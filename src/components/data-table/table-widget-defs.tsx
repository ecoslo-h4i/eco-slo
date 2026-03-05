import Head from "next/head";
import { ColumnDef } from "./table/column-def";
import HeadControls from "./head-controls";

export type TreeSchema = {
  id: number;
  created_at: string; // ISO datetime string
  status: string;
  ecoslo_num: number;
  species_name: string;
  common_name: string;
  funder: string;
  date_planted: string; // ISO date string (YYYY-MM-DD)
  address: string;
  latitude: number;
  longitude: number;
  is_public: boolean;
  adopter_name: string;
  adopter_phone: string;
  adopter_email: string;
  weekly_watering_status: string;
  next_mulching_date: string; // ISO date string
  notes: string;
};

export const dashboardTreeColumns: ColumnDef<TreeSchema, keyof TreeSchema>[] = [
  {
    id: "ecoslo_num",
    name: "EcoSLO #",
    cell: (value) => value,
  },
  {
    id: "species_name",
    name: "Species",
    cell: (value) => value,
  },
  {
    id: "date_planted",
    name: "Date Planted",
    cell: (value) => formatISODate(value),
  },
  {
    id: "status",
    name: "Status",
    cell: (value) => {
      return (
        <div className="px-2 py-0.5 rounded-full inline-block text-center bg-secondary capitalize font-medium text-sm text-foreground">
          {value}
        </div>
      );
    },
  },
  {
    id: "adopter_name",
    name: "Treekeeper",
    cell: (value) => value,
  },
  {
    id: "adopter_email",
    name: "Treekeeper Email",
    cell: (value) => value,
  },
  {
    id: "adopter_phone",
    name: "Treekeeper Phone",
    cell: (value) => formatPhoneNumber(value),
  },
];

export const treeColumns: ColumnDef<TreeSchema, keyof TreeSchema>[] = [
  {
    id: "ecoslo_num",
    name: "EcoSLO #",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} />,
    cell: (value) => value,
    cellId: (value) => String(value),
    comparator: (a, b) => Number(a) - Number(b),
  },
  {
    id: "species_name",
    name: "Species",
    cell: (value) => value,
    cellId: (value) => String(value).toLowerCase(),
  },
  {
    id: "date_planted",
    name: "Date Planted",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} />,
    cell: (value) => formatISODate(value),
    comparator: (a, b) => {
      const dateA = new Date(String(a));
      const dateB = new Date(String(b));
      return dateA.getTime() - dateB.getTime();
    },
  },
  {
    id: "status",
    name: "Status",
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
    id: "common_name",
    name: "Common Name",
    cell: (value) => value,
  },
  {
    id: "funder",
    name: "Funder",
    cell: (value) => value,
  },
  {
    id: "address",
    name: "Address",
    cell: (value) => value,
  },
  {
    id: "latitude",
    name: "Latitude",
    cell: (value) => value,
  },
  {
    id: "longitude",
    name: "Longitude",
    cell: (value) => value,
  },
  {
    id: "is_public",
    name: "Is Public",
    cell: (value) => {
      if (typeof value === "boolean") {
        return value ? "True" : "False";
      }
      return String(value);
    },
    cellId: (value) => {
      if (typeof value === "boolean") {
        return value ? "public" : "private";
      }
      return String(value).toLowerCase();
    },
  },
  {
    id: "adopter_name",
    name: "Treekeeper",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} />,
    cell: (value) => value,
    comparator: (a, b) => String(a).localeCompare(String(b)),
  },
  {
    id: "adopter_phone",
    name: "Treekeeper Phone",
    cell: (value) => formatPhoneNumber(value),
  },
  {
    id: "adopter_email",
    name: "Treekeeper Email",
    cell: (value) => value,
  },
  {
    id: "weekly_watering_status",
    name: "Weekly Watering Status",
    cell: (value) => value,
  },
  {
    id: "next_mulching_date",
    name: "Next Mulching Date",
    cell: (value) => formatISODate(value),
  },
  {
    id: "notes",
    name: "Notes",
    cell: (value) => value,
  },
];

export const formatPhoneNumber = (value: unknown): string => {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (!digits) return "";
  if (digits.length < 10) return digits;

  const localNumber = digits.slice(-10);
  const countryCode = digits.slice(0, -10);

  const formattedLocal = `(${localNumber.slice(0, 3)}) ${localNumber.slice(3, 6)}-${localNumber.slice(6, 10)}`;
  return countryCode ? `+${countryCode} ${formattedLocal}` : formattedLocal;
};

export const formatISODate = (value: unknown): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return raw;

  const [, year, month, day] = match;
  const monthWithoutLeadingZero = String(Number(month));
  const dayWithoutLeadingZero = String(Number(day));

  return `${monthWithoutLeadingZero}/${dayWithoutLeadingZero}/${year}`;
};

export type treeWidgetSchema = {
  ecosloNumber: number;
  status: string;
  latitude: number;
  longitude: number;
  treekeeper: string;
  species: string;
};

export const columnsOld: ColumnDef<treeWidgetSchema, keyof treeWidgetSchema>[] = [
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
