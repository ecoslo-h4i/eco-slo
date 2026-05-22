"use client";

import Fuse from "fuse.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TaskCard, type TaskSchemaWithNames } from "@/components/TaskCard";
import { TasksControlPanel, STATUS_OPTIONS, SURVEY_OPTIONS } from "@/components/TasksControlPanel";
import TaskDetailModal from "@/components/TaskDetailModal";
import ExportCSVModal from "@/components/ExportCSVModal";
import { createUserLevelClient } from "@/lib/supabase/client";
import { AdminPageShell } from "@/components/admin-page-shell";
import {
  AppButton,
  appButtonClassName,
  dropdownContentClassName,
  dropdownItemClassName,
  selectTriggerClassName,
} from "@/components/ui/form-controls";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/dropdown-menu";
import { useCurrentMember } from "@/hooks/useCurrentProvider";
import { cn } from "@/lib/utils";
import { Download, Plus, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

async function getTasks(): Promise<TaskSchemaWithNames[]> {
  const supabase = createUserLevelClient();

  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (tasksError) throw new Error(tasksError.message);
  if (!tasks || tasks.length === 0) return [];

  const assigneeIds = Array.from(new Set(tasks.flatMap((task) => task.assignees ?? [])));

  let nameById = new Map<number, string>();
  if (assigneeIds.length > 0) {
    const { data: members, error: membersError } = await supabase
      .from("public_members")
      .select("id, firstname, lastname")
      .in("id", assigneeIds);

    if (membersError) {
      console.error("[tasks] failed to fetch member names:", membersError);
    } else if (members) {
      nameById = new Map(members.map((m) => [m.id, `${m.firstname} ${m.lastname}`]));
    }
  }

  return tasks.map((task) => ({
    ...task,
    names: (task.assignees ?? []).map((id: number) => nameById.get(id) ?? "Unknown"),
  }));
}

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];

