export type NotificationSeverity = 'info' | 'success' | 'warning' | 'danger';

export interface MobileNotification {
  id: string;
  category: string;
  severity: NotificationSeverity;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export interface DriverRunItem {
  assignment_id: string;
  status: string;
  actual_start_time?: string | null;
  actual_end_time?: string | null;
  run: {
    id: string;
    name: string;
    direction: string;
    scheduled_start_time: string;
    scheduled_end_time: string;
    status: string;
  } | null;
  route: {
    id: string;
    name: string;
    code: string;
    type: string;
    school: { id: string; name: string; code: string } | null;
  } | null;
  vehicle: {
    id: string;
    vehicle_number: string;
    type: string;
    license_plate: string;
  } | null;
}

export interface DriverTodayPayload {
  date: string;
  driver: {
    id: string;
    employee_id: string;
    full_name: string;
    phone: string;
    status: string;
  } | null;
  summary: {
    total: number;
    scheduled: number;
    in_progress: number;
    completed: number;
  };
  runs: DriverRunItem[];
}

export interface ParentChildItem {
  student: {
    id: string;
    student_number: string;
    first_name: string;
    last_name: string;
    grade: string;
    status: string;
  };
  school: { id: string; name: string; code: string; city?: string } | null;
  assigned_driver: {
    id: string;
    first_name: string;
    last_name: string;
    employee_id: string;
    phone: string;
    vehicle: { id: string; vehicle_number: string; type: string } | null;
  } | null;
  routes_today: Array<{
    id: string;
    name: string;
    code: string;
    type: string;
    runs: Array<{
      id: string;
      name: string;
      direction: string;
      scheduled_start_time: string;
      scheduled_end_time: string;
      assignment: {
        status: string;
        driver: { first_name: string; last_name: string; phone: string } | null;
        vehicle: { vehicle_number: string; type: string } | null;
      } | null;
    }>;
  }>;
  service_date: string;
}

export interface ParentTrackItem {
  student_id: string;
  student_name: string;
  tracking_status: string;
  school: { id: string; name: string; code: string } | null;
  run: {
    id: string;
    name: string;
    direction: string;
    scheduled_start_time: string;
    scheduled_end_time: string;
    status: string;
    route_name: string;
    route_type: string;
  } | null;
  vehicle: {
    id: string;
    vehicle_number: string;
    type: string;
    license_plate: string;
    latitude: number;
    longitude: number;
    heading: number;
    speed_mph: number;
    recorded_at: string;
    is_simulated: boolean;
    driver: {
      first_name: string;
      last_name: string;
      phone: string;
    } | null;
  } | null;
}

export interface DriverProfilePayload {
  driver: {
    id: string;
    employee_id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    phone: string;
    status: string;
    license_number: string;
    license_class: string;
    license_expiry: string | null;
    medical_cert_expiry: string | null;
    hire_date: string | null;
    address: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    default_vehicle: {
      id: string;
      vehicle_number: string;
      type: string;
      license_plate: string;
    } | null;
  };
  stats: { assigned_students: number };
}

export interface ParentProfilePayload {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
  };
  parent: {
    id: string;
    relationship: string | null;
    preferred_language: string | null;
    notification_preferences: {
      push?: boolean;
      sms?: boolean;
      email?: boolean;
    } | null;
    children_count: number;
  } | null;
}

export interface DriverAssignmentDetail {
  assignment: {
    id: string;
    status: string;
    service_date: string;
    actual_start_time?: string | null;
    actual_end_time?: string | null;
  };
  run: {
    id: string;
    name: string;
    direction: string;
    scheduled_start_time: string;
    scheduled_end_time: string;
  } | null;
  route: {
    name: string;
    code: string;
    school: string | null;
  } | null;
  vehicle: {
    vehicle_number: string;
    license_plate: string;
  } | null;
  stops: Array<{
    id: string;
    stop_id?: string;
    sequence: number;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    type: string;
    scheduled_time: string | null;
    estimated_arrival: string | null;
    status: string;
    completed_at?: string | null;
    students?: DriverManifestStudent[];
  }>;
  students: DriverManifestStudent[];
  progress?: {
    completed_stops: number;
    total_stops: number;
  };
}

export interface DriverManifestStudent {
  id: string;
  name: string;
  grade: string;
  address: string | null;
  status: string;
  parent: {
    name: string | null;
    phone: string | null;
    relationship: string | null;
  } | null;
}

export type LegalDocumentId = 'privacy' | 'terms' | 'account-deletion';

export interface LegalSection {
  heading: string;
  body: string;
}

export interface LegalDocument {
  title: string;
  updated_at: string;
  sections: LegalSection[];
}

export interface MobileAppInfo {
  app: {
    name: string;
    version: string;
    support_email: string;
    support_phone: string;
    support_hours: string;
  };
  organization: { name: string; email: string; phone: string } | null;
  documents: Record<LegalDocumentId, LegalDocument>;
  policies: Array<{ id: LegalDocumentId; title: string; summary: string }>;
}

export interface SupportChannel {
  id: string;
  title: string;
  description: string;
  email: string | null;
  phone: string | null;
  hours: string;
}

export interface SupportPayload {
  channels: SupportChannel[];
  faqs: Array<{ question: string; answer: string }>;
}
