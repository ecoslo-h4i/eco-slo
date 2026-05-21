"use client";

import { TreeSchema } from "@/components/data-table/table-widget-defs";
import { Modal, ModalClose, ModalContent, ModalDescription, ModalFooter, ModalHeader } from "@/components/modal";
import {
  AppButton,
  appButtonClassName,
  SelectField,
  type SelectOption,
  textFieldClassName,
  textareaFieldClassName,
} from "@/components/ui/form-controls";
import { Database } from "@/database/database.types";
import { createUserLevelClient } from "@/lib/supabase/client";
import { Pencil, Trash2, Undo2, X } from "lucide-react";
import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import Badge from "@/components/badge";

type Condition = Database["public"]["Enums"]["Condition"];
type TreeStatus = Database["public"]["Enums"]["TreeStatus"];
type WateringStatus = Database["public"]["Enums"]["WateringStatus"];
type MulchingStatus = Database["public"]["Enums"]["MulchingStatus"];

type TreeFormState = {
  ecoslo_num: string;
  species_name: string;
  common_name: string;
  funder: string;
  date_planted: string;
  condition: Condition;
  address: string;
  latitude: string;
  longitude: string;
  status: TreeStatus;
  is_public: string;
  next_watering_date: string;
  weekly_watering_status: WateringStatus;
  next_mulching_date: string;
  yearly_mulching_status: MulchingStatus;
  notes: string;
  admin_notes: string;
};

type SurveyRow = {
  id: number;
  body: Record<string, unknown> | null;
  created_at: string;
};

const conditionOptions: SelectOption[] = [
  { label: "Good", value: "good" },
  { label: "Fair", value: "fair" },
  { label: "Poor", value: "poor" },
];

const statusOptions: SelectOption[] = [
  { label: "Active", value: "Active" },
  { label: "Graduated", value: "Graduated" },
];

const visibilityOptions: SelectOption[] = [
  { label: "Public", value: "true" },
  { label: "Private", value: "false" },
];

const wateringStatusOptions: SelectOption[] = [
  { label: "Completed", value: "Completed" },
  { label: "Pending", value: "Pending" },
];

const mulchingStatusOptions: SelectOption[] = [
  { label: "Completed", value: "Completed" },
  { label: "Pending", value: "Pending" },
];

function getCurrentDateInputValue() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function createBlankTreeForm(): TreeFormState {
  return {
    ecoslo_num: "",
    species_name: "",
    common_name: "",
    funder: "",
    date_planted: getCurrentDateInputValue(),
    condition: "good",
    address: "",
    latitude: "",
    longitude: "",
    status: "Active",
    is_public: "false",
    next_watering_date: "",
    weekly_watering_status: "Pending",
    next_mulching_date: "",
    yearly_mulching_status: "Pending",
    notes: "",
    admin_notes: "",
  };
}

function treeToForm(tree: TreeSchema): TreeFormState {
  return {
    ecoslo_num: tree.ecoslo_num != null ? String(tree.ecoslo_num) : "",
    species_name: tree.species_name ?? "",
    common_name: tree.common_name ?? "",
    funder: tree.funder ?? "",
    date_planted: tree.date_planted ?? "",
    condition: tree.condition ?? "good",
    address: tree.address ?? "",
    latitude: tree.latitude != null ? String(tree.latitude) : "",
    longitude: tree.longitude != null ? String(tree.longitude) : "",
    status: tree.status ?? "Active",
    is_public: String(tree.is_public ?? false),
    next_watering_date: tree.next_watering_date ?? "",
    weekly_watering_status: tree.weekly_watering_status ?? "Pending",
    next_mulching_date: tree.next_mulching_date ?? "",
    yearly_mulching_status: tree.yearly_mulching_status ?? "Pending",
    notes: tree.notes ?? "",
    admin_notes: tree.admin_notes ?? "",
  };
}

