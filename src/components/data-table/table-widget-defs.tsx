import { ColumnDef } from "./table/column-def";

export type treeWidgetSchema = {
  ecosloNumber: number;
  status: string;
  latitude: number;
  longitude: number;
  treekeeper: string;
  species: string;
};

export const columns: ColumnDef<treeWidgetSchema, keyof treeWidgetSchema>[] = [
  {
    id: "ecosloNumber",
    name: "EcoSLO #",
    head: (table, name, columnId) => {
      return (
        <button
          className="py-1 px-2 -ml-2 hover:bg-secondary/10 rounded-md"
          onClick={() => table.setColumnVisibility(columnId, (prev) => !prev)}
        >
          {name}
        </button>
      );
    },
    columnWidth: "min-w-30",
    cell: (value) => value,
    comparator: (a, b) => Number(a) - Number(b),
  },
  {
    id: "status",
    name: "Status",
    head: (table, name, columnId) => {
      return (
        <button
          className="py-1 px-2 -ml-2 hover:bg-secondary/10 rounded-md"
          onClick={() => table.setColumnVisibility(columnId, (prev) => !prev)}
        >
          {name}
        </button>
      );
    },
    cell: (value) => {
      return (
        <div className="px-2 py-0.5 rounded-full inline-block text-center bg-secondary capitalize font-medium text-sm text-foreground">
          {value}
        </div>
      );
    },
    cellId: (value) => String(value).toLowerCase(),
  },
  {
    name: "Latitude",
    id: "latitude",
    head: (table, name, columnId) => {
      return (
        <button
          className="py-1 px-2 -ml-2 hover:bg-secondary/10 rounded-md"
          onClick={() => table.setColumnVisibility(columnId, (prev) => !prev)}
        >
          {name}
        </button>
      );
    },
    cell: (value) => truncate(value as number, 4),
  },
  {
    name: "Longitude",
    id: "longitude",
    head: (table, name, columnId) => {
      return (
        <button
          className="py-1 px-2 -ml-2 hover:bg-secondary/10 rounded-md"
          onClick={() => table.setColumnVisibility(columnId, (prev) => !prev)}
        >
          {name}
        </button>
      );
    },
    cell: (value) => truncate(value as number, 4),
  },
  {
    name: "Treekeeper",
    id: "treekeeper",
    head: (table, name, columnId) => {
      return (
        <button
          className="py-1 px-2 -ml-2 hover:bg-secondary/10 rounded-md"
          onClick={() => table.setColumnVisibility(columnId, (prev) => !prev)}
        >
          {name}
        </button>
      );
    },
    cell: (value) => <p className="truncate">{value}</p>,
    cellId: (value) => String(value),
    columnWidth: "min-w-48",
  },
  {
    id: "species",
    name: "Species",
    cell: (value) => <p className="truncate">{value}</p>,
    columnWidth: "min-w-32",
  },
];

const truncate = (value: number, decimals = 4) => {
  const factor = 10 ** decimals;
  const truncated = Math.trunc(value * factor) / factor;
  return truncated.toFixed(decimals);
};