export default function Tasks() {
  const { isAdmin } = useCurrentMember();

  const [status, setStatus] = useState(STATUS_OPTIONS[1]);
  const [surveys, setSurveys] = useState(SURVEY_OPTIONS[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [assignees, setAssignees] = useState<string[]>([]);

  const [tasks, setTasks] = useState<TaskSchemaWithNames[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [modalTask, setModalTask] = useState<TaskSchemaWithNames | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const data = await getTasks();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const allAssignees = useMemo(() => ["All", ...new Set(tasks.flatMap((task) => task.names))], [tasks]);

  const filteredTasks = useMemo(
    () => filterTasks(tasks, status, surveys, assignees, searchQuery),
    [tasks, status, surveys, assignees, searchQuery],
  );

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedTasks = filteredTasks.slice(startIndex, startIndex + pageSize);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setCurrentPage(1);
  }, [status, surveys, assignees, searchQuery, pageSize]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleTaskClick = (task: TaskSchemaWithNames) => {
    setModalTask(task);
    setTaskModalOpen(true);
  };

  const handleAddTaskClick = () => {
    setModalTask(null);
    setTaskModalOpen(true);
  };

  const handleModalOpenChange = (open: boolean) => {
    setTaskModalOpen(open);
    if (!open) setModalTask(null);
  };

  const actions = (
    <>
      {isAdmin ? (
        <AppButton
          radius="small"
          variant="secondary"
          icon={<Download className="h-4 w-4" />}
          onClick={() => setExportModalOpen(true)}
        >
          Export CSV
        </AppButton>
      ) : null}
      {isAdmin ? (
        <AppButton radius="small" variant="primary" icon={<Plus className="h-4 w-4" />} onClick={handleAddTaskClick}>
          Add Task
        </AppButton>
      ) : null}
    </>
  );

  return (
    <>
      <AdminPageShell title="Tasks" actions={actions}>
        {error ? (
          <div className="flex min-h-[570px] w-full items-center justify-center text-danger">{error}</div>
        ) : loading ? (
          <div className="flex min-h-[570px] w-full items-center justify-center text-text-muted">Loading tasks…</div>
        ) : (
          <>
            <TasksControlPanel
              setStatusFunction={setStatus}
              setSurveyFunction={setSurveys}
              searchFunction={setSearchQuery}
              assignees={allAssignees}
              setAssigneesFunction={setAssignees}
              selectedAssignees={assignees}
              isAdmin={isAdmin}
            />

            <div className="flex flex-col rounded-xl border border-border shadow-sm bg-off-white w-auto min-h-[570px] overflow-hidden">
              <div className="flex-1 overflow-y-auto no-scrollbar p-4">
                {paginatedTasks.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-text-muted font-mulish py-20">
                    No tasks match your filters.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {paginatedTasks.map((task) => (
                      <TaskCard key={String(task.id)} task={task} onClick={() => handleTaskClick(task)} />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-shrink-0 border-t border-border bg-off-white h-16">
                <div className="w-full h-full flex justify-between items-center px-4 lg:px-6 gap-x-2">
                  <div className="flex gap-2 items-center min-w-0">
                    <p className="text-text-dark font-medium">
                      Rows<span className="hidden lg:inline"> per page</span>:
                    </p>
                    <DropdownMenu open={pageSizeOpen} onOpenChange={setPageSizeOpen}>
                      <DropdownMenuTrigger
                        className={cn(selectTriggerClassName, "min-h-8 w-16 rounded-lg px-2 py-1 lg:w-20 lg:px-3")}
                      >
                        <span>{pageSize}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-text-muted transition-transform duration-200 ${pageSizeOpen && "rotate-180"}`}
                        />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className={dropdownContentClassName}>
                        {PAGE_SIZE_OPTIONS.map((size) => (
                          <DropdownMenuItem
                            key={size}
                            className={dropdownItemClassName}
                            onClick={() => setPageSize(size)}
                          >
                            {size}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <p className="min-w-0 flex-1 text-text-muted truncate">
                      <span className="hidden lg:inline">Showing </span>
                      <span>{filteredTasks.length === 0 ? 0 : startIndex + 1}</span> to{" "}
                      <span>{Math.min(startIndex + pageSize, filteredTasks.length)}</span> of{" "}
                      <span>{filteredTasks.length}</span>
                      <span> tasks</span>
                    </p>
                  </div>
                  <div className="flex gap-1 items-center">
                    <button
                      type="button"
                      className={appButtonClassName({
                        className: "hidden lg:inline-flex",
                        iconOnly: true,
                        variant: "secondary",
                      })}
                      disabled={safePage <= 1}
                      onClick={() => setCurrentPage(1)}
                      aria-label="First page"
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className={appButtonClassName({ iconOnly: true, variant: "secondary" })}
                      disabled={safePage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <p className="mx-1 shrink-0 text-text-dark">
                      <span className="hidden lg:inline">Page </span>
                      <span>{safePage}</span> of <span>{totalPages}</span>
                    </p>
                    <button
                      type="button"
                      className={appButtonClassName({ iconOnly: true, variant: "secondary" })}
                      disabled={safePage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className={appButtonClassName({
                        className: "hidden lg:inline-flex",
                        iconOnly: true,
                        variant: "secondary",
                      })}
                      disabled={safePage >= totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                      aria-label="Last page"
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </AdminPageShell>

      <TaskDetailModal
        task={modalTask}
        open={taskModalOpen}
        onOpenChange={handleModalOpenChange}
        onSaved={() => void fetchTasks()}
        isAdmin={isAdmin}
      />

      <ExportCSVModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        allTasks={tasks}
        filteredTasks={filteredTasks}
      />
    </>
  );
}

function filterTasks(
  tasks: TaskSchemaWithNames[],
  status: string,
  surveys: string,
  assignees: string[],
  searchQuery: string,
) {
  const selectedAssignees = new Set(assignees.filter((a) => a !== "All"));

  const filteredByControls = tasks.filter((task) => {
    const isComplete = Boolean(task.is_complete);
    const surveysNeeded = task.surveys_needed ?? 0;

    const matchesStatus =
      status === "All" || (status === "Open" && !isComplete) || (status === "Completed" && isComplete);

    const matchesSurvey =
      surveys === "All" ||
      (surveys === "Needs Survey" && surveysNeeded > 0) ||
      (surveys === "No Survey Required" && surveysNeeded === 0);

    const matchesAssignees = selectedAssignees.size === 0 || task.names.some((name) => selectedAssignees.has(name));

    return matchesStatus && matchesSurvey && matchesAssignees;
  });

  if (!searchQuery) return filteredByControls;

  const fuse = new Fuse(filteredByControls, {
    keys: [
      { name: "title", weight: 0.3 },
      { name: "message", weight: 0.3 },
      { name: "names", weight: 0.2 },
      { name: "id", weight: 0.2 },
    ],
    threshold: 0.3,
    ignoreLocation: true,
  });

  return fuse.search(searchQuery).map((result) => result.item);
}
