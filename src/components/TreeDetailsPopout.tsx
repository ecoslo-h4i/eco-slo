"use client";
import { TreeSchema } from "@/components/data-table/table-widget-defs";
import { AppButton, appButtonClassName } from "@/components/ui/form-controls";
import Badge from "@/components/badge";
import { Tables } from "@/database/database.types";
import { createUserLevelClient } from "@/lib/supabase/client";
import { Pencil, Trash2, TriangleAlert, X } from "lucide-react";
import { useEffect, useState } from "react";

const supabase = await createUserLevelClient();

type treeDetailsPopoutProps = {
  tree?: TreeSchema;
  admin: boolean;
  onClose?: () => void;
};

type Member = Tables<"members">;

type SurveyRow = {
  id: number;
  body: Record<string, unknown> | null;
  created_at: string;
};

type TreeDetailRow = {
  id: number;
  ecoslo_num: number;
  species_name: string | null;
  common_name: string | null;
  funder: string | null;
  date_planted: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string | null;
  is_public: boolean | null;
  condition: string | null;
  notes: string | null;
  admin_notes: string | null;
  next_watering_date: string | null;
  weekly_watering_status: string | null;
  next_mulching_date: string | null;
  yearly_mulching_status: string | null;
  survey_logs: number[] | null;
  tree_keeper: Member | Member[] | null;
};

function display(value: unknown): string {
  if (value === null || value === undefined || value === "") return "N/A";
  return String(value);
}

function treeStatusBadgeVariant(status: unknown) {
  return String(status).toLowerCase() === "active" ? "success" : "muted";
}

