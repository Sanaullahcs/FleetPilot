import type { ReactNode } from "react";
import { FleetPilotLogoMarkSvg } from "@/components/brand/logo-mark-svg";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

/* ─── Shared chrome ─── */

export function MarketingBrowserChrome({ url }: { url: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 bg-white px-4 py-2.5">
      <span className="flex gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
      </span>
      <span className="mx-auto flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-medium text-slate-500">
        <svg width="9" height="9" viewBox="0 0 12 12" fill="none" aria-hidden>
          <rect x="2" y="5" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <path d="M4 5V3.5a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1.2" />
        </svg>
        {url}
      </span>
      <span className="w-10" />
    </div>
  );
}

function NavIcon({ children, active }: { children: ReactNode; active?: boolean }) {
  return (
    <span
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded-md [&_svg]:h-2.5 [&_svg]:w-2.5",
        active ? "bg-white/20 text-white" : "text-slate-400",
      )}
    >
      {children}
    </span>
  );
}

const SIDEBAR_NAV = [
  { label: "Dashboard", active: true, icon: "grid" },
  { label: "Dispatch", icon: "dispatch" },
  { label: "Live radar", icon: "radar" },
  { label: "Students", icon: "students" },
  { label: "Drivers", icon: "drivers" },
  { label: "Routes", icon: "routes" },
  { label: "Messages", icon: "messages" },
] as const;