function normalizeTreeForm(form: TreeFormState): TreeFormState {
  return {
    ...form,
    ecoslo_num: form.ecoslo_num.trim(),
    species_name: form.species_name.trim(),
    common_name: form.common_name.trim(),
    funder: form.funder.trim(),
    date_planted: form.date_planted.trim(),
    address: form.address.trim(),
    latitude: form.latitude.trim(),
    longitude: form.longitude.trim(),
    notes: form.notes.trim(),
    admin_notes: form.admin_notes.trim(),
  };
}

function treeFormsMatch(a: TreeFormState, b: TreeFormState): boolean {
  const na = normalizeTreeForm(a);
  const nb = normalizeTreeForm(b);
  return (
    na.ecoslo_num === nb.ecoslo_num &&
    na.species_name === nb.species_name &&
    na.common_name === nb.common_name &&
    na.funder === nb.funder &&
    na.date_planted === nb.date_planted &&
    na.condition === nb.condition &&
    na.address === nb.address &&
    na.latitude === nb.latitude &&
    na.longitude === nb.longitude &&
    na.status === nb.status &&
    na.is_public === nb.is_public &&
    na.next_watering_date === nb.next_watering_date &&
    na.weekly_watering_status === nb.weekly_watering_status &&
    na.next_mulching_date === nb.next_mulching_date &&
    na.yearly_mulching_status === nb.yearly_mulching_status &&
    na.notes === nb.notes &&
    na.admin_notes === nb.admin_notes
  );
}

function display(value: unknown): string {
  if (value === null || value === undefined || value === "") return "N/A";
  return String(value);
}

function conditionBadgeVariant(condition: string) {
  switch (condition.toLowerCase()) {
    case "good":
      return "success" as const;
    case "fair":
      return "warning" as const;
    case "poor":
      return "danger" as const;
    default:
      return "muted" as const;
  }
}

type TreeDetailModalProps = {
  tree: TreeSchema | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export default function TreeDetailModal({ tree, open, onOpenChange, onSaved }: TreeDetailModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      {open && (
        <TreeDetailModalContent key={tree?.id ?? "new"} tree={tree} onOpenChange={onOpenChange} onSaved={onSaved} />
      )}
    </Modal>
  );
}

