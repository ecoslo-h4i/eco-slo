import React from "react";
import { ColumnDef, FieldPath, FieldPathValue } from "./column-def";

import Fuse from "fuse.js";

const FUSE_MATCH_THRESHOLD = 0.3;

const getValueAtPath = <T extends Record<string, unknown>, P extends FieldPath<T>>(
  row: T,
  path: P,
): FieldPathValue<T, P> => {
  const value = path.split(".").reduce<unknown>((currentValue, segment) => {
    if (currentValue == null || typeof currentValue !== "object") return undefined;
    return (currentValue as Record<string, unknown>)[segment];
  }, row);

  return value as FieldPathValue<T, P>;
};

type CellValue<T extends Record<string, unknown>> = FieldPathValue<T, FieldPath<T>>;

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
  row: T;
  cells: {
    column: ColumnDef<T>;
    value: CellValue<T>;
    row: T;
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
  getCell: (column: ColumnDef<T>, value: CellValue<T>, row: T) => React.ReactNode;
  getColumnSorting: () => SortingState;
  setColumnSorting: (columnId: string, desc: boolean) => void;
  getColumnVisibility: (columnId: string) => boolean;
  setColumnVisibility: (columnId: string, update: (prev: boolean) => boolean) => void;
  getColumnFilterValue: (columnId: string) => string[];
  setColumnFilter: (columnId: string, update: (prev: string[]) => string[]) => void;
  resetColumnFilter: (columnId: string) => void;
  getSearchQuery: () => string;
  setSearchQuery: (value: string) => void;
  setSearchColumns: (update: (prev: string[]) => string[]) => void;
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
  firstPage: () => void;
  lastPage: () => void;
};

export const useTable = <T extends Record<string, unknown>>(
  data: T[],
  columnDefs: ColumnDef<T>[],
  initialPageSize: number = 10,
  initialHiddenColumns: string[] = [],
  initialSearchColumns: string[] = [],
  additionalSearchKeys: FieldPath<T>[] = [],
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

  const searchAccessorKeys = React.useMemo(() => {
    return searchColumns
      .map((columnId) => columnDefs.find((column) => column.id === columnId)?.accessorKey)
      .filter((accessorKey): accessorKey is FieldPath<T> => accessorKey !== undefined);
  }, [columnDefs, searchColumns]);

  const fuse = React.useMemo(
    () =>
      new Fuse(data, {
        includeScore: true,
        threshold: FUSE_MATCH_THRESHOLD,
        ignoreLocation: true,
        keys: [...searchAccessorKeys, ...additionalSearchKeys],
      }),
    [data, searchAccessorKeys, additionalSearchKeys],
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
    if (!searchQuery || searchAccessorKeys.length === 0) return data;
    return fuse
      .search(searchQuery.trim())
      .filter(({ score }) => (score ?? 1) <= FUSE_MATCH_THRESHOLD)
      .map(({ item }) => item);
  }, [data, searchQuery, searchAccessorKeys, fuse]);

  const filteredRows = React.useMemo(() => {
    return searchMatchRows.filter((row) => {
      return columnDefs.every((column) => {
        if (!column.cellId) return true;

        const filterValues = filtersById[column.id] ?? [];
        if (filterValues.length === 0) return true;

        const cellId = column.cellId(getValueAtPath(row, column.accessorKey) as CellValue<T>);
        return filterValues.includes(cellId);
      });
    });
  }, [searchMatchRows, columnDefs, filtersById]);

  const sortedRows = React.useMemo(() => {
    const activeSortColumn = sorting.id ? columnDefs.find((column) => column.id === sorting.id) : undefined;
    if (!activeSortColumn || !activeSortColumn.comparator) return filteredRows;

    return [...filteredRows].sort((leftRow, rightRow) => {
      const compareResult = activeSortColumn.comparator!(
        getValueAtPath(leftRow, activeSortColumn.accessorKey) as CellValue<T>,
        getValueAtPath(rightRow, activeSortColumn.accessorKey) as CellValue<T>,
      );
      return sorting.desc ? -compareResult : compareResult;
    });
  }, [filteredRows, sorting, columnDefs]);

  const paginatedRows = React.useMemo(() => {
    const startIndex = pageIndex * pageSize;
    return sortedRows.slice(startIndex, startIndex + pageSize);
  }, [sortedRows, pageIndex, pageSize]);

  React.useEffect(() => {
    const nextPageCount = Math.ceil(sortedRows.length / pageSize);
    const maxPageIndex = Math.max(0, nextPageCount - 1);

    setPageIndex((prev) => Math.min(prev, maxPageIndex));
  }, [sortedRows.length, pageSize]);

  const rowModels: RowModel<T>[] = React.useMemo(() => {
    return paginatedRows.map((row) => ({
      row,
      cells: visibleColumns.map((column) => ({
        column,
        value: getValueAtPath(row, column.accessorKey) as CellValue<T>,
        row,
      })),
    }));
  }, [paginatedRows, visibleColumns]);
  //endregion

  const getCell = React.useCallback((column: ColumnDef<T>, value: CellValue<T>, row: T) => {
    return column.cell ? column.cell(value, row) : (String(value) as React.ReactNode);
  }, []);

  const getColumnSorting = React.useCallback(() => {
    return sorting;
  }, [sorting]);

  const setColumnSorting = React.useCallback((columnId: string, desc: boolean) => {
    setSorting({ id: columnId, desc });
  }, []);

  const getColumnVisibility = React.useCallback(
    (columnId: string) => {
      return columnVisibility[columnId] ?? true;
    },
    [columnVisibility],
  );

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

  const setSearchColumns = React.useCallback((update: (prev: string[]) => string[]) => {
    setSearchColumnsState(update);
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

  const setPageSizeSafe = React.useCallback(
    (size: number) => {
      if (size <= 0) return;

      const nextPageCount = Math.ceil(sortedRows.length / size);
      const maxPageIndex = Math.max(0, nextPageCount - 1);

      setPageSize(size);
      setPageIndex((prev) => Math.min(prev, maxPageIndex));
    },
    [sortedRows.length, setPageSize, setPageIndex],
  );

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

  const firstPage = React.useCallback(() => {
    setPageIndex(0);
  }, [setPageIndex]);

  const lastPage = React.useCallback(() => {
    setPageIndex(getPageCount() - 1);
  }, [getPageCount, setPageIndex]);

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
      getColumnVisibility,
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
      firstPage,
      lastPage,
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
    getColumnVisibility,
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
    firstPage,
    lastPage,
  ]);

  return table;
};
