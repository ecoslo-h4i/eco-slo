"use client";

import Fuse from "fuse.js";
import { useEffect, useState } from "react";
import { TaskSchema } from "@/components/data-table/table-widget-defs";
import { TaskCard } from "@/components/TaskCard";
import { TasksControlPanel } from "@/components/TasksControlPanel";
import { Database } from "@/database/database.types";

type AdminTasksResponse = {
  message?: Database["public"]["Tables"]["tasks"]["Row"][] | string;
  error?: string;
};

interface TaskSchemaWithNames extends TaskSchema {
  names: string[];
}

export async function getTasks() {
  const response = await fetch("/api/admin/tasks");
  const payload = (await response.json()) as AdminTasksResponse;

  if (!response.ok) {
    throw new Error(payload.error ?? String(payload.message ?? "Failed to load members"));
  }

  if (!Array.isArray(payload.message)) return [];
  const result: TaskSchemaWithNames[] = await Promise.all(payload.message.map(async (row) => reMapAssignees(row)));
  return result;
}

async function reMapAssignees(row: Database["public"]["Tables"]["tasks"]["Row"]) {
  if (row.assignees) {
    const requests = row.assignees.map(async (assignee) => {
      const response = await fetch("api/admin/members/" + assignee)
        .then((response) => response.json())
        .then((response) => response.data.firstname + " " + response.data.lastname);
      return response;
    });
    const result = await Promise.all(requests);
    return {
      ...row,
      names: result,
    };
  }
  return {
    ...row,
    names: [],
  };
}

export default function Tasks() {
  // TODO: integrate backend instead of using mock data

  const [status, setStatus] = useState("All");
  const [surveys, setSurveys] = useState("All Tasks");
  const [searchQuery, setSearchQuery] = useState("");

  const [tasks, setTasks] = useState<TaskSchemaWithNames[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [assignees, setAssignees] = useState<string[]>([]);
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = await getTasks();
        if (mounted) {
          setTasks(data);
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

  const allAssignees = ["All", ...new Set(tasks.map((task) => task.names).flat())];
  const filteredTasks = filterTasks(tasks, status, surveys, assignees, searchQuery);

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
              searchFunction={setSearchQuery}
              assignees={allAssignees}
              setAssigneesFunction={setAssignees}
              selectedAssignees={assignees}
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

function filterTasks(
  tasks: TaskSchemaWithNames[],
  status: string,
  surveys: string,
  assignees: string[],
  searchQuery: string,
) {
  const selectedAssignees = new Set(assignees.filter((assignee) => assignee !== "All"));

  const filteredByControls = tasks.filter((task) => {
    const isComplete = Boolean(task.is_complete);

    const matchesStatus =
      status === "All" || (status === "Done" && isComplete) || (status === "Incomplete" && !isComplete);

    const matchesSurvey =
      surveys === "All Tasks" ||
      (surveys === "Surveys Needed" && !isComplete) ||
      (surveys === "Surveys Complete" && isComplete);

    const matchesAssignees = selectedAssignees.size === 0 || task.names.some((name) => selectedAssignees.has(name));

    return matchesStatus && matchesSurvey && matchesAssignees;
  });

  if (!searchQuery) {
    return filteredByControls;
  }
  const fuse = new Fuse(filteredByControls, {
    keys: [
      {
        name: "title",
        weight: 0.4,
      },
      {
        name: "message",
        weight: 0.35,
      },
      {
        name: "names",
        weight: 0.25,
      },
    ],
    threshold: 0.3,
    ignoreLocation: true,
  });

  return fuse.search(searchQuery).map((result) => result.item);
}
