import React from "react";
import { ColumnDef } from "./column-def";

import Fuse from "fuse.js";

const FUSE_MATCH_THRESHOLD = 0.3;

type ColumnKey<T extends Record<string, unknown>> = Extract<keyof T, string>;
type CellValue<T extends Record<string, unknown>> = T[ColumnKey<T>];

export type VisibilityState = {
  [x: string]: boolean;
};

export type ColumnFiltersState = ColumnFilter[];

export interface ColumnFilter {
  id: string;
  value: string[];
}

export type SortingState = {
  desc: boolean;
  id: string;
};

export type RowModel<T extends Record<string, unknown>> = {
  cells: {
    column: ColumnDef<T>;
    value: CellValue<T>;
  }[];
};

export type Table<T extends Record<string, unknown>> = {
  data: T[];
  columnDefs: ColumnDef<T>[];
  getColumns: () => ColumnDef<T>[];
  getAllColumns: () => ColumnDef<T>[];
  getHideableColumns: () => ColumnDef<T>[];
  getRowModels: () => RowModel<T>[];
  getHead: (column: ColumnDef<T>) => React.ReactNode;
  getCell: (column: ColumnDef<T>, value: CellValue<T>) => React.ReactNode;
  getColumnSorting: () => SortingState;
  setColumnSorting: (columnId: string, desc: boolean) => void;
  setColumnVisibility: (columnId: string, update: (prev: boolean) => boolean) => void;
  getColumnFilterValue: (columnId: string) => string[];
  setColumnFilter: (columnId: string, update: (prev: string[]) => string[]) => void;
  resetColumnFilter: (columnId: string) => void;
  getSearchQuery: () => string;
  setSearchQuery: (value: string) => void;
  setSearchColumns: (columnIds: string[]) => void;
  getUnpaginatedRowCount: () => number;
  getPageCount: () => number;
  getPageSize: () => number;
  setPageSize: (size: number) => void;
  getPageIndex: () => number;
  setPageIndex: (index: number) => void;
  hasNextPage: () => boolean;
  hasPreviousPage: () => boolean;
  nextPage: () => void;
  previousPage: () => void;
};

