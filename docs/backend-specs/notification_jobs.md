# Notification System & Queue Jobs

## Overview

The notification system is built on Laravel Queues (Redis + Horizon) for reliable, asynchronous delivery of SMS and email. All notifications are templated, logged, and retryable.

---

## Architecture

```
Trigger Event
    │
    ▼
┌─────────────────┐
│ NotificationService::send()  ← Central dispatcher
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐  ┌────────┐
│  SMS   │  │ Email  │
│  Job   │  │  Job   │
└───┬────┘  └───┬────┘
    │           │
    ▼           ▼
┌────────┐  ┌────────┐
│ Twilio │  │  SES   │
│  API   │  │  API   │
└───┬────┘  └───┬────┘
    │           │
    ▼           ▼
 Webhook      Webhook
 Callback    Callback
    │           │
    ▼           ▼
 Update     Update
 Notification Notification
   Status      Status
```

---

## Core Job Classes

### 1. SendSmsNotification
```php
<?php

namespace App\Jobs;

use App\Models\Notification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Twilio\Rest\Client;
use Illuminate\Support\Facades\Log;

class SendSmsNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $backoff = [30, 120, 300]; // seconds
    public $timeout = 30;

    public function __construct(public Notification $notification)
    {
        $this->onQueue('notifications');
    }

    public function handle(): void
    {
        if ($this->notification->status !== 'pending') {
            return;
        }

        $twilio = new Client(
            config('services.twilio.sid'),
            config('services.twilio.auth_token')
        );

        try {
            $message = $twilio->messages->create(
                $this->getRecipientPhone(),
                [
                    'from' => config('services.twilio.from_number'),
                    'body' => $this->truncateSms($this->notification->content),
                    'statusCallback' => route('webhooks.twilio.status'),
                ]
            );

            $this->notification->update([
                'status' => 'sent',
                'sent_at' => now(),
                'external_message_id' => $message->sid,
            ]);
        } catch (\Exception $e) {
            Log::error('SMS send failed', [
                'notification_id' => $this->notification->id,
                'error' => $e->getMessage(),
            ]);

            $this->notification->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            throw $e; // Trigger retry
        }
    }

    public function failed(\Throwable $exception): void
    {
        $this->notification->update([
            'status' => 'failed',
            'error_message' => $exception->getMessage(),
        ]);
    }

    private function getRecipientPhone(): string
    {
        // Resolve phone from polymorphic recipient
        $recipient = match($this->notification->recipient_type) {
            'parent' => $this->notification->notifiable?->parent_phone,
            'driver' => $this->notification->notifiable?->user?->phone,
            'dispatcher', 'school' => $this->notification->notifiable?->phone,
            default => null,
        };

        if (!$recipient) {
            throw new \RuntimeException('No phone number for recipient');
        }

        return $recipient;
    }

    private function truncateSms(string $content): string
    {
        $max = 160 * 2; // Allow 2-part SMS max
        if (strlen($content) <= $max) {
            return $content;
        }
        return substr($content, 0, $max - 3) . '...';
    }
}
```

---

### 2. SendEmailNotification
```php
<?php

namespace App\Jobs;

use App\Models\Notification;
use App\Mail\DynamicNotificationMail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SendEmailNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $backoff = [60, 300, 600];
    public $timeout = 60;

    public function __construct(public Notification $notification)
    {
        $this->onQueue('notifications');
    }

    public function handle(): void
    {
        if ($this->notification->status !== 'pending') {
            return;
        }

        try {
            $recipient = $this->getRecipientEmail();
            
            Mail::to($recipient)->send(new DynamicNotificationMail($this->notification));

            $this->notification->update([
                'status' => 'sent',
                'sent_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::error('Email send failed', [
                'notification_id' => $this->notification->id,
                'error' => $e->getMessage(),
            ]);

            $this->notification->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function failed(\Throwable $exception): void
    {
        $this->notification->update([
            'status' => 'failed',
            'error_message' => $exception->getMessage(),
        ]);
    }

    private function getRecipientEmail(): string
    {
        $recipient = match($this->notification->recipient_type) {
            'parent' => $this->notification->notifiable?->parent_email,
            'driver' => $this->notification->notifiable?->user?->email,
            'dispatcher', 'school' => $this->notification->notifiable?->email,
            default => null,
        };

        if (!$recipient) {
            throw new \RuntimeException('No email for recipient');
        }

        return $recipient;
    }
}
```

---