function TreeDetailModalContent({ tree, onOpenChange, onSaved }: Omit<TreeDetailModalProps, "open">) {
  const [treeForm, setTreeForm] = useState<TreeFormState>(() => (tree ? treeToForm(tree) : createBlankTreeForm()));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(!tree);
  const [formError, setFormError] = useState<string | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [duplicateEcosloNum, setDuplicateEcosloNum] = useState<number | null>(null);

  const [surveys, setSurveys] = useState<SurveyRow[]>([]);

  const initialTreeForm = tree ? treeToForm(tree) : createBlankTreeForm();
  const hasFormChanges = !treeFormsMatch(treeForm, initialTreeForm);

  const isAddingTree = tree === null;
  const displayedTitle = tree ? `ECOSLO #${tree.ecoslo_num}` : "Add Tree";

  const treeKeeper = tree?.tree_keeper ?? null;
  const hasKeeper = treeKeeper != null && treeKeeper.name.trim().length > 0;

  useEffect(() => {
    const surveyIds = tree?.survey_logs;
    if (!surveyIds?.length) return;

    let cancelled = false;

    async function loadSurveys() {
      const supabase = createUserLevelClient();
      const { data } = await supabase
        .from("surveys")
        .select("id, body, created_at")
        .in("id", surveyIds!)
        .order("id", { ascending: true });

      if (!cancelled) setSurveys((data ?? []) as SurveyRow[]);
    }

    void loadSurveys();
    return () => {
      cancelled = true;
    };
  }, [tree?.id, tree?.survey_logs]);

  const handleFormChange = (field: keyof TreeFormState) => {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setTreeForm((current) => ({ ...current, [field]: event.target.value }));
    };
  };

  const handleSelectChange = (field: keyof TreeFormState) => {
    return (value: string) => {
      setTreeForm((current) => ({ ...current, [field]: value }));
    };
  };

  const handleDelete = async () => {
    if (!tree) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/admin/trees/${tree.id}`, { method: "DELETE" });
      const body = (await response.json().catch(() => null)) as { message?: unknown; error?: unknown } | null;

      if (!response.ok) {
        throw new Error(
          typeof body?.message === "string"
            ? body.message
            : typeof body?.error === "string"
              ? (body.error as string)
              : "Failed to delete tree",
        );
      }

      setDeleteConfirmationOpen(false);
      onSaved();
      onOpenChange(false);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete tree");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasFormChanges) return;

    const normalized = normalizeTreeForm(treeForm);
    const ecosloNum = normalized.ecoslo_num ? parseInt(normalized.ecoslo_num, 10) : null;

    setIsSubmitting(true);
    setFormError(null);

    if (ecosloNum != null) {
      const supabase = createUserLevelClient();
      const { data: existing } = await supabase.from("trees").select("id").eq("ecoslo_num", ecosloNum).maybeSingle();

      if (existing && existing.id !== tree?.id) {
        setDuplicateEcosloNum(ecosloNum);
        setIsSubmitting(false);
        return;
      }
    }

    const payload = {
      ecoslo_num: ecosloNum,
      species_name: normalized.species_name,
      common_name: normalized.common_name,
      funder: normalized.funder,
      date_planted: normalized.date_planted,
      condition: normalized.condition,
      address: normalized.address,
      latitude: normalized.latitude ? parseFloat(normalized.latitude) : 0,
      longitude: normalized.longitude ? parseFloat(normalized.longitude) : 0,
      status: normalized.status,
      is_public: normalized.is_public === "true",
      next_watering_date: normalized.next_watering_date || null,
      weekly_watering_status: normalized.weekly_watering_status,
      next_mulching_date: normalized.next_mulching_date || null,
      yearly_mulching_status: normalized.yearly_mulching_status,
      notes: normalized.notes || null,
      admin_notes: normalized.admin_notes,
    };

    try {
      const response = await fetch(isAddingTree ? "/api/admin/trees" : `/api/admin/trees/${tree.id}`, {
        method: isAddingTree ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => null)) as { message?: unknown; error?: unknown } | null;

      if (!response.ok) {
        throw new Error(
          typeof body?.message === "string"
            ? body.message
            : typeof body?.error === "string"
              ? (body.error as string)
              : "Failed to save tree",
        );
      }

      onSaved();
      onOpenChange(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to save tree");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ModalContent
        className="bg-off-white"
        closeOnOverlayClick={false}
        showCloseButton={false}
        widthClassName="w-full max-w-xl"
      >
        <form onSubmit={handleSubmit}>
          <ModalHeader className="flex flex-col gap-y-4">
            <div className="flex items-center justify-between gap-x-4">
              <div className="flex gap-x-4 items-center">
                <h2 className="text-[1.75rem] text-text-dark font-serif font-extrabold">{displayedTitle}</h2>
              </div>
              <div className="flex gap-x-2">
                <button
                  type="button"
                  className={appButtonClassName({ iconOnly: true, variant: "ghost" })}
                  disabled={isAddingTree}
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsEditing((current) => !current);
                  }}
                >
                  {isEditing ? (
                    <Undo2 className="w-5 h-5 text-text-muted" />
                  ) : (
                    <Pencil className="w-5 h-5 text-text-muted" />
                  )}
                </button>
                <button
                  type="button"
                  className={appButtonClassName({ iconOnly: true, variant: "ghost" })}
                  disabled={isAddingTree}
                  onClick={(event) => {
                    event.stopPropagation();
                    setDeleteError(null);
                    setDeleteConfirmationOpen(true);
                  }}
                >
                  <Trash2 className="w-5 h-5 text-destructive" />
                </button>
                <ModalClose asChild>
                  <button
                    type="button"
                    className={appButtonClassName({ iconOnly: true, variant: "ghost" })}
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenChange(false);
                    }}
                  >
                    <X className="w-5 h-5 text-text-muted" />
                  </button>
                </ModalClose>
              </div>
            </div>
            <div className="bg-border h-px w-full" />
          </ModalHeader>

          <ModalDescription className="flex flex-col gap-y-4 py-4 overflow-y-auto max-h-[70vh]">
            {/* Tree Information */}
            <div className="bg-foreground p-4 border border-border rounded-xl">
              <p className="text-lg font-serif font-bold text-text-dark pb-2">Tree Information</p>
              <div className="flex flex-col gap-y-4">
                <div className="flex gap-x-4">
                  <div className="flex-1 flex flex-col items-start gap-y-1">
                    <p className="text-text-muted font-semibold">
                      <span>ECOSLO #</span>
                      {isEditing && <span className="text-destructive font-semibold"> *</span>}
                    </p>
                    {isEditing ? (
                      <input
                        type="number"
                        className={cn(textFieldClassName, "bg-button-muted")}
                        onChange={handleFormChange("ecoslo_num")}
                        placeholder="EcoSLO number..."
                        required
                        min={1}
                        value={treeForm.ecoslo_num}
                      />
                    ) : (
                      <p className="text-text-dark font-medium">{display(treeForm.ecoslo_num)}</p>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col items-start gap-y-1">
                    <p className="text-text-muted font-semibold">Visibility</p>
                    {isEditing ? (
                      <SelectField
                        className="bg-button-muted"
                        onChange={handleSelectChange("is_public")}
                        options={visibilityOptions}
                        value={treeForm.is_public}
                      />
                    ) : (
                      <Badge variant={treeForm.is_public === "true" ? "info" : "muted"}>
                        {treeForm.is_public === "true" ? "Public" : "Private"}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-x-4">
                  <div className="flex-1 flex flex-col items-start gap-y-1">
                    <p className="text-text-muted font-semibold">
                      <span>Species</span>
                      {isEditing && <span className="text-destructive font-semibold"> *</span>}
                    </p>
                    {isEditing ? (
                      <input
                        className={cn(textFieldClassName, "bg-button-muted")}
                        onChange={handleFormChange("species_name")}
                        placeholder="Species name..."
                        required
                        value={treeForm.species_name}
                      />
                    ) : (
                      <p className="text-text-dark font-medium">{display(treeForm.species_name)}</p>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col items-start gap-y-1">
                    <p className="text-text-muted font-semibold">
                      <span>Common Name</span>
                      {isEditing && <span className="text-destructive font-semibold"> *</span>}
                    </p>
                    {isEditing ? (
                      <input
                        className={cn(textFieldClassName, "bg-button-muted")}
                        onChange={handleFormChange("common_name")}
                        placeholder="Common name..."
                        required
                        value={treeForm.common_name}
                      />
                    ) : (
                      <p className="text-text-dark font-medium">{display(treeForm.common_name)}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-x-4">
                  <div className="flex-1 flex flex-col items-start gap-y-1">
                    <p className="text-text-muted font-semibold">
                      <span>Funder</span>
                      {isEditing && <span className="text-destructive font-semibold"> *</span>}
                    </p>
                    {isEditing ? (
                      <input
                        className={cn(textFieldClassName, "bg-button-muted")}
                        onChange={handleFormChange("funder")}
                        placeholder="Funder..."
                        required
                        value={treeForm.funder}
                      />
                    ) : (
                      <p className="text-text-dark font-medium">{display(treeForm.funder)}</p>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col items-start gap-y-1">
                    <p className="text-text-muted font-semibold">
                      <span>Date Planted</span>
                      {isEditing && <span className="text-destructive font-semibold"> *</span>}
                    </p>
                    {isEditing ? (
                      <input
                        type="date"
                        className={cn(textFieldClassName, "bg-button-muted")}
                        onChange={handleFormChange("date_planted")}
                        required
                        value={treeForm.date_planted}
                      />
                    ) : (
                      <p className="text-text-dark font-medium">{display(treeForm.date_planted)}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-x-4">
                  <div className="flex-1 flex flex-col items-start gap-y-1">
                    <p className="text-text-muted font-semibold">Condition</p>
                    {isEditing ? (
                      <SelectField
                        className="bg-button-muted"
                        onChange={handleSelectChange("condition")}
                        options={conditionOptions}
                        value={treeForm.condition}
                      />
                    ) : (
                      <Badge variant={conditionBadgeVariant(treeForm.condition)} textCase="capitalize">
                        {treeForm.condition}
                      </Badge>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col items-start gap-y-1">
                    <p className="text-text-muted font-semibold">Status</p>
                    {isEditing ? (
                      <SelectField
                        className="bg-button-muted"
                        onChange={handleSelectChange("status")}
                        options={statusOptions}
                        value={treeForm.status}
                      />
                    ) : (
                      <Badge variant={treeForm.status === "Active" ? "success" : "muted"} textCase="capitalize">
                        {treeForm.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-foreground p-4 border border-border rounded-xl">
              <p className="text-lg font-serif font-bold text-text-dark pb-2">Location</p>
              <div className="flex flex-col gap-y-4">
                <div className="flex flex-col items-start gap-y-1">
                  <p className="text-text-muted font-semibold">
                    <span>Address</span>
                    {isEditing && <span className="text-destructive font-semibold"> *</span>}
                  </p>
                  {isEditing ? (
                    <input
                      className={cn(textFieldClassName, "bg-button-muted")}
                      onChange={handleFormChange("address")}
                      placeholder="Street address..."
                      required
                      value={treeForm.address}
                    />
                  ) : (
                    <p className="text-text-dark font-medium">{display(treeForm.address)}</p>
                  )}
                </div>
                <div className="flex gap-x-4">
                  <div className="flex-1 flex flex-col items-start gap-y-1">
                    <p className="text-text-muted font-semibold">
                      <span>Latitude</span>
                      {isEditing && <span className="text-destructive font-semibold"> *</span>}
                    </p>
                    {isEditing ? (
                      <input
                        type="number"
                        step="any"
                        className={cn(textFieldClassName, "bg-button-muted")}
                        onChange={handleFormChange("latitude")}
                        placeholder="35.2828..."
                        required
                        value={treeForm.latitude}
                      />
                    ) : (
                      <p className="text-text-dark font-medium">{display(treeForm.latitude)}</p>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col items-start gap-y-1">
                    <p className="text-text-muted font-semibold">
                      <span>Longitude</span>
                      {isEditing && <span className="text-destructive font-semibold"> *</span>}
                    </p>
                    {isEditing ? (
                      <input
                        type="number"
                        step="any"
                        className={cn(textFieldClassName, "bg-button-muted")}
                        onChange={handleFormChange("longitude")}
                        placeholder="-120.6596..."
                        required
                        value={treeForm.longitude}
                      />
                    ) : (
                      <p className="text-text-dark font-medium">{display(treeForm.longitude)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Treekeeper Info (read-only) */}
            {!isAddingTree && (
              <div className="bg-foreground p-4 border border-border rounded-xl">
                <p className="text-lg font-serif font-bold text-text-dark pb-2">Treekeeper Info</p>
                {hasKeeper ? (
                  <div className="flex flex-col gap-y-4">
                    <div className="flex flex-col items-start gap-y-1">
                      <p className="text-text-muted font-semibold">Name</p>
                      <p className="text-text-dark font-medium">{treeKeeper!.name}</p>
                    </div>
                    <div className="flex gap-x-4">
                      <div className="flex-1 flex flex-col items-start gap-y-1">
                        <p className="text-text-muted font-semibold">Phone</p>
                        <p className="text-text-dark font-medium">
                          {treeKeeper!.phone ? (
                            treeKeeper!.phone
                          ) : (
                            <span className="text-text-muted">None provided</span>
                          )}
                        </p>
                      </div>
                      <div className="flex-1 flex flex-col items-start gap-y-1">
                        <p className="text-text-muted font-semibold">Email</p>
                        <p className="text-text-dark font-medium">
                          {treeKeeper!.email ? (
                            treeKeeper!.email
                          ) : (
                            <span className="text-text-muted">None provided</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-text-muted font-medium">No tree keeper assigned</p>
                )}
              </div>
            )}

            {/* Maintenance */}
            <div className="bg-foreground p-4 border border-border rounded-xl">
              <p className="text-lg font-serif font-bold text-text-dark pb-2">Maintenance</p>
              <div className="flex flex-col gap-y-4">
                <div className="flex gap-x-4">
                  <div className="flex-1 flex flex-col items-start gap-y-1">
                    <p className="text-text-muted font-semibold">Next Watering Date</p>
                    {isEditing ? (
                      <input
                        type="date"
                        className={cn(textFieldClassName, "bg-button-muted")}
                        onChange={handleFormChange("next_watering_date")}
                        value={treeForm.next_watering_date}
                      />
                    ) : (
                      <p className="text-text-dark font-medium">{display(treeForm.next_watering_date)}</p>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col items-start gap-y-1">
                    <p className="text-text-muted font-semibold">Watering Status</p>
                    {isEditing ? (
                      <SelectField
                        className="bg-button-muted"
                        onChange={handleSelectChange("weekly_watering_status")}
                        options={wateringStatusOptions}
                        value={treeForm.weekly_watering_status}
                      />
                    ) : (
                      <p className="text-text-dark font-medium">{display(treeForm.weekly_watering_status)}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-x-4">
                  <div className="flex-1 flex flex-col items-start gap-y-1">
                    <p className="text-text-muted font-semibold">Next Mulching Date</p>
                    {isEditing ? (
                      <input
                        type="date"
                        className={cn(textFieldClassName, "bg-button-muted")}
                        onChange={handleFormChange("next_mulching_date")}
                        value={treeForm.next_mulching_date}
                      />
                    ) : (
                      <p className="text-text-dark font-medium">{display(treeForm.next_mulching_date)}</p>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col items-start gap-y-1">
                    <p className="text-text-muted font-semibold">Mulching Status</p>
                    {isEditing ? (
                      <SelectField
                        className="bg-button-muted"
                        onChange={handleSelectChange("yearly_mulching_status")}
                        options={mulchingStatusOptions}
                        value={treeForm.yearly_mulching_status}
                      />
                    ) : (
                      <p className="text-text-dark font-medium">{display(treeForm.yearly_mulching_status)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-foreground p-4 border border-border rounded-xl">
              <p className="text-lg font-serif font-bold text-text-dark pb-2">Notes</p>
              <div className="flex flex-col gap-y-4">
                <div className="flex flex-col items-start gap-y-1">
                  <p className="text-text-muted font-semibold">General</p>
                  {isEditing ? (
                    <textarea
                      className={cn(textareaFieldClassName, "bg-button-muted min-h-[80px]")}
                      onChange={handleFormChange("notes")}
                      placeholder="Notes..."
                      value={treeForm.notes}
                    />
                  ) : (
                    <p className="text-text-dark font-medium whitespace-pre-wrap">{display(treeForm.notes)}</p>
                  )}
                </div>
                <div className="flex flex-col items-start gap-y-1">
                  <p className="text-text-muted font-semibold">Admin</p>
                  {isEditing ? (
                    <textarea
                      className={cn(textareaFieldClassName, "bg-button-muted min-h-[80px]")}
                      onChange={handleFormChange("admin_notes")}
                      placeholder="Admin notes..."
                      value={treeForm.admin_notes}
                    />
                  ) : (
                    <p className="text-text-dark font-medium whitespace-pre-wrap">{display(treeForm.admin_notes)}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Surveys (read-only) */}
            {!isAddingTree && (
              <div className="bg-foreground p-4 border border-border rounded-xl">
                <p className="text-lg font-serif font-bold text-text-dark pb-2">Surveys</p>
                {surveys.length === 0 ? (
                  <p className="text-text-muted font-medium">No associated surveys</p>
                ) : (
                  <div className="flex flex-col gap-y-3">
                    {surveys.map((survey) => {
                      const body = survey.body ?? {};
                      return (
                        <div key={survey.id} className="rounded-xl border border-border bg-off-white p-3 text-sm">
                          <p className="font-semibold text-text-dark">
                            {new Date(survey.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-text">Issue: {display(body.issue)}</p>
                          <p className="text-text">Other: {display(body.issueOther)}</p>
                          <p className="text-text">Image Link: {display(body.imageLink)}</p>
                          <p className="text-text">Admin Contact: {display(body.adminContact)}</p>
                          <div className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap break-words">
                            <p className="font-semibold text-text-dark">Notes</p>
                            <p className="text-text">{display(body.notes)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {formError ? <p className="text-destructive font-medium">{formError}</p> : null}
          </ModalDescription>

          <ModalFooter>
            <div className="flex flex-col w-full gap-y-4">
              <div className="bg-border h-px w-full" />
              <div className="flex justify-end gap-x-4">
                <AppButton
                  type="button"
                  variant="secondary"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenChange(false);
                  }}
                >
                  Cancel
                </AppButton>
                <AppButton disabled={isSubmitting || !hasFormChanges} type="submit">
                  {isAddingTree ? "Add Tree" : "Save Changes"}
                </AppButton>
              </div>
            </div>
          </ModalFooter>
        </form>
      </ModalContent>

      <Modal open={duplicateEcosloNum !== null} onOpenChange={() => setDuplicateEcosloNum(null)}>
        <ModalContent className="bg-card" closeOnOverlayClick={false} showCloseButton={false} widthClassName="px-8">
          <ModalHeader>
            <div className="flex items-center justify-between gap-x-4">
              <h2 className="w-full text-center text-2xl text-text-dark font-serif font-extrabold">
                Duplicate ECOSLO #
              </h2>
            </div>
          </ModalHeader>
          <ModalDescription className="flex flex-col gap-y-4 pt-1 pb-4">
            <p className="w-full text-center text-text-muted">
              {`ECOSLO #${duplicateEcosloNum} is already assigned to another tree. Please use a different number.`}
            </p>
          </ModalDescription>
          <ModalFooter>
            <div className="w-full flex justify-center">
              <AppButton type="button" onClick={() => setDuplicateEcosloNum(null)}>
                OK
              </AppButton>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal open={deleteConfirmationOpen} onOpenChange={setDeleteConfirmationOpen}>
        <ModalContent className="bg-card" closeOnOverlayClick={false} showCloseButton={false} widthClassName="px-8">
          <ModalHeader>
            <div className="flex items-center justify-between gap-x-4">
              <h2 className="w-full text-center text-2xl text-text-dark font-serif font-extrabold">
                {`Delete Tree #${tree?.ecoslo_num ?? ""}`}
              </h2>
            </div>
          </ModalHeader>
          <ModalDescription className="flex flex-col gap-y-4 pt-1 pb-4">
            <p className="w-full text-center text-text-muted">This action cannot be undone.</p>
            {deleteError ? <p className="text-destructive font-medium">{deleteError}</p> : null}
          </ModalDescription>
          <ModalFooter>
            <div className="w-full flex justify-center gap-x-4">
              <AppButton type="button" variant="secondary" onClick={() => setDeleteConfirmationOpen(false)}>
                Cancel
              </AppButton>
              <AppButton variant="danger" disabled={isDeleting} onClick={handleDelete} type="button">
                {isDeleting ? "Deleting..." : "Delete Tree"}
              </AppButton>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
