# API Specification

## Base URL
```
Production:  https://api.fleetpilot.com/v1
Staging:     https://staging-api.fleetpilot.com/v1
Local:       http://localhost:8000/api/v1
```

## Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer {jwt_token}
```

Tokens are obtained via `POST /auth/login` and refreshed via `POST /auth/refresh`. Same JWT works for web (Next.js) and mobile (React Native).

---

## Standard Response Format

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 150
  }
}
```

Error format:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request failed validation",
    "details": {
      "field": ["error message"]
    }
  }
}
```

---

## Endpoints by Module

###  Authentication (`/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/login` | Email + password → JWT | No |
| POST | `/auth/register-parent` | Parent self-registration | No |
| POST | `/auth/logout` | Invalidate token | Yes |
| POST | `/auth/refresh` | Refresh JWT | Yes |
| POST | `/auth/forgot-password` | Send reset link | No |
| POST | `/auth/reset-password` | Reset with token | No |
| GET | `/auth/me` | Current user profile | Yes |
| PUT | `/auth/me` | Update profile | Yes |
| POST | `/auth/verify-phone` | SMS verification | Yes |
| POST | `/auth/devices` | Register push device token | Yes |
| DELETE | `/auth/devices/{token}` | Unregister device | Yes |

**Login Request:**
```json
{
  "email": "driver@example.com",
  "password": "securePass123",
  "device_type": "ios",
  "device_token": "fcm-token-here",
  "device_name": "iPhone 15 - John"
}
```

**Login Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJSUzI1NiIs...",
    "refresh_token": "def50200...",
    "expires_in": 3600,
    "user": {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Smith",
      "role": "driver",
      "phone_verified": true,
      "requires_onboarding": false
    }
  }
}
```

---

###  Dashboard (`/dashboard`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/dashboard/summary` | Today's KPIs | admin, dispatcher |
| GET | `/dashboard/runs/today` | All runs for date | admin, dispatcher |
| GET | `/dashboard/alerts` | Active alerts | admin, dispatcher |
| GET | `/dashboard/vehicles/status` | Fleet status map | admin, dispatcher |
| GET | `/dashboard/billing-summary` | Weekly billing overview | admin, dispatcher |

---

###  Routes (`/routes`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/routes` | List all routes (paginated, filterable) |
| POST | `/routes` | Create new route |
| GET | `/routes/{id}` | Get route detail with runs |
| PUT | `/routes/{id}` | Update route |
| DELETE | `/routes/{id}` | Archive route |
| GET | `/routes/{id}/runs` | List all runs for route |
| POST | `/routes/{id}/duplicate` | Clone route for new season |
| POST | `/routes/{id}/optimize` | Run optimization on all child runs |

---

###  Runs (`/runs`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/runs` | List runs (filter: route, date, status, driver) |
| POST | `/runs` | Create run |
| GET | `/runs/{id}` | Full run detail with stops |
| PUT | `/runs/{id}` | Update run |
| DELETE | `/runs/{id}` | Archive run |
| POST | `/runs/{id}/publish` | Change status draft → published |
| GET | `/runs/{id}/stops` | Ordered stop list |
| POST | `/runs/{id}/stops` | Add/reorder stops (bulk) |
| PUT | `/runs/{id}/stops` | Update stop sequence |
| POST | `/runs/{id}/optimize` | ⭐ Optimize stop sequence |
| GET | `/runs/{id}/optimization` | Get optimization results |
| POST | `/runs/{id}/optimization/apply` | Apply suggested optimization |
| POST | `/runs/{id}/assign` | Assign vehicle + driver for date |
| GET | `/runs/{id}/assignments` | History of assignments |

**Optimize Run Request:**
```json
{
  "strategy": "shortest_distance",
  "constraints": {
    "time_windows": true,
    "school_start_time": "08:00",
    "max_ride_time_minutes": 60
  }
}
```

**Optimize Run Response:**
```json
{
  "success": true,
  "data": {
    "original_distance": 20.29,
    "optimized_distance": 18.15,
    "savings_percent": 10.5,
    "original_duration": 50,
    "optimized_duration": 44,
    "suggested_sequence": [
      {"stop_id": "uuid-garage", "sequence": 1, "time": "07:09"},
      {"stop_id": "uuid-stop-b", "sequence": 2, "time": "07:24"},
      {"stop_id": "uuid-stop-a", "sequence": 3, "time": "07:42"}
    ]
  }
}
```

---

### 🅿️ Stops (`/stops`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stops` | List stops (geospatial search supported) |
| POST | `/stops` | Create stop |
| GET | `/stops/{id}` | Stop detail |
| PUT | `/stops/{id}` | Update stop |
| DELETE | `/stops/{id}` | Soft delete |
| GET | `/stops/nearby` | Find stops near lat/lng |

---

