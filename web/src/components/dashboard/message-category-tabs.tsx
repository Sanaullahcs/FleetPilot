"use client";

import type { ReactNode } from "react";
import type { DashboardChatConversation, UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BusRouteIcon, DriverIcon, MessageIcon, SchoolIcon } from "@/components/dashboard/stat-icons";

export type MessageCategoryTab =
  | "all"
  | "direct_school"
  | "direct_driver"
  | "direct_contractor"
  | "direct_parent"
  | "parent_driver"
  | "parent_school"
  | "driver_school"
  | "parent_support"
  | "driver_support"
  | "staff_direct"
  | "contractor_driver";

function hasParticipantRole(c: DashboardChatConversation, role: string): boolean {
  return (c.participants ?? []).some((p) => p.role === role);
}

function isDirectStaffWithRole(c: DashboardChatConversation, role: string): boolean {
  return c.type === "staff_direct" && hasParticipantRole(c, role);
}

export const MESSAGE_CATEGORY_TABS: {
  id: MessageCategoryTab;
  label: string;
  shortLabel: string;
  description: string;
  emptyMessage: string;
  icon: ReactNode;
  match: (c: DashboardChatConversation) => boolean;
}[] = [
  {
    id: "all",
    label: "All Threads",
    shortLabel: "All",
    description: "Every conversation across parents, drivers, schools, and contractors.",
    emptyMessage: "No conversations yet.",
    icon: <MessageIcon />,
    match: () => true,
  },
  {
    id: "direct_school",
    label: "Schools",
    shortLabel: "Schools",
    description: "Direct threads between transportation staff and school contacts.",
    emptyMessage: "No school conversations yet.",
    icon: <SchoolIcon />,
    match: (c) => isDirectStaffWithRole(c, "school_contact"),
  },
  {
    id: "direct_driver",
    label: "Drivers",
    shortLabel: "Drivers",
    description: "Dispatch and operations threads with drivers.",
    emptyMessage: "No driver conversations yet.",
    icon: <DriverIcon />,
    match: (c) => c.type === "driver_support",
  },
  {
    id: "direct_contractor",
    label: "Contractors",
    shortLabel: "Contractors",
    description: "Direct threads with contractors and fleet operators.",
    emptyMessage: "No contractor conversations yet.",
    icon: <MessageIcon />,
    match: (c) => isDirectStaffWithRole(c, "contractor"),
  },
  {
    id: "direct_parent",
    label: "Parents",
    shortLabel: "Parents",
    description: "Transportation office threads with parents about routes and dispatch.",
    emptyMessage: "No parent conversations yet.",
    icon: <MessageIcon />,
    match: (c) => c.type === "parent_support" || isDirectStaffWithRole(c, "parent"),
  },
  {
    id: "driver_school",
    label: "Drivers & Schools",
    shortLabel: "Driver ↔ school",
    description: "Route coordination threads between drivers and school offices.",
    emptyMessage: "No driver ↔ school conversations yet.",
    icon: <SchoolIcon />,
    match: (c) => c.type === "driver_school",
  },
  {
    id: "parent_driver",
    label: "Parents & Drivers",
    shortLabel: "Parent ↔ driver",
    description: "Pickup, route, and rider threads between parents and drivers.",
    emptyMessage: "No parent ↔ driver conversations yet.",
    icon: <BusRouteIcon />,
    match: (c) => c.type === "parent_driver",
  },
  {
    id: "parent_school",
    label: "Parents & Schools",
    shortLabel: "Parent ↔ school",
    description: "Enrollment and attendance threads between parents and schools.",
    emptyMessage: "No parent ↔ school conversations yet.",
    icon: <SchoolIcon />,
    match: (c) => c.type === "parent_school",
  },
  {
    id: "contractor_driver",
    label: "Contractor Drivers",
    shortLabel: "Contractor drivers",
    description: "Threads between contractors and their assigned drivers.",
    emptyMessage: "No contractor ↔ driver conversations yet.",
    icon: <DriverIcon />,
    match: (c) => c.type === "contractor_driver",
  },
  {
    id: "parent_support",
    label: "Transportation Office",
    shortLabel: "Transportation Office",
    description: "Transportation office support for parents.",
    emptyMessage: "No office conversations yet.",
    icon: <MessageIcon />,
    match: (c) => c.type === "parent_support",
  },
  {
    id: "driver_support",
    label: "Dispatch & Support",
    shortLabel: "Dispatch",
    description: "Dispatch and operations support for drivers.",
    emptyMessage: "No dispatch conversations yet.",
    icon: <DriverIcon />,
    match: (c) => c.type === "driver_support",
  },
  {
    id: "staff_direct",
    label: "Transportation",
    shortLabel: "Transportation",
    description: "Direct threads with transportation administrators.",
    emptyMessage: "No transportation conversations yet.",
    icon: <MessageIcon />,
    match: (c) => c.type === "staff_direct",
  },
];