### 3. NotifyDelay
```php
<?php

namespace App\Jobs;

use App\Models\RunAssignment;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class NotifyDelay implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 2;

    public function __construct(
        public RunAssignment $assignment,
        public int $delayMinutes,
        public string $reason
    ) {
        $this->onQueue('notifications');
    }

    public function handle(NotificationService $service): void
    {
        $run = $this->assignment->run;
        $driver = $this->assignment->driver;

        // Get all parents of students on this run
        $students = $run->studentAssignments()
            ->with('student')
            ->whereNull('end_date')
            ->get()
            ->pluck('student');

        foreach ($students as $student) {
            if ($student->parent_phone) {
                $service->sendToParent(
                    student: $student,
                    templateKey: 'delay_alert',
                    variables: [
                        'route_name' => $run->run_id,
                        'route_code' => $run->route->code,
                        'delay_minutes' => $this->delayMinutes,
                        'reason' => $this->reason,
                        'eta' => $this->calculateEta($run),
                        'driver_name' => $driver?->user?->full_name ?? 'Unknown',
                        'vehicle_number' => $this->assignment->vehicle?->vehicle_number ?? 'Unknown',
                    ],
                    channels: ['sms', 'email']
                );
            }
        }

        // Also notify school
        if ($run->route->school?->contact_email) {
            $service->sendToSchool(
                school: $run->route->school,
                templateKey: 'delay_alert',
                variables: [
                    'route_name' => $run->run_id,
                    'route_code' => $run->route->code,
                    'delay_minutes' => $this->delayMinutes,
                    'reason' => $this->reason,
                ],
                channels: ['email']
            );
        }
    }

    private function calculateEta($run): string
    {
        $lastEvent = $this->assignment->events()
            ->where('event_type', 'stop_arrived')
            ->latest('recorded_at')
            ->first();

        if (!$lastEvent) {
            return 'Unknown';
        }

        $currentStop = $run->stops()
            ->where('stop_id', $lastEvent->stop_id)
            ->first();

        if (!$currentStop) {
            return 'Unknown';
        }

        // Simple ETA: scheduled time + delay
        $scheduled = \Carbon\Carbon::parse($currentStop->scheduled_time);
        $eta = $scheduled->addMinutes($this->delayMinutes);

        return $eta->format('g:i A');
    }
}
```

---

### 4. ProcessGpsSnapshot
```php
<?php

namespace App\Jobs;

use App\Models\GpsSnapshot;
use App\Models\Vehicle;
use App\Services\GpsService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessGpsSnapshot implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 2;
    public $timeout = 10;

    public function __construct(public array $data)
    {
        $this->onQueue('gps');
    }

    public function handle(GpsService $gps): void
    {
        $snapshot = GpsSnapshot::create($this->data);

        // Check if vehicle is approaching any stops on active runs
        $vehicle = Vehicle::find($this->data['vehicle_id']);
        if (!$vehicle) return;

        $activeAssignment = $vehicle->assignments()
            ->whereDate('assignment_date', today())
            ->whereIn('status', ['in_progress', 'delayed'])
            ->with('run.stops.stop')
            ->first();

        if (!$activeAssignment) return;

        // Geofence check for each pending stop
        foreach ($activeAssignment->run->stops as $runStop) {
            if ($gps->isInGeofence($snapshot, $runStop->stop, 150)) { // 150 meters
                // Auto-record arrival if not already recorded
                $alreadyArrived = $activeAssignment->events()
                    ->where('stop_id', $runStop->stop_id)
                    ->where('event_type', 'stop_arrived')
                    ->exists();

                if (!$alreadyArrived) {
                    $activeAssignment->events()->create([
                        'event_type' => 'stop_arrived',
                        'stop_id' => $runStop->stop_id,
                        'latitude' => $snapshot->latitude,
                        'longitude' => $snapshot->longitude,
                        'recorded_by' => $activeAssignment->driver?->user_id,
                        'recorded_at' => now(),
                    ]);
                }
            }
        }
    }
}
```

---

## NotificationService

