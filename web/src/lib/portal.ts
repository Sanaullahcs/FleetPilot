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

/** Default landing route after sign-in, per role. */
export function getDashboardHomePath(role: UserRole | undefined): string {
  switch (role) {
    case "super_admin":
      return "/dashboard";
    case "parent":
      return "/dashboard";
    case "driver":
      return "/dashboard/today";
    case "school_contact":
      return "/dashboard/my-school";
    default:
      return "/dashboard";
  }
}

/** Top bar title when on the home dashboard route */
export function getPortalTitle(role: UserRole | undefined): string {
  switch (role) {
    case "super_admin":
      return "Platform Portal";
    case "admin":
      return "Admin";
    case "dispatcher":
      return "Dispatch";
    case "driver":
      return "Driver";
    case "parent":
      return "Parent";
    case "school_contact":
      return "School";
    case "contractor":
      return "Contractor";
    default:
      return "FleetPilot";
  }
}

export function getRoleLabel(role: UserRole | undefined): string {
  if (!role) return "User";
  return ROLE_LABELS[role] ?? role;
}

const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/dispatch": "Dispatch",
  "/dashboard/my-schedule": "My schedule",
  "/dashboard/today": "Today's runs",
  "/dashboard/my-children": "My children",
  "/dashboard/my-school": "My school",
  "/dashboard/alerts": "Alerts",
  "/dashboard/support": "Help & support",
  "/dashboard/students": "Students",
  "/dashboard/parents": "Parents",
  "/dashboard/drivers": "Drivers",
  "/dashboard/vehicles": "Vehicles",
  "/dashboard/schools": "Schools",
  "/dashboard/routes": "Routes",
  "/dashboard/messages": "Messages",
  "/dashboard/complaints": "Complaint center",
  "/dashboard/radar": "Live radar",
  "/dashboard/users": "Users & access",
  "/dashboard/roles": "Roles & permissions",
  "/dashboard/organizations": "Organizations",
  "/dashboard/profile": "My profile",
};

export function getPageHeaderTitle(pathname: string): string {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return ROUTE_TITLES[normalized] ?? "FleetPilot";
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
    case "school_contact":
      return {
        title: `Welcome, ${firstName}`,
        description: "Manage students and parents, message families and drivers, and coordinate with transportation in real time.",
      };
    default:
      return {
        title: `Welcome back, ${firstName}`,
        description: "Your FleetPilot workspace for assigned modules and tasks.",
      };
  }
}

/** Paths a parent is allowed to access on the web dashboard. */
export function isParentPortalPath(pathname: string): boolean {
  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/my-children") ||
    pathname.startsWith("/dashboard/messages") ||
    pathname.startsWith("/dashboard/alerts") ||
    pathname.startsWith("/dashboard/support") ||
    pathname.startsWith("/dashboard/complaints") ||
    pathname.startsWith("/dashboard/profile")
  );
}

/** Paths a driver is allowed to access on the web dashboard. */
export function isDriverPortalPath(pathname: string): boolean {
  return (
    pathname.startsWith("/dashboard/today") ||
    pathname.startsWith("/dashboard/my-schedule") ||
    pathname.startsWith("/dashboard/messages") ||
    pathname.startsWith("/dashboard/alerts") ||
    pathname.startsWith("/dashboard/support") ||
    pathname.startsWith("/dashboard/students") ||
    pathname.startsWith("/dashboard/complaints") ||
    pathname.startsWith("/dashboard/profile")
  );
}

/** Paths a school contact is allowed to access on the web dashboard. */
export function isSchoolPortalPath(pathname: string): boolean {
  return (
    pathname === "/dashboard/my-school" ||
    pathname.startsWith("/dashboard/students") ||
    pathname.startsWith("/dashboard/parents") ||
    pathname.startsWith("/dashboard/routes") ||
    pathname.startsWith("/dashboard/messages") ||
    pathname.startsWith("/dashboard/alerts") ||
    pathname.startsWith("/dashboard/support") ||
    pathname.startsWith("/dashboard/complaints") ||
    pathname.startsWith("/dashboard/profile")
  );
}
