"use client";

import { useEffect, useState } from "react";
import { TaskSchema } from "@/components/data-table/table-widget-defs";
import { TaskCard } from "@/components/TaskCard";
import { TasksControlPanel } from "@/components/TasksControlPanel";
import { Database } from "@/database/database.types";

type AdminTasksResponse = {
  message?: Database["public"]["Tables"]["tasks"]["Row"][] | string;
  error?: string;
};

export async function getTasks() {
  const response = await fetch("/api/admin/tasks");
  const payload = (await response.json()) as AdminTasksResponse;

  if (!response.ok) {
    throw new Error(payload.error ?? String(payload.message ?? "Failed to load members"));
  }

  if (!Array.isArray(payload.message)) return [];

  return payload.message;
}

export default function Tasks() {
  // TODO: integrate backend instead of using mock data

  const [status, setStatus] = useState("All");
  const [surveys, setSurveys] = useState("All Tasks");

  const [realTasks, setRealTasks] = useState<TaskSchema[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = await getTasks();
        if (mounted) {
          setRealTasks(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load trees");
      } finally {
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredTasks = filterTasks(realTasks, status, surveys);
  return (
    <main className="flex-1 min-w-0 bg-[#f6f2ec]">
      {error ? (
        <div className="w-full h-full flex justify-center items-center text-red-500">{error}</div>
      ) : (
        <div className="flex flex-col min-w-0 ml-[20px] mt-[15px] mr-[20px] gap-[20px]">
          <header className="flex items-center justify-between pt-5">
            <h1 className="flex text-[36px] font-[Constantia] font-bold">Tasks</h1>
          </header>

          <div className="rounded-xl border-[1px] border-[#d8d3ca] drop-shadow-sm bg-[#ebe7de] w-full min-w-0">
            <TasksControlPanel
              setStatusFunction={setStatus}
              setSurveyFunction={setSurveys}
              searchFunction={() => console.log("placeholder")}
            />
          </div>

          <div className="flex flex-col rounded-xl border-[1px] border-[#d8d3ca] drop-shadow-sm bg-[#ebe7de] w-auto h-[570px] overflow-hidden">
            <div className="flex-1 overflow-y-scroll no-scrollbar p-[15px]">
              <div className="flex flex-col gap-[10px]">
                {filteredTasks.map((task) => (
                  <TaskCard key={String(task.id)} task={task} />
                ))}
              </div>
            </div>

            <div className="border-t border-[#ded9cf] border-t-[1.5px] px-[15px] py-[10px] text-[#6b6661] text-[14px] bg-[#ebe7de] font-semibold">
              Showing {filteredTasks.length} tasks
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function filterTasks(tasks: TaskSchema[], status: string, surveys: string) {
  return tasks.filter((task) => {
    return (
      (status === "All" || Number(task.is_complete) ^ Number(status === "Incomplete")) &&
      (surveys === "All Tasks" || Number(surveys === "Surveys Needed") ^ Number(task.is_complete))
    );
  });
}
