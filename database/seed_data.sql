-- ============================================================
-- FleetPilot — Seed Data (demo tenant: "Metro K-12 Transportation")
-- Sample data matching client's E-613 route structure
-- Includes billing, parent accounts, and route optimization
-- ============================================================

-- Clean existing data (use with caution in production)
-- TRUNCATE TABLE run_events, run_assignments, run_stops, runs, routes,
--              student_stop_assignments, students, stops, vehicles, drivers,
--              schools, parent_students, parent_accounts, users, organizations CASCADE;

-- ============================================================
-- 1. Organization
-- ============================================================

INSERT INTO organizations (id, name, slug, timezone, address, phone, email, settings)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Metro K-12 Transportation',
    'metro-k12',
    'America/New_York',
    '100 Transportation Blvd, Metro City, NY 10001',
    '+1-555-0100',
    'dispatch@metrok12.edu',
    '{"delay_alert_threshold_minutes": 5, "auto_notify_parents": true, "default_early_release": "12:30"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. Users
-- ============================================================

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, is_active, email_verified_at)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@metrok12.edu', '$2y$12$K0ByB.6YI2/OYrB4fQOYLe6QdRg6XnYlYqYqYqYqYqYqYqYqYqYqYqYq', 'Alice', 'Admin', '+1-555-0101', 'admin', true, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'dispatch@metrok12.edu', '$2y$12$K0ByB.6YI2/OYrB4fQOYLe6QdRg6XnYlYqYqYqYqYqYqYqYqYqYqYqYq', 'Bob', 'Dispatcher', '+1-555-0102', 'dispatcher', true, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'john.smith@metrok12.edu', '$2y$12$K0ByB.6YI2/OYrB4fQOYLe6QdRg6XnYlYqYqYqYqYqYqYqYqYqYqYqYq', 'John', 'Smith', '+1-555-0103', 'driver', true, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'sarah.jones@metrok12.edu', '$2y$12$K0ByB.6YI2/OYrB4fQOYLe6QdRg6XnYlYqYqYqYqYqYqYqYqYqYqYqYq', 'Sarah', 'Jones', '+1-555-0104', 'driver', true, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'mike.contractor@email.com', '$2y$12$K0ByB.6YI2/OYrB4fQOYLe6QdRg6XnYlYqYqYqYqYqYqYqYqYqYqYqYq', 'Mike', 'Contractor', '+1-555-0105', 'contractor', true, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a50', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'lisa.johnson@email.com', '$2y$12$K0ByB.6YI2/OYrB4fQOYLe6QdRg6XnYlYqYqYqYqYqYqYqYqYqYqYqYq', 'Lisa', 'Johnson', '+1-555-0301', 'parent', true, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a51', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'david.williams@email.com', '$2y$12$K0ByB.6YI2/OYrB4fQOYLe6QdRg6XnYlYqYqYqYqYqYqYqYqYqYqYqYq', 'David', 'Williams', '+1-555-0302', 'parent', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. Drivers
-- ============================================================

INSERT INTO drivers (id, user_id, employee_id, license_number, license_expiry, license_state, medical_cert_expiry, background_check_status, hire_date, is_contractor, pay_rate, pay_type, emergency_contact_name, emergency_contact_phone)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'DRV-001', 'NY-D12345678', '2027-03-15', 'NY', '2026-12-01', 'clear', '2023-08-01', false, 22.50, 'hour', 'Mary Smith', '+1-555-0106'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'DRV-002', 'NY-D87654321', '2027-06-20', 'NY', '2026-09-15', 'clear', '2024-01-15', false, 22.50, 'hour', 'Tom Jones', '+1-555-0107'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'CTR-001', 'NJ-C11223344', '2026-11-30', 'NJ', '2026-08-10', 'clear', '2024-06-01', true, 1.85, 'mile', 'Lisa Contractor', '+1-555-0108')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. Parent Accounts
-- ============================================================

INSERT INTO parent_accounts (id, user_id, address, city, state, zip, notification_prefs)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a52', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a50', '123 Oak Street', 'Metro City', 'NY', '10001', '{"sms": true, "email": true, "push": true, "delay_alert": true, "pickup_confirm": true, "dropoff_confirm": true}'::jsonb),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a53', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a51', '456 Pine Avenue', 'Metro City', 'NY', '10002', '{"sms": true, "email": true, "push": true, "delay_alert": true, "pickup_confirm": true, "dropoff_confirm": true}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. Schools
-- ============================================================

