import { ColumnDef } from "./table/column-def";
import HeadControls from "./head-controls";
import { Database } from "@/database/database.types";
import Badge from "../badge";
import { CircleAlert, CircleCheck, CircleMinus, Clock, UserRoundCog } from "lucide-react";

export type TreekeeperSchema = {
  tree_keeper: {
    name: string;
    email: string;
    phone: string;
  };
};

export type TreeSchema = Database["public"]["Tables"]["trees"]["Row"] & TreekeeperSchema;

export type TaskSchema = Database["public"]["Tables"]["tasks"]["Row"];

export type DashboardTreeSchema = TreeSchema & {
  last_updated?: string;
};

export type MemberSchema = Database["public"]["Tables"]["members"]["Row"] & { name: string };

function treeStatusBadgeVariant(value: unknown) {
  return String(value).toLowerCase() === "active" ? "success" : "muted";
}

function conditionBadgeVariant(value: unknown) {
  const condition = String(value).toLowerCase();
  if (condition === "good") return "success";
  if (condition === "fair") return "warning";
  return "danger";
}

function conditionBadgeIcon(value: unknown) {
  const condition = String(value).toLowerCase();
  if (condition === "good") return <CircleCheck className="h-4 w-4" />;
  if (condition === "fair") return <CircleMinus className="h-4 w-4" />;
  return <CircleAlert className="h-4 w-4" />;
}

function completionBadgeVariant(value: unknown) {
  return String(value).toLowerCase() === "completed" ? "success" : "muted";
}

function completionBadgeIcon(value: unknown) {
  return String(value).toLowerCase() === "completed" ? (
    <CircleCheck className="h-4 w-4" />
  ) : (
    <Clock className="h-4 w-4" />
  );
}

function roleBadge(value: unknown) {
  const role = String(value);
  const isAdmin = role.toLowerCase() === "admin";

  return (
    <Badge
      variant={isAdmin ? "info" : "success"}
      icon={isAdmin ? <UserRoundCog className="h-4 w-4" /> : undefined}
      textCase="capitalize"
    >
      {role}
    </Badge>
  );
}

export const dashboardTreeColumns: ColumnDef<DashboardTreeSchema>[] = [
  {
    id: "ecoslo_num",
    accessorKey: "ecoslo_num",
    name: "EcoSLO #",
    cell: (value) => Number(value),
  },
  {
    id: "species_name",
    accessorKey: "species_name",
    name: "Species",
    cell: (value) => String(value),
  },
  {
    id: "status",
    accessorKey: "status",
    name: "Status",
    cell: (value) => (
      <Badge variant={treeStatusBadgeVariant(value)} textCase="capitalize">
        {String(value)}
      </Badge>
    ),
  },
  {
    id: "tree_keeper",
    accessorKey: "tree_keeper.name",
    name: "Treekeeper",
    cell: (value) => <p className="capitalize">{String(value)}</p>,
  },
  {
    id: "last_updated",
    accessorKey: "last_updated",
    name: "Last Update",
    cell: (value) => formatISODate(value),
  },
];

