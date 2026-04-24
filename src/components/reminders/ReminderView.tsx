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

type MemberEnum = Enums<"MemberType">;
type Member = Tables<"members">;
type Reminder = Tables<"reminders">;
const MEMBER_TYPES = ["Admin", "Tree Keeper"] as const satisfies readonly MemberEnum[];

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

interface ReminderViewProps {
  members: Member[];
  reminder?: Reminder;
}

export default function ReminderView({ members }: ReminderViewProps) {
  const [isActive, setIsActive] = useState(true);
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

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-auto no-scrollbar rounded-3xl border-1 border-border bg-table-row-dark px-6 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-[Constantia] text-xl font-bold">Create New Reminder</h1>
        <span className="font-avenir text-m font-normal text-text-muted">
          Set up a new automated message for volunteers
        </span>
      </div>
      <hr className="border-0 border-t border-text-muted w-full"></hr>
      <div className="text-text-dark">
        <ReminderTextInput label="Reminder Name *" placeholder="Weekly Watering Reminder" />
      </div>
      <div className="flex flex-row gap-4">
        <div className="flex basis-1/2  text-text-dark">
          <ReminderDropdown
            label="Type"
            options={["Watering Reminder", "Other Reminder"]}
            placeholder="Watering Reminder"
          />
        </div>
        <div className="flex basis-1/2 text-text-dark">
          <ReminderNestedMultiSelectDropdown
            label="Assignees"
            options={assigneeOptions}
            placeholder="Select assignees"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-avenir text-m font-normal text-text-dark">Schedule</span>
        <div className="flex flex-row gap-4">
          <div className="flex basis-1/2 text-text-muted">
            <ReminderDropdown label="Day of Week" options={[...WEEK_DAYS]} placeholder={WEEK_DAYS[0]} />
          </div>
          <div className="flex basis-1/2 text-text-muted">
            <ReminderTimePicker label="Time" defaultValue="08:00" />
          </div>
        </div>
      </div>
      <div className="flex h-25 shrink-0 flex-row items-center gap-3 rounded-3xl bg-table-header">
        <Calendar className="ml-4" size={20} color="#6b7456" />
        <div className="flex flex-col gap-1 font-avenir text-sm">
          <span className="text-text-dark">Next Send</span>
          <span className="text-text-muted">Placeholder date</span>
        </div>
      </div>
      <ReminderLongTextInput
        label="Message Template"
        sublabel="This is the message that will be sent to volunteers. You can use variables like {name} and {tree} to personalize the message."
        placeholder="Reminder template goes here..."
        initialValue="Hi {firstName}! 🌳 Time for your weekly tree check-in. Please water your {treeCount} tree(s) and complete the quick status survey: {surveyLink}"
      />
      <ReminderToggleArea
        label="Activate Immediately"
        checkedDescription="Start sending this reminder right away"
        uncheckedDescription="The reminder will be saved but not sent until you activate it"
        checked={isActive}
        onChange={setIsActive}
      />
      <hr className="border-0 border-t border-text-muted w-full"></hr>
      <div className="flex flex-row gap-4">
        <button className="basis-1/2 rounded-full bg-primary text-text-light h-10 hover:cursor-pointer transition-colors duration-250 hover:bg-primary-light">
          Create Reminder
        </button>
        <button className="basis-1/2 rounded-full bg-button text-text-dark border-1 border-border h-10 transition-colors duration-250 hover:cursor-pointer hover:bg-button-muted">
          Cancel
        </button>
      </div>
    </div>
  );
}
