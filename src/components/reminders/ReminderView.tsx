"use client";
import { Enums, Tables, TablesInsert, TablesUpdate } from "@/database/database.types";
import ReminderDropdown from "./ReminderDropdown";
import ReminderNestedMultiSelectDropdown, { type NestedMultiSelectGroup } from "./ReminderNestedMultiSelectDropdown";
import ReminderTextInput from "./ReminderTextInput";
import ReminderTimePicker from "./ReminderTimePicker";
import ReminderMonthlyDayPicker from "./ReminderMonthlyDayPicker";
import ReminderYearlyDatePicker, { type YearlyDate } from "./ReminderYearlyDatePicker";
import { Calendar, SquarePen, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import ReminderLongTextInput from "./ReminderLongTextInput";
import ReminderToggleArea from "./ReminderToggleArea";
import { reminderFieldLabelClass } from "./reminderInputStyles";
import { MESSAGE_VARIABLE_TOKENS } from "@shared/message-variables";
import { Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader } from "@/components/modal";
import {
  createCronExpression,
  cronExpressionToFormValues,
  getCronPreset,
  getNextCronOccurrence,
} from "@/lib/cron_utils";
import type { NestedMultiSelectValue } from "./ReminderNestedMultiSelectDropdown";
import { AppButton } from "@/components/ui/form-controls";

type MemberEnum = Enums<"MemberType">;
type Member = Tables<"members">;
type Reminder = Tables<"reminders">;
type Template = Tables<"templates">;
type SurveyMode = Enums<"TaskSurveyMode">;
type ReminderInsertPayload = TablesInsert<"reminders">;
type ReminderUpdatePayload = TablesUpdate<"reminders">;
const MEMBER_TYPES = ["Admin", "Tree Keeper"] as const satisfies readonly MemberEnum[];

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
const DEFAULT_REMINDER_NAME = "";
const DEFAULT_REMINDER_TYPE = "";
const DEFAULT_REMINDER_DAY = "";
const DEFAULT_REMINDER_TIME = "";
const DEFAULT_REMINDER_MESSAGE = "";

const REPEAT_OPTIONS = ["Weekly", "Monthly", "Yearly"] as const;
const SURVEY_MODE_OPTIONS = ["No Survey", "Optional Survey", "Required Survey"] as const;
type RepeatOption = (typeof REPEAT_OPTIONS)[number];
type SurveyModeOption = (typeof SURVEY_MODE_OPTIONS)[number];
type ReminderRepeatPreset = "weekly" | "monthly" | "yearly";

const REPEAT_LABEL_TO_PRESET: Record<RepeatOption, ReminderRepeatPreset> = {
  Weekly: "weekly",
  Monthly: "monthly",
  Yearly: "yearly",
};
const REPEAT_PRESET_TO_LABEL: Record<ReminderRepeatPreset, RepeatOption> = {
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};
const SURVEY_MODE_TO_LABEL: Record<SurveyMode, SurveyModeOption> = {
  none: "No Survey",
  optional: "Optional Survey",
  required: "Required Survey",
};
const SURVEY_LABEL_TO_MODE: Record<SurveyModeOption, SurveyMode> = {
  "No Survey": "none",
  "Optional Survey": "optional",
  "Required Survey": "required",
};

interface ReminderViewProps {
  assigneeLabel?: string;
  members: Member[];
  mode: ReminderViewMode;
  onCancel?: () => void;
  onDeleted?: (reminderId: number) => void;
  onEdit?: () => void;
  onSaved?: (reminder: Reminder) => void;
  reminder?: Reminder;
  templates: Template[];
}

type ReminderViewMode = "create" | "edit" | "view";

type ReminderFormState = {
  assignees: NestedMultiSelectValue;
  repeat: ReminderRepeatPreset;
  dayOfWeek: string;
  dayOfMonth: number | null;
  yearlyDate: YearlyDate | null;
  isActive: boolean;
  surveyMode: SurveyMode;
  surveyRequiredCount: number;
  isGroupTask: boolean;
  message: string;
  name: string;
  time: string;
  /** Template name shown in the "Type" dropdown (display only). */
  type: string;
  /** Resolved classification persisted to reminders.type. */
  taskType: Enums<"TaskType">;
};

export default function ReminderView({
  assigneeLabel,
  members,
  mode,
  onCancel,
  onDeleted,
  onEdit,
  onSaved,
  reminder,
  templates,
}: ReminderViewProps) {
  const [form, setForm] = useState<ReminderFormState>(() => getReminderFormState(reminder, members));
  const [submitError, setSubmitError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const isCreateMode = mode === "create";
  const isEditMode = mode === "edit";
  const isViewMode = mode === "view";
  const isExistingReminderMode = isEditMode || isViewMode;
  const isReadOnly = isViewMode;
  const viewInputBackgroundClass = isViewMode ? "disabled:!bg-off-white-2" : undefined;
  const headerTitle = isExistingReminderMode ? reminder?.name || form.name : "Create New Reminder";
  const headerSubtitle = isExistingReminderMode
    ? assigneeLabel || "No assignees"
    : "Set up a new automated message for members";
  const submitLabel = isEditMode ? "Save Changes" : "Create Reminder";
  const displayedReminderName = reminder?.name || form.name || "Reminder";

  const updateForm = <K extends keyof ReminderFormState>(key: K, value: ReminderFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSubmitError("");
    setDeleteError("");
  };

  const handleRepeatChange = (label: string) => {
    if (!isRepeatOption(label)) return;
    updateForm("repeat", REPEAT_LABEL_TO_PRESET[label]);
  };

  const handleSurveyModeChange = (label: string) => {
    if (!isSurveyModeOption(label)) return;
    const surveyMode = SURVEY_LABEL_TO_MODE[label];
    setForm((current) => ({
      ...current,
      surveyMode,
      surveyRequiredCount: surveyMode === "required" ? Math.max(current.surveyRequiredCount, 1) : 0,
    }));
    setSubmitError("");
    setDeleteError("");
  };

  const handleTemplateSelect = (templateName: string) => {
    const selectedTemplate = templates.find((template) => template.name === templateName);

    if (!selectedTemplate) {
      // No matching template: keep the typed-in label but classify as Other.
      setForm((current) => ({ ...current, type: templateName, taskType: "Other" }));
      setSubmitError("");
      setDeleteError("");
      return;
    }

    setForm((current) => ({
      ...current,
      ...getTemplateFormValues(selectedTemplate, members),
      type: selectedTemplate.name,
      taskType: selectedTemplate.type,
    }));
    setSubmitError("");
    setDeleteError("");
  };

  const handleSubmit = async () => {
    setSubmitError("");
    setIsSubmitting(true);

    try {
      const savedReminder = isEditMode ? await updateReminder(reminder, form) : await createReminder(form);

      onSaved?.(savedReminder);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to save reminder.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!reminder) {
      setDeleteError("Select a reminder before deleting.");
      return;
    }

    setDeleteError("");
    setIsDeleting(true);

    try {
      await deleteReminder(reminder.id);
      setDeleteConfirmationOpen(false);
      onDeleted?.(reminder.id);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Unable to delete reminder.");
    } finally {
      setIsDeleting(false);
    }
  };

  const assigneeOptions = useMemo<NestedMultiSelectGroup[]>(
    () =>
      MEMBER_TYPES.map((memberType) => ({
        label: `${memberType}s`,
        value: memberType,
        options: members
          .filter((member) => member.role === memberType)
          .map((member) => ({
            label: `${member.firstname} ${member.lastname}`,
            value: String(member.id),
          })),
      })),
    [members],
  );
  const templateOptions = useMemo(() => templates.map((template) => template.name), [templates]);
  const nextSendLabel = useMemo(() => getNextSendLabel(form), [form]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-auto no-scrollbar rounded-xl border-1 border-border bg-table-row-dark p-6">
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-[26px] font-normal leading-tight">{headerTitle}</h1>
          <span className="font-mulish text-m font-normal text-text-muted">{headerSubtitle}</span>
        </div>
        <div className="flex flex-row items-center gap-4">
          {(isViewMode || isEditMode) && (
            <AppButton
              icon={<Trash2 size={20} className="text-danger" />}
              iconOnly
              variant="ghost"
              disabled={isDeleting}
              onClick={() => {
                setDeleteError("");
                setDeleteConfirmationOpen(true);
              }}
              type="button"
            >
              Delete reminder
            </AppButton>
          )}
          {isViewMode && (
            <AppButton
              icon={<SquarePen size={20} className="text-text-muted" />}
              iconOnly
              variant="ghost"
              onClick={onEdit}
            >
              Edit reminder
            </AppButton>
          )}
        </div>
      </div>
      <hr className="border-0 border-t border-text-muted w-full"></hr>
      {deleteError && <span className="font-mulish text-sm text-danger">{deleteError}</span>}
      {isCreateMode && (
        <div className="text-text-dark">
          <ReminderTextInput
            disabled={isReadOnly}
            label="Reminder Name *"
            placeholder="Reminder name"
            value={form.name}
            onChange={(event) => updateForm("name", event.target.value)}
          />
        </div>
      )}
      <div className="flex flex-row gap-4">
        <div className="flex min-w-0 basis-1/2 text-text-dark">
          {isCreateMode ? (
            <ReminderDropdown
              disabled={isReadOnly}
              label="Type"
              options={templateOptions}
              placeholder="Select a template..."
              value={form.type}
              onOptionClick={handleTemplateSelect}
            />
          ) : (
            // Existing reminders don't store which template built them, so the
            // template picker can't be repopulated. Show the persisted
            // classification read-only (in both edit and view modes) instead of
            // a confusing blank dropdown.
            <ReminderDropdown
              disabled
              triggerClassName={viewInputBackgroundClass}
              label="Type"
              options={[]}
              value={form.taskType}
            />
          )}
        </div>
        <div className="flex min-w-0 basis-1/2 text-text-dark">
          <ReminderNestedMultiSelectDropdown
            disabled={isReadOnly}
            triggerClassName={viewInputBackgroundClass}
            label="Assignees"
            options={assigneeOptions}
            placeholder="Select assignees"
            value={form.assignees}
            onChange={(value) => updateForm("assignees", value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-row gap-4">
          <div className="flex basis-1/2 text-text-dark">
            <ReminderDropdown
              triggerClassName={viewInputBackgroundClass}
              disabled={isReadOnly}
              label="Repeats"
              options={[...REPEAT_OPTIONS]}
              placeholder="Select a frequency..."
              value={REPEAT_PRESET_TO_LABEL[form.repeat]}
              onOptionClick={handleRepeatChange}
            />
          </div>
          <div className="flex basis-1/2 text-text-dark">
            <ReminderTimePicker
              inputClassName={viewInputBackgroundClass}
              disabled={isReadOnly}
              label="Time"
              placeholder="Select a time"
              value={form.time}
              onChange={(event) => updateForm("time", event.target.value)}
            />
          </div>
        </div>

        {form.repeat === "weekly" && (
          <div className="flex flex-row items-start gap-4">
            <div className="flex basis-1/2 text-text-dark">
              <ReminderDropdown
                disabled={isReadOnly}
                label="Day of Week"
                options={[...WEEK_DAYS]}
                placeholder="Select a day..."
                value={form.dayOfWeek}
                onOptionClick={(value) => updateForm("dayOfWeek", value)}
              />
            </div>
            <div className="flex basis-1/2 items-center gap-4 self-end rounded-lg border border-border bg-table-header px-4 py-3">
              <div className="flex items-center rounded-lg bg-primary p-2">
                <Calendar className="text-on-primary" size={24} />
              </div>
              <div className="flex flex-col gap-1 font-mulish text-m">
                <span className="font-semibold text-text-dark">Starts</span>
                <span className="text-text-muted">{nextSendLabel}</span>
              </div>
            </div>
          </div>
        )}

        {form.repeat === "monthly" && (
          <div className="flex flex-col gap-1">
            <span className={reminderFieldLabelClass}>Day of Month</span>
            <ReminderMonthlyDayPicker
              disabled={isReadOnly}
              value={form.dayOfMonth}
              onChange={(day) => updateForm("dayOfMonth", day)}
            />
          </div>
        )}

        {form.repeat === "yearly" && (
          <div className="flex flex-col gap-1">
            <span className={reminderFieldLabelClass}>Date</span>
            <ReminderYearlyDatePicker
              disabled={isReadOnly}
              value={form.yearlyDate}
              onChange={(date) => updateForm("yearlyDate", date)}
            />
          </div>
        )}
        {form.repeat !== "weekly" && (
          <div className="flex items-center gap-4 rounded-lg border border-border bg-table-header px-4 py-3">
            <div className="flex items-center rounded-lg bg-primary p-2">
              <Calendar className="text-on-primary" size={24} />
            </div>
            <div className="flex flex-col gap-1 font-mulish text-m">
              <span className="font-semibold text-text-dark">Starts</span>
              <span className="text-text-muted">{nextSendLabel}</span>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3">
        <span className={reminderFieldLabelClass}>Message Template</span>
        <div className="flex flex-row flex-wrap gap-2">
          {MESSAGE_VARIABLE_TOKENS.map((variable) => (
            <span key={variable} className="rounded-full bg-table-header px-4 py-1 font-mono text-m text-text-muted">
              {variable}
            </span>
          ))}
        </div>
        <ReminderLongTextInput
          textareaClassName={viewInputBackgroundClass}
          disabled={isReadOnly}
          label=""
          placeholder="Write a message..."
          value={form.message}
          onChange={(event) => updateForm("message", event.target.value)}
        />
      </div>
      <div className="flex flex-row gap-4">
        <div className="basis-1/2">
          <ReminderToggleArea
            disabled={isReadOnly}
            label="Active Status"
            checkedDescription="This reminder is currently active"
            uncheckedDescription="This reminder is currently inactive"
            checked={form.isActive}
            onChange={(value) => updateForm("isActive", value)}
          />
        </div>
        <div className="basis-1/2">
          <ReminderDropdown
            triggerClassName={viewInputBackgroundClass}
            disabled={isReadOnly}
            label="Survey Mode"
            options={[...SURVEY_MODE_OPTIONS]}
            value={SURVEY_MODE_TO_LABEL[form.surveyMode]}
            onOptionClick={handleSurveyModeChange}
          />
        </div>
      </div>
      {form.surveyMode === "required" && form.taskType === "Other" ? (
        <div className="max-w-xs text-text-dark">
          <ReminderTextInput
            disabled={isReadOnly}
            label="Required Surveys"
            placeholder="1"
            value={String(form.surveyRequiredCount)}
            onChange={(event) => {
              const next = Math.max(1, Math.min(10, Number(event.target.value) || 1));
              updateForm("surveyRequiredCount", next);
            }}
          />
        </div>
      ) : null}
      <div className="basis-1/3">
        <ReminderToggleArea
          disabled={isReadOnly}
          label="Set Group Task"
          checkedDescription="This reminder will create one task for ALL assignees"
          uncheckedDescription="This reminder will create one task PER assignee"
          checked={form.isGroupTask}
          onChange={(value) => updateForm("isGroupTask", value)}
        />
      </div>
      {!isViewMode && (
        <>
          <hr className="border-0 border-t border-text-muted w-full"></hr>
          <div className="flex flex-row gap-4">
            <AppButton className="basis-1/2" disabled={isSubmitting} onClick={handleSubmit}>
              {isSubmitting ? "Saving..." : submitLabel}
            </AppButton>
            <AppButton className="basis-1/2" variant="secondary" onClick={onCancel}>
              Cancel
            </AppButton>
          </div>
          {submitError && <span className="font-mulish text-sm text-danger">{submitError}</span>}
        </>
      )}

      <Modal open={deleteConfirmationOpen} onOpenChange={setDeleteConfirmationOpen}>
        <ModalContent className="bg-card" closeOnOverlayClick={false} showCloseButton={false} widthClassName="px-8">
          <ModalHeader>
            <div className="flex items-center justify-between gap-x-4">
              <h2 className="w-full text-center text-2xl text-text-dark font-serif font-extrabold">
                {`Delete ${displayedReminderName}`}
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
                {isDeleting ? "Deleting..." : "Delete Reminder"}
              </AppButton>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Schedule helpers
// ---------------------------------------------------------------------------

function isRepeatOption(value: string): value is RepeatOption {
  return (REPEAT_OPTIONS as readonly string[]).includes(value);
}

function isSurveyModeOption(value: string): value is SurveyModeOption {
  return (SURVEY_MODE_OPTIONS as readonly string[]).includes(value);
}

/**
 * Detect which repeat preset this UI should show for an existing cron
 * expression. The UI only offers weekly/monthly/yearly, so daily/weekdays/
 * custom fall back to weekly. This shouldn't be reached since every
 * reminder this form creates uses one of the three supported presets, but
 * the fallback keeps hydration safe if a cron is hand-edited later.
 */
function getReminderRepeatPreset(cronExpression: string | undefined): ReminderRepeatPreset {
  if (!cronExpression) return "weekly";
  try {
    const preset = getCronPreset(cronExpression);
    if (preset === "monthly" || preset === "yearly") return preset;
    return "weekly";
  } catch {
    return "weekly";
  }
}

type ScheduleFromCron = {
  repeat: ReminderRepeatPreset;
  dayOfWeek: string;
  dayOfMonth: number | null;
  yearlyDate: YearlyDate | null;
  time: string;
};

function emptySchedule(): ScheduleFromCron {
  return {
    repeat: "weekly",
    dayOfWeek: DEFAULT_REMINDER_DAY,
    dayOfMonth: null,
    yearlyDate: null,
    time: DEFAULT_REMINDER_TIME,
  };
}

function getReminderSchedule(reminder?: Reminder): ScheduleFromCron {
  return getScheduleFromCronExpression(reminder?.crons_expression);
}

function getScheduleFromCronExpression(cronsExpression?: string): ScheduleFromCron {
  if (!cronsExpression) return emptySchedule();

  try {
    const values = cronExpressionToFormValues(cronsExpression);
    const preset = getReminderRepeatPreset(cronsExpression);
    const time = `${String(values.hour).padStart(2, "0")}:${String(values.minute).padStart(2, "0")}`;

    return {
      repeat: preset,
      // Each repeat-specific field is only filled when its preset is active.
      // Leaving the others at their empty defaults avoids accidentally
      // resurfacing stale data if the user toggles between presets.
      dayOfWeek: preset === "weekly" ? cronDayToWeekDay(values.dayOfWeek) : DEFAULT_REMINDER_DAY,
      dayOfMonth: preset === "monthly" ? values.dayOfMonth : null,
      yearlyDate: preset === "yearly" ? { month: values.month, day: values.dayOfMonth } : null,
      time,
    };
  } catch {
    return emptySchedule();
  }
}

function getTemplateFormValues(template: Template, members: Member[]): Partial<ReminderFormState> {
  const schedule = getScheduleFromCronExpression(template.crons_expression);

  return {
    assignees: getAssigneesFromMemberIds(template.assignees, members),
    repeat: schedule.repeat,
    dayOfWeek: schedule.dayOfWeek,
    dayOfMonth: schedule.dayOfMonth,
    yearlyDate: schedule.yearlyDate,
    message: template.task_message,
    surveyMode: template.survey_mode ?? (template.needs_survey ? "required" : "none"),
    surveyRequiredCount: template.survey_required_count ?? 1,
    time: schedule.time,
  };
}

function getReminderFormState(reminder: Reminder | undefined, members: Member[]): ReminderFormState {
  const schedule = getReminderSchedule(reminder);

  return {
    assignees: getSelectedAssignees(reminder, members),
    repeat: schedule.repeat,
    dayOfWeek: schedule.dayOfWeek,
    dayOfMonth: schedule.dayOfMonth,
    yearlyDate: schedule.yearlyDate,
    isActive: reminder?.is_active ?? true,
    surveyMode: reminder?.survey_mode ?? (reminder?.needs_survey ? "required" : "none"),
    surveyRequiredCount: reminder?.survey_required_count ?? 1,
    isGroupTask: reminder?.is_group_task ?? false,
    message: reminder?.task_message ?? DEFAULT_REMINDER_MESSAGE,
    name: reminder?.name ?? DEFAULT_REMINDER_NAME,
    time: schedule.time,
    type: DEFAULT_REMINDER_TYPE,
    // Preserve an existing reminder's classification across edits even though
    // the template ("Type") dropdown starts blank in edit mode.
    taskType: reminder?.type ?? "Other",
  };
}

function getAssigneesFromMemberIds(memberIds: number[], members: Member[]): NestedMultiSelectValue {
  const selectedMemberIds = new Set(memberIds.map(String));

  return Object.fromEntries(
    MEMBER_TYPES.map((memberType) => [
      memberType,
      members
        .filter((member) => member.role === memberType && selectedMemberIds.has(String(member.id)))
        .map((member) => String(member.id)),
    ]).filter(([, selectedIds]) => selectedIds.length > 0),
  );
}

function getSelectedAssigneeIds(assignees: NestedMultiSelectValue) {
  return Object.values(assignees).flat().map(Number).filter(Number.isInteger);
}

/**
 * Build a cron expression from the current form state, throwing a
 * user-facing error if the schedule isn't fully specified yet.
 */
function getCronExpressionFromForm(form: ReminderFormState): string {
  if (!form.time) {
    throw new Error("Select a time before saving.");
  }

  const [hour, minute] = form.time.split(":").map(Number);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    throw new Error("Select a valid time before saving.");
  }
  const time = { hour, minute };

  switch (form.repeat) {
    case "weekly": {
      const cronDay = weekDayToCronDay(form.dayOfWeek);
      if (cronDay === null) {
        throw new Error("Select a day of the week before saving.");
      }
      return createCronExpression({ repeat: "weekly", time, dayOfWeek: cronDay });
    }
    case "monthly": {
      if (form.dayOfMonth === null) {
        throw new Error("Select a day of the month before saving.");
      }
      return createCronExpression({ repeat: "monthly", time, dayOfMonth: form.dayOfMonth });
    }
    case "yearly": {
      if (!form.yearlyDate) {
        throw new Error("Select a date before saving.");
      }
      return createCronExpression({
        repeat: "yearly",
        time,
        dayOfMonth: form.yearlyDate.day,
        month: form.yearlyDate.month,
      });
    }
  }
}

function getReminderPayload(form: ReminderFormState): ReminderInsertPayload {
  if (!form.name.trim()) {
    throw new Error("Enter a reminder name before saving.");
  }

  const assignees = getSelectedAssigneeIds(form.assignees);
  const crons_expression = getCronExpressionFromForm(form);

  return {
    assignees,
    crons_expression: crons_expression,
    is_active: form.isActive,
    // Watering/Mulching are inherently per-keeper; otherwise,
    // use the isGroupTask field to determine the value
    is_group_task: form.taskType === "Other" && form.isGroupTask,
    needs_survey: form.surveyMode !== "none",
    name: form.name.trim(),
    survey_mode: form.surveyMode,
    survey_required_count: form.surveyMode === "required" ? Math.max(1, form.surveyRequiredCount) : 0,
    task_message: form.message,
    next_run_at: getNextCronOccurrence(crons_expression).toISOString(),
    type: form.taskType,
  };
}

async function createReminder(form: ReminderFormState): Promise<Reminder> {
  const response = await fetch("/api/admin/reminders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(getReminderPayload(form)),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message ?? data?.error?.message ?? "Unable to create reminder.");
  }

  const reminder = Array.isArray(data.data) ? data.data[0] : data.data;

  if (!reminder) {
    throw new Error("Reminder was created, but the response did not include it.");
  }

  return reminder as Reminder;
}

async function updateReminder(reminder: Reminder | undefined, form: ReminderFormState): Promise<Reminder> {
  if (!reminder) {
    throw new Error("Select a reminder before saving changes.");
  }

  const payload: ReminderUpdatePayload = getReminderPayload({
    ...form,
    name: reminder.name, // Enforce immutable name
  });

  const response = await fetch(`/api/admin/reminders/${reminder.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message ?? data?.error?.message ?? "Unable to save reminder changes.");
  }

  if (!data.data) {
    throw new Error("Reminder was saved, but the response did not include it.");
  }

  return data.data as Reminder;
}

async function deleteReminder(reminderId: number): Promise<void> {
  const response = await fetch(`/api/admin/reminders/${reminderId}`, {
    method: "DELETE",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message ?? data?.error?.message ?? "Unable to delete reminder.");
  }
}

function cronDayToWeekDay(dayOfWeek: number) {
  const normalizedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  return WEEK_DAYS[normalizedDay] ?? DEFAULT_REMINDER_DAY;
}

function weekDayToCronDay(dayOfWeek: string) {
  const weekDayIndex = WEEK_DAYS.findIndex((day) => day === dayOfWeek);
  return weekDayIndex < 0 ? null : (weekDayIndex + 1) % 7;
}

/**
 * Compute the human-readable "Next Send" line shown below the schedule.
 *
 * Mirrors getCronExpressionFromForm's validation rules but returns the
 * shortcoming as a UI string rather than throwing. Returning early on each
 * missing field gives the user a precise nudge ("Select a day of the
 * month") instead of a generic "schedule incomplete".
 */
function getNextSendLabel(form: ReminderFormState): string {
  if (!form.time) return "Select a time";

  const [hour, minute] = form.time.split(":").map(Number);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return "Select a valid time";

  switch (form.repeat) {
    case "weekly":
      if (weekDayToCronDay(form.dayOfWeek) === null) return "Select a day of the week";
      break;
    case "monthly":
      if (form.dayOfMonth === null) return "Select a day of the month";
      break;
    case "yearly":
      if (!form.yearlyDate) return "Select a date";
      break;
  }

  try {
    const expression = getCronExpressionFromForm(form);
    return formatNextSendDate(getNextCronOccurrence(expression));
  } catch {
    return "Select a valid schedule";
  }
}

function formatNextSendDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
}

function getSelectedAssignees(reminder: Reminder | undefined, members: Member[]): NestedMultiSelectValue {
  if (!reminder) return {};

  return getAssigneesFromMemberIds(reminder.assignees, members);
}
