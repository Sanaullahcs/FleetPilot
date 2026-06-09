-- ============================================================
-- FleetPilot — K-12 Student Transportation Management System
-- PostgreSQL 16 + PostGIS Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- ENUMERATIONS
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'dispatcher', 'driver', 'contractor', 'school_contact', 'parent');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_type') THEN
        CREATE TYPE vehicle_type AS ENUM ('bus', 'van', 'minivan', 'sedan', 'wheelchair_van');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_status') THEN
        CREATE TYPE vehicle_status AS ENUM ('active', 'maintenance', 'retired', 'out_of_service');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'route_type') THEN
        CREATE TYPE route_type AS ENUM ('regular_ed', 'special_ed', 'field_trip', 'athletic', 'midday', 'on_demand');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'run_direction') THEN
        CREATE TYPE run_direction AS ENUM ('am_pickup', 'pm_dropoff', 'midday', 'reverse', 'special');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'run_status') THEN
        CREATE TYPE run_status AS ENUM ('draft', 'published', 'archived');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stop_type') THEN
        CREATE TYPE stop_type AS ENUM ('student', 'school', 'garage', 'rtc', 'hub', 'other');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'run_stop_type') THEN
        CREATE TYPE run_stop_type AS ENUM ('pickup', 'dropoff', 'both', 'garage', 'school', 'other');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_status') THEN
        CREATE TYPE assignment_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'delayed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type') THEN
        CREATE TYPE event_type AS ENUM ('started', 'stop_arrived', 'stop_completed', 'delayed', 'incident', 'ended', 'gps_update');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type_driver') THEN
        CREATE TYPE document_type_driver AS ENUM ('license', 'medical', 'insurance', 'background_check', 'drug_test', 'training_cert');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type_vehicle') THEN
        CREATE TYPE document_type_vehicle AS ENUM ('registration', 'insurance', 'inspection', 'maintenance_record');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'requester_type') THEN
        CREATE TYPE requester_type AS ENUM ('parent', 'school_staff', 'community', 'district');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
        CREATE TYPE request_status AS ENUM ('pending', 'approved', 'assigned', 'in_progress', 'completed', 'cancelled', 'denied');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_channel') THEN
        CREATE TYPE notification_channel AS ENUM ('sms', 'email', 'push', 'in_app');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_status') THEN
        CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'read');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recipient_type') THEN
        CREATE TYPE recipient_type AS ENUM ('parent', 'school', 'driver', 'dispatcher', 'contractor');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_type') THEN
        CREATE TYPE report_type AS ENUM ('on_time_performance', 'mileage_summary', 'driver_hours', 'cost_efficiency', 'student_ridership');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
        CREATE TYPE report_status AS ENUM ('pending', 'generating', 'ready', 'failed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'file_format') THEN
        CREATE TYPE file_format AS ENUM ('pdf', 'csv', 'xlsx');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gps_source') THEN
        CREATE TYPE gps_source AS ENUM ('samsara', 'manual', 'mobile_app');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contractor_app_status') THEN
        CREATE TYPE contractor_app_status AS ENUM ('submitted', 'under_review', 'documents_requested', 'approved', 'rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'background_check_status') THEN
        CREATE TYPE background_check_status AS ENUM ('pending', 'clear', 'flagged', 'expired');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pay_type') THEN
        CREATE TYPE pay_type AS ENUM ('mile', 'hour', 'trip', 'flat');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fuel_type') THEN
        CREATE TYPE fuel_type AS ENUM ('diesel', 'gas', 'electric', 'hybrid');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_status') THEN
        CREATE TYPE document_status AS ENUM ('active', 'expired', 'pending_review');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'device_type') THEN
        CREATE TYPE device_type AS ENUM ('ios', 'android', 'web');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_rate_type') THEN
        CREATE TYPE billing_rate_type AS ENUM ('per_mile', 'per_hour', 'per_trip', 'flat_daily');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_item_type') THEN
        CREATE TYPE billing_item_type AS ENUM ('mileage', 'hourly', 'trip', 'wait_time', 'extra_stop');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_item_status') THEN
        CREATE TYPE billing_item_status AS ENUM ('pending', 'invoiced', 'paid', 'disputed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
        CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_type') THEN
        CREATE TYPE invoice_type AS ENUM ('contractor', 'district', 'on_demand');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'optimization_status') THEN
        CREATE TYPE optimization_status AS ENUM ('suggested', 'applied', 'rejected');
    END IF;
END $$;

-- ============================================================
-- CORE TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    logo_url VARCHAR(500),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL,
    is_active BOOLEAN DEFAULT true,
    email_verified_at TIMESTAMPTZ,
    phone_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    device_type device_type NOT NULL,
    device_token VARCHAR(500) NOT NULL,
    device_name VARCHAR(255),
    app_version VARCHAR(20),
    os_version VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, device_token)
);

CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    employee_id VARCHAR(50),
    license_number VARCHAR(100),
    license_expiry DATE,
    license_state VARCHAR(2),
    medical_cert_expiry DATE,
    background_check_status background_check_status DEFAULT 'pending',
    background_check_date DATE,
    hire_date DATE,
    termination_date DATE,
    is_contractor BOOLEAN DEFAULT false,
    contractor_company VARCHAR(255),
    pay_rate DECIMAL(8,2),
    pay_type pay_type,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS driver_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    document_type document_type_driver NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255),
    expiry_date DATE,
    status document_status DEFAULT 'active',
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS parent_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    zip VARCHAR(10),
    emergency_contact VARCHAR(255),
    emergency_phone VARCHAR(20),
    notification_prefs JSONB DEFAULT '{"sms": true, "email": true, "push": true, "delay_alert": true, "pickup_confirm": true, "dropoff_confirm": true}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    zip VARCHAR(10),
    timezone VARCHAR(50),
    phone VARCHAR(20),
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    bell_times JSONB,
    location GEOGRAPHY(POINT,4326),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    vehicle_number VARCHAR(50) NOT NULL,
    vin VARCHAR(17),
    make VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    type vehicle_type NOT NULL,
    capacity INTEGER,
    wheelchair_capacity INTEGER DEFAULT 0,
    license_plate VARCHAR(20),
    registration_expiry DATE,
    insurance_expiry DATE,
    inspection_expiry DATE,
    samsara_device_id VARCHAR(100),
    diga_talk_id VARCHAR(100),
    status vehicle_status DEFAULT 'active',
    current_odometer DECIMAL(10,1),
    fuel_type fuel_type,
    garage_location VARCHAR(255),
    cost_per_mile DECIMAL(6,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, vehicle_number)
);

CREATE TABLE IF NOT EXISTS vehicle_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    document_type document_type_vehicle NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    expiry_date DATE,
    status document_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    zip VARCHAR(10),
    location GEOGRAPHY(POINT,4326) NOT NULL,
    type stop_type DEFAULT 'student',
    is_wheelchair_accessible BOOLEAN DEFAULT false,
    notes TEXT,
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    type route_type NOT NULL,
    service_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    estimated_distance DECIMAL(8,2),
    estimated_duration INTEGER,
    status run_status DEFAULT 'active',
    season_start DATE,
    season_end DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, code)
);

CREATE TABLE IF NOT EXISTS runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    run_id VARCHAR(100) NOT NULL UNIQUE,
    direction run_direction NOT NULL,
    effective_date DATE NOT NULL,
    end_date DATE,
    service_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
    scheduled_start_time TIME NOT NULL,
    scheduled_end_time TIME NOT NULL,
    garage_departure_time TIME,
    garage_return_time TIME,
    estimated_distance DECIMAL(8,2),
    estimated_duration INTEGER,
    status run_status DEFAULT 'draft',
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS run_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES runs(id) ON DELETE CASCADE,
    stop_id UUID REFERENCES stops(id) ON DELETE CASCADE,
    sequence_order INTEGER NOT NULL,
    scheduled_time TIME NOT NULL,
    stop_type run_stop_type NOT NULL,
    passenger_count INTEGER DEFAULT 1,
    is_wheelchair BOOLEAN DEFAULT false,
    special_instructions TEXT,
    estimated_drive_time_from_prev INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(run_id, sequence_order)
);