export default function TreeDetailsPopout(props: treeDetailsPopoutProps) {
  const [details, setDetails] = useState<TreeDetailRow | null>(null);
  const [surveys, setSurveys] = useState<SurveyRow[]>([]);
  const tree = props.tree;
  const treeId = tree?.id ?? null;

  useEffect(() => {
    if (treeId == null) {
      return;
    }

    let cancelled = false;

    async function loadTreeDetails() {
      const { data } = await supabase
        .from("trees")
        .select(
          `
          id,
          ecoslo_num,
          species_name,
          common_name,
          funder,
          date_planted,
          address,
          latitude,
          longitude,
          status,
          is_public,
          condition,
          notes,
          admin_notes,
          next_watering_date,
          weekly_watering_status,
          next_mulching_date,
          yearly_mulching_status,
          survey_logs,
          tree_keeper:tree_keeper_id (
            id,
            firstname,
            lastname,
            phone,
            email
          )
        `,
        )
        .eq("id", treeId)
        .single();

      if (cancelled) return;
      if (data) {
        const row = data as TreeDetailRow;
        setDetails(row);

        const surveyIds = Array.isArray(row.survey_logs) ? row.survey_logs : [];
        if (surveyIds.length > 0) {
          const { data: surveyRows } = await supabase
            .from("surveys")
            .select("id, body, created_at")
            .in("id", surveyIds)
            .order("id", { ascending: true });

          if (!cancelled) setSurveys((surveyRows ?? []) as SurveyRow[]);
        } else {
          setSurveys([]);
        }
      }
    }

    void loadTreeDetails();
    return () => {
      cancelled = true;
    };
  }, [treeId]);

  if (!tree) {
    return <div></div>;
  }

  const source =
    details ??
    ({
      id: tree.id,
      ecoslo_num: tree.ecoslo_num,
      species_name: tree.species_name,
      common_name: tree.common_name,
      funder: tree.funder,
      date_planted: tree.date_planted,
      address: tree.address,
      latitude: tree.latitude,
      longitude: tree.longitude,
      status: tree.status,
      is_public: tree.is_public,
      condition: null,
      notes: tree.notes,
      admin_notes: null,
      next_watering_date: null,
      weekly_watering_status: tree.weekly_watering_status,
      next_mulching_date: tree.next_mulching_date,
      yearly_mulching_status: null,
      survey_logs: null,
      tree_keeper: null,
    } satisfies TreeDetailRow);

  const treeKeeper = Array.isArray(source.tree_keeper) ? source.tree_keeper[0] : source.tree_keeper;

  const basicInformation = [
    { title: "Species:", info: display(source.species_name) },
    { title: "Common Name:", info: display(source.common_name) },
    { title: "Funder:", info: display(source.funder) },
    { title: "Date Planted:", info: display(source.date_planted) },
    { title: "Condition:", info: display(source.condition) },
  ];
  const location = [
    { title: "Address:", info: display(source.address) },
    { title: "Coordinates:", info: `${display(source.latitude)}, ${display(source.longitude)}` },
  ];
  const treeKeeperInfo = [
    { title: "Name:", info: `${display(treeKeeper?.firstname)} ${display(treeKeeper?.lastname)}` },
    { title: "Phone:", info: display(treeKeeper?.phone) },
    { title: "Email:", info: display(treeKeeper?.email) },
  ];
  const maintenance = [
    { title: "Next Watering Date:", info: display(source.next_watering_date) },
    { title: "Weekly Watering Status:", info: display(source.weekly_watering_status) },
    { title: "Next Mulching Date:", info: display(source.next_mulching_date) },
    { title: "Yearly Mulching Status:", info: display(source.yearly_mulching_status) },
  ];
  return (
    <div
      className="fixed inset-0 z-[3000] flex items-center justify-center bg-text/40 p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative flex w-[620px] max-h-[88vh] max-w-full flex-col items-center overflow-hidden rounded-2xl bg-panel-bg p-8 pb-0 drop-shadow-xl">
        {props.onClose ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              props.onClose?.();
            }}
            className={appButtonClassName({
              className: "absolute right-3 top-3 bg-card/90",
              iconOnly: true,
              variant: "secondary",
            })}
            aria-label="Close tree details"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        ) : null}
        {/* Header */}
        <div className="flex flex-col items-center">
          <h1 className="text-[32px] font-serif">#{source.ecoslo_num} Tree Details</h1>
          <div className="flex flex-row gap-[10px]">
            <Badge variant="danger" icon={<TriangleAlert aria-hidden="true" className="h-4 w-4" strokeWidth={2} />}>
              Issue Reported
            </Badge>
            <Badge variant={treeStatusBadgeVariant(source.status)} textCase="capitalize">
              {display(source.status)}
            </Badge>
            <Badge variant={source.is_public ? "info" : "muted"}>{source.is_public ? "Public" : "Private"}</Badge>
          </div>
        </div>

        {/* Body Container */}
        <div className="no-scrollbar m-[16px] flex h-full max-h-[70vh] w-fit flex-col items-start justify-items-center gap-[20px] overflow-y-auto">
          <div className="h-auto w-[460px] rounded-2xl border border-border bg-card p-4">
            {mapInfo("TREE INFORMATION", basicInformation)}
          </div>
          <div className="h-auto w-[460px] rounded-2xl border border-border bg-card p-4">
            {mapInfo("LOCATION", location)}
          </div>
          <div className="h-auto w-[460px] rounded-2xl border border-border bg-card p-4">
            {mapInfo("TREEKEEPER INFO", treeKeeperInfo)}
          </div>
          <div className="h-auto w-[460px] rounded-2xl border border-border bg-card p-4">
            {mapInfo("MAINTENANCE", maintenance)}
          </div>
          <div className="h-auto w-[460px] rounded-2xl border border-border bg-card p-5">
            {mapInfo(
              "NOTES",
              [
                { title: "General:", info: display(source.notes) },
                { title: "Admin:", info: display(source.admin_notes) },
              ],
              true,
            )}
          </div>
          <div className="h-auto w-[460px] rounded-2xl border border-border bg-card p-4">
            <h1 className="font-semibold">SURVEYS</h1>
            {surveys.length === 0 ? (
              <p>No associated surveys.</p>
            ) : (
              <div className="mt-2 flex flex-col gap-3">
                {surveys.map((survey) => {
                  const body = survey.body ?? {};
                  return (
                    <div key={survey.id} className="rounded-xl bg-card p-3 text-sm">
                      <p className="font-semibold">{new Date(survey.created_at).toLocaleDateString()}</p>
                      <p>Issue: {display(body.issue)}</p>
                      <p>Other: {display(body.issueOther)}</p>
                      <p>Image Link: {display(body.imageLink)}</p>
                      <p>Admin Contact: {display(body.adminContact)}</p>
                      <div className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap break-words">
                        <p className="font-semibold text-text/80">Survey notes</p>
                        <p>{display(body.notes)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {props.admin ? (
            <div className="flex flex-col items-center gap-[16px]">
              <AppButton className="w-[460px]" icon={Pencil} radius="small" size="sm">
                Edit Tree
              </AppButton>
              <AppButton className="w-[460px]" icon={Trash2} radius="small" size="sm" variant="danger">
                Delete Tree
              </AppButton>
            </div>
          ) : (
            <></>
          )}
        </div>
      </div>
    </div>
  );
}

function mapInfo(header: string, body: { title: string | null; info: string | null }[], stacked = false) {
  return (
    <div>
      <h1 className="font-semibold">{header}</h1>
      <div className={`mt-2 grid gap-3 ${stacked ? "grid-cols-1" : "grid-cols-2"}`}>
        {body.map((entry, idx) => (
          <div key={`${header}-${idx}`} className="w-full">
            <p className="text-sm font-bold uppercase tracking-wide text-text/45">
              {String(entry.title ?? "").replace(/:\s*$/, "")}
            </p>
            <p className="mt-1 font-bold text-text">{entry.info}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
