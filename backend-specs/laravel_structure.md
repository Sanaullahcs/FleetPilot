# Laravel Backend Structure

## Overview

Laravel 11 monolith serving REST API, MCP server, webhooks, queue workers, and scheduled commands from a single codebase.

---

## Directory Structure

```
backend/
├── app/
│   ├── Console/
│   │   └── Commands/
│   │       ├── ExpiringDocumentAlert.php      # Daily cron: check doc expiry
│   │       ├── GenerateDailyReports.php       # Daily performance reports
│   │       └── SyncSamsaraFleet.php           # Periodic GPS sync fallback
│   ├── Exceptions/
│   │   └── Handler.php
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Api/
│   │   │   │   ├── AuthController.php
│   │   │   │   ├── DashboardController.php
│   │   │   │   ├── RouteController.php
│   │   │   │   ├── RunController.php
│   │   │   │   ├── StopController.php
│   │   │   │   ├── VehicleController.php
│   │   │   │   ├── DriverController.php
│   │   │   │   ├── DriverPortalController.php
│   │   │   │   ├── OnDemandController.php
│   │   │   │   ├── NotificationController.php
│   │   │   │   ├── SchoolController.php
│   │   │   │   ├── StudentController.php
│   │   │   │   ├── ContractorController.php
│   │   │   │   └── ReportController.php
│   │   │   └── Webhook/
│   │   │       ├── SamsaraWebhookController.php
│   │   │       └── DigaTalkWebhookController.php
│   │   ├── Middleware/
│   │   │   ├── EnsureRole.php               # Role-based access
│   │   │   ├── RateLimitByRole.php           # Driver vs dispatcher limits
│   │   │   └── ValidateMcpRequest.php        # MCP auth & validation
│   │   ├── Requests/
│   │   │   ├── CreateRouteRequest.php
│   │   │   ├── CreateRunRequest.php
│   │   │   ├── UpdateStopRequest.php
│   │   │   ├── AssignRunRequest.php
│   │   │   ├── RecordEventRequest.php
│   │   │   ├── SubmitOnDemandRequest.php
│   │   │   ├── ContractorApplicationRequest.php
│   │   │   └── SendNotificationRequest.php
│   │   └── Resources/
│   │       ├── RouteResource.php
│   │       ├── RunResource.php
│   │       ├── RunAssignmentResource.php
│   │       ├── ManifestResource.php
│   │       ├── DriverResource.php
│   │       ├── VehicleResource.php
│   │       ├── StopResource.php
│   │       ├── OnDemandResource.php
│   │       └── NotificationResource.php
│   ├── Jobs/
│   │   ├── SendSmsNotification.php
│   │   ├── SendEmailNotification.php
│   │   ├── ProcessGpsSnapshot.php
│   │   ├── GenerateReport.php
│   │   ├── SyncSamsaraVehicle.php
│   │   └── NotifyDelay.php
│   ├── Mail/
│   │   ├── DelayAlertMail.php
│   │   ├── OnDemandConfirmationMail.php
│   │   └── DocumentExpiryMail.php
│   ├── Models/
│   │   ├── Organization.php
│   │   ├── User.php
│   │   ├── Driver.php
│   │   ├── DriverDocument.php
│   │   ├── School.php
│   │   ├── Vehicle.php
│   │   ├── VehicleDocument.php
│   │   ├── Stop.php
│   │   ├── Route.php
│   │   ├── Run.php
│   │   ├── RunStop.php
│   │   ├── RunAssignment.php
│   │   ├── RunEvent.php
│   │   ├── Student.php
│   │   ├── StudentStopAssignment.php
│   │   ├── OnDemandRequest.php
│   │   ├── Notification.php
│   │   ├── NotificationTemplate.php
│   │   ├── GpsSnapshot.php
│   │   ├── ContractorApplication.php
│   │   ├── ContractorApplicationDocument.php
│   │   └── Report.php
│   ├── Mcp/                              # MCP Server Module
│   │   ├── McpServer.php                 # JSON-RPC router
│   │   ├── McpToolRegistry.php           # Tool registration
│   │   ├── McpResourceProvider.php       # Resource resolution
│   │   ├── McpApprovalGate.php           # Human-in-the-loop gating
│   │   ├── Tools/
│   │   │   ├── SearchRunsTool.php
│   │   │   ├── GetVehicleLocationTool.php
│   │   │   ├── FindNearestDriverTool.php
│   │   │   ├── SendNotificationTool.php
│   │   │   ├── UpdateRunStatusTool.php
│   │   │   ├── ApproveOnDemandTool.php
│   │   │   ├── GetPerformanceSummaryTool.php
│   │   │   ├── FlagExpiringDocumentsTool.php
│   │   │   └── CreateRunFromOnDemandTool.php
│   │   └── Resources/
│   │       ├── DispatchTodayResource.php
│   │       ├── FleetStatusResource.php
│   │       ├── RunManifestResource.php
│   │       ├── DriverProfileResource.php
│   │       ├── OnDemandPendingResource.php
│   │       └── PerformanceReportResource.php
│   ├── Providers/
│   │   └── AppServiceProvider.php
│   ├── Services/
│   │   ├── NotificationService.php       # Central notification dispatcher
│   │   ├── GpsService.php                # GPS processing & geofencing
│   │   ├── RouteOptimizationService.php  # Future: OR-Tools integration
│   │   ├── SamsaraService.php            # Samsara API client
│   │   ├── DigaTalkService.php           # Diga Talk API client
│   │   ├── ContractorService.php         # Application workflow
│   │   └── ReportGeneratorService.php    # PDF/CSV generation
│   └── Traits/
│       ├── BelongsToOrganization.php
│       ├── HasStatus.php
│       └── HasGeography.php
├── bootstrap/
├── config/
│   ├── app.php
│   ├── auth.php
│   ├── database.php
│   ├── queue.php
│   ├── services.php          # Twilio, AWS, Samsara, DigaTalk keys
│   └── mcp.php               # MCP server config
├── database/
│   ├── factories/
│   ├── migrations/
│   └── seeders/
├── routes/
│   ├── api.php               # REST API routes
│   ├── web.php               # Minimal web routes
│   ├── mcp.php               # MCP JSON-RPC routes
│   └── webhooks.php          # External service webhooks
├── storage/
├── tests/
│   ├── Feature/
│   │   ├── AuthTest.php
│   │   ├── RouteManagementTest.php
│   │   ├── RunAssignmentTest.php
│   │   ├── DriverPortalTest.php
│   │   ├── OnDemandTest.php
│   │   ├── NotificationTest.php
│   │   ├── WebhookTest.php
│   │   └── McpServerTest.php
│   └── Unit/
│       ├── NotificationServiceTest.php
│       ├── GpsServiceTest.php
│       └── SamsaraServiceTest.php
├── artisan
├── composer.json
├── phpunit.xml
└── Dockerfile
```

