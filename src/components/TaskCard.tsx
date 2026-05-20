import { TaskSchema } from "@/components/data-table/table-widget-defs";

interface TaskCardProps {
  task: TaskSchema;
}

export function TaskCard({ task }: TaskCardProps) {
  return (
    <div className="flex flex-col rounded-xl bg-card w-auto h-fit p-4">
      <div className="flex flex-col gap-2.5 mb-4">
        <p className="text-black text-[16px] font-serif font-semibold">{task.title}</p>
        <p className="text-text-muted text-[16px] font-serif">{task.message}</p>
      </div>

      <hr className="border-[.5px] border-border" />

      <div className="flex flex-row gap-2">
        <div className="flex flex-row gap-1">
          <p className="font-semibold">{task.assignees?.length}</p>
          <p className="text-text-muted">assignees</p>
        </div>

        <div className="flex flex-row">
          <p className="font-semibold">{task.is_complete ? task.surveys_needed : 0}</p>
          <p className="text-text-muted">/{task.surveys_needed}</p>
        </div>

        <div className="flex flex-row">
          <p className="text-text-muted">Due {task.completion_date?.substring(0, 10)}</p>
        </div>
      </div>
    </div>
  );
}
