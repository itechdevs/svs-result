"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { useState } from "react";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

interface UseTableOptions<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  /** Sync pagination to URL. Default: true */
  syncUrl?: boolean;
}

/**
 * Boilerplate hook for TanStack Table v8.
 * Provides sorting, column filtering, pagination, and row selection.
 * Pagination state syncs to URL query params (?page=1&pageSize=20) when syncUrl=true.
 *
 * @example
 * const { table } = useTable({ data: users, columns });
 */
export function useTable<TData>({
  data,
  columns,
  syncUrl = true,
}: UseTableOptions<TData>) {
  const [pageUrl, setPageUrl] = useQueryState(
    "page",
    parseAsInteger.withDefault(1)
  );
  const [pageSizeUrl, setPageSizeUrl] = useQueryState(
    "pageSize",
    parseAsInteger.withDefault(DEFAULT_PAGE_SIZE)
  );
  const [globalFilterUrl, setGlobalFilterUrl] = useQueryState(
    "q",
    parseAsString.withDefault("")
  );

  const [localPage, setLocalPage] = useState(1);
  const [localPageSize, setLocalPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [localGlobalFilter, setLocalGlobalFilter] = useState("");

  const page = syncUrl ? pageUrl : localPage;
  const pageSize = syncUrl ? pageSizeUrl : localPageSize;
  const globalFilter = syncUrl ? globalFilterUrl : localGlobalFilter;

  const setPage = syncUrl ? setPageUrl : setLocalPage;
  const setPageSize = syncUrl
    ? setPageSizeUrl
    : (v: number) => setLocalPageSize(v);
  const setGlobalFilter = syncUrl
    ? setGlobalFilterUrl
    : setLocalGlobalFilter;

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      pagination: { pageIndex: page - 1, pageSize },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: (v: any) => {
      setGlobalFilter(v ?? "");
      setPage(1);
    },
    onPaginationChange: (updater: any) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex: page - 1, pageSize })
          : updater;
      setPage(next.pageIndex + 1);
      setPageSize(next.pageSize);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
  });

  return {
    table,
    globalFilter,
    setGlobalFilter: (v: string) => {
      setGlobalFilter(v);
      setPage(1);
    },
  };
}
