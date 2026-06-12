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
}: {
  active: MessageCategoryTab;
  onChange: (tab: MessageCategoryTab) => void;
  counts: Record<MessageCategoryTab, { total: number; unread: number }>;
  visibleTabs?: MessageCategoryTab[];
}) {
  const tabs = MESSAGE_CATEGORY_TABS.filter(
    (t) => !visibleTabs || visibleTabs.includes(t.id),
  );

  return (
    <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((tab) => {
        const selected = tab.id === active;
        const { total, unread } = counts[tab.id];
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-xl border px-4 py-2.5 text-left transition",
              selected
                ? "border-brand-primary bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                : "border-slate-200 bg-white text-slate-700 hover:border-brand-primary/30 hover:bg-brand-light/40",
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                selected ? "bg-white/15 text-white" : "bg-brand-light text-brand-primary",
              )}
            >
              {tab.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold leading-tight">{tab.shortLabel}</span>
              <span className={cn("block text-[11px]", selected ? "text-white/75" : "text-slate-400")}>
                {total} thread{total === 1 ? "" : "s"}
              </span>
            </span>
            {unread > 0 && (
              <span
                className={cn(
                  "ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
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
  );
}