---

## Key Packages

```json
{
  "require": {
    "php": "^8.3",
    "laravel/framework": "^11.0",
    "laravel/sanctum": "^4.0",
    "tymon/jwt-auth": "^2.1",
    "spatie/laravel-permission": "^6.0",
    "spatie/laravel-query-builder": "^5.0",
    "maatwebsite/excel": "^3.1",
    "barryvdh/laravel-dompdf": "^3.0",
    "twilio/sdk": "^8.0",
    "aws/aws-sdk-php": "^3.0",
    "guzzlehttp/guzzle": "^7.8",
    "predis/predis": "^2.0",
    "laravel/horizon": "^5.0",
    "spatie/laravel-medialibrary": "^11.0",
    "spatie/laravel-activitylog": "^4.0",
    "mll-lab/laravel-graphiql": "^3.0"
  },
  "require-dev": {
    "fakerphp/faker": "^1.23",
    "laravel/pint": "^1.13",
    "laravel/sail": "^1.26",
    "mockery/mockery": "^1.6",
    "nunomaduro/collision": "^8.1",
    "phpunit/phpunit": "^11.0"
  }
}
```

---

## Middleware Stack

| Middleware | Purpose | Applied To |
|------------|---------|------------|
| `auth:api` | JWT authentication | All API routes |
| `ensure.role:admin|dispatcher` | Role check | Admin/dispatcher endpoints |
| `ensure.role:driver` | Driver-only | Driver portal endpoints |
| `throttle:60,1` | General rate limit | API |
| `throttle:10,1` | Auth rate limit | Login/register |
| `throttle:driver` | Driver-specific | Driver portal (higher limit) |
| `validate.mcp` | MCP request validation | `/mcp/*` |
| `webhook.samsara` | HMAC signature verify | Samsara webhooks |

