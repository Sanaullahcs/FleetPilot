export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
}

export interface Organization extends OrganizationSummary {
  timezone: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  users_count?: number;
  admins_count?: number;
  created_at?: string;
}

export type UserRole =
  | "super_admin"
  | "admin"
  | "dispatcher"
  | "driver"
  | "contractor"
  | "school_contact"
  | "parent";

export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  job_title?: string | null;
  role: UserRole;
  organization: OrganizationSummary | null;
  roles: string[];
  permissions: string[];
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface DashboardStats {
  students?: { total: number; active: number };
  drivers?: { total: number; active: number };
  vehicles?: { total: number; active: number };
  schools?: { total: number };
  routes?: { total: number; active: number };
  runs?: { total: number };
  users?: { total: number };
  admins?: { total: number };
  organizations?: { total: number };
  alerts?: { licenses_expiring: number; vehicles_maintenance: number };
}

export type NotificationSeverity = "info" | "warning" | "danger";

export interface DashboardNotification {
  id: string;
  category: string;
  severity: NotificationSeverity;
  title: string;
  message: string;
  detail?: string;
  count: number;
  href: string;
  action_label: string;
}

export interface DashboardNotifications {
  items: DashboardNotification[];
  total: number;
}

export interface ChartPoint {
  name: string;
  value: number;
  fill?: string;
  active?: number;
}

export interface RadarPoint {
  subject: string;
  score: number;
  fullMark?: number;
}

export interface DashboardAnalytics {
  fleet_overview: ChartPoint[];
  operations_radar: RadarPoint[];
  routes_by_type: ChartPoint[];
  vehicles_by_type: ChartPoint[];
  students_by_school: ChartPoint[];
  vehicle_status: ChartPoint[];
  driver_status: ChartPoint[];
  student_status: ChartPoint[];
}

export interface FleetLiveDriver {
  id: string;
  first_name: string;
  last_name: string;
  employee_id: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  license_number?: string | null;
  license_class?: string | null;
  students_count: number;
}

export interface FleetLiveRouteRun {
  id: string;
  name: string;
  scheduled_start: string | null;
  scheduled_end: string | null;
  direction: string | null;
  estimated_miles: number | null;
  status: string;
}

export interface FleetLiveRoute {
  id: string;
  name: string;
  code: string | null;
  type: string;
  status: string;
  school_id: string | null;
  school_name: string | null;
  school_code: string | null;
  run: FleetLiveRouteRun | null;
  assignment_status: string | null;
}

export interface FleetLiveVehicle {
  id: string;
  vehicle_number: string;
  type: string;
  status: string;
  license_plate: string | null;
  make?: string | null;
  model?: string | null;
  capacity?: number | null;
  latitude: number;
  longitude: number;
  heading: number;
  speed_mph: number;
  recorded_at: string;
  is_simulated: boolean;
  route: FleetLiveRoute | null;
  driver: FleetLiveDriver | null;
}

export interface FleetLiveResponse {
  updated_at: string;
  center: { lat: number; lng: number };
  vehicles: FleetLiveVehicle[];
}

export interface FleetLiveFilters {
  search?: string;
  status?: string;
  type?: string;
  assignment?: "assigned" | "unassigned" | "";
  driver_status?: string;
  driver_id?: string;
  movement?: "moving" | "idle" | "";
  route_type?: string;
  school_id?: string;
}

export interface Student {
  id: string;
  student_number: string | null;
  first_name: string;
  last_name: string;
  grade: string | null;
  status: string;
  has_iep: boolean;
  requires_wheelchair: boolean;
  requires_aide: boolean;
  school?: { id: string; name: string; code?: string | null } | null;
  assigned_driver?: { id: string; first_name: string; last_name: string; employee_id?: string | null; status?: string; email?: string | null; phone?: string | null } | null;
  emergency_contact_phone: string | null;
}

export interface Driver {
  id: string;
  employee_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  license_number: string | null;
  license_class: string | null;
  license_expiry: string | null;
  license_state: string | null;
  endorsements: string[] | null;
  hire_date: string | null;
  date_of_birth: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  medical_cert_expiry: string | null;
  background_check_date: string | null;
  drug_test_date: string | null;
  notes: string | null;
  status: string;
  default_vehicle_id?: string | null;
  default_vehicle?: { id: string; vehicle_number: string; type: string; status: string; capacity?: number | null; make?: string | null; model?: string | null } | null;
  students_count?: number;
}

