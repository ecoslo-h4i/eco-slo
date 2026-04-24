"use client";
import { Enums, Tables } from "@/database/database.types";
import ReminderDropdown from "./ReminderDropdown";
import ReminderNestedMultiSelectDropdown, { type NestedMultiSelectGroup } from "./ReminderNestedMultiSelectDropdown";
import ReminderTextInput from "./ReminderTextInput";
import ReminderTimePicker from "./ReminderTimePicker";
import { Calendar } from "lucide-react";
import { useMemo, useState } from "react";
import ReminderLongTextInput from "./ReminderLongTextInput";
import ReminderToggleArea from "./ReminderToggleArea";
import { createWeeklyCronExpression, cronExpressionToFormValues, getNextCronOccurrence } from "@/lib/cron_utils";
import type { NestedMultiSelectValue } from "./ReminderNestedMultiSelectDropdown";

type MemberEnum = Enums<"MemberType">;
type Member = Tables<"members">;
type Reminder = Tables<"reminders">;
const MEMBER_TYPES = ["Admin", "Tree Keeper"] as const satisfies readonly MemberEnum[];

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
const DEFAULT_REMINDER_NAME = "";
const DEFAULT_REMINDER_TYPE = "";
const DEFAULT_REMINDER_DAY = "";
const DEFAULT_REMINDER_TIME = "";
const DEFAULT_REMINDER_MESSAGE = "";

interface ReminderViewProps {
  assigneeLabel?: string;
  members: Member[];
  mode: ReminderViewMode;
  onCancel?: () => void;
  onEdit?: () => void;
  reminder?: Reminder;
}

type ReminderViewMode = "create" | "edit" | "view";

type ReminderFormState = {
  assignees: NestedMultiSelectValue;
  dayOfWeek: string;
  isActive: boolean;
  needsSurvey: boolean;
  message: string;
  name: string;
  time: string;
  type: string;
};

export default function ReminderView({ assigneeLabel, members, mode, onCancel, onEdit, reminder }: ReminderViewProps) {
  const [form, setForm] = useState<ReminderFormState>(() => getReminderFormState(reminder, members));
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
  const nextSendLabel = useMemo(() => getNextSendLabel(form.dayOfWeek, form.time), [form.dayOfWeek, form.time]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-auto no-scrollbar rounded-3xl border-1 border-border bg-table-row-dark px-6 py-8">
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-[Constantia] text-xl font-bold">{headerTitle}</h1>
          <span className="font-avenir text-m font-normal text-text-muted">{headerSubtitle}</span>
        </div>
        {isViewMode && (
          <button
            className="h-10 rounded-full bg-primary px-5 font-avenir text-text-light transition-colors duration-200 hover:cursor-pointer hover:bg-primary-light"
            onClick={onEdit}
          >
            Edit
          </button>
        )}
      </div>
      <hr className="border-0 border-t border-text-muted w-full"></hr>
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
        {!isReadOnly && (
          <div className="flex basis-1/2  text-text-dark">
            <ReminderDropdown
              disabled={isReadOnly}
              label="Type"
              options={["Watering Reminder", "Other Reminder"]}
              placeholder="Select a template..."
              value={form.type}
              onOptionClick={(value) => updateForm("type", value)}
            />
          </div>
        )}
        <div className="flex flex-grow text-text-dark">
          <ReminderNestedMultiSelectDropdown
            disabled={isReadOnly}
            label="Assignees"
            options={assigneeOptions}
            placeholder="Select assignees"
            defaultValue={form.assignees}
            onChange={(value) => updateForm("assignees", value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-avenir text-m font-normal text-text-dark">Schedule</span>
        <div className="flex flex-row gap-4">
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
      </div>
      <div className="flex h-25 shrink-0 flex-row items-center gap-3 rounded-3xl bg-table-header">
        <Calendar className="ml-4" size={20} color="#6b7456" />
        <div className="flex flex-col gap-1 font-avenir text-sm">
          <span className="text-text-dark">Next Send</span>
          <span className="text-text-muted">{nextSendLabel}</span>
        </div>
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
            <button className="basis-1/2 rounded-full bg-primary text-text-light h-10 hover:cursor-pointer transition-colors duration-250 hover:bg-primary-light">
              {submitLabel}
            </button>
            <button
              className="basis-1/2 rounded-full bg-button text-text-dark border-1 border-border h-10 transition-colors duration-250 hover:cursor-pointer hover:bg-button-muted"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function getReminderSchedule(reminder?: Reminder) {
  if (!reminder?.crons_expression) {
    return { dayOfWeek: DEFAULT_REMINDER_DAY, time: DEFAULT_REMINDER_TIME };
  }

  try {
    const values = cronExpressionToFormValues(reminder.crons_expression);

    return {
      dayOfWeek: cronDayToWeekDay(values.dayOfWeek),
      time: `${String(values.hour).padStart(2, "0")}:${String(values.minute).padStart(2, "0")}`,
    };
  } catch {
    return { dayOfWeek: DEFAULT_REMINDER_DAY, time: DEFAULT_REMINDER_TIME };
  }
}

function getReminderFormState(reminder: Reminder | undefined, members: Member[]): ReminderFormState {
  const schedule = getReminderSchedule(reminder);

  return {
    assignees: getSelectedAssignees(reminder, members),
    dayOfWeek: schedule.dayOfWeek,
    isActive: reminder?.is_active ?? true,
    needsSurvey: false,
    message: reminder?.task_message ?? DEFAULT_REMINDER_MESSAGE,
    name: reminder?.name ?? DEFAULT_REMINDER_NAME,
    time: schedule.time,
    type: DEFAULT_REMINDER_TYPE,
  };
}

function cronDayToWeekDay(dayOfWeek: number) {
  const normalizedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  return WEEK_DAYS[normalizedDay] ?? DEFAULT_REMINDER_DAY;
}

function weekDayToCronDay(dayOfWeek: string) {
  const weekDayIndex = WEEK_DAYS.findIndex((day) => day === dayOfWeek);
  return weekDayIndex < 0 ? null : (weekDayIndex + 1) % 7;
}

function getNextSendLabel(dayOfWeek: string, time: string) {
  const cronDay = weekDayToCronDay(dayOfWeek);

  if (cronDay === null || !time) {
    return "Select a day and time";
  }

  const [hour, minute] = time.split(":").map(Number);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return "Select a valid time";
  }

  try {
    const expression = createWeeklyCronExpression({ hour, minute }, cronDay);
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

  const memberIds = new Set(reminder.assignees.map(String));

  return Object.fromEntries(
    MEMBER_TYPES.map((memberType) => [
      memberType,
      members
        .filter((member) => member.role === memberType && memberIds.has(String(member.id)))
        .map((member) => String(member.id)),
    ]).filter(([, selectedIds]) => selectedIds.length > 0),
  );
}
