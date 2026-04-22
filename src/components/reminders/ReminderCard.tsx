import { formatCronSummary } from "@/lib/cron_utils";

interface ReminderCardProps {
  name: string;
  is_active: boolean;
  assignees: string;
  crons_expression: string;
  selected: boolean;
  onClick?: () => void;
}

export default function ReminderCard(props: ReminderCardProps) {
  return (
    <div className="flex w-full flex-col gap-2 rounded-2xl bg-table-header px-4 py-4">
      <div className="flex flex-row items-center justify-between">
        <span className="font-[Constantia] font-medium text-m">{props.name}</span>
        <div
          className={`text-sm font-avenir font-normal px-2 py-1 rounded-full ${props.is_active ? "bg-active-pill text-primary border-1 border-pill-border" : "bg-inactive-pill text-gray-500"}`}
        >
          {props.is_active ? "Active" : "Inactive"}
        </div>
      </div>
      <span className="text-text-muted font-avenir">{props.assignees}</span>
      <div className="flex flex-row">
        <span className="text-text-muted font-avenir">{formatCronSummary(props.crons_expression)}</span>
      </div>
    </div>
  );
}