INSERT INTO schools (id, organization_id, name, code, address, city, state, zip, phone, contact_name, contact_email, contact_phone, bell_times, location)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Lincoln Elementary', 'LIN-E', '500 Lincoln Ave', 'Metro City', 'NY', '10001', '+1-555-0200', 'Principal Davis', 'principal@lincoln.edu', '+1-555-0201',
     '{"am_start": "08:00", "pm_end": "14:30", "early_release": "12:30"}'::jsonb,
     ST_SetSRID(ST_MakePoint(-74.0059, 40.7128), 4326)::geography),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Roosevelt Middle', 'ROS-M', '800 Roosevelt Blvd', 'Metro City', 'NY', '10002', '+1-555-0210', 'VP Johnson', 'vp@roosevelt.edu', '+1-555-0211',
     '{"am_start": "07:45", "pm_end": "15:00", "early_release": "12:00"}'::jsonb,
     ST_SetSRID(ST_MakePoint(-73.9857, 40.7484), 4326)::geography)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. Vehicles
-- ============================================================

INSERT INTO vehicles (id, organization_id, vehicle_number, vin, make, model, year, type, capacity, wheelchair_capacity, license_plate, samsara_device_id, status, current_odometer, fuel_type, garage_location, cost_per_mile)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'E-613', '1HGBH41JXMN109186', 'Thomas', 'Saf-T-Liner C2', 2022, 'bus', 48, 2, 'NY-BUS-613', 'SAM-613-001', 'active', 45231.5, 'diesel', 'Main Garage', 2.50),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'V-104', '3FA6P0LU1KR123456', 'Ford', 'Transit', 2023, 'van', 12, 1, 'NY-VAN-104', 'SAM-104-002', 'active', 23150.0, 'gas', 'Main Garage', 1.85),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'V-107', '5FNRL6H87LB123456', 'Honda', 'Odyssey', 2021, 'minivan', 7, 0, 'NY-MIN-107', NULL, 'active', 18900.0, 'gas', 'South Depot', 1.60)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 7. Stops
-- ============================================================

INSERT INTO stops (id, organization_id, name, code, address, city, state, zip, location, type, notes)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a25', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Main Garage', 'GAR-MAIN', '100 Transport Blvd', 'Metro City', 'NY', '10001', ST_SetSRID(ST_MakePoint(-74.0100, 40.7100), 4326)::geography, 'garage', 'Bus yard entrance on east side'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a26', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Stop A - Oak St', 'STOP-A', '123 Oak Street', 'Metro City', 'NY', '10001', ST_SetSRID(ST_MakePoint(-73.9950, 40.7150), 4326)::geography, 'student', 'Corner of Oak and 5th'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a27', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Stop B - Pine Ave', 'STOP-B', '456 Pine Avenue', 'Metro City', 'NY', '10002', ST_SetSRID(ST_MakePoint(-73.9800, 40.7200), 4326)::geography, 'student', 'Apartment complex entrance'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a28', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Stop C - Elm Dr', 'STOP-C', '789 Elm Drive', 'Metro City', 'NY', '10003', ST_SetSRID(ST_MakePoint(-73.9700, 40.7250), 4326)::geography, 'student', 'Ring doorbell'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a29', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Stop D - Maple Rd', 'STOP-D', '321 Maple Road', 'Metro City', 'NY', '10004', ST_SetSRID(ST_MakePoint(-73.9600, 40.7300), 4326)::geography, 'student', NULL),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a2a', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Stop E - Cedar Ln', 'STOP-E', '654 Cedar Lane', 'Metro City', 'NY', '10005', ST_SetSRID(ST_MakePoint(-73.9500, 40.7350), 4326)::geography, 'student', 'House with blue mailbox'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a2b', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'RTC Center', 'RTC-01', '1000 RTC Boulevard', 'Metro City', 'NY', '10006', ST_SetSRID(ST_MakePoint(-73.9400, 40.7400), 4326)::geography, 'rtc', 'Regional Transportation Center'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a2c', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Lincoln Elementary School', 'SCH-LIN', '500 Lincoln Ave', 'Metro City', 'NY', '10001', ST_SetSRID(ST_MakePoint(-74.0059, 40.7128), 4326)::geography, 'school', 'Front circle drive')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 8. Routes
-- ============================================================

INSERT INTO routes (id, organization_id, name, code, description, type, service_days, school_id, estimated_distance, estimated_duration, status, created_by)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a2d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'E-613', 'E-613', 'Elementary Route 613 - Downtown corridor', 'regular_ed', ARRAY[1,2,3,4,5], 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 18.50, 45, 'active', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 9. Runs
-- ============================================================

