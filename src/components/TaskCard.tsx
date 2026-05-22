"use client";

import Badge from "@/components/badge";
import { TaskSchema } from "@/components/data-table/table-widget-defs";
import { CalendarDays, CheckCircle2, ClipboardList, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TaskSchemaWithNames extends TaskSchema {
  names: string[];
}

interface TaskCardProps {
  task: TaskSchemaWithNames;
  onClick?: () => void;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const isComplete = Boolean(task.is_complete);
  const needsSurvey = (task.surveys_needed ?? 0) > 0;
  const isGroup = (task.assignees?.length ?? 0) > 1;

  return (
    <button
      type="button"
      className={cn(
        "flex w-full cursor-pointer flex-col rounded-xl border border-border bg-foreground p-4 text-left transition-colors hover:bg-off-white",
        isComplete && "opacity-60",
      )}
      onClick={onClick}
    >
      <div className="flex flex-col gap-1.5 mb-3">
        {task.title ? <p className="text-text-dark text-base font-serif font-bold leading-snug">{task.title}</p> : null}
        {task.message ? (
          <p className="text-text-muted text-sm font-mulish leading-snug line-clamp-2">{task.message}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        {isComplete ? (
          <Badge variant="success" size="sm" icon={<CheckCircle2 className="h-3 w-3" />}>
            Complete
          </Badge>
        ) : null}
        {needsSurvey && !isComplete ? (
          <Badge variant="default" size="sm" icon={<ClipboardList className="h-3 w-3" />}>
            Needs Survey
          </Badge>
        ) : null}
        {isGroup ? (
          <Badge variant="info" size="sm" icon={<Users className="h-3 w-3" />}>
            Group Task
          </Badge>
        ) : null}
      </div>

      <div className="bg-border h-px w-full mb-3" />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-mulish text-text-muted">
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {task.names.length > 0 ? task.names.join(", ") : "Unassigned"}
        </span>

        <span className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          {formatDate(task.created_at)}
        </span>

        {isComplete && task.completion_date ? (
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Completed {formatDate(task.completion_date)}
          </span>
        ) : null}
      </div>
    </button>
  );
}
