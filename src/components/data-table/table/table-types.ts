import React from "react";
import { ColumnDef } from "./column-def";

const normalizeFilterString = (value: string) => value.toLowerCase().replace(/\s+/g, "");

type ColumnKey<T extends Record<string, unknown>> = Extract<keyof T, string>;
type CellValue<T extends Record<string, unknown>> = T[ColumnKey<T>];

export type VisibilityState = {
  [x: string]: boolean;
};

export type ColumnFiltersState = ColumnFilter[];

//If value[].length === 1, filter checks if cellId includes filter
//If value[].length > 1, uses direct comparison
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
  getColumnSorting: () => SortingState;
  setColumnSorting: (columnId: string, desc: boolean) => void;
  getColumns: () => ColumnDef<T>[];
  getAllColumns: () => ColumnDef<T>[];
  getRowModels: () => RowModel<T>[];
  getHideableColumns: () => ColumnDef<T>[];
  setColumnVisibility: (columnId: string, update: (prev: boolean) => boolean) => void;
  setColumnFilter: (columnId: string, update: (prev: string[]) => string[]) => void;
  resetColumnFilter: (columnId: string) => void;
  getColumnFilterValue: (columnId: string) => string[];
  setColumnSearchFilter: (columnId: string, value: string) => void;
  getColumnSearchFilterValue: (columnId: string) => string;
  getHead: (column: ColumnDef<T>) => React.ReactNode;
  getCell: (column: ColumnDef<T>, value: CellValue<T>) => React.ReactNode;
};

export const useTable = <T extends Record<string, unknown>>(
  data: T[],
  columnDefs: ColumnDef<T>[],
  initialHiddenColumns: string[] = [],
): Table<T> => {
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

  const [sorting, setSorting] = React.useState<SortingState>({ id: "", desc: false });
  const tableRef = React.useRef<Table<T> | null>(null);

  const visibleColumns = React.useMemo(() => {
    return columnDefs.filter((column) => (column.canHide !== false ? columnVisibility[column.id] : true));
  }, [columnDefs, columnVisibility]);

  const filtersById = React.useMemo(() => {
    return columnFilters.reduce<Record<string, string[]>>((acc, filter) => {
      acc[filter.id] = filter.value;
      return acc;
    }, {});
  }, [columnFilters]);

  const rowModels: RowModel<T>[] = React.useMemo(() => {
    const filteredRows = data.filter((row) => {
      return columnDefs.every((column) => {
        if (!column.cellId) return true;
        const filterValues = filtersById[column.id] ?? [];
        if (filterValues.length === 0) return true;

        const cellId = column.cellId(row[column.id]);

        if (filterValues.length === 1) {
          return normalizeFilterString(cellId).includes(normalizeFilterString(filterValues[0]));
        }

        return filterValues.includes(cellId);
      });
    });

    const activeSortColumn = sorting.id ? columnDefs.find((column) => column.id === sorting.id) : undefined;

    const sortedRows =
      activeSortColumn && activeSortColumn.comparator
        ? [...filteredRows].sort((leftRow, rightRow) => {
            const compareResult = activeSortColumn.comparator!(
              leftRow[activeSortColumn.id],
              rightRow[activeSortColumn.id],
            );
            return sorting.desc ? -compareResult : compareResult;
          })
        : filteredRows;

    return sortedRows.map((row) => ({
      cells: visibleColumns.map((column) => ({
        column,
        value: row[column.id],
      })),
    }));
  }, [data, columnDefs, filtersById, visibleColumns, sorting]);

  const setColumnVisibilityValue = React.useCallback((columnId: string, update: (prev: boolean) => boolean) => {
    setColumnVisibility((prev) => ({ ...prev, [columnId]: update(prev[columnId] ?? true) }));
  }, []);

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

  const getColumnFilterValue = React.useCallback(
    (columnId: string) => {
      const filter = columnFilters.find((f) => f.id === columnId);
      return filter ? filter.value : [];
    },
    [columnFilters],
  );

  const setColumnSearchFilter = React.useCallback((columnId: string, value: string) => {
    setColumnFilters((prev) => {
      return prev.map((filter) => (filter.id === columnId ? { ...filter, value: value ? [value] : [] } : filter));
    });
  }, []);

  const getColumnSearchFilterValue = React.useCallback(
    (columnId: string) => {
      const filter = columnFilters.find((f) => f.id === columnId);
      return filter && filter.value.length > 0 ? filter.value[0] : "";
    },
    [columnFilters],
  );

  const setColumnSorting = React.useCallback((columnId: string, desc: boolean) => {
    setSorting({ id: columnId, desc });
  }, []);

  const getColumnSorting = React.useCallback(() => {
    return sorting;
  }, [sorting]);

  const getCell = React.useCallback((column: ColumnDef<T>, value: CellValue<T>) => {
    return column.cell ? column.cell(value) : (String(value) as React.ReactNode);
  }, []);

  const table: Table<T> = React.useMemo(() => {
    const nextTable: Table<T> = {
      data,
      columnDefs,
      getColumnSorting,
      setColumnSorting,
      getColumns: () => visibleColumns,
      getAllColumns: () => columnDefs,
      getRowModels: () => rowModels,
      getHideableColumns: () => columnDefs.filter((column) => column.canHide !== false),
      setColumnVisibility: setColumnVisibilityValue,
      setColumnFilter,
      resetColumnFilter,
      getColumnFilterValue,
      setColumnSearchFilter,
      getColumnSearchFilterValue,
      getHead: (column) => {
        const tableInstance = tableRef.current ?? nextTable;
        return column.head ? column.head(tableInstance, column.name, column.id) : column.name;
      },
      getCell,
    };

    tableRef.current = nextTable;
    return nextTable;
  }, [
    data,
    columnDefs,
    getColumnSorting,
    setColumnSorting,
    visibleColumns,
    rowModels,
    setColumnVisibilityValue,
    setColumnFilter,
    resetColumnFilter,
    getColumnFilterValue,
    setColumnSearchFilter,
    getColumnSearchFilterValue,
    getCell,
  ]);

  return table;
};
