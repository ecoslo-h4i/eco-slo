import type { Table } from "./table-types";

//Allow only string keys
type StringKeyOf<T> = Extract<keyof T, string>;

//Allow only non-array, non-function, non-date objects, or primitives
type NonArrayObject<T> =
  T extends Record<string, unknown>
    ? T extends readonly unknown[]
      ? never
      : T extends (...args: never[]) => unknown
        ? never
        : T extends Date
          ? never
          : T
    : never;

//create recursive valid string types for nested field paths, e.g. "user.address.street"
export type FieldPath<T extends Record<string, unknown>> = {
  [K in StringKeyOf<T>]: NonArrayObject<NonNullable<T[K]>> extends never
    ? K
    : K | `${K}.${FieldPath<NonArrayObject<NonNullable<T[K]>>>}`;
}[StringKeyOf<T>];

//resolves field type with nested nullability
export type FieldPathValue<
  T extends Record<string, unknown>,
  P extends FieldPath<T>,
> = P extends `${infer K}.${infer R}`
  ? K extends StringKeyOf<T>
    ? NonArrayObject<NonNullable<T[K]>> extends Record<string, unknown>
      ?
          | FieldPathValue<NonArrayObject<NonNullable<T[K]>>, Extract<R, FieldPath<NonArrayObject<NonNullable<T[K]>>>>>
          | Extract<T[K], null | undefined>
      : never
    : never
  : P extends StringKeyOf<T>
    ? T[P]
    : never;

export type ColumnDef<T extends Record<string, unknown>, P extends FieldPath<T> = FieldPath<T>> = {
  id: string;
  accessorKey: P;
  name: string;
  head?: (table: Table<T>, name: string, columnId: string) => React.ReactNode;
  cell?: (value: FieldPathValue<T, P>, row: T) => React.ReactNode;
  cellId?: (value: FieldPathValue<T, P>) => string;
  comparator?: (a: FieldPathValue<T, P>, b: FieldPathValue<T, P>) => number;
  headPosition?: "left" | "center" | "right";
  cellPosition?: "left" | "center" | "right";
  columnWidth?: string;
  canHide?: boolean; //default true
  canSearch?: boolean; //default false
};