###  Vehicles (`/vehicles`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/vehicles` | List vehicles |
| POST | `/vehicles` | Add vehicle |
| GET | `/vehicles/{id}` | Vehicle detail |
| PUT | `/vehicles/{id}` | Update vehicle |
| GET | `/vehicles/{id}/gps` | Latest GPS snapshot |
| GET | `/vehicles/{id}/history` | GPS history (time range) |
| POST | `/vehicles/{id}/maintenance` | Log maintenance |
| GET | `/vehicles/{id}/documents` | List documents |
| POST | `/vehicles/{id}/documents` | Upload document |

---

###  Drivers (`/drivers`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/drivers` | List drivers (filter: contractor, status) |
| POST | `/drivers` | Create driver profile |
| GET | `/drivers/{id}` | Driver detail with docs |
| PUT | `/drivers/{id}` | Update driver |
| GET | `/drivers/{id}/runs` | Upcoming assigned runs |
| GET | `/drivers/{id}/history` | Past runs |
| POST | `/drivers/{id}/documents` | Upload document |
| GET | `/drivers/{id}/documents` | List documents |
| GET | `/drivers/{id}/pay-summary` | Earnings summary (date range) |
| GET | `/drivers/{id}/earnings` | Detailed earnings by assignment |

---

###  Driver Portal (`/driver`) — Web & Mobile

Mobile-optimized endpoints for daily operations. Used by both web portal and React Native app.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/driver/today` | Today's assigned runs |
| GET | `/driver/runs/{assignment_id}/manifest` | Full manifest for run |
| POST | `/driver/runs/{assignment_id}/start` | Start run |
| POST | `/driver/runs/{assignment_id}/complete` | Complete run |
| POST | `/driver/runs/{assignment_id}/events` | Record event |
| POST | `/driver/runs/{assignment_id}/stops/{stop_id}/arrive` | Arrived at stop |
| POST | `/driver/runs/{assignment_id}/stops/{stop_id}/complete` | Completed stop |
| POST | `/driver/runs/{assignment_id}/delay` | Report delay |
| GET | `/driver/profile` | Driver's own profile |
| PUT | `/driver/profile` | Update availability, phone |
| GET | `/driver/earnings` | Earnings history |
| GET | `/driver/schedule` | Weekly schedule view |

---

### ‍‍ Parent Portal (`/parent`) — Web & Mobile

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/parent/register` | Register parent account |
| GET | `/parent/profile` | Parent profile + linked children |
| PUT | `/parent/profile` | Update profile, notification prefs |
| GET | `/parent/children` | List linked students |
| POST | `/parent/children/link` | Link child by student ID + code |
| DELETE | `/parent/children/{student_id}` | Unlink child |
| GET | `/parent/children/{student_id}/routes` | Current route assignments |
| GET | `/parent/children/{student_id}/tracking` | Live tracking for today's run |
| GET | `/parent/notifications` | Notification history |
| PUT | `/parent/notification-prefs` | Update SMS/email/push preferences |
| GET | `/parent/history` | Past ridership history |
| POST | `/parent/on-demand` | Submit on-demand request (authed) |

**Link Child Request:**
```json
{
  "student_id": "STU-1001",
  "verification_code": "123456",
  "relationship": "mother"
}
```

**Tracking Response:**
```json
{
  "success": true,
  "data": {
    "student_name": "Emma Johnson",
    "run_id": "E-S613ABEA",
    "status": "in_progress",
    "current_location": { "lat": 40.7128, "lng": -74.0060 },
    "next_stop": "Stop B - Pine Ave",
    "eta": "7:52 AM",
    "vehicle_number": "V-104",
    "driver_name": "John Smith",
    "stops_remaining": 1
  }
}
```

---

###  On-Demand (`/on-demand`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/on-demand/requests` | Public: submit request | No |
| GET | `/on-demand/requests` | List all requests | Yes (dispatcher+) |
| GET | `/on-demand/requests/{id}` | Request detail | Yes |
| PUT | `/on-demand/requests/{id}/approve` | Approve request | Yes (dispatcher+) |
| PUT | `/on-demand/requests/{id}/deny` | Deny with reason | Yes (dispatcher+) |
| PUT | `/on-demand/requests/{id}/assign` | Assign to run/driver | Yes (dispatcher+) |
| GET | `/on-demand/requests/tracking/{token}` | Public tracking page | Token-based |

---

