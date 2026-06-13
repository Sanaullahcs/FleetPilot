"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardStatTile } from "@/components/dashboard/dashboard-stat-tile";
import {
  AlertCircleIcon,
  ArchiveIcon,
  BusRouteIcon,
  CalendarRunIcon,
  CheckCircleIcon,
  ChecklistIcon,
  CrownIcon,
  DistrictIcon,
  DriverIcon,
  FamilyIcon,
  GridIcon,
  HeadsetIcon,
  KeyIcon,
  LayersIcon,
  LicenseIcon,
  LinkIcon,
  LockIcon,
  MessageIcon,
  OrgIcon,
  ParentIcon,
  ParkingIcon,
  PendingLinkIcon,
  ProgressIcon,
  RouteIcon,
  ScheduleIcon,
  SchoolIcon,
  ShieldIcon,
  SpecialNeedsIcon,
  SteeringWheelIcon,
  StudentsIcon,
  UnassignedIcon,
  UnreadIcon,
  UsersGroupIcon,
  VehicleIcon,
  WrenchIcon,
} from "@/components/dashboard/stat-icons";
import { brand } from "@/lib/brand";
import {
  getComplaintStats,
  getDriverStats,
  getParentStats,
  getRouteStats,
  getSchoolStats,
  getStudentStats,
  getUserStats,
  getVehicleStats,
} from "@/lib/resources";
import type { DashboardChatConversation } from "@/lib/types";

const GRID = "grid grid-cols-2 gap-2.5 sm:grid-cols-2 xl:grid-cols-4";

function loading(value: boolean, n: number | string = 0) {
  return value ? "—" : n;
}

export function DriverStatRow() {
  const { data: stats, isLoading } = useQuery({ queryKey: ["driver-stats"], queryFn: getDriverStats });

  return (
    <div className={GRID}>
      <DashboardStatTile
        label="Total Drivers"
        value={loading(isLoading, stats?.total ?? 0)}
        hint={`${stats?.active ?? 0} active on roster`}
        accent={brand.primary}
        icon={<DriverIcon />}
      />
      <DashboardStatTile
        label="Vehicle Assigned"
        value={loading(isLoading, stats?.with_vehicle ?? 0)}
        hint={`${stats?.vehicle_assignment_pct ?? 0}% of active drivers`}
        accent={brand.cyan}
        icon={<VehicleIcon />}
      />
      <DashboardStatTile
        label="With Students"
        value={loading(isLoading, stats?.with_students ?? 0)}
        hint="Drivers with assigned riders"
        accent={brand.orange}
        icon={<StudentsIcon />}
      />
      <DashboardStatTile
        label="License Expiring"
        value={loading(isLoading, stats?.license_expiring_soon ?? 0)}
        hint="Within next 30 days"
        accent={brand.chart[4]}
        icon={<LicenseIcon />}
      />
    </div>
  );
}

export function ParentStatRow() {
  const { data: stats, isLoading } = useQuery({ queryKey: ["parent-stats"], queryFn: getParentStats });

  return (
    <div className={GRID}>
      <DashboardStatTile
        label="Parent Accounts"
        value={loading(isLoading, stats?.total ?? 0)}
        hint={`${stats?.active ?? 0} with portal access`}
        accent={brand.primary}
        icon={<ParentIcon />}
      />
      <DashboardStatTile
        label="Linked Students"
        value={loading(isLoading, stats?.student_links ?? 0)}
        hint={
          stats
            ? `~${stats.avg_students_per_parent} avg per linked parent`
            : "Parent ↔ student links"
        }
        accent={brand.cyan}
        icon={<LinkIcon />}
      />
      <DashboardStatTile
        label="With Children"
        value={loading(isLoading, stats?.with_students ?? 0)}
        hint="Parents linked to at least one student"
        accent={brand.orange}
        icon={<FamilyIcon />}
      />
      <DashboardStatTile
        label="Awaiting Links"
        value={loading(isLoading, stats?.without_students ?? 0)}
        hint="No students assigned yet"
        accent={brand.chart[4]}
        icon={<PendingLinkIcon />}
      />
    </div>
  );
}

