import { FleetPilotLogoMarkSvg } from "@/components/brand/logo-mark-svg";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function FleetPilotLogoMark({
  size = 44,
  className,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return <FleetPilotLogoMarkSvg size={size} className={className} />;
}

export function FleetPilotLogo({
  href,
  showText = true,
  subtitle,
  subtitleClassName,
  size = 44,
  className,
}: {
  href?: string;
  showText?: boolean;
  subtitle?: string;
  subtitleClassName?: string;
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  const mark = (
    <FleetPilotLogoMarkSvg
      size={size}
      className={cn("transition group-hover:scale-[1.03]", className)}
    />
  );

  const inner = (
    <>
      {mark}
      {showText && (
        <div className="min-w-0">
          <span className="block text-base font-semibold text-slate-900">FleetPilot</span>
          {subtitle && (
            <span
              className={cn(
                "block truncate text-sm font-normal text-slate-500",
                subtitleClassName,
              )}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="group flex min-w-0 items-center gap-2.5">
        {inner}
      </Link>
    );
  }

  return <div className="group flex min-w-0 items-center gap-2.5">{inner}</div>;
}