export const treeColumns: ColumnDef<TreeSchema>[] = [
  {
    id: "ecoslo_num",
    accessorKey: "ecoslo_num",
    name: "EcoSLO #",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} />,
    cell: (value) => <p className="w-24 font-bold">#{Number(value)}</p>,
    comparator: (a, b) => Number(a) - Number(b),
    canSearch: true,
  },
  {
    id: "status",
    accessorKey: "status",
    name: "Status",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} />,
    cell: (value) => (
      <Badge variant={treeStatusBadgeVariant(value)} textCase="capitalize">
        {String(value)}
      </Badge>
    ),
    cellId: (value) => String(value).toLowerCase(),
    comparator: (a, b) => String(a).localeCompare(String(b)),
    canSearch: true,
  },
  {
    id: "condition",
    accessorKey: "condition",
    name: "Condition",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} />,
    cell: (value) => (
      <Badge variant={conditionBadgeVariant(value)} icon={conditionBadgeIcon(value)} textCase="capitalize">
        {String(value)}
      </Badge>
    ),
    cellId: (value) => String(value).toLowerCase(),
    comparator: (a, b) => String(a).localeCompare(String(b)),
    canSearch: true,
  },
  {
    id: "species_name",
    accessorKey: "species_name",
    name: "Species",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} />,
    cell: (value) => <p className="max-w-48 truncate">{String(value)}</p>,
    comparator: (a, b) => String(a).localeCompare(String(b)),
    canSearch: true,
  },
  {
    id: "common_name",
    accessorKey: "common_name",
    name: "Common Name",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} />,
    cell: (value) => <p className="max-w-48 truncate">{String(value)}</p>,
    comparator: (a, b) => String(a).localeCompare(String(b)),
    canSearch: true,
  },
  {
    id: "funder",
    accessorKey: "funder",
    name: "Funder",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} />,
    cell: (value) => <p className="max-w-48 truncate text-text-muted">{String(value)}</p>,
    comparator: (a, b) => String(a).localeCompare(String(b)),
    canSearch: true,
  },
  {
    id: "date_planted",
    accessorKey: "date_planted",
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
    accessorKey: "address",
    name: "Address",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} />,
    cell: (value) => <p className="max-w-48 truncate">{String(value)}</p>,
    comparator: (a, b) => String(a).localeCompare(String(b)),
    canSearch: true,
  },
  {
    id: "latitude",
    accessorKey: "latitude",
    name: "Latitude",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} canSort={false} />,
    cell: (value) => <p className="max-w-24 truncate text-text-muted">{Number(value)}</p>,
    comparator: (a, b) => Number(a) - Number(b),
    canSearch: true,
  },
  {
    id: "longitude",
    accessorKey: "longitude",
    name: "Longitude",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} canSort={false} />,
    cell: (value) => <p className="max-w-24 truncate text-text-muted">{Number(value)}</p>,
    comparator: (a, b) => Number(a) - Number(b),
    canSearch: true,
  },
  {
    id: "is_public",
    accessorKey: "is_public",
    name: "Is Public",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} />,
    cell: (value) => (
      <Badge variant={value ? "info" : "muted"} textCase="capitalize">
        {value ? "Public" : "Private"}
      </Badge>
    ),
    cellId: (value) => {
      if (typeof value === "boolean") {
        return value ? "public" : "private";
      }
      return String(value).toLowerCase();
    },
    comparator: (a, b) => {
      if (typeof a === "boolean" && typeof b === "boolean") return Number(b) - Number(a);
      return String(a).localeCompare(String(b));
    },
    canSearch: true,
  },
  {
    id: "tree_keeper_name",
    accessorKey: "tree_keeper.name",
    name: "Treekeeper",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} />,
    cell: (value) => <p className="capitalize">{String(value)}</p>,
    comparator: (a, b) => String(a).localeCompare(String(b)),
    canSearch: true,
  },
  {
    id: "tree_keeper_email",
    accessorKey: "tree_keeper.email",
    name: "Treekeeper Email",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} />,
    cell: (value) => <p className="max-w-48 truncate">{String(value)}</p>,
    comparator: (a, b) => String(a).localeCompare(String(b)),
    canSearch: true,
  },
  {
    id: "tree_keeper_phone",
    accessorKey: "tree_keeper.phone",
    name: "Treekeeper Phone",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} />,
    cell: (value) => formatPhoneNumber(value),
    comparator: (a, b) => String(a).localeCompare(String(b)),
    canSearch: true,
  },
  {
    id: "next_watering_date",
    accessorKey: "next_watering_date",
    name: "Next Watering Date",
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
    id: "weekly_watering_status",
    accessorKey: "weekly_watering_status",
    name: "Weekly Watering Status",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} />,
    cell: (value) => (
      <Badge variant={completionBadgeVariant(value)} icon={completionBadgeIcon(value)} textCase="capitalize">
        {String(value)}
      </Badge>
    ),
    comparator: (a, b) => String(a).localeCompare(String(b)),
    canSearch: true,
  },
  {
    id: "next_mulching_date",
    accessorKey: "next_mulching_date",
    name: "Next Mulching Date",
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
    id: "yearly_mulching_status",
    accessorKey: "yearly_mulching_status",
    name: "Yearly Mulching Status",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} />,
    cell: (value) => (
      <Badge variant={completionBadgeVariant(value)} icon={completionBadgeIcon(value)} textCase="capitalize">
        {String(value)}
      </Badge>
    ),
    comparator: (a, b) => String(a).localeCompare(String(b)),
    canSearch: true,
  },
  {
    id: "notes",
    accessorKey: "notes",
    name: "Notes",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} canSort={false} />,
    cell: (value) => <p className="max-w-64 truncate">{String(value)}</p>,
    canSearch: true,
  },
  {
    id: "admin_notes",
    accessorKey: "admin_notes",
    name: "Admin Notes",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} canSort={false} />,
    cell: (value) => <p className="max-w-64 truncate">{String(value)}</p>,
    canSearch: true,
  },
  {
    id: "survey_logs",
    accessorKey: "survey_logs",
    name: "Survey Logs",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} canSort={false} />,
    cell: (value) => <p className="max-w-64 truncate">{String(value)}</p>,
    canSearch: true,
  },
];

