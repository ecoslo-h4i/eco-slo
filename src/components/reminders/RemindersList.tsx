"use client";
import type { Tables } from "@/database/database.types";
import ReminderCard from "./ReminderCard";

type Reminder = Tables<"reminders">;

interface RemindersListProps {
  assigneeLabels: Record<number, string>;
  onSelectReminder: (reminderId: number) => void;
  reminders: Reminder[];
  selectedReminderId: number | null;
}

export default function RemindersList({
  assigneeLabels,
  onSelectReminder,
  reminders,
  selectedReminderId,
}: RemindersListProps) {
  return (
    <div className="flex max-h-full min-h-0 flex-col gap-6 overflow-hidden rounded-xl border-1 border-border bg-table-row-dark p-6">
      <h2 className="font-serif text-[26px] font-normal leading-tight">Overview</h2>
      <div className="min-h-0 no-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
        {reminders.length > 0 ? (
          reminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              name={reminder.name}
              is_active={reminder.is_active}
              crons_expression={reminder.crons_expression}
              // Unique roles for each member in assignees
              assignees={assigneeLabels[reminder.id] || "No assignees"}
              selected={selectedReminderId === reminder.id}
              onClick={() => onSelectReminder(reminder.id)}
            />
          ))
        ) : (
          <span className="font-mulish">Loading...</span>
        )}
      </div>
    </div>
  );
}
