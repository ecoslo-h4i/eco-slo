export type ColumnDef<T extends Record<string, unknown>, K extends keyof T = keyof T> = {
  name: string;
  accessorKey: K;
  cell: (value: T[K]) => React.ReactNode;
  headPosition?: "left" | "center" | "right";
  cellPosition?: "left" | "center" | "right";
};