function SidebarIcon({ kind }: { kind: (typeof SIDEBAR_NAV)[number]["icon"] }) {
  if (kind === "grid") {
    return (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }
  if (kind === "dispatch") {
    return (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M3 4h10v8H3z" stroke="currentColor" strokeWidth="1.2" />
        <path d="M6 8h4M6 10.5h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "radar") {
    return (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M8 8V3.5M8 8l3.5 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "students") {
    return (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M3 14c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "drivers") {
    return (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="8" cy="5" r="2" stroke="currentColor" strokeWidth="1.2" />
        <path d="M4 13v-1.5a4 4 0 018 0V13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "routes") {
    return (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="8" cy="4" r="2" stroke="currentColor" strokeWidth="1.2" />
        <path d="M3 12c0-2 2-4 5-4s5 2 5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 4.5h10v7H3z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M3 6.5l5 3.5 5-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

const RUN_ROWS: [string, string, string, string][] = [
  ["AM-4 · E-613", "T. Alvarez", "Bus 18", "On time"],
  ["AM-7 · E-220", "M. Chen", "Van 05", "In progress"],
  ["MID-2 · E-114", "R. Brooks", "Bus 09", "Delayed"],
  ["PM-1 · E-401", "J. Patel", "Bus 22", "Scheduled"],
];

const STAT_TILES = [
  { value: "24", label: "Runs today", accent: brand.primary, hint: "4 starting soon" },
  { value: "98%", label: "On time", accent: brand.success, hint: "This week" },
  { value: "18", label: "Vehicles out", accent: brand.accent, hint: "2 returning" },
  { value: "2", label: "Open alerts", accent: brand.orange, hint: "Needs review" },
];

function StatusPill({ status }: { status: string }) {
  const cls =
    status === "On time"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : status === "Delayed"
        ? "bg-orange-50 text-orange-600 ring-orange-100"
        : status === "Scheduled"
          ? "bg-slate-50 text-slate-600 ring-slate-200"
          : "bg-sky-50 text-sky-700 ring-sky-100";
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[8px] font-bold ring-1", cls)}>{status}</span>
  );
}

/** High-fidelity dashboard snapshot with FleetPilot branding. */
export function MarketingDashboardSnapshot({
  size = "md",
  className,
}: {
  size?: "hero" | "sm" | "md" | "lg";
  className?: string;
}) {
  const isHero = size === "hero";
  const rows = size === "lg" ? RUN_ROWS : RUN_ROWS.slice(0, isHero ? 2 : 3);
  const textScale = isHero ? "text-[8px]" : size === "sm" ? "text-[9px]" : size === "md" ? "text-[10px]" : "text-[11px]";
  const sidebarW = isHero ? "w-11" : size === "sm" ? "w-[7.5rem]" : size === "md" ? "w-[9rem]" : "w-[10.5rem]";

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-brand-primary/15",
        isHero && "max-w-[480px]",
        className,
      )}
    >
      <MarketingBrowserChrome url="app.fleetpilot.com/dashboard" />
      <div className="flex min-w-0">
        <aside className={cn("shrink-0 border-r border-slate-100 bg-[#f8f9fc] p-2", isHero ? "px-1.5" : "p-3", sidebarW)}>
          <div className={cn("flex items-center border-b border-slate-100 pb-2", isHero ? "justify-center" : "gap-1.5")}>
            <FleetPilotLogoMarkSvg size={isHero ? 20 : size === "lg" ? 22 : 18} />
            {!isHero && (
              <div className="min-w-0">
                <p className={cn("truncate font-bold text-slate-900", textScale)}>FleetPilot</p>
                <p className="truncate text-[8px] text-slate-400">Admin portal</p>
              </div>
            )}
          </div>
          <ul className={cn("mt-2 space-y-0.5", isHero && "flex flex-col items-center")}>
            {SIDEBAR_NAV.map((item) => (
              <li
                key={item.label}
                title={item.label}
                className={cn(
                  "flex items-center rounded-lg font-medium",
                  isHero ? "justify-center p-1.5" : "gap-2 px-2 py-1.5",
                  textScale,
                  item.active
                    ? "bg-brand-primary text-white shadow-sm shadow-brand-primary/25"
                    : "text-slate-500",
                )}
              >
                <NavIcon active={item.active}>
                  <SidebarIcon kind={item.icon} />
                </NavIcon>
                {!isHero && <span className="truncate">{item.label}</span>}
              </li>
            ))}
          </ul>
        </aside>

        <div className="min-w-0 flex-1 space-y-2.5 bg-[#fafbfd] p-2.5 sm:space-y-3 sm:p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className={cn("truncate font-bold text-slate-900", isHero ? "text-[10px]" : size === "lg" ? "text-sm" : "text-xs")}>
                Good morning, Dana
              </p>
              <p className="truncate text-[8px] text-slate-400 sm:text-[9px]">Friday, Jun 12 · 24 runs</p>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[7px] font-bold text-emerald-600 ring-1 ring-emerald-100 sm:text-[8px]">
              Live
            </span>
          </div>

          <div className={cn("grid gap-1.5", isHero ? "grid-cols-4" : "grid-cols-2 sm:grid-cols-4")}>
            {STAT_TILES.map((tile) => (
              <div
                key={tile.label}
                className="relative min-w-0 overflow-hidden rounded-lg border border-slate-200/70 bg-white p-1.5 shadow-sm sm:rounded-xl sm:p-2"
              >
                <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: tile.accent }} />
                <p className={cn("fp-mkt-num font-bold text-slate-900", isHero ? "text-sm" : "text-base sm:text-lg")}>
                  {tile.value}
                </p>
                <p className={cn("truncate font-medium text-slate-500", textScale)}>{tile.label}</p>
                {!isHero && <p className="mt-0.5 truncate text-[7px] text-slate-400">{tile.hint}</p>}
              </div>
            ))}
          </div>

          {!isHero && (
            <div className="grid gap-2 lg:grid-cols-[1fr_1.35fr]">
              <div className="rounded-xl border border-slate-200/70 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">On-time by week</p>
                  <span className="text-[8px] font-semibold text-emerald-600">+6% vs last week</span>
                </div>
                <div className="mt-3 flex h-20 items-end gap-1.5 sm:h-24">
                  {[52, 68, 61, 78, 72, 88, 98].map((h, i) => (
                    <span
                      key={i}
                      style={{ height: `${h}%` }}
                      className={cn(
                        "flex-1 rounded-t-md transition-all",
                        i === 6 ? "bg-gradient-to-t from-brand-primary to-sky-400" : "bg-brand-primary/15",
                      )}
                    />
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[8px] text-slate-400">
                  <span>Mon</span>
                  <span>Fri</span>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Today&apos;s runs</p>
                  <span className="text-[8px] font-semibold text-brand-primary">View dispatch →</span>
                </div>
                {rows.map(([run, driver, veh, status]) => (
                  <div
                    key={run}
                    className="flex items-center justify-between gap-2 border-b border-slate-50 px-3 py-2 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className={cn("truncate font-semibold text-slate-800", textScale)}>{run}</p>
                      <p className="truncate text-[8px] text-slate-400">
                        {driver} · {veh}
                      </p>
                    </div>
                    <StatusPill status={status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {isHero && (
            <div className="overflow-hidden rounded-lg border border-slate-200/70 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-2.5 py-1.5">
                <p className="text-[8px] font-bold uppercase tracking-wide text-slate-400">Today&apos;s runs</p>
              </div>
              {rows.map(([run, driver, veh, status]) => (
                <div
                  key={run}
                  className="flex items-center justify-between gap-2 border-b border-slate-50 px-2.5 py-1.5 last:border-0"
                >
                  <div className="min-w-0">
                    <p className={cn("truncate font-semibold text-slate-800", textScale)}>{run}</p>
                    <p className="truncate text-[7px] text-slate-400">{driver} · {veh}</p>
                  </div>
                  <StatusPill status={status} />
                </div>
              ))}
            </div>
          )}

          {size === "lg" && (
            <div className="grid grid-cols-3 gap-2">
              {[
                ["Plan route", brand.primary],
                ["Live radar", brand.accent],
                ["Message driver", brand.orange],
              ].map(([label, accent]) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white px-3 py-2 shadow-sm"
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold text-white"
                    style={{ background: accent }}
                  >
                    →
                  </span>
                  <span className={cn("truncate font-semibold text-slate-700", textScale)}>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MarketingRadarCard({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        "fp-mkt-radar shrink-0 overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-brand-primary/25",
        compact ? "w-[148px] sm:w-[168px]" : "w-full max-w-[280px]",
        className,
      )}
    >
      <div className="flex items-center justify-between px-3 pt-2.5">
        <p className="text-[9px] font-bold uppercase tracking-widest text-white/70">Live radar</p>
        <span className="flex items-center gap-1 rounded-full bg-emerald-400/15 px-1.5 py-0.5 text-[8px] font-bold text-emerald-300">
          <span className="h-1 w-1 rounded-full bg-emerald-400" /> Live
        </span>
      </div>
      <div className="relative aspect-[24/17] w-full">
        <div className="fp-mkt-radar-grid absolute inset-0" aria-hidden />
        <svg viewBox="0 0 240 170" className="relative h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden>
          <path d="M20 140 C 70 120, 80 70, 130 60 S 200 45, 225 25" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M20 140 C 70 120, 80 70, 130 60 S 200 45, 225 25" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="7 11" className="fp-mkt-dash" />
          {[[20, 140], [130, 60], [225, 25]].map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="5" fill="rgba(255,255,255,0.15)" />
              <circle cx={x} cy={y} r="2.2" fill="#fff" />
            </g>
          ))}
          <g className="fp-mkt-ping" style={{ transformOrigin: "130px 60px" }}>
            <circle cx="130" cy="60" r="12" fill="#38BDF8" opacity="0.25" />
            <circle cx="130" cy="60" r="5.5" fill="#38BDF8" />
          </g>
        </svg>
      </div>
      <div className="flex items-center gap-2 border-t border-white/10 bg-white/[0.06] px-3 py-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-sky-400/20 text-sky-300">
          <BusGlyph />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[9px] font-bold text-white">Bus 18 · 32 mph</p>
          <p className="truncate text-[8px] text-white/50">Maple St → Lincoln</p>
        </div>
      </div>
    </div>
  );
}

function BusGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 4h10a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 9.5h12M5 12v1.2M11 12v1.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

const PHONE_WIDTH = {
  compact: 128,
  default: 140,
} as const;

function PhoneFrame({
  children,
  className,
  raised,
  size = "default",
}: {
  children: ReactNode;
  className?: string;
  raised?: boolean;
  size?: keyof typeof PHONE_WIDTH;
}) {
  const width = PHONE_WIDTH[size];

  return (
    <div
      className={cn(
        "relative shrink-0 transition-transform duration-500",
        raised && "-translate-y-3",
        className,
      )}
      style={{ width }}
    >
      <div
        className="relative overflow-hidden rounded-[1.6rem] border-[2.5px] border-slate-800 bg-slate-800 p-[3px] shadow-xl shadow-slate-900/20"
        style={{ aspectRatio: "9 / 19.5" }}
      >
        <div className="absolute left-1/2 top-[5px] z-10 h-[4px] w-7 -translate-x-1/2 rounded-full bg-slate-700" />
        <div className="flex h-full flex-col overflow-hidden rounded-[1.25rem] bg-white">{children}</div>
      </div>
    </div>
  );
}

/** Driver app snapshot with manifest and stop progress. */
export function DriverAppSnapshot({
  className,
  raised,
  compact,
}: {
  className?: string;
  raised?: boolean;
  compact?: boolean;
}) {
  const stops = compact
    ? [
        ["Stop A · Oak Ridge", "Done", true],
        ["Stop B · Maple St", "Next · 0.8 mi", false],
      ]
    : [
        ["Stop A · Oak Ridge", "2 pickups · Done", true],
        ["Stop B · Maple St", "1 pickup · Next · 0.8 mi", false],
        ["Stop C · Cedar Ln", "3 pickups · Upcoming", false],
      ];

  return (
    <PhoneFrame className={className} raised={raised} size={compact ? "compact" : "default"}>
      <div className="flex min-h-0 flex-1 flex-col bg-white">
        {/* status bar */}
        <div className="flex shrink-0 items-center justify-between px-3 pb-1 pt-3">
          <span className="text-[8px] font-semibold text-slate-900">9:41</span>
          <span className="flex items-center gap-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            <span className="h-1.5 w-2.5 rounded-sm bg-slate-400" />
          </span>
        </div>
        {/* greeting */}
        <div className="flex shrink-0 items-center justify-between px-3 pb-2">
          <div className="flex items-center gap-1.5">
            <FleetPilotLogoMarkSvg size={15} />
            <div>
              <p className="text-[10px] font-bold leading-none text-slate-900">Hi, Tomas</p>
              <p className="text-[7px] text-slate-400">AM-4 · 12 stops</p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[7px] font-bold text-emerald-600">On shift</span>
        </div>
        <div className="min-h-0 flex-1 space-y-1.5 overflow-hidden px-2 pt-1">
          <div className="rounded-lg border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-2 shadow-sm">
            <div className="flex items-center justify-between gap-1">
              <span className="rounded-full bg-orange-500 px-1.5 py-0.5 text-[7px] font-bold text-white">Active</span>
              <span className="text-[7px] font-semibold text-orange-600">Stop 3/12</span>
            </div>
            <p className="mt-1 truncate text-[9px] font-bold text-slate-900">AM-4 · Run E-613</p>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-orange-100">
              <div className="h-full w-[28%] rounded-full bg-orange-500" />
            </div>
          </div>
          {stops.map(([title, sub, done]) => (
            <div
              key={title}
              className={cn(
                "flex items-start gap-1.5 rounded-lg border px-2 py-1.5",
                done ? "border-emerald-100 bg-emerald-50/80" : "border-slate-100 bg-white",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[7px] font-bold",
                  done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400",
                )}
              >
                {done ? "✓" : "○"}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[8px] font-semibold text-slate-800">{title}</p>
                <p className="truncate text-[7px] text-slate-500">{sub}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 grid shrink-0 grid-cols-4 border-t border-slate-100 bg-white pb-2 pt-1.5">
          {DRIVER_TABS.map((tab, i) => (
            <span
              key={tab.label}
              className={cn(
                "flex flex-col items-center gap-0.5",
                i === 0 ? "text-brand-primary" : "text-slate-300",
              )}
            >
              <span className="h-3 w-3 [&_svg]:h-3 [&_svg]:w-3">
                <TabIcon kind={tab.icon} />
              </span>
              <span className="text-[6px] font-semibold">{tab.label}</span>
            </span>
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}

const DRIVER_TABS: { label: string; icon: "home" | "child" | "bell" | "user" }[] = [
  { label: "Runs", icon: "home" },
  { label: "Map", icon: "child" },
  { label: "Alerts", icon: "bell" },
  { label: "Profile", icon: "user" },
];

const PARENT_TABS: { label: string; icon: "home" | "child" | "bell" | "user" }[] = [
  { label: "Home", icon: "home" },
  { label: "Kids", icon: "child" },
  { label: "Alerts", icon: "bell" },
  { label: "Profile", icon: "user" },
];

function TabIcon({ kind }: { kind: "home" | "child" | "bell" | "user" }) {
  if (kind === "home") {
    return (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M3 7l5-4 5 4v6H3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === "child") {
    return (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="8" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.3" />
        <path d="M4 13c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "bell") {
    return (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M4.5 11V7a3.5 3.5 0 017 0v4l1 1.5H3.5L4.5 11z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M6.8 13.5a1.5 1.5 0 002.4 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3.5 13c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/** Parent app snapshot with live tracking and pickup alerts. */
export function ParentAppSnapshot({
  className,
  raised,
  compact,
}: {
  className?: string;
  raised?: boolean;
  compact?: boolean;
}) {
  return (
    <PhoneFrame className={className} raised={raised} size={compact ? "compact" : "default"}>
      <div className="flex min-h-0 flex-1 flex-col bg-white">
        {/* status bar */}
        <div className="flex shrink-0 items-center justify-between px-3 pb-1 pt-3">
          <span className="text-[8px] font-semibold text-slate-900">9:41</span>
          <span className="flex items-center gap-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            <span className="h-1.5 w-2.5 rounded-sm bg-slate-400" />
          </span>
        </div>

        {/* greeting */}
        <div className="flex shrink-0 items-center justify-between px-3 pb-2">
          <div className="flex items-center gap-1.5">
            <FleetPilotLogoMarkSvg size={15} />
            <div>
              <p className="text-[10px] font-bold leading-none text-slate-900">Hi, Sarah</p>
              <p className="text-[7px] text-slate-400">Tracking Emma</p>
            </div>
          </div>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <TabIcon kind="bell" />
          </span>
        </div>

        {/* live map — the showcase element */}
        <div className="relative mx-2 shrink-0 overflow-hidden rounded-xl" style={{ aspectRatio: "16 / 13" }}>
          <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-brand-light to-emerald-50" />
          <div className="fp-mkt-radar-grid absolute inset-0 opacity-30" aria-hidden />
          <svg viewBox="0 0 200 160" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
            <path d="M15 130 C 55 110, 70 70, 110 75 S 170 95, 188 70" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
            <path d="M15 130 C 55 110, 70 70, 110 75 S 170 95, 188 70" fill="none" stroke={brand.primary} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 9" className="fp-mkt-dash" />
            {/* home pin */}
            <circle cx="15" cy="130" r="4" fill="#fff" />
            <circle cx="15" cy="130" r="2" fill={brand.orange} />
            {/* school pin */}
            <circle cx="188" cy="70" r="4" fill="#fff" />
            <circle cx="188" cy="70" r="2" fill={brand.success} />
          </svg>
          {/* live bus marker */}
          <div className="absolute left-[52%] top-[44%] -translate-x-1/2 -translate-y-1/2">
            <span className="relative flex items-center justify-center">
              <span className="absolute h-7 w-7 animate-ping rounded-full bg-sky-400/40" />
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg ring-2 ring-white">
                <BusGlyph />
              </span>
            </span>
          </div>
          {/* ETA pill */}
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 shadow-sm backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[8px] font-bold text-slate-800">Bus E-613</span>
            <span className="text-[8px] text-slate-400">· 5 min</span>
          </div>
        </div>

        {/* pickup status card */}
        <div className="min-h-0 flex-1 px-2 pt-2">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-bold text-emerald-900">Emma picked up</p>
                <p className="truncate text-[8px] text-emerald-600">7:27 AM · notified instantly</p>
              </div>
            </div>
          </div>
        </div>

        {/* bottom nav */}
        <div className="mt-2 grid shrink-0 grid-cols-4 border-t border-slate-100 bg-white pb-2 pt-1.5">
          {PARENT_TABS.map((tab, i) => (
            <span
              key={tab.label}
              className={cn(
                "flex flex-col items-center gap-0.5",
                i === 0 ? "text-brand-primary" : "text-slate-300",
              )}
            >
              <span className="h-3 w-3 [&_svg]:h-3 [&_svg]:w-3">
                <TabIcon kind={tab.icon} />
              </span>
              <span className="text-[6px] font-semibold">{tab.label}</span>
            </span>
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}

/** A moving bus marker that travels along an SVG path via animateMotion. */
function MovingBus({
  pathId,
  color,
  dur,
  begin = "0s",
  reverse = false,
}: {
  pathId: string;
  color: string;
  dur: string;
  begin?: string;
  reverse?: boolean;
}) {
  return (
    <g>
      <circle r="15" fill={color} opacity="0.16" />
      <circle r="10" fill={color} />
      <g stroke="#fff" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="-5" y="-4.2" width="10" height="8.4" rx="1.6" />
        <path d="M-5 1 h10" />
        <path d="M-2.8 4.2 v1.3 M2.8 4.2 v1.3" />
      </g>
      <animateMotion
        dur={dur}
        begin={begin}
        repeatCount="indefinite"
        rotate="0"
        calcMode="linear"
        keyPoints={reverse ? "1;0" : "0;1"}
        keyTimes="0;1"
      >
        <mpath href={`#${pathId}`} />
      </animateMotion>
    </g>
  );
}

const HOME = [70, 410] as const;
const SCHOOL = [432, 116] as const;

const HERO_ROUTES = [
  { id: "fp-route-1", d: "M70 410 C 150 360, 150 240, 250 215 S 380 150, 432 116", color: brand.primary, dur: "16s", begin: "0s", reverse: false },
  { id: "fp-route-2", d: "M70 410 C 170 380, 220 300, 300 255 S 395 165, 432 116", color: "#38BDF8", dur: "19s", begin: "1.5s", reverse: false },
  { id: "fp-route-3", d: "M70 410 C 210 415, 320 335, 372 268 S 420 165, 432 116", color: brand.orange, dur: "15s", begin: "2s", reverse: true },
];

const HERO_STOPS = [
  [250, 215],
  [300, 255],
  [372, 268],
  [190, 330],
] as const;

/** Creative animated "live network" hero: buses routing to school in real time. */
export function MarketingHeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[440px] sm:max-w-[500px] lg:max-w-[540px]">
      {/* ambient glows */}
      <div className="pointer-events-none absolute -inset-6 rounded-[3rem] bg-gradient-to-tr from-brand-primary/15 via-sky-200/25 to-transparent blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-4 top-6 h-44 w-44 rounded-full bg-sky-300/25 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -left-6 bottom-10 h-40 w-40 rounded-full bg-brand-primary/15 blur-3xl" aria-hidden />

      <div className="fp-mkt-float relative overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-white via-brand-light/40 to-sky-50/60 shadow-2xl shadow-brand-primary/15 backdrop-blur-sm">
        <div className="fp-mkt-grid absolute inset-0 opacity-70" aria-hidden />

        <svg viewBox="0 0 480 460" className="relative block w-full" role="img" aria-label="Live bus network heading to school">
          <defs>
            {HERO_ROUTES.map((r) => (
              <path key={r.id} id={r.id} d={r.d} fill="none" />
            ))}
          </defs>

          {/* route base + animated dashes */}
          {HERO_ROUTES.map((r, i) => (
            <g key={r.id}>
              <path d={r.d} fill="none" stroke="#0f172a" strokeOpacity="0.06" strokeWidth="8" strokeLinecap="round" />
              <path
                d={r.d}
                fill="none"
                stroke={r.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="2 13"
                className={i % 2 === 0 ? "fp-mkt-dash" : "fp-mkt-dash-slow"}
                style={{ animationDuration: i % 2 === 0 ? "7s" : "9s" }}
              />
            </g>
          ))}

          {/* stop pins */}
          {HERO_STOPS.map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="8" fill="#fff" stroke="#CBD5E1" strokeWidth="1.5" />
              <circle cx={x} cy={y} r="3" fill={brand.primary} />
            </g>
          ))}

          {/* home origin marker */}
          <g>
            <circle cx={HOME[0]} cy={HOME[1]} r="30" fill={brand.orange} opacity="0.07" className="fp-mkt-ping" style={{ transformOrigin: `${HOME[0]}px ${HOME[1]}px` }} />
            <circle cx={HOME[0]} cy={HOME[1]} r="18" fill="#fff" stroke={brand.orange} strokeWidth="2" />
            <g transform={`translate(${HOME[0]} ${HOME[1]})`} stroke={brand.orange} strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round">
              <path d="M-7 0 L0 -6 L7 0" />
              <path d="M-5 0 v6 h10 v-6" />
              <path d="M-1.5 6 v-3.5 h3 v3.5" fill={brand.orange} />
            </g>
          </g>

          {/* school destination with live radar rings */}
          <g>
            <circle cx={SCHOOL[0]} cy={SCHOOL[1]} r="46" fill={brand.primary} opacity="0.06" className="fp-mkt-ping" style={{ transformOrigin: `${SCHOOL[0]}px ${SCHOOL[1]}px` }} />
            <circle cx={SCHOOL[0]} cy={SCHOOL[1]} r="30" fill={brand.primary} opacity="0.08" className="fp-mkt-ping-delayed" style={{ transformOrigin: `${SCHOOL[0]}px ${SCHOOL[1]}px` }} />
            <circle cx={SCHOOL[0]} cy={SCHOOL[1]} r="20" fill="#fff" stroke={brand.primary} strokeWidth="2" />
            <g transform={`translate(${SCHOOL[0]} ${SCHOOL[1]})`} stroke={brand.primary} strokeWidth="2" fill="none" strokeLinejoin="round">
              <path d="M-8 1 L0 -5 L8 1 Z" fill={brand.primary} />
              <path d="M-6 1 v6 h12 v-6" />
              <path d="M0 -5 v-3" />
            </g>
          </g>

          {/* moving buses — two heading to school, one returning home */}
          {HERO_ROUTES.map((r) => (
            <MovingBus key={r.id} pathId={r.id} color={r.color} dur={r.dur} begin={r.begin} reverse={r.reverse} />
          ))}
        </svg>

        {/* glass stat badges */}
        <div className="fp-mkt-float pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-full border border-white/70 bg-white/90 px-3 py-1.5 shadow-lg shadow-brand-primary/10 backdrop-blur sm:left-4 sm:top-4">
          <span className="relative flex h-2 w-2">
            <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[11px] font-bold text-slate-800">24 buses live</span>
        </div>

        <div className="fp-mkt-float-delayed pointer-events-none absolute right-3 top-3 rounded-full border border-white/70 bg-white/90 px-3 py-1.5 shadow-lg shadow-brand-primary/10 backdrop-blur sm:right-4 sm:top-4">
          <span className="text-[11px] font-bold text-emerald-600">98%</span>
          <span className="ml-1 text-[10px] font-medium text-slate-500">on time</span>
        </div>
      </div>

      {/* floating callouts */}
      <div className="fp-mkt-float pointer-events-none absolute -left-3 top-[38%] z-20 hidden items-center gap-2 rounded-2xl border border-white/80 bg-white/95 px-3 py-2 shadow-xl shadow-brand-primary/10 backdrop-blur sm:flex">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
          <BusGlyph />
        </span>
        <span className="min-w-0">
          <span className="block text-[11px] font-bold leading-tight text-slate-900">Bus E-613 · AM-4</span>
          <span className="flex items-center gap-1 text-[10px] text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> 5 min from Stop A
          </span>
        </span>
      </div>

      <div className="fp-mkt-float-delayed pointer-events-none absolute -right-3 bottom-6 z-20 hidden items-center gap-2 rounded-2xl border border-white/80 bg-white/95 px-3 py-2 shadow-xl shadow-brand-primary/10 backdrop-blur sm:flex">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="min-w-0">
          <span className="block text-[11px] font-bold leading-tight text-slate-900">Emma picked up</span>
          <span className="block text-[10px] text-slate-500">Parent notified · 7:27 AM</span>
        </span>
      </div>
    </div>
  );
}