```php
<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\NotificationTemplate;
use App\Models\RunAssignment;
use App\Models\School;
use App\Models\Student;
use App\Jobs\SendSmsNotification;
use App\Jobs\SendEmailNotification;
use Illuminate\Support\Facades\DB;

class NotificationService
{
    public function send(
        RunAssignment $assignment,
        string $templateKey,
        array $variables,
        array $channels = ['sms', 'email']
    ): void {
        $template = $this->getTemplate($templateKey);
        $rendered = $this->renderTemplate($template, $variables);

        // Create notification records and dispatch jobs
        foreach ($channels as $channel) {
            $notification = Notification::create([
                'organization_id' => $assignment->run->route->organization_id,
                'notifiable_type' => 'run_assignment',
                'notifiable_id' => $assignment->id,
                'recipient_type' => 'parent',
                'channel' => $channel,
                'template_key' => $templateKey,
                'subject' => $rendered['email_subject'] ?? null,
                'content' => $channel === 'sms' ? $rendered['sms'] : ($rendered['email_text'] ?? $rendered['sms']),
                'status' => 'pending',
            ]);

            match($channel) {
                'sms' => SendSmsNotification::dispatch($notification),
                'email' => SendEmailNotification::dispatch($notification),
                default => null,
            };
        }
    }

    public function sendToParent(
        Student $student,
        string $templateKey,
        array $variables,
        array $channels = ['sms']
    ): void {
        $template = $this->getTemplate($templateKey);
        $rendered = $this->renderTemplate($template, $variables);

        foreach ($channels as $channel) {
            $content = $channel === 'sms' ? $rendered['sms'] : ($rendered['email_text'] ?? '');
            
            $notification = Notification::create([
                'organization_id' => $student->organization_id,
                'notifiable_type' => 'student',
                'notifiable_id' => $student->id,
                'recipient_type' => 'parent',
                'channel' => $channel,
                'template_key' => $templateKey,
                'subject' => $rendered['email_subject'] ?? null,
                'content' => $content,
                'status' => 'pending',
            ]);

            match($channel) {
                'sms' => SendSmsNotification::dispatch($notification),
                'email' => SendEmailNotification::dispatch($notification),
                default => null,
            };
        }
    }

    public function sendToSchool(
        School $school,
        string $templateKey,
        array $variables,
        array $channels = ['email']
    ): void {
        $template = $this->getTemplate($templateKey);
        $rendered = $this->renderTemplate($template, $variables);

        foreach ($channels as $channel) {
            $notification = Notification::create([
                'organization_id' => $school->organization_id,
                'notifiable_type' => 'school',
                'notifiable_id' => $school->id,
                'recipient_type' => 'school',
                'channel' => $channel,
                'template_key' => $templateKey,
                'subject' => $rendered['email_subject'] ?? null,
                'content' => $channel === 'sms' ? $rendered['sms'] : ($rendered['email_text'] ?? ''),
                'status' => 'pending',
            ]);

            match($channel) {
                'sms' => SendSmsNotification::dispatch($notification),
                'email' => SendEmailNotification::dispatch($notification),
                default => null,
            };
        }
    }

    public function queueBulk(array $recipients, string $templateKey, array $variables): void
    {
        foreach ($recipients as $recipient) {
            // Batch dispatch for efficiency
        }
    }

    private function getTemplate(string $key): NotificationTemplate
    {
        return NotificationTemplate::where('key', $key)
            ->where('is_active', true)
            ->firstOrFail();
    }

    private function renderTemplate(NotificationTemplate $template, array $variables): array
    {
        $render = function (?string $content) use ($variables): ?string {
            if (!$content) return null;
            foreach ($variables as $key => $value) {
                $content = str_replace("{{{$key}}}", (string) $value, $content);
            }
            return $content;
        };

        return [
            'sms' => $render($template->sms_template),
            'email_subject' => $render($template->email_subject),
            'email_html' => $render($template->email_body_html),
            'email_text' => $render($template->email_body_text),
        ];
    }
}
```

---

## Queue Configuration

```php
// config/queue.php
'connections' => [
    'redis' => [
        'driver' => 'redis',
        'connection' => 'default',
        'queue' => 'default',
        'retry_after' => 90,
        'block_for' => null,
        'after_commit' => false,
    ],
],
```

### Horizon Configuration
```php
// config/horizon.php
'environments' => [
    'production' => [
        'supervisor-1' => [
            'connection' => 'redis',
            'queue' => ['default', 'notifications', 'gps', 'reports'],
            'balance' => 'auto',
            'maxProcesses' => 10,
            'tries' => 3,
            'timeout' => 60,
        ],
    ],
],
```

---

## Monitoring

### Horizon Dashboard
- URL: `/horizon` (admin only)
- Monitor queue throughput, failed jobs, wait times
- Retry failed jobs directly from UI

### Key Metrics
| Metric | Target | Alert If |
|--------|--------|----------|
| Notification queue wait time | < 5 sec | > 30 sec |
| Failed notification rate | < 1% | > 5% |
| SMS delivery rate | > 95% | < 90% |
| Email delivery rate | > 98% | < 95% |

---

*Notification Jobs v1.0 | 2026-06-05*
