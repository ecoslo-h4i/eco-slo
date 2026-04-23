import ReminderDropdown from "./ReminderDropdown";
import ReminderTextInput from "./ReminderTextInput";

export default function ReminderView() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-hidden rounded-3xl border-1 border-border bg-table-row-dark px-6 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-[Constantia] text-xl font-bold">Create New Reminder</h1>
        <span className="font-avenir text-m font-normal text-text-muted">
          Set up a new automated message for volunteers
        </span>
      </div>
      <hr className="border-0 border-t border-text-muted w-full"></hr>
      <ReminderTextInput label="Reminder Name *" placeholder="Weekly Watering Reminder" />
      <div className="flex flex-row gap-4">
        <div className="flex basis-1/2">
          <ReminderDropdown
            label="Type"
            options={["Watering Reminder, Other Reminder"]}
            placeholder="Watering Reminder"
          />
        </div>
        <div className="flex basis-1/2">
          <ReminderDropdown label="Assignees" options={["Tree Keepers, Admins"]} placeholder="Tree Keepers" />
        </div>
      </div>
    </div>
  );
}
