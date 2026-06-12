import type { QueryClient } from "@tanstack/react-query";
import {
  getComplaintStats,
  getDashboardAnalytics,
  getDashboardStats,
  getDriverStats,
  getParentStats,
  getRouteStats,
  getSchoolStats,
  getStudentStats,
  getUserStats,
  getVehicleStats,
  listComplaints,
  listDashboardChatConversations,
  listDrivers,
  listParents,
  listRoutes,
  listSchools,
  listStudents,
  listUsers,
  listVehicles,
} from "@/lib/resources";

/** Warm React Query cache for a dashboard route before navigation. */
export function prefetchDashboardRoute(queryClient: QueryClient, href: string) {
  switch (href) {
    case "/dashboard":
      return Promise.all([
        queryClient.prefetchQuery({
          queryKey: ["dashboard-stats", { period: "all" }],
          queryFn: () => getDashboardStats({ period: "all" }),
        }),
        queryClient.prefetchQuery({
          queryKey: ["dashboard-analytics", { period: "all" }],
          queryFn: () => getDashboardAnalytics({ period: "all" }),
        }),
      ]);
    case "/dashboard/parents":
      return Promise.all([
        queryClient.prefetchQuery({ queryKey: ["parent-stats"], queryFn: getParentStats }),
        queryClient.prefetchQuery({
          queryKey: ["parents", { search: "", isActive: "", studentsAssignment: "", page: 1, sortKey: "last_name", sortDir: "asc" }],
          queryFn: () => listParents({ page: 1, sort_by: "last_name", sort_dir: "asc" }),
        }),
      ]);
    case "/dashboard/students":
      return Promise.all([
        queryClient.prefetchQuery({ queryKey: ["student-stats"], queryFn: getStudentStats }),
        queryClient.prefetchQuery({
          queryKey: ["students", { search: "", status: "", schoolId: "", grade: "", assignment: "", page: 1, sortKey: "student_number", sortDir: "asc" }],
          queryFn: () => listStudents({ page: 1, sort_by: "student_number", sort_dir: "asc" }),
        }),
      ]);
    case "/dashboard/drivers":
      return Promise.all([
        queryClient.prefetchQuery({ queryKey: ["driver-stats"], queryFn: getDriverStats }),
        queryClient.prefetchQuery({
          queryKey: ["drivers", { search: "", status: "", licenseClass: "", vehicleAssignment: "", studentsAssignment: "", page: 1, sortKey: "employee_id", sortDir: "asc" }],
          queryFn: () => listDrivers({ page: 1, sort_by: "employee_id", sort_dir: "asc" }),
        }),
      ]);
    case "/dashboard/vehicles":
      return Promise.all([
        queryClient.prefetchQuery({ queryKey: ["vehicle-stats"], queryFn: getVehicleStats }),
        queryClient.prefetchQuery({
          queryKey: ["vehicles", { search: "", status: "", type: "", assignment: "", page: 1, sortKey: "vehicle_number", sortDir: "asc" }],
          queryFn: () => listVehicles({ page: 1, sort_by: "vehicle_number", sort_dir: "asc" }),
        }),
      ]);
    case "/dashboard/schools":
      return Promise.all([
        queryClient.prefetchQuery({ queryKey: ["school-stats"], queryFn: getSchoolStats }),
        queryClient.prefetchQuery({
          queryKey: ["schools", { search: "", district: "", state: "", city: "", enrollment: "", page: 1, sortKey: "code", sortDir: "asc" }],
          queryFn: () => listSchools({ page: 1, sort_by: "code", sort_dir: "asc" }),
        }),
      ]);
    case "/dashboard/routes":
      return Promise.all([
        queryClient.prefetchQuery({ queryKey: ["route-stats"], queryFn: getRouteStats }),
        queryClient.prefetchQuery({
          queryKey: ["routes", { search: "", type: "", status: "", page: 1, sortKey: "code", sortDir: "asc" }],
          queryFn: () => listRoutes({ page: 1, sort_by: "code", sort_dir: "asc" }),
        }),
      ]);
    case "/dashboard/users":
      return Promise.all([
        queryClient.prefetchQuery({ queryKey: ["user-stats"], queryFn: getUserStats }),
        queryClient.prefetchQuery({
          queryKey: ["users", { search: "", role: "", activeFilter: "", page: 1, orgFilter: "", sortKey: "email", sortDir: "asc" }],
          queryFn: () => listUsers({ page: 1, sort_by: "email", sort_dir: "asc" }),
        }),
      ]);
    case "/dashboard/complaints":
      return Promise.all([
        queryClient.prefetchQuery({ queryKey: ["complaint-stats"], queryFn: getComplaintStats }),
        queryClient.prefetchQuery({
          queryKey: ["complaints", { search: "", status: "", priority: "", submitterRole: "", page: 1, sortKey: "last_activity_at", sortDir: "desc", isStaff: true }],
          queryFn: () =>
            listComplaints({
              page: 1,
              per_page: 20,
              sort_by: "last_activity_at",
              sort_dir: "desc",
            }),
        }),
      ]);
    case "/dashboard/messages":
      return queryClient.prefetchQuery({
        queryKey: ["dashboard-chat-conversations"],
        queryFn: listDashboardChatConversations,
      });
    default:
      return Promise.resolve();
  }
}