---

## Queue Configuration

**Connection:** Redis (Laravel Horizon)

| Queue | Purpose | Priority |
|-------|---------|----------|
| `default` | General jobs | Normal |
| `notifications` | SMS/Email dispatch | High |
| `gps` | GPS snapshot processing | Normal |
| `reports` | Report generation | Low |
| `webhooks` | Outbound webhook delivery | Normal |

**Horizon Dashboard:** `/horizon` (admin only)

---

## Scheduled Commands

```php
// app/Console/Kernel.php (or Laravel 11's routes/console.php)
Schedule::command('alerts:expiring-documents')->dailyAt('06:00');
Schedule::command('reports:daily')->dailyAt('23:00');
Schedule::command('gps:sync-samsara')->everyFiveMinutes();
Schedule::command('notifications:retry-failed')->everyFifteenMinutes();
Schedule::command('on-demand:expire-pending')->hourly();
```

---

## Model Relationships

### Run (Central Model)
```php
class Run extends Model
{
    public function route() { return $this->belongsTo(Route::class); }
    public function stops() { return $this->hasMany(RunStop::class)->orderBy('sequence_order'); }
    public function assignments() { return $this->hasMany(RunAssignment::class); }
    public function studentAssignments() { return $this->hasMany(StudentStopAssignment::class); }
    public function onDemandRequest() { return $this->hasOne(OnDemandRequest::class, 'assigned_run_id'); }
}
```

### RunAssignment (Daily Operations)
```php
class RunAssignment extends Model
{
    public function run() { return $this->belongsTo(Run::class); }
    public function vehicle() { return $this->belongsTo(Vehicle::class); }
    public function driver() { return $this->belongsTo(Driver::class); }
    public function coDriver() { return $this->belongsTo(Driver::class, 'co_driver_id'); }
    public function events() { return $this->hasMany(RunEvent::class); }
    public function notifications() { return $this->morphMany(Notification::class, 'notifiable'); }
}
```

### Driver
```php
class Driver extends Model
{
    public function user() { return $this->belongsTo(User::class); }
    public function documents() { return $this->hasMany(DriverDocument::class); }
    public function assignments() { return $this->hasMany(RunAssignment::class); }
    public function vehicleAssignments() { return $this->hasMany(RunAssignment::class, 'vehicle_id'); }
}
```

---

## Service Layer Design

### NotificationService
```php
class NotificationService
{
    public function send(RunAssignment $assignment, string $templateKey, array $variables, array $channels = ['sms', 'email']);
    public function sendToParents(RunAssignment $assignment, string $templateKey, array $variables);
    public function sendToSchool(RunAssignment $assignment, string $templateKey, array $variables);
    public function queueBulk(array $recipients, string $templateKey, array $variables);
    public function renderTemplate(string $templateKey, array $variables): array; // [sms, email_subject, email_body]
}
```

### GpsService
```php
class GpsService
{
    public function recordSnapshot(array $data): GpsSnapshot;
    public function getLatestLocation(Vehicle $vehicle): ?GpsSnapshot;
    public function getVehicleHistory(Vehicle $vehicle, Carbon $from, Carbon $to): Collection;
    public function calculateDistance(Vehicle $vehicle, Carbon $date): float;
    public function isInGeofence(GpsSnapshot $snapshot, Stop $stop, float $radiusMeters = 100): bool;
    public function findNearestAvailableDriver(float $lat, float $lng, ?VehicleType $type = null): Collection;
}
```

### SamsaraService
```php
class SamsaraService
{
    public function syncFleet(): void;
    public function getVehicleLocation(string $samsaraDeviceId): ?array;
    public function getCameraSnapshot(string $samsaraDeviceId): ?string; // URL
    public function processWebhook(array $payload): void;
}
```

---

## API Route Definitions

