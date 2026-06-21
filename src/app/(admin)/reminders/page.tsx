"use client";

import RemindersList from "@/components/reminders/RemindersList";
import ReminderView from "@/components/reminders/ReminderView";
import type { Tables } from "@/database/database.types";
import { AppButton } from "@/components/ui/form-controls";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminPageShell } from "@/components/admin-page-shell";
import { cn } from "@/lib/utils";

type Member = Tables<"members">;
type Reminder = Tables<"reminders">;
type Template = Tables<"templates">;
type ReminderViewMode = "create" | "edit" | "view";
// Below md only one pane fits, so the page swaps between the overview list
// and the editor; both stay mounted (just hidden) so desktop and form state
// are unaffected.
type MobilePane = "list" | "editor";

export default function Reminders() {
  const [members, setMembers] = useState<Member[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedReminderId, setSelectedReminderId] = useState<number | null>(null);
  const [reminderViewMode, setReminderViewMode] = useState<ReminderViewMode>("create");
  const [mobilePane, setMobilePane] = useState<MobilePane>("list");

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
    setMobilePane("editor");
  };

  // Cancel resets the editor like handleCreateReminder, but on mobile it
  // returns to the list instead of leaving a blank editor on screen.
  const handleCancelEdit = () => {
    setSelectedReminderId(null);
    setReminderViewMode("create");
    setMobilePane("list");
  };

  const handleSelectReminder = (reminderId: number) => {
    setSelectedReminderId(reminderId);
    setReminderViewMode("view");
    setMobilePane("editor");
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
    setMobilePane("list");
  };

  return (
    <AdminPageShell
      title="Reminders"
      className="h-full overflow-hidden"
      contentClassName="h-full min-h-0"
      actions={
        <AppButton icon={Plus} radius="small" onClick={handleCreateReminder}>
          New Reminder
        </AppButton>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-6 md:flex-row md:gap-8">
        <div className={cn("min-h-0 flex-1 md:grow-0 md:basis-1/3", mobilePane === "editor" && "max-md:hidden")}>
          <RemindersList
            reminders={reminders}
            assigneeLabels={assigneeLabels}
            selectedReminderId={selectedReminderId}
            onSelectReminder={handleSelectReminder}
          />
        </div>
        <div className={cn("min-h-0 flex-1 md:grow-0 md:basis-2/3", mobilePane === "list" && "max-md:hidden")}>
          <ReminderView
            key={`${selectedReminder?.id ?? "new"}-${members.length}`}
            assigneeLabel={selectedAssigneeLabel}
            members={members}
            mode={reminderViewMode}
            onBack={() => setMobilePane("list")}
            onCancel={handleCancelEdit}
            onDeleted={handleReminderDeleted}
            onEdit={handleEditReminder}
            onSaved={handleReminderSaved}
            reminder={selectedReminder}
            templates={templates}
          />
        </div>
      </div>
    </AdminPageShell>
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
      const roles = reminder.assignees.map((id) => `${membersById.get(id)?.role ?? "General Member"}s`);

      return [reminder.id, [...new Set(roles)].join(", ")] as const;
    }),
  );
}
