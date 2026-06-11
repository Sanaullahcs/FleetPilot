import { api } from "@/lib/api";
import type {
  AdminRole,
  AdminUser,
  DashboardChatConversation,
  DashboardChatMessage,
  DashboardAnalytics,
  DashboardNotifications,
  DashboardStats,
  DispatchBoard,
  DispatchAssignment,
  DispatchRunRow,
  DriverPortalRun,
  DriverScheduleResponse,
  DriverTodayResponse,
  ParentChildView,
  ParentRecord,
  ParentStudentLink,
  ParentTrackingResponse,
  Driver,
  FleetLiveFilters,
  FleetLiveResponse,
  NewVehiclePayload,
  Organization,
  Paginated,
  PermissionGroup,
  RouteDetail,
  RouteItem,
  RouteRun,
  School,
  Student,
  UserRole,
  Vehicle,
  VehicleDetail,
} from "@/lib/types";

export interface ListParams {
  search?: string;
  status?: string;
  role?: string;
  type?: string;
  is_active?: boolean;
  organization_id?: string;
  district?: string;
  state?: string;
  city?: string;
  enrollment?: "with_students" | "without_students" | "";
  assignment?: "assigned" | "unassigned" | "";
  vehicle_assignment?: "assigned" | "unassigned" | "";
  students_assignment?: "with_students" | "without_students" | "";
  license_class?: string;
  assigned_driver_id?: string;
  student_status?: string;
  grade?: string;
  driver_id?: string;
  school_id?: string;
  dispatch_eligible?: boolean;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_dir?: "asc" | "desc" | "";
}

export interface SchoolStats {
  schools: number;
  districts: number;
  students_enrolled: number;
  active_routes: number;
  schools_with_students: number;
  avg_students_per_school: number;
}

export interface SchoolFilterOptions {
  districts: string[];
  states: string[];
  cities: string[];
}

export interface DashboardFilters {
  period?: "7d" | "30d" | "90d" | "ytd" | "all" | "custom";
  from?: string;
  to?: string;
  school_id?: string;
  route_type?: string;
}

function buildDashboardParams(filters: DashboardFilters = {}): Record<string, string> {
  const out: Record<string, string> = {};
  if (filters.period && filters.period !== "all") out.period = filters.period;
  if (filters.from) out.from = filters.from;
  if (filters.to) out.to = filters.to;
  if (filters.school_id) out.school_id = filters.school_id;
  if (filters.route_type) out.route_type = filters.route_type;
  return out;
}

export async function getDashboardStats(filters: DashboardFilters = {}): Promise<DashboardStats> {
  const { data } = await api.get<{ data: DashboardStats }>("/dashboard/stats", {
    params: buildDashboardParams(filters),
  });
  return data.data;
}

export async function getDashboardAnalytics(filters: DashboardFilters = {}): Promise<DashboardAnalytics> {
  const { data } = await api.get<{ data: DashboardAnalytics }>("/dashboard/analytics", {
    params: buildDashboardParams(filters),
  });
  return data.data;
}

export async function getDashboardNotifications(): Promise<DashboardNotifications> {
  const { data } = await api.get<{ data: DashboardNotifications }>("/dashboard/notifications");
  return data.data;
}

function buildFleetLiveParams(filters: FleetLiveFilters = {}): Record<string, string> {
  const out: Record<string, string> = {};
  if (filters.search) out.search = filters.search;
  if (filters.status) out.status = filters.status;
  if (filters.type) out.type = filters.type;
  if (filters.assignment) out.assignment = filters.assignment;
  if (filters.driver_status) out.driver_status = filters.driver_status;
  if (filters.driver_id) out.driver_id = filters.driver_id;
  if (filters.movement) out.movement = filters.movement;
  if (filters.route_type) out.route_type = filters.route_type;
  if (filters.school_id) out.school_id = filters.school_id;
  return out;
}

export async function getFleetLive(filters: FleetLiveFilters = {}): Promise<FleetLiveResponse> {
  const { data } = await api.get<{ data: FleetLiveResponse }>("/fleet/live", {
    params: buildFleetLiveParams(filters),
  });
  return data.data;
}

