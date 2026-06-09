"use client";

import { DropdownMenu, type DropdownMenuItemDef } from "@/components/ui/dropdown-menu";

export interface ActionMenuItem {
  label: string;
  onClick: () => void;
  variant?: "default" | "danger" | "warning";
  hidden?: boolean;
}

interface RowActionsProps {
  items: ActionMenuItem[];
}

export function RowActions({ items }: RowActionsProps) {
  const menuItems: DropdownMenuItemDef[] = items.map((item) => ({
    label: item.label,
    onClick: item.onClick,
    variant: item.variant,
    hidden: item.hidden,
  }));

  return (
    <div className="flex justify-end">
      <DropdownMenu items={menuItems} ariaLabel="Row actions" width={192} />
    </div>
  );
}