CREATE TABLE IF NOT EXISTS route_optimizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES runs(id) ON DELETE CASCADE,
    original_distance DECIMAL(8,2),
    optimized_distance DECIMAL(8,2),
    original_duration INTEGER,
    optimized_duration INTEGER,
    optimization_type VARCHAR(20) DEFAULT 'vrp',
    status optimization_status DEFAULT 'suggested',
    suggested_sequence JSONB,
    applied_by UUID REFERENCES users(id),
    applied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS run_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES runs(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    co_driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    assignment_date DATE NOT NULL,
    status assignment_status DEFAULT 'scheduled',
    actual_start_time TIMESTAMPTZ,
    actual_end_time TIMESTAMPTZ,
    actual_distance DECIMAL(8,2),
    delay_minutes INTEGER DEFAULT 0,
    delay_reason TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(run_id, assignment_date)
);

CREATE TABLE IF NOT EXISTS run_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_assignment_id UUID REFERENCES run_assignments(id) ON DELETE CASCADE,
    event_type event_type NOT NULL,
    stop_id UUID REFERENCES stops(id) ON DELETE SET NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    event_data JSONB,
    recorded_by UUID REFERENCES users(id),
    recorded_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    student_id VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    grade VARCHAR(10),
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    date_of_birth DATE,
    is_wheelchair BOOLEAN DEFAULT false,
    requires_monitor BOOLEAN DEFAULT false,
    special_needs TEXT,
    photo_url VARCHAR(500),
    status run_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS parent_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES parent_accounts(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    relationship VARCHAR(50),
    is_primary BOOLEAN DEFAULT false,
    can_pickup BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(parent_id, student_id)
);

CREATE TABLE IF NOT EXISTS student_stop_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    run_id UUID REFERENCES runs(id) ON DELETE CASCADE,
    stop_id UUID REFERENCES stops(id) ON DELETE CASCADE,
    assignment_type run_stop_type NOT NULL,
    effective_date DATE NOT NULL,
    end_date DATE,
    days_of_week INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS on_demand_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    request_number VARCHAR(50) NOT NULL UNIQUE,
    requester_name VARCHAR(255) NOT NULL,
    requester_phone VARCHAR(20) NOT NULL,
    requester_email VARCHAR(255),
    requester_type requester_type NOT NULL,
    requester_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    pickup_address TEXT NOT NULL,
    pickup_location GEOGRAPHY(POINT,4326),
    dropoff_address TEXT NOT NULL,
    dropoff_location GEOGRAPHY(POINT,4326),
    requested_date DATE NOT NULL,
    requested_pickup_time TIME,
    requested_dropoff_time TIME,
    passenger_count INTEGER DEFAULT 1,
    wheelchair_needed BOOLEAN DEFAULT false,
    student_names TEXT,
    purpose TEXT,
    status request_status DEFAULT 'pending',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    assigned_run_id UUID REFERENCES runs(id) ON DELETE SET NULL,
    fare_estimate DECIMAL(8,2),
    fare_actual DECIMAL(8,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billing_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    rate_type billing_rate_type NOT NULL,
    rate_amount DECIMAL(8,2) NOT NULL,
    vehicle_type vehicle_type,
    route_type route_type,
    effective_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billing_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_assignment_id UUID REFERENCES run_assignments(id) ON DELETE CASCADE,
    billing_rate_id UUID REFERENCES billing_rates(id),
    driver_id UUID REFERENCES drivers(id),
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    item_type billing_item_type NOT NULL,
    quantity DECIMAL(8,2) NOT NULL,
    unit_rate DECIMAL(8,2) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    status billing_item_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    driver_id UUID REFERENCES drivers(id),
    invoice_type invoice_type NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    adjustments DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    status invoice_status DEFAULT 'draft',
    sent_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    paid_via VARCHAR(50),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    notifiable_type VARCHAR(50) NOT NULL,
    notifiable_id UUID,
    recipient_type recipient_type NOT NULL,
    recipient_id UUID,
    channel notification_channel NOT NULL,
    template_key VARCHAR(100),
    subject VARCHAR(255),
    content TEXT NOT NULL,
    status notification_status DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    external_message_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    name VARCHAR(255),
    description TEXT,
    channels notification_channel[] DEFAULT ARRAY['sms', 'email']::notification_channel[],
    sms_template TEXT,
    email_subject VARCHAR(255),
    email_body_html TEXT,
    email_body_text TEXT,
    push_title VARCHAR(255),
    push_body TEXT,
    variables JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, key)
);

