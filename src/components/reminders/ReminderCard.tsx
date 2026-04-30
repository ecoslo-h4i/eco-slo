import { formatCronSummary } from "@/lib/cron_utils";
import { useEffect, useState } from "react";
import { Clock, Dot } from "lucide-react";

interface ReminderCardProps {
  name: string;
  is_active: boolean;
  assignees: string;
  crons_expression: string;
  selected: boolean;
  onClick?: () => void;
}

export default function ReminderCard(props: ReminderCardProps) {
  const [scheduleSummary, setScheduleSummary] = useState<string[]>(["", ""]);

  useEffect(() => {
    const parseCronExpression = () => {
      try {
        const summary = formatCronSummary(props.crons_expression).split(" - ");
        setScheduleSummary([summary[0], summary[1]]);
      } catch (error) {
        setScheduleSummary(["Error", "Invalid schedule"]);
      }
    };

    parseCronExpression();
  }, []);

  return (
    <div
      className={`flex w-full flex-col gap-2 rounded-2xl px-4 py-4 hover:cursor-pointer transition-colors duration-200 ${props.selected ? "bg-primary" : "bg-table-header hover:bg-active-pill"}`}
      onClick={props.onClick}
    >
      <div className="flex flex-row items-center justify-between">
        <span
          className={`font-[Constantia] font-medium text-m ${props.selected ? "text-text-light" : "text-text-dark"}`}
        >
          {props.name}
        </span>
        <div
          className={`text-sm font-avenir font-normal px-2 py-1 rounded-full ${props.selected ? "bg-primary-extra-light text-text-light" : props.is_active ? "bg-active-pill text-primary border-1 border-pill-border" : "bg-inactive-pill text-gray-500"}`}
        >
          {props.is_active ? "Active" : "Inactive"}
        </div>
      </div>
      <span className={`text-sm font-avenir ${props.selected ? "text-text-light" : "text-text-muted"}`}>
        {props.assignees}
      </span>
      <div
        className={`flex flex-row items-center text-sm font-avenir ${props.selected ? "text-text-light" : "text-text-muted"}`}
      >
        <Clock className="mr-1" size={16} color={`${props.selected ? "#ffffff" : "#6b6662"}`} />
        <span>{scheduleSummary[0]}</span>
        <Dot color={`${props.selected ? "#ffffff" : "#6b6662"}`} />
        <span>{scheduleSummary[1]}</span>
      </div>
    </div>
  );
}
