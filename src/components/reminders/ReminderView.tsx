"use client";
import { Enums, Tables } from "@/database/database.types";
import ReminderDropdown from "./ReminderDropdown";
import ReminderTextInput from "./ReminderTextInput";
import { Calendar } from "lucide-react";
import { useState } from "react";
import { getNextCronOccurrence } from "@/lib/cron_utils";
import ReminderLongTextInput from "./ReminderLongTextInput";

interface ReminderViewProps {
  reminder?: Reminder;
}

type MemberEnum = Enums<"MemberType">;
type Reminder = Tables<"reminders">;
const MEMBER_TYPES = ["Admin", "Tree Keeper"] as const satisfies readonly MemberEnum[];

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export default function ReminderView(props: ReminderViewProps) {
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
          <ReminderDropdown label="Assignees" options={[...MEMBER_TYPES]} placeholder={MEMBER_TYPES[0]} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-avenir text-m font-normal text-text-dark">Schedule</span>
        <div className="flex flex-row gap-4">
          <div className="flex basis-1/2 text-text-muted">
            <ReminderDropdown label="Day of Week" options={[...WEEK_DAYS]} placeholder={WEEK_DAYS[0]} />
          </div>
          <div className="flex basis-1/2 text-text-muted">
            <ReminderTextInput label="Time" placeholder="8:00 AM" />
          </div>
        </div>
      </div>
      <div className="h-25 bg-table-header rounded-3xl flex flex-row items-center gap-3">
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
      {/* <div className="h-20 bg-table-header rounded-3xl flex flex-row items-center gap-3">
        <div className="flex flex-col gap-1 font-avenir text-sm ml-4">
          <span className="text-text-dark">Active Status</span>
          <span className="text-text-muted">This reminder is currently active</span>
        </div>
      </div> */}
    </div>
  );
}