CREATE TABLE IF NOT EXISTS gps_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    source gps_source DEFAULT 'samsara',
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    heading DECIMAL(5,2),
    speed DECIMAL(5,2),
    odometer DECIMAL(10,1),
    ignition BOOLEAN,
    recorded_at TIMESTAMPTZ NOT NULL,
    raw_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contractor_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    zip VARCHAR(10),
    company_name VARCHAR(255),
    ein VARCHAR(20),
    vehicle_type vehicle_type,
    vehicle_year INTEGER,
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_capacity INTEGER,
    license_number VARCHAR(100),
    license_state VARCHAR(2),
    license_expiry DATE,
    insurance_provider VARCHAR(255),
    insurance_policy VARCHAR(255),
    insurance_expiry DATE,
    background_check_consent BOOLEAN DEFAULT false,
    drug_test_consent BOOLEAN DEFAULT false,
    status contractor_app_status DEFAULT 'submitted',
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    converted_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contractor_application_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES contractor_applications(id) ON DELETE CASCADE,
    document_type document_type_driver NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    report_type report_type NOT NULL,
    name VARCHAR(255),
    date_range_start DATE,
    date_range_end DATE,
    parameters JSONB,
    file_path VARCHAR(500),
    file_format file_format,
    status report_status DEFAULT 'pending',
    generated_by UUID REFERENCES users(id),
    generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_org_role ON users(organization_id, role);
