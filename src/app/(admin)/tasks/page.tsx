"use client";

import Fuse from "fuse.js";
import { useEffect, useState } from "react";
import { TaskSchema } from "@/components/data-table/table-widget-defs";
import { TaskCard } from "@/components/TaskCard";
import { TasksControlPanel } from "@/components/TasksControlPanel";
import { createUserLevelClient } from "@/lib/supabase/client";
import { AdminPageShell } from "@/components/admin-page-shell";

interface TaskSchemaWithNames extends TaskSchema {
  names: string[];
}

export async function getTasks(): Promise<TaskSchemaWithNames[]> {
  const supabase = createUserLevelClient();

  // 1. Fetch tasks directly. RLS filters to:
  //    - Admins: all tasks
  //    - Tree Keepers: tasks where they're in the assignees array
  //    Sort matches the previous /api/admin/tasks behavior (newest first).
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (tasksError) {
    throw new Error(tasksError.message);
  }

  if (!tasks || tasks.length === 0) return [];

  // 2. Collect every assignee id referenced across all returned tasks,
  //    then batch-fetch their names from public_members in one round trip.
  //    public_members is readable by any authenticated user and exposes
  //    only id/firstname/lastname.
  const assigneeIds = Array.from(new Set(tasks.flatMap((task) => task.assignees ?? [])));

  let nameById = new Map<number, string>();
  if (assigneeIds.length > 0) {
    const { data: members, error: membersError } = await supabase
      .from("public_members")
      .select("id, firstname, lastname")
      .in("id", assigneeIds);

    if (membersError) {
      console.error("[tasks] failed to fetch member names:", membersError);
      // Non-fatal: render task rows with placeholders rather than crashing.
    } else if (members) {
      nameById = new Map(members.map((m) => [m.id, `${m.firstname} ${m.lastname}`]));
    }
  }

  // 3. Attach names to each task. An id without a matching member entry
  //    falls back to "Unknown" — shouldn't happen given current RLS, but
  //    survives the case where a member was deleted while a task still
  //    references their id.
  return tasks.map((task) => ({
    ...task,
    names: (task.assignees ?? []).map((id: number) => nameById.get(id) ?? "Unknown"),
  }));
}

export default function Tasks() {
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
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load tasks");
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
    <AdminPageShell title="Tasks">
      {error ? (
        <div className="flex min-h-[570px] w-full items-center justify-center text-danger">{error}</div>
      ) : (
        <>
          <div className="rounded-xl border-[1px] border-border drop-shadow-sm bg-muted-card-bg w-full min-w-0">
            <TasksControlPanel
              setStatusFunction={setStatus}
              setSurveyFunction={setSurveys}
              searchFunction={setSearchQuery}
              assignees={allAssignees}
              setAssigneesFunction={setAssignees}
              selectedAssignees={assignees}
            />
          </div>

          <div className="flex flex-col rounded-xl border-[1px] border-border drop-shadow-sm bg-muted-card-bg w-auto h-[570px] overflow-hidden">
            <div className="flex-1 overflow-y-scroll no-scrollbar p-[15px]">
              <div className="flex flex-col gap-[10px]">
                {filteredTasks.map((task) => (
                  <TaskCard key={String(task.id)} task={task} />
                ))}
              </div>
            </div>

            <div className="border-t border-border border-t-[1.5px] px-4 py-2.5 text-text-muted text-sm bg-muted-card-bg font-semibold">
              Showing {filteredTasks.length} tasks
            </div>
          </div>
        </>
      )}
    </AdminPageShell>
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