const PORTAL_TAB_LABELS: Partial<
  Record<UserRole, Partial<Record<MessageCategoryTab, { label: string; shortLabel: string }>>>
> = {
  parent: {
    parent_support: { label: "Transportation Office", shortLabel: "Transportation Office" },
    parent_driver: { label: "Drivers", shortLabel: "Drivers" },
    parent_school: { label: "Schools", shortLabel: "Schools" },
  },
  driver: {
    driver_support: { label: "Dispatch & Support", shortLabel: "Dispatch" },
    parent_driver: { label: "Parents", shortLabel: "Parents" },
    driver_school: { label: "Schools", shortLabel: "Schools" },
    contractor_driver: { label: "Contractor", shortLabel: "Contractor" },
  },
  school_contact: {
    parent_school: { label: "Parents", shortLabel: "Parents" },
    driver_school: { label: "Drivers", shortLabel: "Drivers" },
    staff_direct: { label: "Transportation", shortLabel: "Transportation" },
  },
  contractor: {
    staff_direct: { label: "Transportation Office", shortLabel: "Admin" },
    contractor_driver: { label: "My Drivers", shortLabel: "Drivers" },
  },
};

export function tabDisplayForRole(
  tab: MessageCategoryTab,
  role?: UserRole,
): { label: string; shortLabel: string; description: string; emptyMessage: string } {
  const config = MESSAGE_CATEGORY_TABS.find((t) => t.id === tab)!;
  const override = role ? PORTAL_TAB_LABELS[role]?.[tab] : undefined;
  return {
    label: override?.label ?? config.label,
    shortLabel: override?.shortLabel ?? config.shortLabel,
    description: config.description,
    emptyMessage: config.emptyMessage,
  };
}

export function filterConversationsByTab(
  conversations: DashboardChatConversation[],
  tab: MessageCategoryTab,
) {
  const config = MESSAGE_CATEGORY_TABS.find((t) => t.id === tab)!;
  return conversations.filter(config.match);
}

export function countConversationsByTab(conversations: DashboardChatConversation[]) {
  const out = Object.fromEntries(
    MESSAGE_CATEGORY_TABS.map((tab) => [tab.id, { total: 0, unread: 0 }]),
  ) as Record<MessageCategoryTab, { total: number; unread: number }>;

  for (const c of conversations) {
    out.all.total += 1;
    out.all.unread += c.unread_count;
    for (const tab of MESSAGE_CATEGORY_TABS) {
      if (tab.id === "all") continue;
      if (tab.match(c)) {
        out[tab.id].total += 1;
        out[tab.id].unread += c.unread_count;
      }
    }
  }

  return out;
}

export function MessageCategoryTabs({
  active,
  onChange,
  counts,
  visibleTabs,
  search,
  onSearchChange,
  searchPlaceholder = "Search threads…",
  role,
}: {
  active: MessageCategoryTab;
  onChange: (tab: MessageCategoryTab) => void;
  counts: Record<MessageCategoryTab, { total: number; unread: number }>;
  visibleTabs?: MessageCategoryTab[];
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  role?: UserRole;
}) {
  const tabs = visibleTabs
    ? visibleTabs
        .map((id) => MESSAGE_CATEGORY_TABS.find((t) => t.id === id))
        .filter((t): t is (typeof MESSAGE_CATEGORY_TABS)[number] => !!t)
    : MESSAGE_CATEGORY_TABS;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          const selected = tab.id === active;
          const { total, unread } = counts[tab.id];
          const display = tabDisplayForRole(tab.id, role);
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left transition",
                selected
                  ? "border-brand-primary bg-brand-primary text-white shadow-sm shadow-brand-primary/15"
                  : "border-slate-200 bg-white text-slate-700 hover:border-brand-primary/30 hover:bg-brand-light/30",
              )}
            >
              <span className="text-xs font-semibold leading-none">{display.shortLabel}</span>
              <span className={cn("text-[10px] tabular-nums", selected ? "text-white/70" : "text-slate-400")}>
                {total}
              </span>
              {unread > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none",
                    selected ? "bg-white/20 text-white" : "bg-brand-primary text-white",
                  )}
                >
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {onSearchChange ? (
        <div className="relative w-full shrink-0 sm:w-52 lg:w-60">
          <svg
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
          </svg>
          <input
            type="search"
            value={search ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-2.5 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
          />
        </div>
      ) : null}
    </div>
  );
}