CREATE INDEX IF NOT EXISTS idx_drivers_user ON drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_contractor ON drivers(is_contractor) WHERE is_contractor = true;
CREATE INDEX IF NOT EXISTS idx_vehicles_org ON vehicles(organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_samsara ON vehicles(samsara_device_id) WHERE samsara_device_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stops_org ON stops(organization_id);
CREATE INDEX IF NOT EXISTS idx_stops_location ON stops USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_stops_school ON stops(school_id);
CREATE INDEX IF NOT EXISTS idx_schools_org ON schools(organization_id);
CREATE INDEX IF NOT EXISTS idx_schools_location ON schools USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_routes_org ON routes(organization_id);
CREATE INDEX IF NOT EXISTS idx_routes_code ON routes(code);
CREATE INDEX IF NOT EXISTS idx_runs_route ON runs(route_id);
CREATE INDEX IF NOT EXISTS idx_runs_run_id ON runs(run_id);
CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status);
CREATE INDEX IF NOT EXISTS idx_run_stops_run ON run_stops(run_id);
CREATE INDEX IF NOT EXISTS idx_run_stops_stop ON run_stops(stop_id);
CREATE INDEX IF NOT EXISTS idx_route_optimizations_run ON route_optimizations(run_id);
CREATE INDEX IF NOT EXISTS idx_run_assignments_run ON run_assignments(run_id);
CREATE INDEX IF NOT EXISTS idx_run_assignments_date ON run_assignments(assignment_date);
CREATE INDEX IF NOT EXISTS idx_run_assignments_driver ON run_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_run_assignments_vehicle ON run_assignments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_run_events_assignment ON run_events(run_assignment_id);
CREATE INDEX IF NOT EXISTS idx_run_events_type ON run_events(event_type);
CREATE INDEX IF NOT EXISTS idx_students_org ON students(organization_id);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_students_parent ON parent_students(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_students_student ON parent_students(student_id);
CREATE INDEX IF NOT EXISTS idx_student_assignments_student ON student_stop_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_assignments_run ON student_stop_assignments(run_id);
CREATE INDEX IF NOT EXISTS idx_on_demand_org ON on_demand_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_on_demand_status ON on_demand_requests(status);
CREATE INDEX IF NOT EXISTS idx_on_demand_date ON on_demand_requests(requested_date);
CREATE INDEX IF NOT EXISTS idx_billing_rates_org ON billing_rates(organization_id);
CREATE INDEX IF NOT EXISTS idx_billing_items_driver ON billing_items(driver_id);
CREATE INDEX IF NOT EXISTS idx_billing_items_invoice ON billing_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_billing_items_status ON billing_items(status);
CREATE INDEX IF NOT EXISTS idx_invoices_driver ON invoices(driver_id);
CREATE INDEX IF NOT EXISTS idx_invoices_period ON invoices(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_app_devices_user ON app_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_app_devices_token ON app_devices(device_token);
CREATE INDEX IF NOT EXISTS idx_notifications_pending ON notifications(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_notifications_org ON notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_gps_vehicle ON gps_snapshots(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_gps_recorded ON gps_snapshots USING BRIN(recorded_at);
CREATE INDEX IF NOT EXISTS idx_contractor_app_status ON contractor_applications(status);
CREATE INDEX IF NOT EXISTS idx_contractor_app_email ON contractor_applications(email);
CREATE INDEX IF NOT EXISTS idx_reports_org ON reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_app_devices_updated_at BEFORE UPDATE ON app_devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_parent_accounts_updated_at BEFORE UPDATE ON parent_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stops_updated_at BEFORE UPDATE ON stops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_runs_updated_at BEFORE UPDATE ON runs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_run_stops_updated_at BEFORE UPDATE ON run_stops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_route_optimizations_updated_at BEFORE UPDATE ON route_optimizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_run_assignments_updated_at BEFORE UPDATE ON run_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_parent_students_updated_at BEFORE UPDATE ON parent_students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_assignments_updated_at BEFORE UPDATE ON student_stop_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_on_demand_updated_at BEFORE UPDATE ON on_demand_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_billing_rates_updated_at BEFORE UPDATE ON billing_rates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_billing_items_updated_at BEFORE UPDATE ON billing_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contractor_applications_updated_at BEFORE UPDATE ON contractor_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================

COMMENT ON TABLE organizations IS 'Top-level tenant. MVP supports single org; multi-tenant ready.';
COMMENT ON TABLE runs IS 'Individual scheduled execution of a route. The daily dispatchable unit.';
COMMENT ON TABLE run_assignments IS 'Daily linking of run + vehicle + driver. One per run per date.';
COMMENT ON TABLE run_events IS 'Granular audit trail: start, stop arrival, completion, delays, incidents.';
COMMENT ON TABLE gps_snapshots IS 'Time-series GPS data from Samsara or mobile app.';
COMMENT ON TABLE on_demand_requests IS 'Public trip requests. Converted to runs on approval.';
COMMENT ON TABLE contractor_applications IS 'Independent contractor registration workflow before driver account creation.';
COMMENT ON TABLE billing_rates IS 'Rate cards defining pay rates for contractors.';
COMMENT ON TABLE billing_items IS 'Line items generated from completed run assignments.';
COMMENT ON TABLE invoices IS 'Contractor payment invoices grouping billing items by period.';
COMMENT ON TABLE route_optimizations IS 'Suggested stop sequence optimizations from OR-Tools solver.';
COMMENT ON TABLE parent_accounts IS 'Parent/guardian profiles and notification preferences.';
-- ============================================================
-- 28. ROLES AND PERMISSIONS (Granular RBAC)
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, slug)
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, slug)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_roles_org ON roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_permissions_org ON permissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed default system roles
INSERT INTO roles (id, organization_id, name, slug, description, is_system_role)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380b01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Super Admin', 'super_admin', 'Full system access across all organizations', true),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380b02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Admin', 'admin', 'Organization admin with user and settings management', true),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380b03', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Dispatcher', 'dispatcher', 'Daily operations and route management', true),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380b04', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Driver', 'driver', 'Employee driver with assigned runs', true),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380b05', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Contractor', 'contractor', 'Independent contractor with available runs', true),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380b06', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Parent', 'parent', 'Guardian with child tracking access', true),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380b07', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'School Contact', 'school_contact', 'School staff with view access', true)
ON CONFLICT DO NOTHING;

