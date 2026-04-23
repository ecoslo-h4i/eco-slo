"use client";
import { useState, useEffect, useRef } from "react";
import type { Tables } from "@/database/database.types";
import ReminderCard from "./ReminderCard";

type Reminder = Tables<"reminders">;
type Member = Tables<"members">;
type RoleCache = Record<number, Promise<string>>;

export default function RemindersList() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selectedReminderId, setSelectedReminderId] = useState<number | null>(null);
  const [assigneeLabels, setAssigneeLabels] = useState<Record<number, string>>({});
  const roleCacheRef = useRef<RoleCache>({});

  useEffect(() => {
    const fetchData = async () => {
      const remindersData = await fetchReminders();
      remindersData.sort((a, b) => (b.is_active as unknown as number) - (a.is_active as unknown as number));
      setReminders(remindersData);

      const labels = await Promise.all(
        remindersData.map(
          async (reminder) =>
            [reminder.id, await rolesFromAssignees(reminder.assignees, roleCacheRef.current)] as const,
        ),
      );

      setAssigneeLabels(Object.fromEntries(labels));
    };

    fetchData();
  }, []);

  return (
    <div className="flex max-h-full min-h-0 flex-col gap-6 overflow-hidden rounded-3xl border-1 border-border bg-table-row-dark px-6 py-8">
      <h2 className="font-[Constantia] text-xl font-semibold leading-none">Reminders</h2>
      <div className="min-h-0 no-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
        {reminders.length > 0 ? (
          reminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              name={reminder.name}
              is_active={reminder.is_active}
              crons_expression={reminder.crons_expression}
              // Unique roles for each member in assignees
              assignees={assigneeLabels[reminder.id] || "Loading roles..."}
              selected={selectedReminderId === reminder.id}
              onClick={() => setSelectedReminderId(reminder.id)}
            />
          ))
        ) : (
          <span className="font-avenir">Loading...</span>
        )}
      </div>
    </div>
  );
}

async function fetchReminders(): Promise<Reminder[]> {
  const response = await fetch("/api/admin/reminders");
  if (!response.ok) {
    return [] as Reminder[];
  }
  const data = await response.json();
  return data.message as Reminder[];
}

async function rolesFromAssignees(assignees: number[], roleCache: RoleCache): Promise<string> {
  const rolePromises = assignees.map((id) => {
    // If we have already fetched the role for this member, return the cached promise
    if (!roleCache[id]) {
      roleCache[id] = fetch(`/api/admin/members/${id}`)
        .then(async (response) => {
          let role = "General Volunteer";

          if (response.ok) {
            const data = await response.json();
            const member: Member = data.data as Member;
            role = (member.role as string) || role;
          }

          return `${role}s`;
        })
        .catch(() => "General Volunteers");
    }

    return roleCache[id];
  });

  const roles = await Promise.all(rolePromises);
  return [...new Set(roles)].join(", ");
}
