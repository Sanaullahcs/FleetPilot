import type { UserRole } from "@/lib/types";

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Administrator",
  admin: "Administrator",
  dispatcher: "Dispatcher",
  driver: "Driver",
  contractor: "Contractor",
  school_contact: "School Contact",
  parent: "Parent",
};

/** Top bar title when on the home dashboard route */
export function getPortalTitle(role: UserRole | undefined): string {
  switch (role) {
    case "super_admin":
      return "Platform Console";
    case "admin":
      return "Admin Dashboard";
    case "dispatcher":
      return "Dispatch Dashboard";
    case "driver":
      return "Driver Portal";
    case "parent":
      return "Parent Portal";
    default:
      return "FleetPilot";
  }
}

export function getRoleLabel(role: UserRole | undefined): string {
  if (!role) return "User";
  return ROLE_LABELS[role] ?? role;
}

const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/dispatch": "Dispatch",
  "/dashboard/my-schedule": "My schedule",
  "/dashboard/my-children": "My children",
  "/dashboard/students": "Students",
  "/dashboard/parents": "Parents",
  "/dashboard/drivers": "Drivers",
  "/dashboard/vehicles": "Vehicles",
  "/dashboard/schools": "Schools",
  "/dashboard/routes": "Routes",
  "/dashboard/radar": "Live radar",
  "/dashboard/users": "Users & access",
  "/dashboard/roles": "Roles & permissions",
  "/dashboard/organizations": "Organizations",
  "/dashboard/profile": "My profile",
};

export function getPageHeaderTitle(pathname: string, role: UserRole | undefined): string {
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    return getPortalTitle(role);
  }
  return ROUTE_TITLES[pathname] ?? "FleetPilot";
}

export function getDashboardWelcome(role: UserRole | undefined, firstName: string): {
  title: string;
  description: string;
} {
  switch (role) {
    case "super_admin":
      return {
        title: `Welcome, ${firstName}`,
        description: "Manage organizations, tenant admins, and platform-wide settings.",
      };
    case "admin":
      return {
        title: `Welcome back, ${firstName}`,
        description: "Full control of fleet operations, users, roles, and organization settings.",
      };
    case "dispatcher":
      return {
        title: `Welcome back, ${firstName}`,
        description: "Monitor daily routes, drivers, vehicles, and live fleet operations.",
      };
    case "driver":
      return {
        title: `Welcome, ${firstName}`,
        description: "Review your weekly assignments, routes, and vehicle details.",
      };
    case "parent":
      return {
        title: `Welcome, ${firstName}`,
        description: "View your children's routes, drivers, and today's transportation schedule.",
      };
    default:
      return {
        title: `Welcome back, ${firstName}`,
        description: "Your FleetPilot workspace for assigned modules and tasks.",
      };
  }
}