-- Seed default permissions
INSERT INTO permissions (id, organization_id, name, slug, resource, action, description)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'View Routes', 'routes.view', 'routes', 'view', 'View route list and details'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380c02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Create Routes', 'routes.create', 'routes', 'create', 'Create new routes'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380c03', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Edit Routes', 'routes.edit', 'routes', 'edit', 'Edit existing routes'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380c04', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Delete Routes', 'routes.delete', 'routes', 'delete', 'Archive or delete routes'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380c05', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'View Runs', 'runs.view', 'runs', 'view', 'View run list and details'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380c06', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Manage Runs', 'runs.manage', 'runs', 'manage', 'Create, edit, publish runs'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380c07', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Assign Runs', 'runs.assign', 'runs', 'assign', 'Assign drivers and vehicles to runs'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380c08', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'View Billing', 'billing.view', 'billing', 'view', 'View billing dashboard and reports'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380c09', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Manage Billing', 'billing.manage', 'billing', 'manage', 'Create rates, generate invoices'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380c10', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'View Reports', 'reports.view', 'reports', 'view', 'View and generate reports'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Manage Users', 'users.manage', 'users', 'manage', 'Create, edit, deactivate users'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380c12', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Manage Settings', 'settings.manage', 'settings', 'manage', 'Organization settings and configuration'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380c13', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'View Fleet', 'fleet.view', 'fleet', 'view', 'View vehicle locations and status'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380c14', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Approve Contractors', 'contractors.approve', 'contractors', 'approve', 'Review and approve contractor applications')
ON CONFLICT DO NOTHING;

-- Link permissions to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.slug = 'super_admin';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.slug = 'admin' AND p.slug IN (
    'routes.view', 'routes.create', 'routes.edit', 'routes.delete',
    'runs.view', 'runs.manage', 'runs.assign',
    'billing.view', 'billing.manage', 'reports.view', 'users.manage',
    'settings.manage', 'fleet.view', 'contractors.approve'
);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.slug = 'dispatcher' AND p.slug IN (
    'routes.view', 'routes.create', 'routes.edit',
    'runs.view', 'runs.manage', 'runs.assign',
    'billing.view', 'reports.view', 'fleet.view'
);

-- Link system roles to sample users
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'admin@metrok12.edu' AND r.slug = 'super_admin';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'dispatch@metrok12.edu' AND r.slug = 'dispatcher';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'john.smith@metrok12.edu' AND r.slug = 'driver';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'mike.contractor@email.com' AND r.slug = 'contractor';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'lisa.johnson@email.com' AND r.slug = 'parent';

COMMENT ON TABLE app_devices IS 'Mobile device tokens for push notification delivery.';