export function StudentStatRow() {
  const { data: stats, isLoading } = useQuery({ queryKey: ["student-stats"], queryFn: getStudentStats });

  return (
    <div className={GRID}>
      <DashboardStatTile
        label="Active Students"
        value={loading(isLoading, stats?.active ?? 0)}
        hint={`${stats?.total ?? 0} total on roster`}
        accent={brand.primary}
        icon={<StudentsIcon />}
      />
      <DashboardStatTile
        label="Driver Assigned"
        value={loading(isLoading, stats?.assigned ?? 0)}
        hint={`${stats?.assignment_pct ?? 0}% of active students`}
        accent={brand.cyan}
        icon={<SteeringWheelIcon />}
      />
      <DashboardStatTile
        label="Unassigned"
        value={loading(isLoading, stats?.unassigned ?? 0)}
        hint="Need driver assignment"
        accent={brand.orange}
        icon={<UnassignedIcon />}
      />
      <DashboardStatTile
        label="Special Needs"
        value={loading(isLoading, stats?.special_needs ?? 0)}
        hint={`${stats?.with_parents ?? 0} with parent links`}
        accent={brand.chart[4]}
        icon={<SpecialNeedsIcon />}
      />
    </div>
  );
}

export function VehicleStatRow() {
  const { data: stats, isLoading } = useQuery({ queryKey: ["vehicle-stats"], queryFn: getVehicleStats });

  return (
    <div className={GRID}>
      <DashboardStatTile
        label="Fleet Units"
        value={loading(isLoading, stats?.total ?? 0)}
        hint={`${stats?.active ?? 0} active vehicles`}
        accent={brand.primary}
        icon={<VehicleIcon />}
      />
      <DashboardStatTile
        label="Driver Assigned"
        value={loading(isLoading, stats?.assigned ?? 0)}
        hint={`${stats?.assignment_pct ?? 0}% of active fleet`}
        accent={brand.cyan}
        icon={<SteeringWheelIcon />}
      />
      <DashboardStatTile
        label="Unassigned"
        value={loading(isLoading, stats?.unassigned ?? 0)}
        hint="Available for dispatch"
        accent={brand.orange}
        icon={<ParkingIcon />}
      />
      <DashboardStatTile
        label="In Maintenance"
        value={loading(isLoading, stats?.maintenance ?? 0)}
        hint="Out of rotation"
        accent={brand.chart[4]}
        icon={<WrenchIcon />}
      />
    </div>
  );
}

export function RouteStatRow() {
  const { data: stats, isLoading } = useQuery({ queryKey: ["route-stats"], queryFn: getRouteStats });

  return (
    <div className={GRID}>
      <DashboardStatTile
        label="Total Routes"
        value={loading(isLoading, stats?.total ?? 0)}
        hint={`${stats?.active ?? 0} active runs`}
        accent={brand.primary}
        icon={<RouteIcon />}
      />
      <DashboardStatTile
        label="Active Routes"
        value={loading(isLoading, stats?.active ?? 0)}
        hint="Morning, afternoon & special runs"
        accent={brand.cyan}
        icon={<ScheduleIcon />}
      />
      <DashboardStatTile
        label="Schools Served"
        value={loading(isLoading, stats?.schools_served ?? 0)}
        hint="Unique campuses on routes"
        accent={brand.orange}
        icon={<SchoolIcon />}
      />
      <DashboardStatTile
        label="Draft / inactive"
        value={loading(isLoading, (stats?.draft ?? 0) + (stats?.inactive ?? 0))}
        hint={`${stats?.draft ?? 0} draft · ${stats?.inactive ?? 0} inactive`}
        accent={brand.chart[4]}
        icon={<ArchiveIcon />}
      />
    </div>
  );
}