INSERT INTO runs (id, route_id, run_id, direction, effective_date, service_days, scheduled_start_time, scheduled_end_time, garage_departure_time, garage_return_time, estimated_distance, estimated_duration, status, notes, created_by)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a2e', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a2d', 'E-S613ABEA', 'am_pickup', '2024-09-01', ARRAY[1,2,3,4,5], '07:09', '07:59', '07:09', '08:15', 20.29, 50, 'published', 'AM elementary pickup route', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a2f', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a2d', 'E-S613ABEP', 'pm_dropoff', '2024-09-01', ARRAY[1,2,3,4,5], '10:50', '11:38', '10:40', '11:45', 18.64, 38, 'published', 'PM elementary dropoff route', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a30', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a2d', 'E-S613RTCA', 'midday', '2024-09-01', ARRAY[1,2,3,4], '08:17', '09:05', '08:10', '09:15', 15.46, 48, 'published', 'Midday RTC shuttle - AM direction', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a2d', 'E-S613RTCP', 'reverse', '2024-09-01', ARRAY[1,2,3,4], '12:33', '13:30', '12:25', '13:35', 20.66, 47, 'published', 'Midday RTC shuttle - PM return', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 10. Run Stops
-- ============================================================

INSERT INTO run_stops (id, run_id, stop_id, sequence_order, scheduled_time, stop_type, passenger_count, is_wheelchair, special_instructions, estimated_drive_time_from_prev)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a32', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a2e', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a25', 1, '07:09', 'garage', 0, false, 'Depart garage', 0),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a2e', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a26', 2, '07:27', 'pickup', 3, false, '3 Pickups', 18),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a34', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a2e', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a27', 3, '07:45', 'dropoff', 3, false, NULL, 18),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a35', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a2f', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a27', 1, '10:50', 'pickup', 3, false, '3 Pickups', 0),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a36', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a2f', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a26', 2, '11:07', 'dropoff', 3, false, NULL, 17),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a37', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a2f', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a25', 3, '11:39', 'garage', 0, false, 'Return to garage', 32),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a38', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a30', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a2c', 1, '08:17', 'school', 0, false, 'Depart Lincoln Elementary', 0),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a39', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a30', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a28', 2, '08:22', 'pickup', 2, false, NULL, 5),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a3a', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a30', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a29', 3, '08:26', 'pickup', 1, false, NULL, 4),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a3b', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a30', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a2a', 4, '08:29', 'pickup', 2, false, NULL, 3),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a3c', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a30', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a2b', 5, '08:35', 'dropoff', 5, false, 'RTC dropoff', 6),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a3d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a30', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a25', 6, '08:55', 'garage', 0, false, 'Return to garage', 20),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a3e', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a26', 1, '12:33', 'pickup', 2, false, NULL, 0),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a3f', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a2b', 2, '12:45', 'pickup', 3, false, 'RTC (3 Pickups)', 12),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a40', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a2a', 3, '12:53', 'dropoff', 2, false, NULL, 8),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a41', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a29', 4, '12:57', 'dropoff', 1, false, NULL, 4),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a42', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a28', 5, '13:01', 'dropoff', 2, false, NULL, 4),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a43', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a25', 6, '13:20', 'garage', 0, false, 'Return to garage', 19)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 11. Students
-- ============================================================

INSERT INTO students (id, organization_id, student_id, first_name, last_name, grade, school_id, date_of_birth, parent_name, parent_phone, parent_email, is_wheelchair, status)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'STU-1001', 'Emma', 'Johnson', '3', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', '2018-03-15', 'Lisa Johnson', '+1-555-0301', 'lisa.j@email.com', false, 'active'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a45', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'STU-1002', 'Liam', 'Williams', '4', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', '2017-08-22', 'David Williams', '+1-555-0302', 'david.w@email.com', false, 'active'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a46', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'STU-1003', 'Olivia', 'Brown', '2', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', '2019-01-10', 'Sarah Brown', '+1-555-0303', 'sarah.b@email.com', true, 'active')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 12. Parent-Student Links
-- ============================================================

INSERT INTO parent_students (id, parent_id, student_id, relationship, is_primary, can_pickup)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a54', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a52', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'mother', true, true),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a53', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a45', 'father', true, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 13. Billing Rates
-- ============================================================

INSERT INTO billing_rates (id, organization_id, name, rate_type, rate_amount, vehicle_type, route_type, effective_date, is_active, created_by)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a56', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Standard Contractor Mileage', 'per_mile', 1.85, NULL, NULL, '2024-09-01', true, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a57', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Driver Hourly Rate', 'per_hour', 22.50, NULL, NULL, '2024-09-01', true, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a58', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Field Trip Premium', 'per_hour', 35.00, 'bus', 'field_trip', '2024-09-01', true, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a59', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Minivan Flat Rate', 'per_trip', 45.00, 'minivan', NULL, '2024-09-01', true, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 14. Notification Templates
-- ============================================================