export async function getDispatchRuns(date?: string): Promise<DispatchBoard> {
  const { data } = await api.get<{ data: DispatchBoard }>("/dispatch/runs", {
    params: date ? { date } : undefined,
  });
  return data.data;
}

export async function assignDispatchRun(
  runId: string,
  payload: { service_date: string; driver_id: string; vehicle_id: string; notes?: string },
): Promise<{ run: DispatchRunRow; assignment: DispatchBoard["runs"][0]["assignment"] }> {
  const { data } = await api.post<{
    data: { run: DispatchRunRow; assignment: DispatchBoard["runs"][0]["assignment"] };
  }>(`/dispatch/runs/${runId}/assign`, payload);
  return data.data;
}

export async function cancelDispatchAssignment(assignmentId: string) {
  const { data } = await api.patch<{ data: unknown }>(`/dispatch/assignments/${assignmentId}/cancel`);
  return data.data;
}

export async function updateDispatchAssignment(
  assignmentId: string,
  payload: { driver_id: string; vehicle_id: string; notes?: string },
) {
  const { data } = await api.patch<{ data: DispatchAssignment; message: string }>(
    `/dispatch/assignments/${assignmentId}`,
    payload,
  );
  return data;
}

function buildParams(params: ListParams): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  if (params.search) out.search = params.search;
  if (params.status) out.status = params.status;
  if (params.role) out.role = params.role;
  if (params.type) out.type = params.type;
  if (params.is_active === true || params.is_active === false) out.is_active = params.is_active ? 1 : 0;
  if (params.organization_id) out.organization_id = params.organization_id;
  if (params.district) out.district = params.district;
  if (params.state) out.state = params.state;
  if (params.city) out.city = params.city;
  if (params.enrollment) out.enrollment = params.enrollment;
  if (params.type) out.type = params.type;
  if (params.assignment) out.assignment = params.assignment;
  if (params.vehicle_assignment) out.vehicle_assignment = params.vehicle_assignment;
  if (params.students_assignment) out.students_assignment = params.students_assignment;
  if (params.license_class) out.license_class = params.license_class;
  if (params.assigned_driver_id) out.assigned_driver_id = params.assigned_driver_id;
  if (params.student_status) out.student_status = params.student_status;
  if (params.grade) out.grade = params.grade;
  if (params.driver_id) out.driver_id = params.driver_id;
  if (params.school_id) out.school_id = params.school_id;
  if (params.dispatch_eligible === true) out.dispatch_eligible = 1;
  if (params.page) out.page = params.page;
  if (params.per_page) out.per_page = params.per_page;
  if (params.sort_by) out.sort_by = params.sort_by;
  if (params.sort_dir) out.sort_dir = params.sort_dir;
  return out;
}

export async function listStudents(params: ListParams = {}): Promise<Paginated<Student>> {
  const { data } = await api.get<Paginated<Student>>("/students", { params: buildParams(params) });
  return data;
}

export async function getStudent(id: string): Promise<Student> {
  const { data } = await api.get<{ data: Student }>(`/students/${id}`);
  return data.data;
}

export async function listDrivers(params: ListParams = {}): Promise<Paginated<Driver>> {
  const { data } = await api.get<Paginated<Driver>>("/drivers", { params: buildParams(params) });
  return data;
}

export async function listVehicles(params: ListParams = {}): Promise<Paginated<Vehicle>> {
  const { data } = await api.get<Paginated<Vehicle>>("/vehicles", { params: buildParams(params) });
  return data;
}

export async function listSchools(params: ListParams = {}): Promise<Paginated<School>> {
  const { data } = await api.get<Paginated<School>>("/schools", { params: buildParams(params) });
  return data;
}

export async function getSchoolStats(): Promise<SchoolStats> {
  const { data } = await api.get<{ data: SchoolStats }>("/schools/stats");
  return data.data;
}

export async function getSchoolFilterOptions(): Promise<SchoolFilterOptions> {
  const { data } = await api.get<{ data: SchoolFilterOptions }>("/schools/filter-options");
  return data.data;
}

