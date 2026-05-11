import { TaskSchema } from "@/components/data-table/table-widget-defs";

interface TaskCardProps {
  task: TaskSchema;
}

export function TaskCard({ task }: TaskCardProps) {
  return (
    <div className="flex flex-col rounded-xl bg-[#ffffff] w-auto h-fit p-[16px]">
      <div className="flex flex-col gap-[10px] mb-[15px]">
        <p className="text-black text-[16px] font-[Constantia] font-semibold">{task.title}</p>
        <p className="text-[#6b6661] text-[16px] font-[Constantia]">{task.message}</p>
      </div>

      <hr className="border-[.5px] border-[#e8e6e0]" />

      <div className="flex flex-row gap-[8px]">
        <div className="flex flex-row gap-[5px]">
          <p className="font-semibold">{task.assignees?.length}</p>
          <p className="text-[#6b6661]">assignees</p>
        </div>

        <div className="flex flex-row">
          <p className="font-semibold">{task.is_complete ? task.surveys_needed : 0}</p>
          <p className="text-[#6b6661]">/{task.surveys_needed}</p>
        </div>

        <div className="flex flex-row">
          <p className="text-[#6b6661]">Due {task.completion_date?.substring(0, 10)}</p>
        </div>
      </div>
    </div>
  );
}
