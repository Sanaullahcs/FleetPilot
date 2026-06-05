# Integration & Webhook Specifications

## Overview

This document details inbound webhook handlers for Samsara GPS/Cameras and Diga Talk radios, plus outbound API integrations.

---

## 1. Samsara Integration

### Connection Method
- **Primary:** Webhook push (real-time)
- **Fallback:** Polling every 5 minutes via scheduled command

### Authentication
Samsara webhooks use HMAC-SHA256 signature verification.

```php
// Middleware: webhook.samsara
public function handle(Request $request, Closure $next)
{
    $signature = $request->header('X-Samsara-Signature');
    $payload = $request->getContent();
    $secret = config('services.samsara.webhook_secret');
    
    $expected = hash_hmac('sha256', $payload, $secret);
    
    if (!hash_equals($expected, $signature)) {
        abort(401, 'Invalid signature');
    }
    
    return $next($request);
}
```

### Webhook Endpoint
```
POST /webhooks/samsara/gps
Content-Type: application/json
X-Samsara-Signature: sha256=abc123...
```

### Payload: GPS Update
```json
{
  "eventId": "evt_abc123",
  "eventType": "gps",
  "eventTime": "2026-06-05T12:34:56.000Z",
  "orgId": 12345,
  "vehicle": {
    "id": "2120149180862013",
    "name": "V-104"
  },
  "device": {
    "serial": "SAM-104-002",
    "id": "2120149180862013"
  },
  "gps": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "heading": 180,
    "speed": 35.5,
    "reverseGeo": {
      "formattedAddress": "123 Main St, New York, NY"
    }
  },
  "odometerMeters": 72850000
}
```

### Handler Logic
```php
class SamsaraWebhookController extends Controller
{
    public function gps(Request $request)
    {
        $data = $request->all();
        
        // Find vehicle by samsara_device_id
        $vehicle = Vehicle::where('samsara_device_id', $data['device']['serial'])->first();
        
        if (!$vehicle) {
            Log::warning('Samsara GPS for unknown vehicle', ['serial' => $data['device']['serial']]);
            return response()->json(['status' => 'ignored']);
        }
        
        // Dispatch job to process (non-blocking)
        ProcessGpsSnapshot::dispatch([
            'vehicle_id' => $vehicle->id,
            'latitude' => $data['gps']['latitude'],
            'longitude' => $data['gps']['longitude'],
            'heading' => $data['gps']['heading'] ?? null,
            'speed' => isset($data['gps']['speed']) ? $data['gps']['speed'] * 0.621371 : null, // km/h to mph
            'odometer' => isset($data['odometerMeters']) ? $data['odometerMeters'] * 0.000621371 : null, // m to miles
            'source' => 'samsara',
            'recorded_at' => $data['eventTime'],
            'raw_payload' => $data
        ]);
        
        return response()->json(['status' => 'received']);
    }
}
```

### Camera Snapshot Integration

**API Endpoint (outbound to Samsara):**
```
GET https://api.samsara.com/fleet/vehicles/{vehicleId}/camera/snapshot
Authorization: Bearer {SAMSARA_API_TOKEN}
```

**Response:**
```json
{
  "data": {
    "url": "https://media.samsara.com/snapshots/abc123.jpg",
    "expiresAt": "2026-06-05T13:34:56Z"
  }
}
```

**Display in App:**
- Vehicle detail page shows "Latest Camera View" thumbnail
- Click to open full image (valid for 1 hour)
- No persistent storage of camera images (compliance)

---

## 2. Diga Talk Integration

### Connection Method
- REST API polling (Diga Talk provides API access)
- Webhook support if available from vendor

### Authentication
API Key in header:
```
GET https://api.digatalk.com/v1/radios/status
X-API-Key: {DIGA_TALK_API_KEY}
```

### Radio Status Endpoint
```php
class DigaTalkService
{
    public function getRadioStatus(string $digaTalkId): ?array
    {
        $response = Http::withHeaders([
            'X-API-Key' => config('services.diga_talk.api_key')
        ])->get("https://api.digatalk.com/v1/radios/{$digaTalkId}/status");
        
        if (!$response->successful()) {
            Log::error('Diga Talk API error', ['id' => $digaTalkId, 'status' => $response->status()]);
            return null;
        }
        
        return $response->json('data');
    }
}
```

### Expected Response
```json
{
  "data": {
    "radioId": "DIGA-104",
    "status": "online",
    "lastSeen": "2026-06-05T12:34:00Z",
    "batteryLevel": 85,
    "signalStrength": 4,
    "currentChannel": "Dispatch-1",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  }
}
```