export const useTable = <T extends Record<string, unknown>>(
  data: T[],
  columnDefs: ColumnDef<T>[],
  initialHiddenColumns: string[] = [],
  initialSearchColumns: string[] = [],
  initialPageSize: number = 10,
): Table<T> => {
  /*
   * Initalize Table State
   */
  const [sorting, setSorting] = React.useState<SortingState>({ id: "", desc: false });

  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(() => {
    return columnDefs.reduce<VisibilityState>((acc, column) => {
      if (column.canHide === false) return acc;
      acc[column.id] = !initialHiddenColumns.includes(column.id);
      return acc;
    }, {});
  });

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(() => {
    return columnDefs.reduce<ColumnFiltersState>((acc, column) => {
      acc.push({ id: column.id, value: [] });
      return acc;
    }, []);
  });

  const [searchQuery, setSearchQueryState] = React.useState<string>("");

  const defaultSearchColumnIds = React.useMemo(() => {
    return columnDefs.filter((column) => column.canSearch === true).map((column) => column.id);
  }, [columnDefs]);

  const [searchColumns, setSearchColumnsState] = React.useState<string[]>(
    initialSearchColumns.length > 0 ? initialSearchColumns : defaultSearchColumnIds,
  );

  const fuse = React.useMemo(
    () =>
      new Fuse(data, {
        includeScore: true,
        threshold: FUSE_MATCH_THRESHOLD,
        ignoreLocation: true,
        keys: searchColumns,
      }),
    [data, searchColumns],
  );

  const [pageIndex, setPageIndex] = React.useState<number>(0);
  const [pageSize, setPageSize] = React.useState<number>(initialPageSize);

  /*
   * Table functionallity
   */

  //region getRowModels
  const filtersById = React.useMemo(() => {
    return columnFilters.reduce<Record<string, string[]>>((acc, filter) => {
      acc[filter.id] = filter.value;
      return acc;
    }, {});
  }, [columnFilters]);

  const visibleColumns = React.useMemo(() => {
    return columnDefs.filter((column) => (column.canHide !== false ? columnVisibility[column.id] : true));
  }, [columnDefs, columnVisibility]);

  const searchMatchRows = React.useMemo(() => {
    if (!searchQuery || searchColumns.length === 0) return data;
    return fuse
      .search(searchQuery.trim())
      .filter(({ score }) => (score ?? 1) <= FUSE_MATCH_THRESHOLD)
      .map(({ item }) => item);
  }, [data, searchQuery, searchColumns, fuse]);

  const filteredRows = React.useMemo(() => {
    return searchMatchRows.filter((row) => {
      return columnDefs.every((column) => {
        if (!column.cellId) return true;

        const filterValues = filtersById[column.id] ?? [];
        if (filterValues.length === 0) return true;

        const cellId = column.cellId(row[column.id]);
        return filterValues.includes(cellId);
      });
    });
  }, [searchMatchRows, columnDefs, filtersById]);

  const sortedRows = React.useMemo(() => {
    const activeSortColumn = sorting.id ? columnDefs.find((column) => column.id === sorting.id) : undefined;
    if (!activeSortColumn || !activeSortColumn.comparator) return filteredRows;

    return [...filteredRows].sort((leftRow, rightRow) => {
      const compareResult = activeSortColumn.comparator!(leftRow[activeSortColumn.id], rightRow[activeSortColumn.id]);
      return sorting.desc ? -compareResult : compareResult;
    });
  }, [filteredRows, sorting, columnDefs]);

  const paginatedRows = React.useMemo(() => {
    const startIndex = pageIndex * pageSize;
    return sortedRows.slice(startIndex, startIndex + pageSize);
  }, [sortedRows, pageIndex, pageSize]);

  const rowModels: RowModel<T>[] = React.useMemo(() => {
    return paginatedRows.map((row) => ({
      cells: visibleColumns.map((column) => ({
        column,
        value: row[column.id],
      })),
    }));
  }, [paginatedRows, visibleColumns]);
  //endregion

  const getCell = React.useCallback((column: ColumnDef<T>, value: CellValue<T>) => {
    return column.cell ? column.cell(value) : (String(value) as React.ReactNode);
  }, []);

  const getColumnSorting = React.useCallback(() => {
    return sorting;
  }, [sorting]);

  const setColumnSorting = React.useCallback((columnId: string, desc: boolean) => {
    setSorting({ id: columnId, desc });
  }, []);

  const setColumnVisibilityValue = React.useCallback((columnId: string, update: (prev: boolean) => boolean) => {
    setColumnVisibility((prev) => ({ ...prev, [columnId]: update(prev[columnId] ?? true) }));
  }, []);

  const getColumnFilterValue = React.useCallback(
    (columnId: string) => {
      const filter = columnFilters.find((f) => f.id === columnId);
      return filter ? filter.value : [];
    },
    [columnFilters],
  );

  const setColumnFilter = React.useCallback((columnId: string, update: (prev: string[]) => string[]) => {
    setColumnFilters((prev) => {
      return prev.map((filter) => (filter.id === columnId ? { ...filter, value: update(filter.value) } : filter));
    });
  }, []);

  const resetColumnFilter = React.useCallback((columnId: string) => {
    setColumnFilters((prev) => {
      return prev.map((filter) => (filter.id === columnId ? { ...filter, value: [] } : filter));
    });
  }, []);

  const getSearchQuery = React.useCallback(() => searchQuery, [searchQuery]);

  const setSearchQuery = React.useCallback((value: string) => {
    setSearchQueryState(value);
  }, []);

  const setSearchColumns = React.useCallback((columnIds: string[]) => {
    setSearchColumnsState(columnIds);
  }, []);

  const getUnpaginatedRowCount = React.useCallback(() => {
    return sortedRows.length;
  }, [sortedRows]);

  const getPageCount = React.useCallback(() => {
    return Math.ceil(sortedRows.length / pageSize);
  }, [sortedRows, pageSize]);

  const getPageSize = React.useCallback(() => {
    return pageSize;
  }, [pageSize]);

  const setPageSizeSafe = React.useCallback((size: number) => {
    if (size > 0) setPageSize(size);
  }, []);

  const getPageIndex = React.useCallback(() => {
    return pageIndex;
  }, [pageIndex]);

  const setPageIndexSafe = React.useCallback(
    (index: number) => {
      if (index >= 0 && index < getPageCount()) setPageIndex(index);
    },
    [getPageCount, setPageIndex],
  );

  const hasNextPage = React.useCallback(() => {
    return pageIndex < getPageCount() - 1;
  }, [pageIndex, getPageCount]);

  const hasPreviousPage = React.useCallback(() => {
    return pageIndex > 0;
  }, [pageIndex]);

  const nextPage = React.useCallback(() => {
    setPageIndex((prev) => (hasNextPage() ? prev + 1 : prev));
  }, [hasNextPage]);

  const previousPage = React.useCallback(() => {
    setPageIndex((prev) => (hasPreviousPage() ? prev - 1 : prev));
  }, [hasPreviousPage]);

  const table: Table<T> = React.useMemo(() => {
    const nextTable = {} as Table<T>;

    Object.assign(nextTable, {
      data,
      columnDefs,
      getColumns: () => visibleColumns,
      getAllColumns: () => columnDefs,
      getHideableColumns: () => columnDefs.filter((column) => column.canHide !== false),
      getRowModels: () => rowModels,
      getHead: (column: ColumnDef<T>) => {
        return column.head ? column.head(nextTable, column.name, column.id) : column.name;
      },
      getCell,
      getColumnSorting,
      setColumnSorting,
      setColumnVisibility: setColumnVisibilityValue,
      getColumnFilterValue,
      setColumnFilter,
      resetColumnFilter,
      getSearchQuery,
      setSearchQuery,
      setSearchColumns,
      getUnpaginatedRowCount,
      getPageCount,
      getPageSize,
      setPageSize: setPageSizeSafe,
      getPageIndex,
      setPageIndex: setPageIndexSafe,
      hasNextPage,
      hasPreviousPage,
      nextPage,
      previousPage,
    } satisfies Table<T>);

    return nextTable;
  }, [
    data,
    columnDefs,
    visibleColumns,
    rowModels,
    getCell,
    getColumnSorting,
    setColumnSorting,
    setColumnVisibilityValue,
    getColumnFilterValue,
    setColumnFilter,
    resetColumnFilter,
    getSearchQuery,
    setSearchQuery,
    setSearchColumns,
    getUnpaginatedRowCount,
    getPageCount,
    getPageSize,
    setPageSizeSafe,
    getPageIndex,
    setPageIndexSafe,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
  ]);

  return table;
};