```php
// routes/api.php

Route::prefix('v1')->group(function () {
    // Auth
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);
    
    Route::middleware('auth:api')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::post('/auth/refresh', [AuthController::class, 'refresh']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::put('/auth/me', [AuthController::class, 'updateProfile']);
        
        // Dashboard
        Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
        Route::get('/dashboard/runs/today', [DashboardController::class, 'todayRuns']);
        Route::get('/dashboard/alerts', [DashboardController::class, 'alerts']);
        
        // Routes
        Route::apiResource('routes', RouteController::class);
        Route::post('routes/{route}/duplicate', [RouteController::class, 'duplicate']);
        Route::get('routes/{route}/runs', [RouteController::class, 'runs']);
        
        // Runs
        Route::apiResource('runs', RunController::class);
        Route::post('runs/{run}/publish', [RunController::class, 'publish']);
        Route::get('runs/{run}/stops', [RunController::class, 'stops']);
        Route::post('runs/{run}/stops', [RunController::class, 'updateStops']);
        Route::post('runs/{run}/assign', [RunController::class, 'assign']);
        
        // Stops
        Route::apiResource('stops', StopController::class);
        Route::get('stops/nearby', [StopController::class, 'nearby']);
        
        // Vehicles
        Route::apiResource('vehicles', VehicleController::class);
        Route::get('vehicles/{vehicle}/gps', [VehicleController::class, 'gps']);
        Route::get('vehicles/{vehicle}/history', [VehicleController::class, 'history']);
        
        // Drivers
        Route::apiResource('drivers', DriverController::class);
        Route::get('drivers/{driver}/runs', [DriverController::class, 'runs']);
        Route::get('drivers/{driver}/history', [DriverController::class, 'history']);
        
        // Driver Portal
        Route::prefix('driver')->group(function () {
            Route::get('/today', [DriverPortalController::class, 'today']);
            Route::get('/runs/{assignment}/manifest', [DriverPortalController::class, 'manifest']);
            Route::post('/runs/{assignment}/start', [DriverPortalController::class, 'start']);
            Route::post('/runs/{assignment}/complete', [DriverPortalController::class, 'complete']);
            Route::post('/runs/{assignment}/events', [DriverPortalController::class, 'recordEvent']);
            Route::post('/runs/{assignment}/delay', [DriverPortalController::class, 'reportDelay']);
        });
        
        // On-Demand
        Route::apiResource('on-demand/requests', OnDemandController::class);
        Route::put('on-demand/requests/{request}/approve', [OnDemandController::class, 'approve']);
        Route::put('on-demand/requests/{request}/deny', [OnDemandController::class, 'deny']);
        Route::put('on-demand/requests/{request}/assign', [OnDemandController::class, 'assign']);
        
        // Notifications
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::post('notifications/send', [NotificationController::class, 'send']);
        Route::post('notifications/bulk', [NotificationController::class, 'bulk']);
        Route::apiResource('notifications/templates', NotificationController::class);
        
        // Schools
        Route::apiResource('schools', SchoolController::class);
        
        // Students
        Route::apiResource('students', StudentController::class);
        Route::post('students/import', [StudentController::class, 'import']);
        
        // Contractors
        Route::get('contractors/applications', [ContractorController::class, 'applications']);
        Route::get('contractors/applications/{application}', [ContractorController::class, 'showApplication']);
        Route::put('contractors/applications/{application}/review', [ContractorController::class, 'review']);
        Route::apiResource('contractors', ContractorController::class);
        
        // Reports
        Route::get('reports/types', [ReportController::class, 'types']);
        Route::post('reports', [ReportController::class, 'generate']);
        Route::get('reports/{report}', [ReportController::class, 'show']);
    });
});

// Public routes
Route::post('on-demand/requests', [OnDemandController::class, 'store']);
Route::get('on-demand/tracking/{token}', [OnDemandController::class, 'track']);
Route::post('contractors/apply', [ContractorController::class, 'apply']);
```

---

## Testing Strategy

```bash
# Unit tests
php artisan test --filter=Unit

# Feature tests
php artisan test --filter=Feature

# Specific suite
php artisan test --filter=RunAssignmentTest

# With coverage
php artisan test --coverage --min=70
```

**Coverage Targets:**
| Layer | Target |
|-------|--------|
| Models | 80% |
| Services | 75% |
| Controllers | 70% |
| Jobs | 70% |
| MCP Tools | 60% |

---

*Backend Spec v1.0 | 2026-06-05*