###  Billing (`/billing`) ⭐ NEW

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/billing/rates` | List rate cards | admin, dispatcher |
| POST | `/billing/rates` | Create rate card | admin |
| PUT | `/billing/rates/{id}` | Update rate card | admin |
| DELETE | `/billing/rates/{id}` | Deactivate rate | admin |
| GET | `/billing/items` | List billing line items | admin, dispatcher |
| POST | `/billing/items/generate` | Auto-generate from assignments | admin |
| GET | `/billing/items/{id}` | Item detail | admin |
| PUT | `/billing/items/{id}` | Adjust item | admin |
| GET | `/billing/invoices` | List invoices | admin, dispatcher |
| POST | `/billing/invoices` | Create invoice from items | admin |
| GET | `/billing/invoices/{id}` | Invoice detail with items | admin |
| PUT | `/billing/invoices/{id}/send` | Mark sent | admin |
| PUT | `/billing/invoices/{id}/pay` | Record payment | admin |
| GET | `/billing/invoices/{id}/download` | PDF export | admin |
| GET | `/billing/summary` | Dashboard summary | admin |
| GET | `/billing/driver/{driver_id}` | Driver's billable items | admin, driver (own) |
| GET | `/billing/reports/earnings` | Earnings report (date range) | admin |

**Generate Billing Items Request:**
```json
{
  "date_from": "2026-05-01",
  "date_to": "2026-05-31",
  "driver_ids": ["uuid-1", "uuid-2"],
  "auto_create_invoices": false
}
```

**Create Invoice Request:**
```json
{
  "driver_id": "uuid",
  "billing_item_ids": ["uuid-1", "uuid-2", "uuid-3"],
  "period_start": "2026-05-01",
  "period_end": "2026-05-31",
  "adjustments": -25.00,
  "adjustment_reason": "Late penalty",
  "notes": "Weekly contractor payment"
}
```

---

###  Notifications (`/notifications`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | List notifications |
| POST | `/notifications/send` | Send manual notification |
| POST | `/notifications/templates` | Create template |
| GET | `/notifications/templates` | List templates |
| PUT | `/notifications/templates/{id}` | Update template |
| POST | `/notifications/bulk` | Bulk send to run parents |
| POST | `/notifications/test` | Test template with sample data |

---

###  Schools (`/schools`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/schools` | List schools |
| POST | `/schools` | Create school |
| GET | `/schools/{id}` | School detail |
| PUT | `/schools/{id}` | Update school |
| GET | `/schools/{id}/runs` | Active routes |
| GET | `/schools/{id}/contacts` | Contact list |

---

### ‍ Students (`/students`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/students` | List students (searchable) |
| POST | `/students` | Add student |
| GET | `/students/{id}` | Student detail with assignments |
| PUT | `/students/{id}` | Update student |
| GET | `/students/{id}/runs` | Current run assignments |
| POST | `/students/{id}/assign` | Assign to run/stop |
| POST | `/students/import` | Bulk CSV import |

---

### 🤝 Contractors (`/contractors`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/contractors/apply` | Public application | No |
| GET | `/contractors/applications` | List applications | Yes (admin) |
| GET | `/contractors/applications/{id}` | Application detail | Yes (admin) |
| PUT | `/contractors/applications/{id}/review` | Review & decision | Yes (admin) |
| GET | `/contractors` | List approved contractors | Yes |
| GET | `/contractors/{id}` | Contractor detail | Yes |
| GET | `/contractors/{id}/runs` | Available/accepted runs | Yes |
| POST | `/contractors/{id}/accept-run` | Accept run offer | Yes (contractor) |

---

###  Reports (`/reports`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/types` | Available report types |
| POST | `/reports` | Generate report (async) |
| GET | `/reports/{id}` | Report status & download |
| GET | `/reports` | Report history |

---

###  Integrations (`/integrations`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/webhooks/samsara/gps` | Samsara GPS webhook |
| POST | `/webhooks/samsara/cameras` | Samsara camera events |
| POST | `/webhooks/diga-talk` | Diga Talk status updates |
| POST | `/webhooks/twilio/status` | Twilio delivery status |
| GET | `/integrations/status` | Integration health check |
| POST | `/integrations/samsara/sync` | Manual sync trigger |

---

## Rate Limiting

| Endpoint Group | Limit |
|----------------|-------|
| Authentication | 10 requests / minute |
| Driver Portal | 100 requests / minute |
| Parent Portal | 100 requests / minute |
| Webhooks | 1000 requests / minute |
| All others | 60 requests / minute |

---

## Pagination

All list endpoints support:
```
?page=2&per_page=50&sort=-created_at
```

Default: `per_page=20`, `sort=-created_at`.

---

## Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `UNAUTHORIZED` | 401 | Invalid or expired token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Request validation failed |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |

---

## OpenAPI Contract

The complete API contract is documented in `OPENAPI_SPEC.yaml` (OpenAPI 3.0.3). This file serves as the single source of truth for:

- Frontend development teams (Next.js and React Native)
- Third-party integrators
- Automated testing and mock server generation
- Client SDK generation

**Location:** `docs/OPENAPI_SPEC.yaml`

**Tools for development:**
- Swagger UI: Interactive API documentation at `/api/documentation`
- Postman: Import `OPENAPI_SPEC.yaml` directly
- Insomnia: Import for local testing
- Mock servers: Use Stoplight Prism or Mockoon for frontend development against contract

**Contract-first workflow:**
1. API changes are proposed as OpenAPI YAML updates
2. Reviewed and approved before implementation
3. Backend implements to match the contract
4. Frontend develops against mock server generated from contract
5. Integration testing validates contract compliance

---

*Version: 2.0 | Format: REST JSON + OpenAPI 3.0 | Auth: JWT Bearer | Platforms: Web + Mobile*