### UI Display
- Small radio icon in vehicle list: 🟢 online /  offline
- Hover tooltip shows battery, signal, channel
- No persistent storage; fetched on-demand

### Webhook (if supported by Diga Talk)
```
POST /webhooks/diga-talk/status
```

```json
{
  "radioId": "DIGA-104",
  "status": "offline",
  "timestamp": "2026-06-05T12:35:00Z",
  "reason": "battery_depleted"
}
```

---

## 3. Twilio SMS Integration

### Outbound SMS
```php
class SendSmsNotification implements ShouldQueue
{
    public function handle(): void
    {
        $twilio = new Client(
            config('services.twilio.sid'),
            config('services.twilio.auth_token')
        );
        
        $twilio->messages->create(
            $this->notification->recipient_phone,
            [
                'from' => config('services.twilio.from_number'),
                'body' => $this->notification->content,
                'statusCallback' => route('webhooks.twilio.status')
            ]
        );
    }
}
```

### Inbound SMS (Reply Handling)
```
POST /webhooks/twilio/sms
```

```php
public function inbound(Request $request)
{
    $from = $request->input('From');
    $body = strtolower(trim($request->input('Body')));
    
    // Simple keyword responses
    match($body) {
        'stop' => $this->unsubscribe($from),
        'status' => $this->sendRouteStatus($from),
        default => $this->sendHelpText($from),
    };
    
    return response('<?xml version="1.0"?><Response></Response>')
        ->header('Content-Type', 'text/xml');
}
```

### Delivery Status Webhook
```
POST /webhooks/twilio/status
```

Updates `notifications` table:
```php
$notification = Notification::where('external_message_id', $request->input('MessageSid'))->first();
$notification?->update([
    'status' => match($request->input('MessageStatus')) {
        'delivered' => 'delivered',
        'failed', 'undelivered' => 'failed',
        default => 'sent',
    },
    'delivered_at' => $request->input('MessageStatus') === 'delivered' ? now() : null,
    'error_message' => $request->input('ErrorCode') ? $this->getErrorMessage($request->input('ErrorCode')) : null,
]);
```

---

## 4. Amazon SES Email Integration

### Configuration
```php
// config/mail.php
'mailers' => [
    'ses' => [
        'transport' => 'ses',
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],
],
```

### Outbound Email Job
```php
class SendEmailNotification implements ShouldQueue
{
    public function handle(): void
    {
        Mail::to($this->notification->recipient_email)
            ->send(new DynamicNotificationMail($this->notification));
    }
}
```

### Email Class
```php
class DynamicNotificationMail extends Mailable
{
    public function build(): self
    {
        return $this
            ->subject($this->notification->subject)
            ->view('emails.dynamic', ['notification' => $this->notification])
            ->text('emails.dynamic_plain', ['notification' => $this->notification]);
    }
}
```

### SES Bounce/Complaint Handling
```
POST /webhooks/ses/feedback
```

```php
public function feedback(Request $request)
{
    $message = json_decode($request->getContent(), true);
    
    if ($message['notificationType'] === 'Bounce') {
        $this->handleBounce($message['bounce']);
    }
    
    if ($message['notificationType'] === 'Complaint') {
        $this->handleComplaint($message['complaint']);
    }
    
    return response()->json(['status' => 'ok']);
}
```

---

## 5. Webhook Security Summary

| Webhook | Auth Method | Rate Limit |
|---------|-------------|------------|
| Samsara GPS | HMAC-SHA256 | 1000/min |
| Diga Talk | API Key (inbound) | 100/min |
| Twilio SMS | Signature verify | 500/min |
| Twilio Status | Signature verify | 500/min |
| SES Feedback | SNS verify | 100/min |

### IP Allowlisting (Recommended)
- Samsara: `52.89.214.0/24` (verify with Samsara docs)
- Twilio: Dynamic — use signature verification
- SES: SNS — verify certificate

---

## 6. Error Handling & Retries

| Integration | Failure Action | Retry Policy |
|-------------|---------------|--------------|
| Samsara webhook | Log + return 200 | N/A (push) |
| Samsara polling | Log + retry in 5 min | 3 attempts |
| Diga Talk API | Log + cache last known | 3 attempts, exponential backoff |
| Twilio SMS | Queue retry | 3 attempts over 15 min |
| SES Email | Queue retry | 3 attempts over 15 min |

### Dead Letter Queue
Failed webhook processing jobs move to `failed_jobs` table. Admin can:
- View failures in Horizon dashboard
- Retry individual jobs
- Bulk retry by type

---

*Integration Spec v1.0 | 2026-06-05*