export function UserStatRow() {
  const { data: stats, isLoading } = useQuery({ queryKey: ["user-stats"], queryFn: getUserStats });

  return (
    <div className={GRID}>
      <DashboardStatTile
        label="Team Members"
        value={loading(isLoading, stats?.total ?? 0)}
        hint={`${stats?.active ?? 0} active accounts`}
        accent={brand.primary}
        icon={<UsersGroupIcon />}
      />
      <DashboardStatTile
        label="Administrators"
        value={loading(isLoading, stats?.admins ?? 0)}
        hint="Org admin role"
        accent={brand.cyan}
        icon={<ShieldIcon />}
      />
      <DashboardStatTile
        label="Dispatchers"
        value={loading(isLoading, stats?.dispatchers ?? 0)}
        hint="Operations staff"
        accent={brand.orange}
        icon={<HeadsetIcon />}
      />
      <DashboardStatTile
        label="Blocked"
        value={loading(isLoading, stats?.inactive ?? 0)}
        hint="Inactive portal access"
        accent={brand.chart[4]}
        icon={<LockIcon />}
      />
    </div>
  );
}

export function SchoolStatRow() {
  const { data: stats, isLoading } = useQuery({ queryKey: ["school-stats"], queryFn: getSchoolStats });

  return (
    <div className={GRID}>
      <DashboardStatTile
        label="Schools Served"
        value={loading(isLoading, stats?.schools ?? 0)}
        hint={`${stats?.schools_with_students ?? 0} with enrolled students`}
        accent={brand.primary}
        icon={<SchoolIcon />}
      />
      <DashboardStatTile
        label="Students Enrolled"
        value={loading(isLoading, stats?.students_enrolled ?? 0)}
        hint={stats ? `~${stats.avg_students_per_school} avg per school` : "Active transportation roster"}
        accent={brand.cyan}
        icon={<StudentsIcon />}
      />
      <DashboardStatTile
        label="Active Routes"
        value={loading(isLoading, stats?.active_routes ?? 0)}
        hint="Morning, afternoon & special runs"
        accent={brand.orange}
        icon={<RouteIcon />}
      />
      <DashboardStatTile
        label="Districts"
        value={loading(isLoading, stats?.districts ?? 0)}
        hint="Unique districts in your network"
        accent={brand.chart[4]}
        icon={<DistrictIcon />}
      />
    </div>
  );
}

export function DispatchStatRow({
  summary,
  isLoading,
}: {
  summary: { total: number; assigned: number; unassigned: number; in_progress: number };
  isLoading?: boolean;
}) {
  return (
    <div className={GRID}>
      <DashboardStatTile
        label="Total Runs"
        value={isLoading ? "—" : summary.total}
        hint="Scheduled for service date"
        accent={brand.primary}
        icon={<CalendarRunIcon />}
      />
      <DashboardStatTile
        label="Assigned"
        value={isLoading ? "—" : summary.assigned}
        hint="Driver & vehicle set"
        accent={brand.success}
        icon={<CheckCircleIcon />}
      />
      <DashboardStatTile
        label="Unassigned"
        value={isLoading ? "—" : summary.unassigned}
        hint="Need driver assignment"
        accent={brand.warning}
        icon={<AlertCircleIcon />}
      />
      <DashboardStatTile
        label="In Progress"
        value={isLoading ? "—" : summary.in_progress}
        hint="Runs underway now"
        accent={brand.cyan}
        icon={<ProgressIcon />}
      />
    </div>
  );
}

export function MessagesStatRow({
  conversations,
  unreadTotal,
  isLoading,
}: {
  conversations: DashboardChatConversation[];
  unreadTotal: number;
  isLoading?: boolean;
}) {
  const parentDriver = conversations.filter((c) => c.type === "parent_driver").length;
  const parentSchool = conversations.filter((c) => c.type === "parent_school").length;

  return (
    <div className={GRID}>
      <DashboardStatTile
        label="Conversations"
        value={isLoading ? "—" : conversations.length}
        hint="Active message threads"
        accent={brand.primary}
        icon={<MessageIcon />}
      />
      <DashboardStatTile
        label="Unread"
        value={isLoading ? "—" : unreadTotal}
        hint="Messages awaiting reply"
        accent={brand.orange}
        icon={<UnreadIcon />}
      />
      <DashboardStatTile
        label="Parent ↔ driver"
        value={isLoading ? "—" : parentDriver}
        hint="Route & pickup threads"
        accent={brand.cyan}
        icon={<BusRouteIcon />}
      />
      <DashboardStatTile
        label="Parent ↔ school"
        value={isLoading ? "—" : parentSchool}
        hint="School office chats"
        accent={brand.chart[4]}
        icon={<SchoolIcon />}
      />
    </div>
  );
}

