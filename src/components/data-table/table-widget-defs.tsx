import { ColumnDef } from "./table/column-def";
import HeadControls from "./head-controls";
import { Database } from "@/database/database.types";
import Badge from "../badge";
import { CircleAlert, CircleCheck, CircleMinus, Clock } from "lucide-react";

export type TreeSchema = Database["public"]["Tables"]["trees"]["Row"];

export type DashboardTreeSchema = TreeSchema & {
  last_updated: string;
};

export const dashboardTreeColumns: ColumnDef<DashboardTreeSchema, keyof DashboardTreeSchema>[] = [
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
    id: "status",
    name: "Status",
    cell: (value) => (
      <Badge variant={value == "Active" ? "default" : "muted"} className="capitalize">
        {value}
      </Badge>
    ),
  },
  {
    id: "tree_keeper_id",
    name: "Treekeeper",
    cell: (value) => value,
  },
  {
    id: "last_updated",
    name: "Last Update",
    cell: (value) => formatISODate(value),
  },
];

export const treeColumns: ColumnDef<TreeSchema, keyof TreeSchema>[] = [
  {
    id: "ecoslo_num",
    name: "EcoSLO #",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} />,
    cell: (value) => <p className="w-24 font-bold">#{value}</p>,
    cellId: (value) => String(value),
    comparator: (a, b) => Number(a) - Number(b),
    canSearch: true,
  },
  {
    id: "status",
    name: "Status",
    cell: (value) => (
      <Badge variant={String(value).toLowerCase() == "active" ? "default" : "muted"} className="capitalize">
        {value}
      </Badge>
    ),
    cellId: (value) => String(value).toLowerCase(),
    canSearch: true,
  },
  {
    id: "condition",
    name: "Condition",
    cell: (value) => (
      <Badge
        variant={
          String(value).toLowerCase() == "good"
            ? "default"
            : String(value).toLowerCase() == "fair"
              ? "warning"
              : "destructive"
        }
        icon={
          String(value).toLowerCase() == "good" ? (
            <CircleCheck className="w-4 h-4" />
          ) : String(value).toLowerCase() == "fair" ? (
            <CircleMinus className="w-4 h-4" />
          ) : (
            <CircleAlert className="w-4 h-4" />
          )
        }
        className="capitalize"
      >
        {value}
      </Badge>
    ),
    cellId: (value) => String(value).toLowerCase(),
    canSearch: true,
  },
  {
    id: "species_name",
    name: "Species",
    cell: (value) => <p className="max-w-48 truncate">{value}</p>,
    cellId: (value) => String(value).toLowerCase(),
    canSearch: true,
  },
  {
    id: "common_name",
    name: "Common Name",
    cell: (value) => <p className="max-w-48 truncate">{value}</p>,
    canSearch: true,
  },
  {
    id: "funder",
    name: "Funder",
    cell: (value) => <p className="max-w-48 truncate text-text-muted">{value}</p>,
    canSearch: true,
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
    canSearch: true,
  },
  {
    id: "address",
    name: "Address",
    cell: (value) => <p className="max-w-48 truncate">{value}</p>,
    canSearch: true,
  },
  {
    id: "latitude",
    name: "Latitude",
    cell: (value) => <p className="max-w-24 truncate text-text-muted">{value}</p>,
    canSearch: true,
  },
  {
    id: "longitude",
    name: "Longitude",
    cell: (value) => <p className="max-w-24 truncate text-text-muted">{value}</p>,
    canSearch: true,
  },
  {
    id: "is_public",
    name: "Is Public",
    cell: (value) => (
      <Badge variant={value ? "default" : "muted"} className="capitalize">
        {value ? "True" : "False"}
      </Badge>
    ),
    cellId: (value) => {
      if (typeof value === "boolean") {
        return value ? "public" : "private";
      }
      return String(value).toLowerCase();
    },
    canSearch: true,
  },
  {
    id: "tree_keeper_id",
    name: "Treekeeper Id",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} />,
    cell: (value) => value,
    comparator: (a, b) => String(a).localeCompare(String(b)),
    canSearch: true,
  },
  {
    id: "next_watering_date",
    name: "Next Watering Date",
    cell: (value) => formatISODate(value),
    canSearch: true,
  },
  {
    id: "weekly_watering_status",
    name: "Weekly Watering Status",
    cell: (value) => (
      <Badge
        variant={String(value).toLowerCase() == "completed" ? "default" : "muted"}
        icon={
          String(value).toLowerCase() == "completed" ? (
            <CircleCheck className="w-4 h-4" />
          ) : (
            <Clock className="w-4 h-4" />
          )
        }
        className="capitalize"
      >
        {value}
      </Badge>
    ),
    canSearch: true,
  },
  {
    id: "next_mulching_date",
    name: "Next Mulching Date",
    cell: (value) => formatISODate(value),
    canSearch: true,
  },
  {
    id: "yearly_mulching_status",
    name: "Yearly Mulching Status",
    cell: (value) => (
      <Badge
        variant={String(value).toLowerCase() == "completed" ? "default" : "muted"}
        icon={
          String(value).toLowerCase() == "completed" ? (
            <CircleCheck className="w-4 h-4" />
          ) : (
            <Clock className="w-4 h-4" />
          )
        }
        className="capitalize"
      >
        {value}
      </Badge>
    ),
    cellId: (value) => String(value).toLowerCase(),
    canSearch: true,
  },
  {
    id: "notes",
    name: "Notes",
    cell: (value) => <p className="max-w-64 truncate">{value}</p>,
    canSearch: true,
  },
  {
    id: "admin_notes",
    name: "Admin Notes",
    cell: (value) => <p className="max-w-64 truncate">{value}</p>,
    canSearch: true,
  },
  {
    id: "survey_logs",
    name: "Survey Logs",
    cell: (value) => <p className="max-w-64 truncate">{value}</p>,
    canSearch: true,
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

  return `${year}-${month}-${day}`;
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