export async function getSchool(id: string): Promise<School> {
  const { data } = await api.get<{ data: School }>(`/schools/${id}`);
  return data.data;
}

export async function listRoutes(params: ListParams = {}): Promise<Paginated<RouteItem>> {
  const { data } = await api.get<Paginated<RouteItem>>("/routes", { params: buildParams(params) });
  return data;
}

export async function getRoute(id: string): Promise<RouteDetail> {
  const { data } = await api.get<{ data: RouteDetail }>(`/routes/${id}`);
  return data.data;
}

export async function getVehicle(id: string): Promise<VehicleDetail> {
  const { data } = await api.get<{ data: VehicleDetail }>(`/vehicles/${id}`);
  return data.data;
}

export async function createStudent(payload: Partial<Student> & { school_id: string; assigned_driver_id?: string | null }) {
  const { data } = await api.post<{ data: Student }>("/students", payload);
  return data.data;
}

export async function assignStudentDriver(studentId: string, driverId: string | null) {
  const { data } = await api.patch<{ data: Student; message: string }>(`/students/${studentId}/assign-driver`, {
    assigned_driver_id: driverId,
  });
  return data;
}

export async function updateStudentStatus(studentId: string, status: string) {
  const { data } = await api.patch<{ data: Student; message: string }>(`/students/${studentId}/status`, { status });
  return data;
}

export async function updateStudent(id: string, payload: Partial<Student> & { school_id?: string; assigned_driver_id?: string | null }) {
  const { data } = await api.put<{ data: Student }>(`/students/${id}`, payload);
  return data.data;
}

export async function deleteStudent(id: string) {
  await api.delete(`/students/${id}`);
}

export async function listStudentParents(studentId: string): Promise<ParentStudentLink[]> {
  const { data } = await api.get<{ data: ParentStudentLink[] }>(`/students/${studentId}/parents`);
  return data.data;
}

export async function linkStudentParent(
  studentId: string,
  payload: { user_id: string; relationship?: string; is_primary?: boolean; can_pickup?: boolean },
) {
  const { data } = await api.post<{ data: ParentStudentLink; message: string }>(`/students/${studentId}/parents`, payload);
  return data;
}

export async function unlinkStudentParent(studentId: string, linkId: string) {
  await api.delete(`/students/${studentId}/parents/${linkId}`);
}

export async function getParentChildren(): Promise<ParentChildView[]> {
  const { data } = await api.get<{ data: ParentChildView[] }>("/parent/children");
  return data.data;
}

export async function getParentTracking(): Promise<ParentTrackingResponse> {
  const { data } = await api.get<{ data: ParentTrackingResponse }>("/parent/tracking");
  return data.data;
}

export async function getDriverToday(): Promise<DriverTodayResponse> {
  const { data } = await api.get<{ data: DriverTodayResponse }>("/driver/runs/today");
  return data.data;
}

export async function getDriverSchedule(params?: {
  range?: import("@/lib/driver-schedule").DriverScheduleRange;
  start?: string;
  end?: string;
  status?: import("@/lib/driver-schedule").DriverScheduleState;
}): Promise<DriverScheduleResponse> {
  const { data } = await api.get<{ data: DriverScheduleResponse }>("/driver/schedule", {
    params: {
      range: params?.range ?? "this_week",
      start: params?.start,
      end: params?.end,
      status: params?.status && params.status !== "all" ? params.status : undefined,
    },
  });
  return data.data;
}

export async function listParents(params: ListParams = {}): Promise<Paginated<ParentRecord>> {
  const { data } = await api.get<Paginated<ParentRecord>>("/parents", { params: buildParams(params) });
  return data;
}

export async function getParent(id: string): Promise<ParentRecord> {
  const { data } = await api.get<{ data: ParentRecord }>(`/parents/${id}`);
  return data.data;
}

export async function createParent(payload: {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  password: string;
  password_confirmation: string;
  relationship?: string;
  preferred_language?: string;
  is_active?: boolean;
}) {
  const { data } = await api.post<{ data: ParentRecord }>("/parents", payload);
  return data.data;
}