INSERT INTO notification_templates (id, organization_id, key, name, description, channels, sms_template, email_subject, email_body_text, push_title, push_body, variables, is_active)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a47', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'delay_alert', 'Route Delay Alert', 'Sent to parents when a run is delayed', ARRAY['sms', 'email', 'push']::notification_channel[],
     'K12 Transport Alert: {{route_name}} is running {{delay_minutes}} minutes late. New ETA: {{eta}}. Reason: {{reason}}.',
     'Route Delay Alert - {{route_name}}',
     'Dear Parent, Route {{route_name}} is currently running {{delay_minutes}} minutes late. New estimated arrival: {{eta}} Reason: {{reason}} Driver: {{driver_name}} Vehicle: {{vehicle_number}}',
     'Route Delay Alert',
     '{{route_name}} is running {{delay_minutes}} minutes late. ETA: {{eta}}.',
     '["route_name", "delay_minutes", "eta", "reason", "driver_name", "vehicle_number"]'::jsonb, true),

    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a48', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'run_started', 'Run Started Notification', 'Sent when driver starts a run', ARRAY['push']::notification_channel[],
     NULL, NULL, NULL,
     'Bus En Route',
     '{{driver_name}} has started {{route_name}}. First pickup: {{first_stop}} at {{first_stop_time}}.',
     '["driver_name", "route_name", "first_stop", "first_stop_time"]'::jsonb, true),

    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a49', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'on_demand_confirmed', 'On-Demand Request Confirmed', 'Sent when on-demand request is approved', ARRAY['sms', 'email', 'push']::notification_channel[],
     'Your transportation request {{request_number}} has been confirmed. Pickup: {{pickup_time}} at {{pickup_address}}. Driver: {{driver_name}}.',
     'Transportation Confirmed - {{request_number}}',
     'Hello {{requester_name}}, Your transportation request {{request_number}} has been confirmed. Pickup: {{pickup_time}} at {{pickup_address}} Driver: {{driver_name}} Vehicle: {{vehicle_number}}',
     'Transportation Confirmed',
     'Your ride {{request_number}} is confirmed. Pickup at {{pickup_time}}.',
     '["request_number", "requester_name", "pickup_time", "pickup_address", "driver_name", "vehicle_number"]'::jsonb, true),

    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a4a', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'student_pickup_complete', 'Student Pickup Confirmation', 'Sent when student is picked up', ARRAY['push']::notification_channel[],
     NULL, NULL, NULL,
     'Pickup Complete',
     '{{student_name}} was picked up at {{stop_name}} at {{pickup_time}}.',
     '["student_name", "stop_name", "pickup_time"]'::jsonb, true),

    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a4b', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'student_dropoff_complete', 'Student Dropoff Confirmation', 'Sent when student is dropped off', ARRAY['push']::notification_channel[],
     NULL, NULL, NULL,
     'Dropoff Complete',
     '{{student_name}} was dropped off at {{stop_name}} at {{dropoff_time}}.',
     '["student_name", "stop_name", "dropoff_time"]'::jsonb, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 15. Sample Run Assignment (for today)
-- ============================================================

INSERT INTO run_assignments (id, run_id, vehicle_id, driver_id, assignment_date, status, created_by)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a4c', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a2e', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', CURRENT_DATE, 'scheduled', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a4d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a2f', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', CURRENT_DATE, 'scheduled', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a4e', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a30', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', CURRENT_DATE, 'scheduled', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 16. Sample On-Demand Request
-- ============================================================

INSERT INTO on_demand_requests (id, organization_id, request_number, requester_name, requester_phone, requester_email, requester_type, pickup_address, dropoff_address, requested_date, requested_pickup_time, passenger_count, wheelchair_needed, purpose, status)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a4f', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ODR-2026-0001', 'Maria Garcia', '+1-555-0401', 'maria.g@email.com', 'parent', '789 Pine St, Metro City', 'Lincoln Elementary, 500 Lincoln Ave', CURRENT_DATE + INTERVAL '2 days', '14:00', 1, false, 'Doctor appointment pickup', 'pending')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 17. Sample Billing Items and Invoice
-- ============================================================

INSERT INTO billing_items (id, run_assignment_id, billing_rate_id, driver_id, item_type, quantity, unit_rate, amount, description, status)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a60', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a4c', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a56', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 'mileage', 20.29, 1.85, 37.54, 'E-S613ABEA - June 5, 2026', 'pending'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a61', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a4d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a56', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 'mileage', 18.64, 1.85, 34.48, 'E-S613ABEP - June 5, 2026', 'pending')
ON CONFLICT (id) DO NOTHING;

INSERT INTO invoices (id, organization_id, invoice_number, driver_id, invoice_type, period_start, period_end, subtotal, adjustments, total_amount, status, notes, created_by)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a62', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'INV-2026-0001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 'contractor', '2026-05-01', '2026-05-31', 72.02, 0, 72.02, 'draft', 'Sample invoice for contractor Mike Contractor', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12')
ON CONFLICT (id) DO NOTHING;

-- Link billing items to invoice
UPDATE billing_items SET invoice_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a62', status = 'invoiced'
WHERE id IN ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a60', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a61');
