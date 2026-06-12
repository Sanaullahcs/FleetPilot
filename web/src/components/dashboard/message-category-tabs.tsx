"use client";

import type { ReactNode } from "react";
import type { DashboardChatConversation } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BusRouteIcon, DriverIcon, MessageIcon, SchoolIcon } from "@/components/dashboard/stat-icons";

export type MessageCategoryTab =
  | "all"
  | "parent_driver"
  | "parent_school"
  | "driver_school"
  | "parent_support"
  | "driver_support";

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
    label: "All threads",
    shortLabel: "All",
    description: "Every conversation across parents, drivers, and schools.",
    emptyMessage: "No conversations yet.",
    icon: <MessageIcon />,
    match: () => true,
  },
  {
    id: "parent_driver",
    label: "Parents & drivers",
    shortLabel: "Drivers",
    description: "Pickup, route, and rider threads between parents and drivers.",
    emptyMessage: "No parent ↔ driver conversations yet.",
    icon: <BusRouteIcon />,
    match: (c) => c.type === "parent_driver",
  },
  {
    id: "parent_school",
    label: "Parents & schools",
    shortLabel: "Schools",
    description: "Enrollment, attendance, and office threads with school contacts.",
    emptyMessage: "No parent ↔ school conversations yet.",
    icon: <SchoolIcon />,
    match: (c) => c.type === "parent_school",
  },
  {
    id: "driver_school",
    label: "Drivers & schools",
    shortLabel: "Driver ↔ school",
    description: "Route coordination threads between drivers and school offices.",
    emptyMessage: "No driver ↔ school conversations yet.",
    icon: <SchoolIcon />,
    match: (c) => c.type === "driver_school",
  },
  {
    id: "parent_support",
    label: "Parent support",
    shortLabel: "Parent help",
    description: "Transportation office threads with parents about routes and dispatch.",
    emptyMessage: "No parent support conversations yet.",
    icon: <MessageIcon />,
    match: (c) => c.type === "parent_support",
  },
  {
    id: "driver_support",
    label: "Driver support",
    shortLabel: "Driver help",
    description: "Dispatch and operations support threads with drivers.",
    emptyMessage: "No driver support conversations yet.",
    icon: <DriverIcon />,
    match: (c) => c.type === "driver_support",
  },
];

export function filterConversationsByTab(
  conversations: DashboardChatConversation[],
  tab: MessageCategoryTab,
) {
  const config = MESSAGE_CATEGORY_TABS.find((t) => t.id === tab)!;
  return conversations.filter(config.match);
}

export function countConversationsByTab(conversations: DashboardChatConversation[]) {
  const out: Record<MessageCategoryTab, { total: number; unread: number }> = {
    all: { total: 0, unread: 0 },
    parent_driver: { total: 0, unread: 0 },
    parent_school: { total: 0, unread: 0 },
    driver_school: { total: 0, unread: 0 },
    parent_support: { total: 0, unread: 0 },
    driver_support: { total: 0, unread: 0 },
  };

  for (const c of conversations) {
    out.all.total += 1;
    out.all.unread += c.unread_count;
    if (c.type === "parent_driver") {
      out.parent_driver.total += 1;
      out.parent_driver.unread += c.unread_count;
    } else if (c.type === "parent_school") {
      out.parent_school.total += 1;
      out.parent_school.unread += c.unread_count;
    } else if (c.type === "driver_school") {
      out.driver_school.total += 1;
      out.driver_school.unread += c.unread_count;
    } else if (c.type === "parent_support") {
      out.parent_support.total += 1;
      out.parent_support.unread += c.unread_count;
    } else if (c.type === "driver_support") {
      out.driver_support.total += 1;
      out.driver_support.unread += c.unread_count;
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
}: {
  active: MessageCategoryTab;
  onChange: (tab: MessageCategoryTab) => void;
  counts: Record<MessageCategoryTab, { total: number; unread: number }>;
  visibleTabs?: MessageCategoryTab[];
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}) {
  const tabs = MESSAGE_CATEGORY_TABS.filter(
    (t) => !visibleTabs || visibleTabs.includes(t.id),
  );

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          const selected = tab.id === active;
          const { total, unread } = counts[tab.id];
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
              <span className="text-xs font-semibold leading-none">{tab.shortLabel}</span>
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
