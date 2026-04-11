import { Table } from "./table-types";

export type ColumnDef<
  T extends Record<string, unknown>,
  K extends Extract<keyof T, string> = Extract<keyof T, string>,
> = {
  id: K;
  name: string;
  head?: (table: Table<T>, name: string, columnId: K) => React.ReactNode;
  cell?: (value: T[K]) => React.ReactNode;
  cellId?: (value: T[K]) => string;
  comparator?: (a: T[K], b: T[K]) => number;
  headPosition?: "left" | "center" | "right";
  cellPosition?: "left" | "center" | "right";
  columnWidth?: string;
  canHide?: boolean; //default true
  canSearch?: boolean; //default false
};
