"use client";

import { useState } from "react";
import type { SortDirection } from "@/lib/table-sort";

export function useTableSort(fieldKey: string, defaultDir: SortDirection = "asc") {
  const [sortKey, setSortKey] = useState(fieldKey);
  const [sortDir, setSortDir] = useState<SortDirection>(defaultDir);

  const onSortChange = (key: string, dir: SortDirection) => {
    setSortKey(key);
    setSortDir(dir);
  };

  return {
    sortKey,
    sortDir,
    onSortChange,
    sortParams: { sort_by: sortKey, sort_dir: sortDir },
  };
}
