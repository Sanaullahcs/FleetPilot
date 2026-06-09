import type { Column } from "@/components/ui/data-table";

export type SortDirection = "asc" | "desc";

export function compareSortValues(
  a: string | number | null | undefined,
  b: string | number | null | undefined,
  dir: SortDirection,
): number {
  const empty = dir === "asc" ? 1 : -1;
  const aEmpty = a == null || a === "";
  const bEmpty = b == null || b === "";
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return empty;
  if (bEmpty) return -empty;

  if (typeof a === "number" && typeof b === "number") {
    return dir === "asc" ? a - b : b - a;
  }

  const result = String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
  return dir === "asc" ? result : -result;
}

export function sortRows<T>(
  rows: T[],
  columns: Column<T>[],
  sortKey: string,
  sortDir: SortDirection,
): T[] {
  const column = columns.find((c) => c.key === sortKey);
  if (!column?.sortValue) return rows;

  return [...rows].sort((a, b) => compareSortValues(column.sortValue!(a), column.sortValue!(b), sortDir));
}

export function nextSortDir(currentKey: string, columnKey: string, currentDir: SortDirection): SortDirection {
  if (currentKey !== columnKey) return "asc";
  return currentDir === "asc" ? "desc" : "asc";
}