export async function updateParent(
  id: string,
  payload: {
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    password?: string;
    password_confirmation?: string;
    relationship?: string;
    preferred_language?: string;
    is_active?: boolean;
  },
) {
  const { data } = await api.put<{ data: ParentRecord }>(`/parents/${id}`, payload);
  return data.data;
}

export async function deleteParent(id: string) {
  await api.delete(`/parents/${id}`);
}

export async function listParentStudents(parentId: string): Promise<ParentStudentLink[]> {
  const { data } = await api.get<{ data: ParentStudentLink[] }>(`/parents/${parentId}/students`);
  return data.data;
}

export async function linkParentStudent(
  parentId: string,
  payload: { student_id: string; relationship?: string; is_primary?: boolean; can_pickup?: boolean },
) {
  const { data } = await api.post<{ data: ParentStudentLink; message: string }>(`/parents/${parentId}/students`, payload);
  return data;
}

export async function unlinkParentStudent(parentId: string, linkId: string) {
  await api.delete(`/parents/${parentId}/students/${linkId}`);
}

export async function createDriver(payload: Partial<Driver> & { default_vehicle_id?: string | null; vehicle?: NewVehiclePayload }) {
  const { data } = await api.post<{ data: Driver }>("/drivers", payload);
  return data.data;
}

export async function updateDriver(id: string, payload: Partial<Driver> & { default_vehicle_id?: string | null; vehicle?: NewVehiclePayload }) {
  const { data } = await api.put<{ data: Driver }>(`/drivers/${id}`, payload);
  return data.data;
}

export async function deleteDriver(id: string) {
  await api.delete(`/drivers/${id}`);
}

export async function createVehicle(payload: Partial<Vehicle>) {
  const { data } = await api.post<{ data: Vehicle }>("/vehicles", payload);
  return data.data;
}

export async function assignDriverVehicle(driverId: string, vehicleId: string | null) {
  const { data } = await api.patch<{ data: Driver; message: string }>(`/drivers/${driverId}/assign-vehicle`, {
    default_vehicle_id: vehicleId,
  });
  return data;
}

export async function updateDriverStatus(driverId: string, status: string) {
  const { data } = await api.patch<{ data: Driver; message: string }>(`/drivers/${driverId}/status`, { status });
  return data;
}

export async function assignVehicleDriver(vehicleId: string, driverId: string | null) {
  const { data } = await api.patch<{ data: Vehicle; message: string }>(`/vehicles/${vehicleId}/assign-driver`, {
    driver_id: driverId,
  });
  return data;
}

export async function updateVehicleStatus(vehicleId: string, status: string) {
  const { data } = await api.patch<{ data: Vehicle; message: string }>(`/vehicles/${vehicleId}/status`, { status });
  return data;
}

export interface DriverStudentAssignment {
  id: string;
  employee_id: string | null;
  first_name: string;
  last_name: string;
  status: string;
  students_count: number;
  default_vehicle?: { id: string; vehicle_number: string; type: string; status: string } | null;
  students: Array<{
    id: string;
    first_name: string;
    last_name: string;
    grade: string | null;
    status: string;
    student_number: string | null;
    school?: { id: string; name: string; code?: string | null } | null;
  }>;
}

export async function listDriverStudentAssignments(params: ListParams = {}): Promise<DriverStudentAssignment[]> {
  const { data } = await api.get<{ data: DriverStudentAssignment[] }>("/drivers/student-assignments", {
    params: buildParams(params),
  });
  return data.data;
}

export async function updateVehicle(id: string, payload: Partial<Vehicle>) {
  const { data } = await api.put<{ data: Vehicle }>(`/vehicles/${id}`, payload);
  return data.data;
}

export async function deleteVehicle(id: string) {
  await api.delete(`/vehicles/${id}`);
}

export async function createSchool(payload: Partial<School>) {
  const { data } = await api.post<{ data: School }>("/schools", payload);
  return data.data;
}

export async function updateSchool(id: string, payload: Partial<School>) {
  const { data } = await api.put<{ data: School }>(`/schools/${id}`, payload);
  return data.data;
}