export const memberColumns: ColumnDef<MemberSchema>[] = [
  {
    id: "first_name",
    accessorKey: "firstname",
    name: "First Name",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} canHide={false} />,
    cell: (value) => <p className="capitalize">{String(value)}</p>,
    comparator: (a, b) => String(a).localeCompare(String(b)),
    canSearch: false,
    canHide: false,
  },
  {
    id: "last_name",
    accessorKey: "lastname",
    name: "Last Name",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} canHide={false} />,
    cell: (value) => <p className="capitalize">{String(value)}</p>,
    comparator: (a, b) => String(a).localeCompare(String(b)),
    canSearch: false,
    canHide: false,
  },
  {
    id: "email",
    accessorKey: "email",
    name: "Email",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} canHide={false} />,
    cell: (value) => <p className="truncate">{String(value)}</p>,
    comparator: (a, b) => String(a).localeCompare(String(b)),
    canSearch: true,
    canHide: false,
  },
  {
    id: "phone",
    accessorKey: "phone",
    name: "Phone",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} canHide={false} />,
    cell: (value) => formatPhoneNumber(value),
    comparator: (a, b) => String(a).localeCompare(String(b)),
    canSearch: true,
    canHide: false,
  },
  {
    id: "role",
    accessorKey: "role",
    name: "Role",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} canHide={false} />,
    cell: (value) => roleBadge(value),
    comparator: (a, b) => String(a).localeCompare(String(b)),
    cellId: (value) => String(value).toLowerCase(),
    canSearch: true,
    canHide: false,
  },
  {
    id: "joined_date",
    accessorKey: "joined",
    name: "Joined Date",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} canHide={false} />,
    cell: (value) => formatISODate(value),
    comparator: (a, b) => {
      const dateA = new Date(String(a));
      const dateB = new Date(String(b));
      return dateA.getTime() - dateB.getTime();
    },
    canSearch: true,
    canHide: false,
  },
  {
    id: "trees_assigned",
    accessorKey: "trees_assigned",
    name: "Trees Assigned",
    cell: (value) => {
      const treeIds =
        Array.isArray(value) && value.every((treeId): treeId is number => typeof treeId === "number") ? value : [];

      return (
        <Badge shape="rounded" variant="muted">
          {treeIds.length > 0 ? (
            <span className="flex justify-between gap-x-2 max-w-48">
              <span className="truncate">{treeIds.map((id) => `#${id}`).join(", ")}</span>
              {treeIds.length >= 5 && <span className="font-extrabold">{treeIds.length}</span>}
            </span>
          ) : (
            "No Trees"
          )}
        </Badge>
      );
    },
    canSearch: false,
    canHide: false,
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
