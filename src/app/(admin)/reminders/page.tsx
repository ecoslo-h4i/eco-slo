"use client";

import RemindersList from "@/components/reminders/RemindersList";
import ReminderView from "@/components/reminders/ReminderView";
import type { Tables } from "@/database/database.types";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type Member = Tables<"members">;
type Reminder = Tables<"reminders">;
type Template = Tables<"templates">;
type ReminderViewMode = "create" | "edit" | "view";

export default function Reminders() {
  const [members, setMembers] = useState<Member[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedReminderId, setSelectedReminderId] = useState<number | null>(null);
  const [reminderViewMode, setReminderViewMode] = useState<ReminderViewMode>("create");

  useEffect(() => {
    const fetchData = async () => {
      const [membersData, remindersData, templatesData] = await Promise.all([
        fetchMembers(),
        fetchReminders(),
        fetchTemplates(),
      ]);

      remindersData.sort((a, b) => Number(b.is_active) - Number(a.is_active));
      setMembers(membersData);
      setReminders(remindersData);
      setTemplates(templatesData);
    };

    fetchData();
  }, []);

  const assigneeLabels = useMemo(() => getAssigneeLabels(reminders, members), [members, reminders]);
  const selectedReminder = useMemo(
    () => reminders.find((reminder) => reminder.id === selectedReminderId),
    [reminders, selectedReminderId],
  );
  const selectedAssigneeLabel = selectedReminder ? assigneeLabels[selectedReminder.id] : undefined;

  const handleCreateReminder = () => {
    setSelectedReminderId(null);
    setReminderViewMode("create");
  };

  const handleSelectReminder = (reminderId: number) => {
    setSelectedReminderId(reminderId);
    setReminderViewMode("view");
  };

  const handleEditReminder = () => {
    if (selectedReminderId === null) return;

    setReminderViewMode("edit");
  };

  const handleReminderSaved = (savedReminder: Reminder) => {
    setReminders((currentReminders) => {
      const reminderExists = currentReminders.some((reminder) => reminder.id === savedReminder.id);
      const nextReminders = reminderExists
        ? currentReminders.map((reminder) => (reminder.id === savedReminder.id ? savedReminder : reminder))
        : [savedReminder, ...currentReminders];

      return nextReminders.sort((a, b) => Number(b.is_active) - Number(a.is_active));
    });
    setSelectedReminderId(savedReminder.id);
    setReminderViewMode("view");
  };

  const handleReminderDeleted = (deletedReminderId: number) => {
    setReminders((currentReminders) => currentReminders.filter((reminder) => reminder.id !== deletedReminderId));
    setSelectedReminderId(null);
    setReminderViewMode("create");
  };

  return (
    <main className="flex h-screen flex-1 flex-col overflow-hidden bg-background px-8 py-10">
      <header className="flex flex-row items-center justify-between pt-5">
        <h1 className="text-[56px] font-[Constantia] font-semibold leading-none">Automated Reminders</h1>
        <button
          className="h-10 w-40 bg-primary rounded-full text-white font-avenir flex flex-row items-center justify-center hover:bg-primary-light transition-colors duration-200 cursor-pointer"
          onClick={handleCreateReminder}
        >
          <span>New Reminder</span>
          <Image src="/icons/plus.svg" alt="Plus Icon" width={20} height={20} className="ml-2" />
        </button>
      </header>
      <div className="mt-10 flex min-h-0 flex-1 flex-row gap-8">
        <div className="min-h-0 basis-1/3">
          <RemindersList
            reminders={reminders}
            assigneeLabels={assigneeLabels}
            selectedReminderId={selectedReminderId}
            onSelectReminder={handleSelectReminder}
          />
        </div>
        <div className="min-h-0 basis-2/3">
          <ReminderView
            key={`${selectedReminder?.id ?? "new"}-${members.length}`}
            assigneeLabel={selectedAssigneeLabel}
            members={members}
            mode={reminderViewMode}
            onCancel={handleCreateReminder}
            onDeleted={handleReminderDeleted}
            onEdit={handleEditReminder}
            onSaved={handleReminderSaved}
            reminder={selectedReminder}
            templates={templates}
          />
        </div>
      </div>
    </main>
  );
}

async function fetchMembers(): Promise<Member[]> {
  const response = await fetch("/api/admin/members");

  if (!response.ok) return [];

  const data = await response.json();
  return (data.message ?? []) as Member[];
}

async function fetchReminders(): Promise<Reminder[]> {
  const response = await fetch("/api/admin/reminders");

  if (!response.ok) return [];

  const data = await response.json();
  return (data.message ?? []) as Reminder[];
}

async function fetchTemplates(): Promise<Template[]> {
  const response = await fetch("/api/admin/templates");

  if (!response.ok) return [];

  const data = await response.json();
  return (data.message ?? []) as Template[];
}

function getAssigneeLabels(reminders: Reminder[], members: Member[]) {
  const membersById = new Map(members.map((member) => [member.id, member]));

  return Object.fromEntries(
    reminders.map((reminder) => {
      const roles = reminder.assignees.map((id) => `${membersById.get(id)?.role ?? "General Volunteer"}s`);

      return [reminder.id, [...new Set(roles)].join(", ")] as const;
    }),
  );
}
