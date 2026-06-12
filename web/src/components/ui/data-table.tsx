"use client";

import { useMemo, useState } from "react";
import { Spinner, EmptyState, Button } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { nextSortDir, sortRows, type SortDirection } from "@/lib/table-sort";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  /** Hide this column in the mobile card layout. */
  hideOnMobile?: boolean;
  /** Mark as the primary (title) field for the mobile card layout. */
  primary?: boolean;
  /** Enable click-to-sort on the column header. */
  sortable?: boolean;
  /** Value used for sorting (required when sortable). */
  sortValue?: (row: T) => string | number | null | undefined;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  rowKey: (row: T) => string;
  actions?: (row: T) => React.ReactNode;
  /** Controlled sort — use with server-side sorting. */
  sortKey?: string;
  sortDir?: SortDirection;
  onSortChange?: (key: string, dir: SortDirection) => void;
  /** Initial sort when uncontrolled (client-side). */
  defaultSortKey?: string;
  defaultSortDir?: SortDirection;
}

function SortHeader({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group inline-flex items-center gap-1 rounded-md px-1 py-0.5 -mx-1 transition",
        "hover:text-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40",
        active ? "text-brand-primary" : "text-slate-500",
      )}
    >
      <span>{label}</span>
      <span className="inline-flex flex-col text-[9px] leading-none text-slate-300 group-hover:text-brand-primary/60">
        <svg
          viewBox="0 0 8 5"
          className={cn("h-2 w-2", active && direction === "asc" && "text-brand-primary")}
          aria-hidden
        >
          <path d="M4 0l4 5H0z" fill="currentColor" />
        </svg>
        <svg
          viewBox="0 0 8 5"
          className={cn("h-2 w-2 -mt-px", active && direction === "desc" && "text-brand-primary")}
          aria-hidden
        >
          <path d="M4 5L0 0h8z" fill="currentColor" />
        </svg>
      </span>
    </button>
  );
}

export function DataTable<T>({
  columns,
  rows,
  isLoading,
  emptyMessage = "No records found.",
  rowKey,
  actions,
  sortKey: controlledSortKey,
  sortDir: controlledSortDir,
  onSortChange,
  defaultSortKey,
  defaultSortDir = "asc",
}: DataTableProps<T>) {
  const [internalSortKey, setInternalSortKey] = useState(defaultSortKey ?? "");
  const [internalSortDir, setInternalSortDir] = useState<SortDirection>(defaultSortDir);

  const isControlled = onSortChange != null;
  const sortKey = isControlled ? (controlledSortKey ?? "") : internalSortKey;
  const sortDir = isControlled ? (controlledSortDir ?? "asc") : internalSortDir;

  const displayRows = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortable || !col.sortValue) return rows;
    if (isControlled) return rows;
    return sortRows(rows, columns, sortKey, sortDir);
  }, [rows, columns, sortKey, sortDir, isControlled]);

  const handleSort = (key: string) => {
    const col = columns.find((c) => c.key === key);
    if (!col?.sortable) return;

    const dir = nextSortDir(sortKey, key, sortDir);
    if (isControlled) {
      onSortChange(key, dir);
    } else {
      setInternalSortKey(key);
      setInternalSortDir(dir);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-16">
        <Spinner />
      </div>
    );
  }

  if (!rows.length) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="fp-label px-4 py-3 text-left font-medium"
                    aria-sort={
                      col.sortable && sortKey === col.key
                        ? sortDir === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                  >
                    {col.sortable ? (
                      <SortHeader
                        label={col.header}
                        active={sortKey === col.key}
                        direction={sortDir}
                        onClick={() => handleSort(col.key)}
                      />
                    ) : (
                      col.header
                    )}
                  </th>
                ))}
                {actions && (
                  <th className="w-12 px-2 py-3" aria-label="Actions" />
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayRows.map((row) => (
                <tr key={rowKey(row)} className="hover:bg-slate-50">
                  {columns.map((col) => (
                    <td key={col.key} className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                      {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as React.ReactNode}
                    </td>
                  ))}
                  {actions && (
                    <td className="w-12 whitespace-nowrap px-2 py-3 text-right text-sm">{actions(row)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {displayRows.map((row) => {
          const primary = columns.find((c) => c.primary) ?? columns[0];
          const idCol = columns.find((c) => c.header === "ID");
          return (
            <div
              key={rowKey(row)}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="font-medium text-slate-900">
                  {primary.render
                    ? primary.render(row)
                    : ((row as Record<string, unknown>)[primary.key] as React.ReactNode)}
                </div>
                {actions && <div>{actions(row)}</div>}
              </div>
              {idCol && (
                <p className="mb-2 font-mono text-xs font-semibold text-slate-500">
                  ID: {idCol.sortValue ? idCol.sortValue(row) ?? "—" : "—"}
                </p>
              )}
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                {columns
                  .filter((c) => c !== primary && c.header !== "ID" && !c.hideOnMobile)
                  .map((col) => (
                    <div key={col.key} className="flex flex-col">
                      <dt className="text-xs uppercase tracking-wide text-slate-400">{col.header}</dt>
                      <dd className="text-slate-700">
                        {col.render
                          ? col.render(row)
                          : ((row as Record<string, unknown>)[col.key] as React.ReactNode)}
                      </dd>
                    </div>
                  ))}
              </dl>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function Pagination({
  page,
  lastPage,
  total,
  onPageChange,
}: {
  page: number;
  lastPage: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  if (lastPage <= 1) {
    return <p className="text-xs text-slate-400">{total} record{total === 1 ? "" : "s"}</p>;
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs text-slate-400">
        Page {page} of {lastPage} · {total} records
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          disabled={page >= lastPage}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
