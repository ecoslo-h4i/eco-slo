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
  { name: "EcoSLO #", accessorKey: "ecosloNumber", cell: (value) => value },
  {
    name: "Status",
    accessorKey: "status",
    cell: (value) => {
      return (
        <div className="px-2 py-0.5 rounded-full inline-block text-center bg-secondary capitalize font-medium text-sm text-foreground">
          {value}
        </div>
      );
    },
  },
  { name: "Latitude", accessorKey: "latitude", cell: (value) => truncate(value as number, 4) },
  { name: "Longitude", accessorKey: "longitude", cell: (value) => truncate(value as number, 4) },
  { name: "Treekeeper", accessorKey: "treekeeper", cell: (value) => value },
  { name: "Species", accessorKey: "species", cell: (value) => value },
];

const truncate = (value: number, decimals = 4) => {
  const factor = 10 ** decimals;
  const truncated = Math.trunc(value * factor) / factor;
  return truncated.toFixed(decimals);
};
