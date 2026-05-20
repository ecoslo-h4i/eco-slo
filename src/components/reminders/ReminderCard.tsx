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
      className={`flex w-full flex-col gap-4 rounded-3xl p-6 hover:cursor-pointer transition-colors duration-200 ${
        props.selected
          ? "bg-white border-l-4 border-l-primary border border-border"
          : props.is_active
            ? "bg-white hover:bg-active-pill"
            : "bg-table-header hover:bg-button-muted"
      }`}
      onClick={props.onClick}
    >
      <div className="flex flex-row items-center justify-between">
        <span className={`font-serif font-normal text-xl ${props.is_active ? "text-text-dark" : "text-text-subtle"}`}>
          {props.name}
        </span>
        <div
          className={`text-sm font-avenir font-normal px-2 py-1 rounded-full ${
            props.is_active
              ? "bg-active-pill text-primary border-1 border-pill-border"
              : "bg-danger-bg text-danger border-1 border-danger-border"
          }`}
        >
          {props.is_active ? "Active" : "Inactive"}
        </div>
      </div>
      <span className={`text-m font-avenir font-semibold ${props.is_active ? "text-text-muted" : "text-text-subtle"}`}>
        {props.assignees}
      </span>
      <div
        className={`flex flex-row items-center text-m font-avenir ${
          props.is_active ? "text-text-muted" : "text-text-subtle"
        }`}
      >
        <Clock className="mr-1" size={16} />
        <span>{scheduleSummary[0]}</span>
        <Dot />
        <span>{scheduleSummary[1]}</span>
      </div>
    </div>
  );
}
