import { formatCronSummary } from "@/lib/cron_utils";
import { useEffect, useState } from "react";
import { Clock, Dot } from "lucide-react";
import Badge from "@/components/badge";

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
      } catch {
        setScheduleSummary(["Error", "Invalid schedule"]);
      }
    };

    parseCronExpression();
  }, [props.crons_expression]);

  return (
    <div
      className={`flex w-full flex-col gap-4 rounded-3xl p-6 hover:cursor-pointer transition-colors duration-200 ${
        props.selected
          ? "bg-card border-l-4 border-primary"
          : props.is_active
            ? "bg-card hover:bg-off-white-3 border-l-4 border-transparent"
            : "bg-table-header hover:bg-button-muted border-l-4 border-transparent"
      }`}
      onClick={props.onClick}
    >
      <div className="flex flex-row items-start justify-between gap-2">
        <div>
          <span className={`font-serif font-normal text-xl ${props.is_active ? "text-text-dark" : "text-text-subtle"}`}>
            {props.name}
          </span>
        </div>
        <Badge variant={props.is_active ? "success" : "danger"} size="sm">
          {props.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>
      <div className="flex flex-col gap-1">
        <span
          className={`text-m font-mulish font-semibold ${props.is_active ? "text-text-muted" : "text-text-subtle"}`}
        >
          {props.assignees}
        </span>
        <div
          className={`flex flex-row items-center text-m font-mulish ${
            props.is_active ? "text-text-muted" : "text-text-subtle"
          }`}
        >
          <Clock className="mr-1" size={16} />
          <span>{scheduleSummary[0]}</span>
          <Dot />
          <span>{scheduleSummary[1]}</span>
        </div>
      </div>
    </div>
  );
}
