# Database Schema Design

## Overview

PostgreSQL 16 with PostGIS extension. Designed for multi-tenant ready (organization_id on key tables) but single-tenant for MVP. Covers billing, route optimization, parent accounts, cross-platform device support, and granular RBAC.

**Table count:** 33 tables total. The 27 domain tables documented below, plus three operational/auth groups:
- `vehicle_documents` (#10b) and `contractor_application_documents` (#26b) — file attachments parallel to `driver_documents`.
- `roles`, `permissions`, `role_permissions`, `user_roles` (#28) — granular RBAC. See `backend-specs/rbac_permissions.md`.

> The executable `database/schema.sql` is the single source of truth for column types, constraints, triggers, and seed data. This document is the human-readable reference; if the two ever diverge, the SQL wins.

---

## Entity Relationship Summary

```
[organizations] 1--* [users] 1--* [drivers]
                                    |
[vehicles] 1--* [vehicle_documents] |
       |                            |
[runs] *--1 [routes]              [driver_documents]
  |  
  *--* [stops] (via run_stops)
  |
  *--* [drivers] (via run_assignments)
  *--1 [vehicles] (via run_assignments)

[on_demand_requests] *--1 [runs] (when converted)
[notifications] *--1 [runs]
[gps_snapshots] *--1 [vehicles]
[contractor_applications] → becomes [drivers]

[vehicles] 1--* [vehicle_documents]
[contractor_applications] 1--* [contractor_application_documents]

--- BILLING / OPTIMIZATION / PARENT / DEVICES ---
[billing_rates] 1--* [billing_items]
[invoices] 1--* [billing_items]
[route_optimizations] *--1 [runs]
[parent_accounts] 1--* [parent_students]
[app_devices] *--1 [users] (for push notifications)

--- RBAC (see #28) ---
[users] *--* [roles] (via user_roles)
[roles] *--* [permissions] (via role_permissions)
```

> Note: `student_locations` was dropped from the MVP schema. Live position is derived from the vehicle's `gps_snapshots` for the run the student is assigned to, so a separate per-student location table is unnecessary.

---

## Table Definitions

### 1. `organizations`
Top-level tenant.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| name | VARCHAR(255) | NOT NULL | District/company name |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | URL-friendly identifier |
| timezone | VARCHAR(50) | DEFAULT 'America/New_York' | IANA tz identifier |
| address | TEXT | | Headquarters address |
| phone | VARCHAR(20) | | Main dispatch phone |
| email | VARCHAR(255) | | Contact email |
| logo_url | VARCHAR(500) | | Organization logo |
| settings | JSONB | DEFAULT '{}' | Feature flags, notification prefs |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

---

### 2. `users`
Authentication base table. Role-based access.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| organization_id | UUID | FK → organizations.id | |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Login identifier |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt hash |
| first_name | VARCHAR(100) | NOT NULL | |
| last_name | VARCHAR(100) | NOT NULL | |
| phone | VARCHAR(20) | | Mobile for SMS |
| role | user_role | NOT NULL | Primary/denormalized role for fast checks: `admin`, `dispatcher`, `driver`, `contractor`, `school_contact`, `parent`. Authoritative permissions come from the RBAC tables (#28); a user may hold multiple roles via `user_roles`. |
| is_active | BOOLEAN | DEFAULT true | Soft-disable account |
| email_verified_at | TIMESTAMPTZ | | |
| phone_verified_at | TIMESTAMPTZ | | |
| last_login_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

**Indexes:** `email`, `organization_id`, `role`

---

### 3. `app_devices`
Track mobile devices for push notifications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id | |
| device_type | ENUM | | `ios`, `android`, `web` |
| device_token | VARCHAR(500) | NOT NULL | FCM/APNs token |
| device_name | VARCHAR(255) | | "iPhone 15", "Pixel 8" |
| app_version | VARCHAR(20) | | "1.2.0" |
| os_version | VARCHAR(20) | | "iOS 17.4" |
| is_active | BOOLEAN | DEFAULT true | |
| last_used_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

**Unique:** `(user_id, device_token)`

---

### 4. `drivers`
Extended profile for anyone with `role = 'driver'` or `'contractor'`.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id, UNIQUE | |
| employee_id | VARCHAR(50) | | Internal ID or contractor ref |
| license_number | VARCHAR(100) | | CDL or state license |
| license_expiry | DATE | | |
| license_state | VARCHAR(2) | | e.g., 'NY', 'NJ' |
| medical_cert_expiry | DATE | | DOT medical card |
| background_check_status | ENUM | DEFAULT 'pending' | `pending`, `clear`, `flagged`, `expired` |
| background_check_date | DATE | | |
| hire_date | DATE | | |
| termination_date | DATE | | |
| is_contractor | BOOLEAN | DEFAULT false | Independent contractor flag |
| contractor_company | VARCHAR(255) | | LLC name if applicable |
| pay_rate | DECIMAL(8,2) | | Per mile or per hour rate |
| pay_type | ENUM | | `mile`, `hour`, `trip`, `flat` |
| emergency_contact_name | VARCHAR(255) | | |
| emergency_contact_phone | VARCHAR(20) | | |
| notes | TEXT | | Dispatcher-only notes |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

---

### 5. `driver_documents`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| driver_id | UUID | FK → drivers.id | |
| document_type | ENUM | NOT NULL | `license`, `medical`, `insurance`, `background_check`, `drug_test`, `training_cert` |
| file_path | VARCHAR(500) | NOT NULL | Storage path |
| original_filename | VARCHAR(255) | | |
| expiry_date | DATE | | |
| status | ENUM | DEFAULT 'active' | `active`, `expired`, `pending_review` |
| reviewed_by | UUID | FK → users.id | |
| reviewed_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

---

### 6. `parent_accounts`
Parent/guardian profiles linked to students.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id, UNIQUE | |
| address | TEXT | | Home address |
| city | VARCHAR(100) | | |
| state | VARCHAR(2) | | |
| zip | VARCHAR(10) | | |
| emergency_contact | VARCHAR(255) | | Secondary emergency contact |
| emergency_phone | VARCHAR(20) | | |
| notification_prefs | JSONB | DEFAULT '{"sms": true, "email": true, "push": true, "delay_alert": true, "pickup_confirm": true, "dropoff_confirm": true}' | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

---

### 7. `students`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| organization_id | UUID | FK → organizations.id | |
| student_id | VARCHAR(50) | NOT NULL | District student ID |
| first_name | VARCHAR(100) | NOT NULL | |
| last_name | VARCHAR(100) | NOT NULL | |
| grade | VARCHAR(10) | | "K", "1", ... "12" |
| school_id | UUID | FK → schools.id | |
| date_of_birth | DATE | | |
| is_wheelchair | BOOLEAN | DEFAULT false | |
| requires_monitor | BOOLEAN | DEFAULT false | |
| special_needs | TEXT | | IEP, 504, medical notes |
| photo_url | VARCHAR(500) | | Optional student photo |
| status | ENUM | DEFAULT 'active' | `active`, `inactive`, `graduated` |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

---

### 8. `parent_students`
Junction: which parents are linked to which students.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| parent_id | UUID | FK → parent_accounts.id | |
| student_id | UUID | FK → students.id | |
| relationship | VARCHAR(50) | | `mother`, `father`, `guardian`, `grandparent` |
| is_primary | BOOLEAN | DEFAULT false | Primary contact |
| can_pickup | BOOLEAN | DEFAULT true | Authorized for pickup |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

**Unique:** `(parent_id, student_id)`

---

### 9. `schools`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| organization_id | UUID | FK → organizations.id | |
| name | VARCHAR(255) | NOT NULL | |
| code | VARCHAR(50) | | Internal code |
| address | TEXT | | |
| city | VARCHAR(100) | | |
| state | VARCHAR(2) | | |
| zip | VARCHAR(10) | | |
| timezone | VARCHAR(50) | | School-specific if different |
| phone | VARCHAR(20) | | Main office |
| contact_name | VARCHAR(255) | | Transportation coordinator |
| contact_email | VARCHAR(255) | | |
| contact_phone | VARCHAR(20) | | |
| bell_times | JSONB | | `{"am_start": "08:00", "pm_end": "15:00", "early_release": "12:30"}` |
| location | GEOGRAPHY(POINT,4326) | | PostGIS point for routing |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

---

### 10. `vehicles`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| organization_id | UUID | FK → organizations.id | |
| vehicle_number | VARCHAR(50) | NOT NULL, UNIQUE(per org) | E.g., "E-613" |
| vin | VARCHAR(17) | | |
| make | VARCHAR(100) | | |
| model | VARCHAR(100) | | |
| year | INTEGER | | |
| type | ENUM | NOT NULL | `bus`, `van`, `minivan`, `sedan`, `wheelchair_van` |
| capacity | INTEGER | | Max passengers |
| wheelchair_capacity | INTEGER | DEFAULT 0 | |
| license_plate | VARCHAR(20) | | |
| registration_expiry | DATE | | |
| insurance_expiry | DATE | | |
| inspection_expiry | DATE | | |
| samsara_device_id | VARCHAR(100) | | Samsara GPS unit ID |
| diga_talk_id | VARCHAR(100) | | Diga Talk radio ID |
| status | ENUM | DEFAULT 'active' | `active`, `maintenance`, `retired`, `out_of_service` |
| current_odometer | DECIMAL(10,1) | | Miles |
| fuel_type | ENUM | | `diesel`, `gas`, `electric`, `hybrid` |
| garage_location | VARCHAR(255) | | Home base |
| cost_per_mile | DECIMAL(6,2) | | For billing calculations |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

---

### 10b. `vehicle_documents`
Document attachments for vehicles (mirrors `driver_documents`).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| vehicle_id | UUID | FK → vehicles.id | |
| document_type | document_type_vehicle | NOT NULL | `registration`, `insurance`, `inspection`, `maintenance_record` |
| file_path | VARCHAR(500) | NOT NULL | Storage path |
| original_filename | VARCHAR(255) | | |
| expiry_date | DATE | | |
| status | document_status | DEFAULT 'active' | `active`, `expired`, `pending_review` |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

---

### 11. `stops` (Master Stop Library)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| organization_id | UUID | FK → organizations.id | |
| name | VARCHAR(255) | NOT NULL | "Stop A", "John's House" |
| code | VARCHAR(50) | | Internal stop code |
| address | TEXT | | Full street address |
| city | VARCHAR(100) | | |
| state | VARCHAR(2) | | |
| zip | VARCHAR(10) | | |
| location | GEOGRAPHY(POINT,4326) | NOT NULL | PostGIS lat/lng |
| type | ENUM | DEFAULT 'student' | `student`, `school`, `garage`, `rtc`, `hub`, `other` |
| is_wheelchair_accessible | BOOLEAN | DEFAULT false | |
| notes | TEXT | | e.g., "Key under mat", "Ring doorbell" |
| school_id | UUID | FK → schools.id, NULLABLE | Associated school if applicable |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

---

### 12. `routes`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| organization_id | UUID | FK → organizations.id | |
| name | VARCHAR(255) | NOT NULL | E.g., "E-613" |
| code | VARCHAR(50) | NOT NULL, UNIQUE(per org) | Route identifier |
| description | TEXT | | |
| type | ENUM | NOT NULL | `regular_ed`, `special_ed`, `field_trip`, `athletic`, `midday`, `on_demand` |
| service_days | INTEGER[] | | PostgreSQL array of ISO day numbers [1,2,3,4,5] = Mon-Fri |
| school_id | UUID | FK → schools.id | Primary school served |
| estimated_distance | DECIMAL(8,2) | | Average miles |
| estimated_duration | INTEGER | | Average minutes |
| status | ENUM | DEFAULT 'active' | `active`, `inactive`, `seasonal` |
| season_start | DATE | | For seasonal routes |
| season_end | DATE | | |
| created_by | UUID | FK → users.id | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

---

### 13. `runs`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| route_id | UUID | FK → routes.id | Parent route |
| run_id | VARCHAR(100) | NOT NULL, UNIQUE | E.g., "E-S613ABEA" |
| direction | ENUM | NOT NULL | `am_pickup`, `pm_dropoff`, `midday`, `reverse`, `special` |
| effective_date | DATE | NOT NULL | When this run schedule starts |
| end_date | DATE | | NULL = indefinite |
| service_days | INTEGER[] | | Override route days if needed |
| scheduled_start_time | TIME | NOT NULL | First stop time |
| scheduled_end_time | TIME | NOT NULL | Last stop time |
| garage_departure_time | TIME | | When vehicle leaves garage |
| garage_return_time | TIME | | When vehicle returns to garage |
| estimated_distance | DECIMAL(8,2) | | This specific run's distance |
| estimated_duration | INTEGER | | This specific run's duration (min) |
| status | ENUM | DEFAULT 'draft' | `draft`, `published`, `archived` |
| notes | TEXT | | Dispatcher notes |
| created_by | UUID | FK → users.id | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

---

### 14. `run_stops`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| run_id | UUID | FK → runs.id | |
| stop_id | UUID | FK → stops.id | |
| sequence_order | INTEGER | NOT NULL | 1, 2, 3, ... |
| scheduled_time | TIME | NOT NULL | Planned arrival time |
| stop_type | ENUM | NOT NULL | `pickup`, `dropoff`, `both`, `garage`, `school`, `other` |
| passenger_count | INTEGER | DEFAULT 1 | Students at this stop |
| is_wheelchair | BOOLEAN | DEFAULT false | Any wheelchair users? |
| special_instructions | TEXT | | "3 Pickups", "Ring bell" |
| estimated_drive_time_from_prev | INTEGER | | Minutes from previous stop |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

**Unique:** `(run_id, sequence_order)`

---

### 15. `route_optimizations` ⭐ NEW
Stores optimization results for runs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| run_id | UUID | FK → runs.id | |
| original_distance | DECIMAL(8,2) | | Before optimization |
| optimized_distance | DECIMAL(8,2) | | After optimization |
| original_duration | INTEGER | | Minutes before |
| optimized_duration | INTEGER | | Minutes after |
| optimization_type | ENUM | DEFAULT 'vrp' | `vrp`, `manual`, `time_window` |
| status | ENUM | DEFAULT 'suggested' | `suggested`, `applied`, `rejected` |
| suggested_sequence | JSONB | | `[{"stop_id": "...", "sequence": 1, "time": "07:24"}, ...]` |
| applied_by | UUID | FK → users.id | Dispatcher who applied |
| applied_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

---

### 16. `run_assignments`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| run_id | UUID | FK → runs.id | |
| vehicle_id | UUID | FK → vehicles.id | |
| driver_id | UUID | FK → drivers.id | Primary driver |
| co_driver_id | UUID | FK → drivers.id, NULLABLE | Monitor/attendant |
| assignment_date | DATE | NOT NULL | The operating date |
| status | ENUM | DEFAULT 'scheduled' | `scheduled`, `in_progress`, `completed`, `cancelled`, `delayed` |
| actual_start_time | TIMESTAMPTZ | | When driver tapped "Start Run" |
| actual_end_time | TIMESTAMPTZ | | When driver tapped "End Run" |
| actual_distance | DECIMAL(8,2) | | From GPS or odometer |
| delay_minutes | INTEGER | DEFAULT 0 | Calculated or reported |
| delay_reason | TEXT | | "Traffic", "Mechanical", etc. |
| notes | TEXT | | |
| created_by | UUID | FK → users.id | Dispatcher who assigned |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

**Unique:** `(run_id, assignment_date)`

---

### 17. `run_events`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| run_assignment_id | UUID | FK → run_assignments.id | |
| event_type | ENUM | NOT NULL | `started`, `stop_arrived`, `stop_completed`, `delayed`, `incident`, `ended`, `gps_update` |
| stop_id | UUID | FK → stops.id, NULLABLE | If event relates to a stop |
| latitude | DECIMAL(10,8) | | GPS at time of event |
| longitude | DECIMAL(11,8) | | |
| event_data | JSONB | | Flexible payload |
| recorded_by | UUID | FK → users.id | Driver who recorded |
| recorded_at | TIMESTAMPTZ | NOT NULL | Event timestamp |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

---

### 18. `student_stop_assignments`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| student_id | UUID | FK → students.id | |
| run_id | UUID | FK → runs.id | |
| stop_id | UUID | FK → stops.id | Pickup OR dropoff stop |
| assignment_type | ENUM | NOT NULL | `am_pickup`, `pm_dropoff`, `midday`, `both` |
| effective_date | DATE | NOT NULL | |
| end_date | DATE | | NULL = ongoing |
| days_of_week | INTEGER[] | | [1,2,3,4,5] |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

---

### 19. `on_demand_requests`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| organization_id | UUID | FK → organizations.id | |
| request_number | VARCHAR(50) | UNIQUE, NOT NULL | e.g., "ODR-2026-0001" |
| requester_name | VARCHAR(255) | NOT NULL | |
| requester_phone | VARCHAR(20) | NOT NULL | |
| requester_email | VARCHAR(255) | | |
| requester_type | ENUM | NOT NULL | `parent`, `school_staff`, `community`, `district` |
| requester_user_id | UUID | FK → users.id, NULLABLE | If logged-in user |
| pickup_address | TEXT | NOT NULL | |
| pickup_location | GEOGRAPHY(POINT,4326) | | Geocoded |
| dropoff_address | TEXT | NOT NULL | |
| dropoff_location | GEOGRAPHY(POINT,4326) | | Geocoded |
| requested_date | DATE | NOT NULL | |
| requested_pickup_time | TIME | | Preferred pickup |
| requested_dropoff_time | TIME | | Preferred arrival |
| passenger_count | INTEGER | DEFAULT 1 | |
| wheelchair_needed | BOOLEAN | DEFAULT false | |
| student_names | TEXT | | Comma-separated if applicable |
| purpose | TEXT | | "Field trip", "Doctor appointment" |
| status | ENUM | DEFAULT 'pending' | `pending`, `approved`, `assigned`, `in_progress`, `completed`, `cancelled`, `denied` |
| approved_by | UUID | FK → users.id | |
| approved_at | TIMESTAMPTZ | | |
| assigned_run_id | UUID | FK → runs.id | Created/linked run |
| fare_estimate | DECIMAL(8,2) | | |
| fare_actual | DECIMAL(8,2) | | |
| notes | TEXT | | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

---

### 20. `billing_rates` ⭐ NEW
Rate cards for different billing scenarios.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| organization_id | UUID | FK → organizations.id | |
| name | VARCHAR(255) | NOT NULL | "Standard Contractor Rate", "Field Trip Rate" |
| rate_type | ENUM | NOT NULL | `per_mile`, `per_hour`, `per_trip`, `flat_daily` |
| rate_amount | DECIMAL(8,2) | NOT NULL | e.g., 1.85 per mile |
| vehicle_type | ENUM | NULLABLE | Apply to specific vehicle type or NULL = all |
| route_type | ENUM | NULLABLE | Apply to specific route type or NULL = all |
| effective_date | DATE | NOT NULL | |
| end_date | DATE | | NULL = ongoing |
| is_active | BOOLEAN | DEFAULT true | |
| created_by | UUID | FK → users.id | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

---

### 21. `billing_items` ⭐ NEW
Line items for each completed assignment.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| run_assignment_id | UUID | FK → run_assignments.id | |
| billing_rate_id | UUID | FK → billing_rates.id | |
| driver_id | UUID | FK → drivers.id | |
| invoice_id | UUID | FK → invoices.id, NULLABLE | NULL until invoiced |
| item_type | ENUM | NOT NULL | `mileage`, `hourly`, `trip`, `wait_time`, `extra_stop` |
| quantity | DECIMAL(8,2) | NOT NULL | Miles, hours, or trip count |
| unit_rate | DECIMAL(8,2) | NOT NULL | Rate at time of billing |
| amount | DECIMAL(10,2) | NOT NULL | quantity × unit_rate |
| description | TEXT | | "E-S613ABEA - June 5, 2026" |
| status | ENUM | DEFAULT 'pending' | `pending`, `invoiced`, `paid`, `disputed` |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

---

### 22. `invoices` ⭐ NEW

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| organization_id | UUID | FK → organizations.id | |
| invoice_number | VARCHAR(50) | NOT NULL, UNIQUE | e.g., "INV-2026-0001" |
| driver_id | UUID | FK → drivers.id | For contractor invoices |
| district_id | UUID | FK → organizations.id, NULLABLE | For district billing (future) |
| invoice_type | ENUM | NOT NULL | `contractor`, `district`, `on_demand` |
| period_start | DATE | NOT NULL | |
| period_end | DATE | NOT NULL | |
| subtotal | DECIMAL(10,2) | NOT NULL | |
| adjustments | DECIMAL(10,2) | DEFAULT 0 | Bonuses, penalties |
| total_amount | DECIMAL(10,2) | NOT NULL | |
| status | ENUM | DEFAULT 'draft' | `draft`, `sent`, `paid`, `overdue`, `cancelled` |
| sent_at | TIMESTAMPTZ | | |
| paid_at | TIMESTAMPTZ | | |
| paid_via | VARCHAR(50) | | `check`, `ach`, `direct_deposit` |
| notes | TEXT | | |
| created_by | UUID | FK → users.id | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

---

### 23. `notifications`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| organization_id | UUID | FK → organizations.id | |
| notifiable_type | VARCHAR(50) | NOT NULL | `run_assignment`, `on_demand_request`, `student`, `user` |
| notifiable_id | UUID | | Polymorphic FK |
| recipient_type | ENUM | NOT NULL | `parent`, `school`, `driver`, `dispatcher`, `contractor` |
| recipient_id | UUID | FK → users.id | |
| channel | ENUM | NOT NULL | `sms`, `email`, `push`, `in_app` |
| template_key | VARCHAR(100) | | `delay_alert`, `run_started`, `on_demand_confirmed` |
| subject | VARCHAR(255) | | |
| content | TEXT | NOT NULL | Rendered message |
| status | ENUM | DEFAULT 'pending' | `pending`, `sent`, `delivered`, `failed`, `read` |
| sent_at | TIMESTAMPTZ | | |
| delivered_at | TIMESTAMPTZ | | |
| error_message | TEXT | | |
| external_message_id | VARCHAR(255) | | Twilio SID, SES message ID |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

---

### 24. `notification_templates`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| organization_id | UUID | FK → organizations.id | NULL = default |
| key | VARCHAR(100) | NOT NULL | Template identifier |
| name | VARCHAR(255) | | Human-readable |
| description | TEXT | | When it's used |
| channels | notification_channel[] | | `['sms','email']` |
| sms_template | TEXT | | With {{variables}} |
| email_subject | VARCHAR(255) | | |
| email_body_html | TEXT | | |
| email_body_text | TEXT | | |
| push_title | VARCHAR(255) | | Mobile push notification title |
| push_body | TEXT | | Mobile push notification body |
| variables | JSONB | | `["student_name","delay_minutes","eta"]` |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

---

### 25. `gps_snapshots`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| vehicle_id | UUID | FK → vehicles.id | |
| source | ENUM | DEFAULT 'samsara' | `samsara`, `manual`, `mobile_app` |
| latitude | DECIMAL(10,8) | NOT NULL | |
| longitude | DECIMAL(11,8) | NOT NULL | |
| heading | DECIMAL(5,2) | | Degrees |
| speed | DECIMAL(5,2) | | MPH |
| odometer | DECIMAL(10,1) | | |
| ignition | BOOLEAN | | |
| recorded_at | TIMESTAMPTZ | NOT NULL | GPS timestamp |
| raw_payload | JSONB | | Full Samsara webhook data |
| created_at | TIMESTAMPTZ DEFAULT now() | |

**Index:** `vehicle_id, recorded_at` (BRIN for time-series)

---

### 26. `contractor_applications`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| organization_id | UUID | FK → organizations.id | |
| first_name | VARCHAR(100) | NOT NULL | |
| last_name | VARCHAR(100) | NOT NULL | |
| email | VARCHAR(255) | NOT NULL | |
| phone | VARCHAR(20) | NOT NULL | |
| address | TEXT | | |
| city | VARCHAR(100) | | |
| state | VARCHAR(2) | | |
| zip | VARCHAR(10) | | |
| company_name | VARCHAR(255) | | LLC / DBA |
| ein | VARCHAR(20) | | Tax ID |
| vehicle_type | ENUM | | `van`, `minivan`, `sedan`, `wheelchair_van` |
| vehicle_year | INTEGER | | |
| vehicle_make | VARCHAR(100) | | |
| vehicle_model | VARCHAR(100) | | |
| vehicle_capacity | INTEGER | | |
| license_number | VARCHAR(100) | | |
| license_state | VARCHAR(2) | | |
| license_expiry | DATE | | |
| insurance_provider | VARCHAR(255) | | |
| insurance_policy | VARCHAR(255) | | |
| insurance_expiry | DATE | | |
| background_check_consent | BOOLEAN | DEFAULT false | |
| drug_test_consent | BOOLEAN | DEFAULT false | |
| status | ENUM | DEFAULT 'submitted' | `submitted`, `under_review`, `documents_requested`, `approved`, `rejected` |
| reviewed_by | UUID | FK → users.id | |
| reviewed_at | TIMESTAMPTZ | | |
| rejection_reason | TEXT | | |
| converted_user_id | UUID | FK → users.id | When approved |
| created_at | TIMESTAMPTZ DEFAULT now() | |
| updated_at | TIMESTAMPTZ DEFAULT now() | |

---

### 26b. `contractor_application_documents`
Uploaded files attached to a contractor application (license, insurance, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| application_id | UUID | FK → contractor_applications.id | |
| document_type | VARCHAR(100) | NOT NULL | `license`, `insurance`, `vehicle_registration`, `other` |
| file_path | VARCHAR(500) | NOT NULL | |
| original_filename | VARCHAR(255) | | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

---

### 27. `reports`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| organization_id | UUID | FK → organizations.id | |
| report_type | ENUM | NOT NULL | `on_time_performance`, `mileage_summary`, `driver_hours`, `cost_efficiency`, `student_ridership` |
| name | VARCHAR(255) | | |
| date_range_start | DATE | | |
| date_range_end | DATE | | |
| parameters | JSONB | | Filter criteria |
| file_path | VARCHAR(500) | | Generated PDF/CSV |
| file_format | ENUM | | `pdf`, `csv`, `xlsx` |
| status | ENUM | DEFAULT 'pending' | `pending`, `generating`, `ready`, `failed` |
| generated_by | UUID | FK → users.id | |
| generated_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ DEFAULT now() | |

---

### 28. RBAC: `roles`, `permissions`, `role_permissions`, `user_roles`
Granular role-based access control. System roles are seeded; organizations may add custom roles. Full matrix and Laravel implementation in `backend-specs/rbac_permissions.md`.

**`roles`**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| organization_id | UUID | FK → organizations.id | NULL allowed for global system roles |
| name | VARCHAR(100) | NOT NULL | "Dispatcher" |
| slug | VARCHAR(100) | NOT NULL | `dispatcher` |
| description | TEXT | | |
| is_system_role | BOOLEAN | DEFAULT false | Protects built-in roles from deletion |
| created_at / updated_at | TIMESTAMPTZ | DEFAULT now() | |

**Unique:** `(organization_id, slug)`

**`permissions`**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| organization_id | UUID | FK → organizations.id | |
| name | VARCHAR(100) | NOT NULL | "View Routes" |
| slug | VARCHAR(100) | NOT NULL | `routes.view` |
| resource | VARCHAR(100) | NOT NULL | `routes` |
| action | VARCHAR(100) | NOT NULL | `view` |
| description | TEXT | | |

**Unique:** `(organization_id, slug)`

**`role_permissions`** — many-to-many join: `role_id` × `permission_id` (unique together).

**`user_roles`** — many-to-many join: `user_id` × `role_id` (unique together), plus `assigned_by` (FK → users.id) for the audit trail.

---

## Indexes & Performance

### Critical Indexes
```sql
-- Time-series GPS data (BRIN for efficiency)
CREATE INDEX idx_gps_snapshots_time ON gps_snapshots USING BRIN(recorded_at);

-- Run lookups by date
CREATE INDEX idx_run_assignments_date ON run_assignments(assignment_date);

-- Active runs for a route
CREATE INDEX idx_runs_route_status ON runs(route_id, status);

-- Billing lookups
CREATE INDEX idx_billing_items_driver ON billing_items(driver_id);
CREATE INDEX idx_billing_items_invoice ON billing_items(invoice_id);
CREATE INDEX idx_billing_items_status ON billing_items(status);
CREATE INDEX idx_invoices_driver ON invoices(driver_id);
CREATE INDEX idx_invoices_period ON invoices(period_start, period_end);

-- Parent/student lookups
CREATE INDEX idx_parent_students_parent ON parent_students(parent_id);
CREATE INDEX idx_parent_students_student ON parent_students(student_id);

-- App devices for push
CREATE INDEX idx_app_devices_user ON app_devices(user_id);
CREATE INDEX idx_app_devices_token ON app_devices(device_token);

-- Geospatial queries
CREATE INDEX idx_stops_location ON stops USING GIST(location);
CREATE INDEX idx_schools_location ON schools USING GIST(location);
CREATE INDEX idx_gps_location ON gps_snapshots USING GIST(
  geography(ST_Point(longitude, latitude))
);

-- Notification queue
CREATE INDEX idx_notifications_pending ON notifications(status) WHERE status = 'pending';
```

---

## Data Integrity Rules

1. **Run Assignment Uniqueness:** Only one assignment per `run_id` + `assignment_date`.
2. **Stop Sequence:** `sequence_order` must be contiguous within a run.
3. **Billing Calculation:** `billing_items.amount` = `quantity` × `unit_rate` (computed, not stored editable).
4. **Invoice Totals:** `invoices.total_amount` = SUM(`billing_items.amount`) + `adjustments`.
5. **Document Expiry:** Daily cron flags vehicles/drivers with expiring documents.
6. **Parent Access:** Parents can only view students linked via `parent_students`.

---

## Soft Deletes

All tables use `status` or `is_active` for soft deletion. No `deleted_at` columns in MVP.

---

*Next: See `database/schema.sql` for executable DDL (authoritative source, 33 tables).*
*Version: 2.1 | Updated: 2026-06-09*
