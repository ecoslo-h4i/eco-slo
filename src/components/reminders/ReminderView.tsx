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
import {
  createCronExpression,
  cronExpressionToFormValues,
  getCronPreset,
  getNextCronOccurrence,
} from "@/lib/cron_utils";
import type { NestedMultiSelectValue } from "./ReminderNestedMultiSelectDropdown";

type MemberEnum = Enums<"MemberType">;
type Member = Tables<"members">;
type Reminder = Tables<"reminders">;
type Template = Tables<"templates">;
type ReminderWithNeedsSurvey = Reminder & { needs_survey?: boolean | null };
type ReminderInsertPayload = TablesInsert<"reminders"> & { needs_survey?: boolean };
type ReminderUpdatePayload = TablesUpdate<"reminders"> & { needs_survey?: boolean };
const MEMBER_TYPES = ["Admin", "Tree Keeper"] as const satisfies readonly MemberEnum[];

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
const DEFAULT_REMINDER_NAME = "";
const DEFAULT_REMINDER_TYPE = "";
const DEFAULT_REMINDER_DAY = "";
const DEFAULT_REMINDER_TIME = "";
const DEFAULT_REMINDER_MESSAGE = "";

const REPEAT_OPTIONS = ["Weekly", "Monthly", "Yearly"] as const;
type RepeatOption = (typeof REPEAT_OPTIONS)[number];
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
  needsSurvey: boolean;
  message: string;
  name: string;
  time: string;
  type: string;
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
  const isCreateMode = mode === "create";
  const isEditMode = mode === "edit";
  const isViewMode = mode === "view";
  const isExistingReminderMode = isEditMode || isViewMode;
  const isReadOnly = isViewMode;
  const headerTitle = isExistingReminderMode ? reminder?.name || form.name : "Create New Reminder";
  const headerSubtitle = isExistingReminderMode
    ? assigneeLabel || "No assignees"
    : "Set up a new automated message for volunteers";
  const submitLabel = isEditMode ? "Save Changes" : "Create Reminder";

  const updateForm = <K extends keyof ReminderFormState>(key: K, value: ReminderFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSubmitError("");
    setDeleteError("");
  };

  const handleRepeatChange = (label: string) => {
    if (!isRepeatOption(label)) return;
    updateForm("repeat", REPEAT_LABEL_TO_PRESET[label]);
  };

  const handleTemplateSelect = (templateName: string) => {
    const selectedTemplate = templates.find((template) => template.name === templateName);

    if (!selectedTemplate) {
      updateForm("type", templateName);
      return;
    }

    setForm((current) => ({
      ...current,
      ...getTemplateFormValues(selectedTemplate, members),
      type: selectedTemplate.name,
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
  const nextSendLabel = useMemo(
    () => getNextSendLabel(form),
    // Listing schedule-relevant fields keeps this stable when name/message/etc. change.
    [form.repeat, form.dayOfWeek, form.dayOfMonth, form.yearlyDate, form.time],
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-auto no-scrollbar rounded-3xl border-1 border-border bg-table-row-dark px-6 py-8">
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-[26px] font-normal leading-tight">{headerTitle}</h1>
          <span className="font-avenir text-m font-normal text-text-muted">{headerSubtitle}</span>
        </div>
        <div className="flex flex-row items-center gap-4">
          {(isViewMode || isEditMode) && (
            <button
              className="flex items-center justify-center h-9 w-9 rounded-full font-avenir text-text-light transition-colors duration-200 hover:cursor-pointer hover:bg-border disabled:cursor-default disabled:opacity-60"
              disabled={isDeleting}
              onClick={handleDelete}
              type="button"
            >
              <Trash2 size={24} className="text-danger" />
            </button>
          )}
          {isViewMode && (
            <button
              className="flex items-center justify-center h-9 w-9 rounded-full font-avenir text-text-light transition-colors duration-200 hover:cursor-pointer hover:bg-border"
              onClick={onEdit}
            >
              <SquarePen size={24} className="text-text-muted" />
            </button>
          )}
        </div>
      </div>
      <hr className="border-0 border-t border-text-muted w-full"></hr>
      {deleteError && <span className="font-avenir text-sm text-danger">{deleteError}</span>}
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
      {!isViewMode && (
        <div className="flex flex-row gap-4">
          <div className="flex basis-1/2  text-text-dark">
            <ReminderDropdown
              disabled={isReadOnly}
              label="Type"
              options={templateOptions}
              placeholder="Select a template..."
              value={form.type}
              onOptionClick={handleTemplateSelect}
            />
          </div>
          <div className="flex flex-grow text-text-dark">
            <ReminderNestedMultiSelectDropdown
              disabled={isReadOnly}
              label="Assignees"
              options={assigneeOptions}
              placeholder="Select assignees"
              value={form.assignees}
              onChange={(value) => updateForm("assignees", value)}
            />
          </div>
        </div>
      )}
      <div className="flex flex-col gap-4">
        <div className="flex flex-row gap-4">
          <div className="flex basis-1/2 text-text-dark">
            <ReminderDropdown
              disabled={isReadOnly}
              label="Repeats"
              options={[...REPEAT_OPTIONS]}
              placeholder="Select a frequency..."
              value={REPEAT_PRESET_TO_LABEL[form.repeat]}
              onOptionClick={handleRepeatChange}
            />
          </div>
          <div className="flex basis-1/2 text-text-muted">
            <ReminderTimePicker
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
            <div className="flex basis-1/2 text-text-muted">
              <ReminderDropdown
                disabled={isReadOnly}
                label="Day of Week"
                options={[...WEEK_DAYS]}
                placeholder="Select a day..."
                value={form.dayOfWeek}
                onOptionClick={(value) => updateForm("dayOfWeek", value)}
              />
            </div>
            <div className="flex basis-1/2 items-center gap-4 rounded-lg bg-table-header px-4 py-3 self-end">
              <div className="flex items-center rounded-lg bg-primary p-2">
                <Calendar className="text-white" size={24} />
              </div>
              <div className="flex flex-col gap-1 font-avenir text-m">
                <span className="font-semibold text-text-dark">Starts</span>
                <span className="text-text-muted">{nextSendLabel}</span>
              </div>
            </div>
          </div>
        )}

        {form.repeat === "monthly" && (
          <div className="flex flex-col gap-1">
            <span className="font-avenir text-m font-normal">Day of Month</span>
            <ReminderMonthlyDayPicker
              disabled={isReadOnly}
              value={form.dayOfMonth}
              onChange={(day) => updateForm("dayOfMonth", day)}
            />
          </div>
        )}

        {form.repeat === "yearly" && (
          <div className="flex flex-col gap-1">
            <span className="font-avenir text-m font-normal">Date</span>
            <ReminderYearlyDatePicker
              disabled={isReadOnly}
              value={form.yearlyDate}
              onChange={(date) => updateForm("yearlyDate", date)}
            />
          </div>
        )}
        {form.repeat !== "weekly" && (
          <div className="flex items-center gap-4 rounded-lg bg-table-header px-4 py-3">
            <div className="flex items-center rounded-lg bg-primary p-2">
              <Calendar className="text-white" size={24} />
            </div>
            <div className="flex flex-col gap-1 font-avenir text-m">
              <span className="font-semibold text-text-dark">Starts</span>
              <span className="text-text-muted">{nextSendLabel}</span>
            </div>
          </div>
        )}
      </div>
      <ReminderLongTextInput
        disabled={isReadOnly}
        label="Message Template"
        sublabel="This is the message that will be sent to volunteers. You can use variables like {name} and {tree} to personalize the message."
        placeholder="Write a message..."
        value={form.message}
        onChange={(event) => updateForm("message", event.target.value)}
      />
      <ReminderToggleArea
        disabled={isReadOnly}
        label="Active Status"
        checkedDescription="This reminder is currently active"
        uncheckedDescription="This reminder is currently inactive"
        checked={form.isActive}
        onChange={(value) => updateForm("isActive", value)}
      />
      <ReminderToggleArea
        disabled={isReadOnly}
        label="Survey Status"
        checkedDescription="This reminder requires a survey"
        uncheckedDescription="This reminder does not require a survey"
        checked={form.needsSurvey}
        onChange={(value) => updateForm("needsSurvey", value)}
      />
      {!isViewMode && (
        <>
          <hr className="border-0 border-t border-text-muted w-full"></hr>
          <div className="flex flex-row gap-4">
            <button
              className="basis-1/2 flex items-center justify-center rounded-full bg-primary text-text-light h-10 hover:cursor-pointer transition-colors duration-250 hover:bg-primary-light disabled:cursor-default disabled:opacity-70"
              disabled={isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? "Saving..." : submitLabel}
            </button>
            <button
              className="basis-1/2 flex items-center justify-center rounded-full bg-button text-text-dark border-1 border-border h-10 transition-colors duration-250 hover:cursor-pointer hover:bg-button-muted"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
          {submitError && <span className="font-avenir text-sm text-danger">{submitError}</span>}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Schedule helpers
// ---------------------------------------------------------------------------

function isRepeatOption(value: string): value is RepeatOption {
  return (REPEAT_OPTIONS as readonly string[]).includes(value);
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
    time: schedule.time,
  };
}

function getReminderFormState(reminder: Reminder | undefined, members: Member[]): ReminderFormState {
  const schedule = getReminderSchedule(reminder);
  const reminderWithNeedsSurvey = reminder as ReminderWithNeedsSurvey | undefined;

  return {
    assignees: getSelectedAssignees(reminder, members),
    repeat: schedule.repeat,
    dayOfWeek: schedule.dayOfWeek,
    dayOfMonth: schedule.dayOfMonth,
    yearlyDate: schedule.yearlyDate,
    isActive: reminder?.is_active ?? true,
    needsSurvey: reminderWithNeedsSurvey?.needs_survey ?? false,
    message: reminder?.task_message ?? DEFAULT_REMINDER_MESSAGE,
    name: reminder?.name ?? DEFAULT_REMINDER_NAME,
    time: schedule.time,
    type: DEFAULT_REMINDER_TYPE,
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
    is_group_task: assignees.length > 1,
    needs_survey: form.needsSurvey,
    name: form.name.trim(),
    task_message: form.message,
    next_run_at: getNextCronOccurrence(crons_expression).toISOString(),
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