export interface NewVehiclePayload {
  vehicle_number: string;
  type: string;
  capacity?: number;
  wheelchair_capacity?: number;
  make?: string;
  model?: string;
}

export interface Vehicle {
  id: string;
  vehicle_number: string;
  type: string;
  make: string | null;
  model: string | null;
  year: number | null;
  capacity: number | null;
  wheelchair_capacity: number;
  license_plate: string | null;
  status: string;
  fuel_type: string | null;
  assigned_driver?: {
    id: string;
    first_name: string;
    last_name: string;
    employee_id?: string | null;
    status?: string;
    email?: string | null;
    phone?: string | null;
  } | null;
}

export interface School {
  id: string;
  name: string;
  code: string | null;
  district: string | null;
  grade_levels: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  timezone: string | null;
  phone: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  principal_name: string | null;
  website: string | null;
  bell_times: Record<string, string> | null;
  latitude: number | null;
  longitude: number | null;
  students_count?: number;
  active_students_count?: number;
  routes_count?: number;
  active_routes_count?: number;
}

export interface RouteRun {
  id: string;
  name: string;
  scheduled_start_time: string | null;
  scheduled_end_time: string | null;
  direction: string;
  estimated_distance_miles: number | null;
  estimated_duration_minutes: number | null;
  status: string;
}

export interface RouteDetail {
  id: string;
  name: string;
  code: string | null;
  type: string;
  status: string;
  description: string | null;
  days_of_week: number[] | null;
  runs_count?: number;
  runs?: RouteRun[];
  school?: { id: string; name: string; code?: string | null; city?: string | null; state?: string | null } | null;
}

export interface RouteItem {
  id: string;
  name: string;
  code: string | null;
  type: string;
  status: string;
  runs_count?: number;
  school?: { id: string; name: string } | null;
}

export interface DispatchAssignmentDriver {
  id: string;
  first_name: string;
  last_name: string;
  employee_id: string | null;
  status: string;
}

export interface DispatchAssignmentVehicle {
  id: string;
  vehicle_number: string;
  type: string;
  status: string;
}

export interface DispatchAssignment {
  id: string;
  service_date: string;
  status: string;
  notes: string | null;
  driver: DispatchAssignmentDriver | null;
  vehicle: DispatchAssignmentVehicle | null;
}

export interface DispatchRunRow {
  id: string;
  name: string;
  scheduled_start_time: string | null;
  scheduled_end_time: string | null;
  direction: string | null;
  estimated_distance_miles: number | null;
  status: string;
  route: {
    id: string;
    name: string;
    code: string | null;
    type: string;
    school: { id: string; name: string; code: string | null } | null;
  } | null;
  assignment: DispatchAssignment | null;
}

export interface DispatchBoard {
  date: string;
  summary: {
    total: number;
    assigned: number;
    unassigned: number;
    in_progress: number;
  };
  runs: DispatchRunRow[];
}

export interface ParentStudentLink {
  id: string;
  parent_account_id: string;
  relationship: string | null;
  is_primary: boolean;
  can_pickup: boolean;
  user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
  } | null;
  student?: {
    id: string;
    student_number: string | null;
    first_name: string;
    last_name: string;
    grade: string | null;
    status: string;
    school?: { id: string; name: string; code: string | null } | null;
  } | null;
}

export interface ParentRecord {
  id: string;
  relationship: string | null;
  preferred_language: string;
  students_count: number;
  created_at?: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    is_active: boolean;
    last_login_at?: string | null;
  } | null;
  students?: ParentStudentLink[];
}

export interface ParentChildRun {
  id: string;
  name: string;
  direction: string | null;
  scheduled_start_time: string | null;
  scheduled_end_time: string | null;
  assignment: {
    status: string;
    driver: { id: string; first_name: string; last_name: string; employee_id?: string | null; phone?: string | null } | null;
    vehicle: { id: string; vehicle_number: string; type: string } | null;
  } | null;
}

export interface ParentChildView {
  student: {
    id: string;
    student_number: string | null;
    first_name: string;
    last_name: string;
    grade: string | null;
    status: string;
  };
  school: { id: string; name: string; code: string | null; city: string | null } | null;
  assigned_driver: {
    id: string;
    first_name: string;
    last_name: string;
    employee_id?: string | null;
    phone?: string | null;
    email?: string | null;
    status: string;
    vehicle: { id: string; vehicle_number: string; type: string } | null;
  } | null;
  routes_today: {
    id: string;
    name: string;
    code: string | null;
    type: string;
    runs: ParentChildRun[];
  }[];
  service_date: string;
}