export function RolesStatRow({
  roleCount,
  permissionCount,
  selectedPermissionCount,
  groupCount,
  isLoading,
}: {
  roleCount: number;
  permissionCount: number;
  selectedPermissionCount: number;
  groupCount: number;
  isLoading?: boolean;
}) {
  return (
    <div className={GRID}>
      <DashboardStatTile
        label="Roles"
        value={isLoading ? "—" : roleCount}
        hint="Configurable access profiles"
        accent={brand.primary}
        icon={<ShieldIcon />}
      />
      <DashboardStatTile
        label="Permissions"
        value={isLoading ? "—" : permissionCount}
        hint="Across all modules"
        accent={brand.cyan}
        icon={<KeyIcon />}
      />
      <DashboardStatTile
        label="Permission Groups"
        value={isLoading ? "—" : groupCount}
        hint="Resource categories"
        accent={brand.orange}
        icon={<GridIcon />}
      />
      <DashboardStatTile
        label="Selected Role"
        value={isLoading ? "—" : selectedPermissionCount}
        hint="Permissions enabled"
        accent={brand.chart[4]}
        icon={<ChecklistIcon />}
      />
    </div>
  );
}

export function ComplaintStatRow() {
  const { data: stats, isLoading } = useQuery({ queryKey: ["complaint-stats"], queryFn: getComplaintStats });

  return (
    <div className={GRID}>
      <DashboardStatTile
        label="Open Complaints"
        value={loading(isLoading, stats?.open ?? 0)}
        hint={`${stats?.total ?? 0} total registered`}
        accent={brand.primary}
        icon={<HeadsetIcon />}
      />
      <DashboardStatTile
        label="Urgent Priority"
        value={loading(isLoading, stats?.urgent ?? 0)}
        hint="Needs immediate attention"
        accent={brand.orange}
        icon={<AlertCircleIcon />}
      />
      <DashboardStatTile
        label="Unassigned"
        value={loading(isLoading, stats?.unassigned ?? 0)}
        hint={`${stats?.waiting_on_submitter ?? 0} waiting on submitter`}
        accent={brand.cyan}
        icon={<UnassignedIcon />}
      />
      <DashboardStatTile
        label="Resolved This Week"
        value={loading(isLoading, stats?.resolved_this_week ?? 0)}
        hint="Closed in the last 7 days"
        accent={brand.chart[4]}
        icon={<CheckCircleIcon />}
      />
    </div>
  );
}

export function OrganizationStatRow({
  totalOrgs,
  totalUsers,
  isLoading,
}: {
  totalOrgs: number;
  totalUsers: number;
  isLoading?: boolean;
}) {
  return (
    <div className={GRID}>
      <DashboardStatTile
        label="Organizations"
        value={isLoading ? "—" : totalOrgs}
        hint="Tenants on the platform"
        accent={brand.primary}
        icon={<OrgIcon />}
      />
      <DashboardStatTile
        label="Users (visible)"
        value={isLoading ? "—" : totalUsers}
        hint="Across listed organizations"
        accent={brand.cyan}
        icon={<UsersGroupIcon />}
      />
      <DashboardStatTile
        label="Platform Role"
        value="Super Admin"
        hint="Full tenant management"
        accent={brand.orange}
        icon={<CrownIcon />}
      />
      <DashboardStatTile
        label="Multi-tenant"
        value={isLoading ? "—" : totalOrgs}
        hint="Isolated org workspaces"
        accent={brand.chart[4]}
        icon={<LayersIcon />}
      />
    </div>
  );
}
