"use client";
import { supabase } from "@/supabase-client";
import { useEffect, useState } from "react";

export type TreeSchema = {
  address: string;
  adopter_email: string;
  adopter_name: string;
  adopter_phone: string;
  common_name: string;
  created_at: string;
  date_planted: string;
  ecoslo_num: number;
  funder: string;
  id: number;
  is_public: boolean;
  latitude: number;
  longitude: number;
  next_mulching_date: string | null;
  notes: string | null;
  species_name: string;
  status: string;
  weekly_watering_status: string | null;
};

type treeDetailsPopoutProps = {
  tree?: TreeSchema;
  admin: boolean;
};

type Member = {
  id: number;
  firstname: string;
  lastname: string;
  phone: string | null;
  email: string | null;
};

type SurveyRow = {
  id: number;
  body: Record<string, unknown> | null;
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
            .select("id, body")
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
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/40 p-6">
      <div className="flex w-[620px] max-h-[88vh] max-w-full flex-col items-center overflow-hidden rounded-2xl bg-[#f4ede2] p-[32px] pb-[0px] drop-shadow-xl">
        {/* Header */}
        <div className="flex flex-col items-center">
          <h1 className="text-[32px] font-serif">#{source.ecoslo_num} Tree Details</h1>
          <div className="flex flex-row gap-[10px]">
            <div className="flex w-[150px] flex-row gap-[3px] rounded-2xl bg-[#ffd8d8] p-[2px] pr-[10px] pl-[10px]">
              <img src="/exclamation-mark.svg"></img>
              <p className="text-sm font-semibold text-[#be4747]">Issue Reported</p>
            </div>
            <div className="rounded-2xl bg-[#d7e6bd] p-[2px] pr-[10px] pl-[10px] text-sm font-semibold text-[#7b8c5d]">
              {display(source.status)}
            </div>
            <div className="rounded-2xl bg-[#d7e6bd] p-[2px] pr-[10px] pl-[10px] text-sm font-semibold text-[#7b8c5d]">
              {source.is_public ? "Public" : "Private"}
            </div>
          </div>
        </div>

        {/* Body Container */}
        <div className="no-scrollbar m-[16px] flex h-full max-h-[70vh] w-fit flex-col items-start justify-items-center gap-[20px] overflow-y-auto">
          <div className="h-auto w-[460px] rounded-2xl border border-black bg-white p-[16px]">
            {mapInfo("TREE INFORMATION", basicInformation)}
          </div>
          <div className="h-auto w-[460px] rounded-2xl border border-black bg-white p-[16px]">
            {mapInfo("LOCATION", location)}
          </div>
          <div className="h-auto w-[460px] rounded-2xl border border-black bg-white p-[16px]">
            {mapInfo("TREEKEEPER INFO", treeKeeperInfo)}
          </div>
          <div className="h-auto w-[460px] rounded-2xl border border-black bg-white p-[16px]">
            {mapInfo("MAINTENANCE", maintenance)}
          </div>
          <div className="h-auto w-[460px] rounded-2xl border border-black bg-white p-[20px]">
            {mapInfo("NOTES", [
              { title: "General:", info: display(source.notes) },
              { title: "Admin:", info: display(source.admin_notes) },
            ])}
          </div>
          <div className="h-auto w-[460px] rounded-2xl border border-black bg-white p-[16px]">
            <h1 className="font-semibold">SURVEYS</h1>
            {surveys.length === 0 ? (
              <p>No associated surveys.</p>
            ) : (
              <div className="mt-2 flex flex-col gap-3">
                {surveys.map((survey) => {
                  const body = survey.body ?? {};
                  return (
                    <div key={survey.id} className="rounded-xl bg-white p-3 text-sm">
                      <p className="font-semibold">Survey #{survey.id}</p>
                      <p>Issue: {display(body.issue)}</p>
                      <p>Other: {display(body.issueOther)}</p>
                      <p>Image Link: {display(body.imageLink)}</p>
                      <p>Admin Contact: {display(body.adminContact)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {props.admin ? (
            <div className="flex flex-col items-center gap-[16px]">
              <button className="flex h-[32px] w-[460px] cursor-pointer items-center justify-center gap-[8px] rounded-2xl bg-[#758656] p-[10px]">
                <p className="font-semibold text-[#FFFFFF]">Edit Tree</p>
                <img className="h-[20px] w-[20px]" src="/white_edit.png"></img>
              </button>
              <button className="flex h-[32px] w-[460px] cursor-pointer flex-row items-center justify-center gap-[5px] rounded-2xl bg-[#F5EADD] p-[10px] gap-[8px]">
                <p className="font-semibold text-[#be4747]">Delete Tree</p>
                <img className="h-[20px] w-[20px]" src="/hugeicons_delete-02.svg"></img>
              </button>
            </div>
          ) : (
            <></>
          )}
        </div>
      </div>
    </div>
  );
}

function mapInfo(header: string, body: { title: string | null; info: string | null }[]) {
  return (
    <div>
      <h1 className="font-semibold">{header}</h1>
      <div className="mt-2 grid grid-cols-2 gap-3">
        {body.map((entry, idx) => (
          <div key={`${header}-${idx}`} className="w-full">
            <p className="text-sm font-bold uppercase tracking-wide text-black/45">
              {String(entry.title ?? "").replace(/:\s*$/, "")}
            </p>
            <p className="mt-1 font-bold text-black">{entry.info}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