export async function deleteSchool(id: string) {
  await api.delete(`/schools/${id}`);
}

export async function createRoute(payload: Partial<RouteItem> & { school_id?: string | null; description?: string }) {
  const { data } = await api.post<{ data: RouteItem }>("/routes", payload);
  return data.data;
}

export async function updateRoute(id: string, payload: Partial<RouteItem> & { school_id?: string | null; description?: string }) {
  const { data } = await api.put<{ data: RouteItem }>(`/routes/${id}`, payload);
  return data.data;
}

export async function updateRouteStatus(routeId: string, status: string) {
  const { data } = await api.patch<{ data: RouteItem; message: string }>(`/routes/${routeId}/status`, { status });
  return data;
}

export async function deleteRoute(id: string) {
  await api.delete(`/routes/${id}`);
}

// --- Platform: Organizations (super admin) ---

export async function listOrganizations(params: ListParams = {}): Promise<Paginated<Organization>> {
  const { data } = await api.get<Paginated<Organization>>("/organizations", { params: buildParams(params) });
  return data;
}

export async function createOrganization(payload: Record<string, unknown>) {
  const { data } = await api.post<{ data: Organization }>("/organizations", payload);
  return data.data;
}

export async function updateOrganization(id: string, payload: Record<string, unknown>) {
  const { data } = await api.put<{ data: Organization }>(`/organizations/${id}`, payload);
  return data.data;
}

export async function deleteOrganization(id: string) {
  await api.delete(`/organizations/${id}`);
}

// --- Admin: Users & RBAC ---

export async function listUsers(params: ListParams = {}): Promise<Paginated<AdminUser>> {
  const { data } = await api.get<Paginated<AdminUser>>("/users", { params: buildParams(params) });
  return data;
}

export async function createUser(payload: Record<string, unknown>) {
  const { data } = await api.post<{ data: AdminUser }>("/users", payload);
  return data.data;
}

export async function updateUser(id: string, payload: Record<string, unknown>) {
  const { data } = await api.put<{ data: AdminUser }>(`/users/${id}`, payload);
  return data.data;
}

export async function resetUserPassword(id: string, password: string, password_confirmation: string) {
  await api.post(`/users/${id}/reset-password`, { password, password_confirmation });
}

export async function toggleUserActive(id: string) {
  const { data } = await api.post<{ data: AdminUser; message: string }>(`/users/${id}/toggle-active`);
  return data;
}

export async function deleteUser(id: string) {
  await api.delete(`/users/${id}`);
}

export async function listRoles(): Promise<AdminRole[]> {
  const { data } = await api.get<{ data: AdminRole[] }>("/roles");
  return data.data;
}

export async function listPermissionGroups(): Promise<PermissionGroup[]> {
  const { data } = await api.get<{ data: PermissionGroup[] }>("/permissions");
  return data.data;
}

export async function updateRolePermissions(roleId: string, permissionIds: string[]) {
  const { data } = await api.put<{ data: AdminRole; message: string }>(`/roles/${roleId}/permissions`, {
    permission_ids: permissionIds,
  });
  return data;
}

export async function listDashboardChatConversations() {
  const { data } = await api.get<{ data: { items: DashboardChatConversation[] } }>("/chat/conversations");
  return data.data.items;
}

export async function listDashboardChatMessages(conversationId: string) {
  const { data } = await api.get<{ data: DashboardChatMessage[] }>(`/chat/conversations/${conversationId}/messages`);
  return data.data;
}

export async function sendDashboardChatMessage(conversationId: string, body: string) {
  const { data } = await api.post<{ data: DashboardChatMessage }>(`/chat/conversations/${conversationId}/messages`, {
    body,
  });
  return data.data;
}

export const USER_ROLES: { label: string; value: UserRole }[] = [
  { label: "Super Admin", value: "super_admin" },
  { label: "Admin", value: "admin" },
  { label: "Dispatcher", value: "dispatcher" },
  { label: "Driver", value: "driver" },
  { label: "Contractor", value: "contractor" },
  { label: "School Contact", value: "school_contact" },
  { label: "Parent", value: "parent" },
];
