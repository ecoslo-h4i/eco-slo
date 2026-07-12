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

export type MemberSchema = Database["public"]["Tables"]["members"]["Row"] & { name: string };

/** Row shape for the Surveys dashboard — survey columns plus resolved labels. */
export type SurveySchema = {
  id: number;
  created_at: string;
  issue: Database["public"]["Enums"]["SurveyIssue"] | null;
  /** Human-readable issue label ("N/A" for legacy rows without one). */
  issue_label: string;
  issue_other: string | null;
  image_link: string | null;
  notes: string | null;
  admin_contact: boolean;
  /** Linked tree ecoslo_num, or null for unlinked surveys. */
  tree: number | null;
  /** "#<num> — <name>" when linked; empty string when unlinked. */
  tree_label: string;
  /** Linked task id, or null (tasks detach after the 30-day cleanup). */
  task: number | null;
  /** Task title; empty when there is no task or RLS hides it. */
  task_title: string;
  submitted_by: number | null;
  /** Resolved submitter contact; empty strings when unrecorded or hidden by RLS. */
  submitter: {
    name: string;
    email: string;
    phone: string;
  };
};

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
    cell: (value) => {
      const surveyIds = Array.isArray(value) && value.every((id): id is number => typeof id === "number") ? value : [];

      return (
        <Badge shape="rounded" variant="muted">
          {surveyIds.length > 0 ? (
            <span className="flex justify-between gap-x-2 max-w-48">
              <span className="truncate">{surveyIds.join(", ")}</span>
              {surveyIds.length >= 5 && <span className="font-extrabold">{surveyIds.length}</span>}
            </span>
          ) : (
            "None"
          )}
        </Badge>
      );
    },
    canSearch: false,
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
      const ecoslo_nums =
        Array.isArray(value) && value.every((ecoslo_num): ecoslo_num is number => typeof ecoslo_num === "number")
          ? value
          : [];

      return (
        <Badge shape="rounded" variant="muted">
          {ecoslo_nums.length > 0 ? (
            <span className="flex justify-between gap-x-2 max-w-48">
              <span className="truncate">{ecoslo_nums.map((id) => `#${id}`).join(", ")}</span>
              {ecoslo_nums.length >= 5 && <span className="font-extrabold">{ecoslo_nums.length}</span>}
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

export const surveyColumns: ColumnDef<SurveySchema>[] = [
  {
    id: "id",
    accessorKey: "id",
    name: "Survey #",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} />,
    cell: (value) => <p className="w-20 font-bold">#{Number(value)}</p>,
    comparator: (a, b) => Number(a) - Number(b),
    canSearch: true,
  },
  {
    id: "created_at",
    accessorKey: "created_at",
    name: "Date Submitted",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} />,
    cell: (value) => <p className="whitespace-nowrap">{formatDateTime(value)}</p>,
    comparator: (a, b) => {
      const dateA = new Date(String(a));
      const dateB = new Date(String(b));
      return dateA.getTime() - dateB.getTime();
    },
    canSearch: false,
  },
  {
    id: "issue",
    accessorKey: "issue_label",
    name: "Issue",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} />,
    cell: (value) => <Badge variant={String(value) === "N/A" ? "muted" : "default"}>{String(value)}</Badge>,
    cellId: (value) => String(value).toLowerCase(),
    comparator: (a, b) => String(a).localeCompare(String(b)),
    canSearch: true,
  },
  {
    id: "tree_label",
    accessorKey: "tree_label",
    name: "Linked Tree",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} />,
    cell: (value) =>
      String(value ?? "") ? (
        <p className="max-w-48 truncate">{String(value)}</p>
      ) : (
        <Badge variant="muted">Unlinked</Badge>
      ),
    cellId: (value) => (String(value ?? "") ? "linked" : "unlinked"),
    comparator: (a, b) => String(a).localeCompare(String(b)),
    canSearch: true,
  },
  {
    id: "task_title",
    accessorKey: "task_title",
    name: "Task",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} />,
    cell: (value) =>
      String(value ?? "") ? <p className="max-w-48 truncate">{String(value)}</p> : <p className="text-text-muted">—</p>,
    comparator: (a, b) => String(a).localeCompare(String(b)),
    canSearch: true,
  },
  {
    id: "submitter_name",
    accessorKey: "submitter.name",
    name: "Submitted By",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} />,
    cell: (value) =>
      String(value ?? "") ? (
        <p className="capitalize">{String(value)}</p>
      ) : (
        <p className="text-text-muted">Not recorded</p>
      ),
    comparator: (a, b) => String(a).localeCompare(String(b)),
    canSearch: true,
  },
  {
    id: "admin_contact",
    accessorKey: "admin_contact",
    name: "Contact OK",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} />,
    cell: (value) => <Badge variant={value === true ? "info" : "muted"}>{value === true ? "Yes" : "No"}</Badge>,
    cellId: (value) => (value === true ? "yes" : "no"),
    comparator: (a, b) => Number(a === true) - Number(b === true),
    canSearch: false,
  },
  {
    id: "image_link",
    accessorKey: "image_link",
    name: "Image",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} canSort={false} />,
    cell: (value) =>
      String(value ?? "") ? (
        <a
          href={String(value)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="text-primary underline underline-offset-2 hover:text-primary-hover"
        >
          View Image
        </a>
      ) : (
        <p className="text-text-muted">None</p>
      ),
    canSearch: false,
  },
  {
    id: "notes",
    accessorKey: "notes",
    name: "Notes",
    head: (table, name, columnId) => <HeadControls table={table} columnId={columnId} title={name} canSort={false} />,
    cell: (value) => <p className="max-w-64 truncate">{value == null ? "" : String(value)}</p>,
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

/** Local date + time for timestamptz values (e.g. "Jul 9, 2026, 3:24 PM"). */
export const formatDateTime = (value: unknown): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;

  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
};