export interface ParentTrackVehicle {
  id: string;
  vehicle_number: string;
  type: string;
  status: string;
  license_plate: string | null;
  latitude: number;
  longitude: number;
  heading: number;
  speed_mph: number;
  recorded_at: string;
  is_simulated: boolean;
  driver: {
    id: string;
    first_name: string;
    last_name: string;
    employee_id?: string | null;
    phone?: string | null;
  } | null;
}

export interface ParentTrack {
  student_id: string;
  student_name: string;
  tracking_status: "in_progress" | "scheduled" | "assigned" | "unavailable";
  school: { id: string; name: string; code: string | null } | null;
  run: {
    id: string;
    name: string;
    direction: string | null;
    scheduled_start_time: string | null;
    scheduled_end_time: string | null;
    status: string;
    route_name: string | null;
    route_type: string | null;
  } | null;
  vehicle: ParentTrackVehicle | null;
}

export interface ParentTrackingResponse {
  updated_at: string;
  center: { lat: number; lng: number };
  tracks: ParentTrack[];
}

export interface DriverScheduleSummary {
  total: number;
  incoming: number;
  scheduled: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  missed: number;
}

export interface DriverPortalRun {
  assignment_id: string;
  service_date: string;
  status: string;
  schedule_state?: string;
  actual_start_time?: string | null;
  actual_end_time?: string | null;
  run: {
    id: string;
    name: string;
    direction: string | null;
    scheduled_start_time: string | null;
    scheduled_end_time: string | null;
    status: string;
  } | null;
  route: {
    id: string;
    name: string;
    code: string | null;
    type: string | null;
    school: { id: string; name: string; code: string | null } | null;
  } | null;
  vehicle: {
    id: string;
    vehicle_number: string;
    type: string;
    license_plate: string | null;
  } | null;
}

export interface DriverScheduleDay {
  date: string;
  weekday: string;
  label: string;
  label_long?: string;
  is_today: boolean;
  is_past?: boolean;
  is_future?: boolean;
  summary: DriverScheduleSummary;
  runs: DriverPortalRun[];
}

export interface DriverScheduleResponse {
  range: string;
  range_start: string;
  range_end: string;
  week_start: string;
  week_end: string;
  today: string;
  status_filter?: string;
  driver: {
    id: string;
    employee_id: string | null;
    full_name: string;
    phone: string | null;
    status: string;
  } | null;
  summary: DriverScheduleSummary;
  filtered_summary?: DriverScheduleSummary;
  days: DriverScheduleDay[];
  runs?: DriverPortalRun[];
}

export interface DriverTodayResponse {
  date: string;
  driver: DriverScheduleResponse["driver"];
  summary: DriverScheduleSummary;
  runs: DriverPortalRun[];
}

export interface VehicleDetail {
  id: string;
  vehicle_number: string;
  vin: string | null;
  type: string;
  make: string | null;
  model: string | null;
  year: number | null;
  capacity: number | null;
  wheelchair_capacity: number;
  license_plate: string | null;
  registration_expiry: string | null;
  insurance_expiry: string | null;
  inspection_expiry: string | null;
  status: string;
  fuel_type: string | null;
  current_odometer: number | null;
  garage_location: string | null;
  cost_per_mile: number | null;
  assigned_driver?: {
    id: string;
    first_name: string;
    last_name: string;
    employee_id?: string | null;
    status?: string;
    phone?: string | null;
    email?: string | null;
  } | null;
}

export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  phone: string | null;
  last_login_at: string | null;
  organization?: OrganizationSummary | null;
  roles?: { id: string; name: string; slug: string }[];
}

export interface AdminRole {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_system_role: boolean;
  users_count?: number;
  permissions?: { id: string; name: string; slug: string; resource: string; action: string }[];
}

export interface PermissionGroup {
  resource: string;
  permissions: { id: string; name: string; slug: string; resource: string; action: string }[];
}

export interface DashboardChatConversation {
  id: string;
  type: "driver_support" | "parent_driver" | "parent_school";
  title: string;
  subtitle: string | null;
  participants: { name: string; role: string }[];
  last_message: {
    body: string;
    time: string;
    sender_name: string;
  } | null;
  updated_at: string;
}

export interface DashboardChatMessage {
  id: string;
  body: string;
  is_system: boolean;
  is_mine: boolean;
  time: string;
  sender: {
    id: string | null;
    name: string;
    role: string;
  };
}
