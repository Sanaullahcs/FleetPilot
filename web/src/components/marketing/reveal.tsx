import { cn } from "@/lib/utils";

/** Layout wrapper only. Content stays visible (no scroll-hide). */
export function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return <div className={cn(className)}>{children}</div>;
}
