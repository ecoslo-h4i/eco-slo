"use client";

import { useState } from "react";
import { TaskSchema } from "@/components/data-table/table-widget-defs";
import { TaskCard } from "@/components/TaskCard";
import { TasksControlPanel } from "@/components/TasksControlPanel";

export default function Tasks() {
  // TODO: integrate backend instead of using mock data
  const tasks: TaskSchema[] = [
    {
      id: 1,
      assignees: [0, 0],
      completion_date: "2022-02-23 18:10:15+00",
      title: "Weekly Watering Reminder",
      message: "It's time for you to water the trees!",
      created_at: "2022-02-23 19:10:15+00",
      surveys_needed: 0,
      created_by: 0,
      is_complete: false,
    },
    {
      id: 2,
      assignees: [0, 0],
      completion_date: "2022-02-23 19:11:15+01",
      title: "Weekly Watering Reminder",
      message: "It's time for you to water the trees!",
      created_at: "2022-02-24 19:10:15+00",
      surveys_needed: 0,
      created_by: 0,
      is_complete: true,
    },
    {
      id: 3,
      assignees: [0, 0],
      completion_date: "2022-02-23 19:12:15+02",
      title: "Weekly Watering Reminder",
      message: "It's time for you to water the trees!",
      created_at: "2022-02-25 19:10:15+00",
      surveys_needed: 0,
      created_by: 0,
      is_complete: false,
    },
    {
      id: 4,
      assignees: [0, 0],
      completion_date: "2022-02-23 19:13:15+03",
      title: "Weekly Watering Reminder",
      message: "It's time for you to water the trees!",
      created_at: "2022-02-26 19:10:15+00",
      surveys_needed: 0,
      created_by: 0,
      is_complete: false,
    },
    {
      id: 5,
      assignees: [0, 0],
      completion_date: "2022-02-23 19:14:15+04",
      title: "Weekly Watering Reminder",
      message: "It's time for you to water the trees!",
      created_at: "2022-02-27 19:10:15+00",
      surveys_needed: 0,
      created_by: 0,
      is_complete: true,
    },
    {
      id: 6,
      assignees: [0, 0],
      completion_date: "2022-02-23 19:15:15+05",
      title: "Weekly Watering Reminder",
      message: "It's time for you to water the trees!",
      created_at: "2022-02-28 19:10:15+00",
      surveys_needed: 0,
      created_by: 0,
      is_complete: false,
    },
    {
      id: 7,
      assignees: [0, 0],
      completion_date: "2022-02-23 19:16:15+06",
      title: "Weekly Watering Reminder",
      message: "It's time for you to water the trees!",
      created_at: "2022-02-29 19:10:15+00",
      surveys_needed: 0,
      created_by: 0,
      is_complete: false,
    },
    {
      id: 8,
      assignees: [0, 0],
      completion_date: "2022-02-23 19:17:15+07",
      title: "Weekly Watering Reminder",
      message: "It's time for you to water the trees!",
      created_at: "2022-02-30 19:10:15+00",
      surveys_needed: 0,
      created_by: 0,
      is_complete: false,
    },
    {
      id: 9,
      assignees: [0, 0],
      completion_date: "2022-02-23 19:18:15+08",
      title: "Weekly Watering Reminder",
      message: "It's time for you to water the trees!",
      created_at: "2022-02-31 19:10:15+00",
      surveys_needed: 0,
      created_by: 0,
      is_complete: false,
    },
    {
      id: 10,
      assignees: [0, 0],
      completion_date: "2022-02-23 19:19:15+09",
      title: "Weekly Watering Reminder",
      message: "It's time for you to water the trees!",
      created_at: "2022-02-32 19:10:15+00",
      surveys_needed: 0,
      created_by: 0,
      is_complete: false,
    },
  ];

  const [status, setStatus] = useState("All");
  const [surveys, setSurveys] = useState("All Tasks");

  const filteredTasks = filterTasks(tasks, status, surveys);

  return (
    <main className="flex-1 min-w-0 bg-[#f6f2ec]">
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
    </main>
  );
}

function filterTasks(tasks: TaskSchema[], status: string, surveys: string) {
  return tasks.filter((task) => {
    return (
      (status === "All" || task.is_complete) &&
      (surveys === "All Tasks" || Number(surveys === "Surveys Needed") ^ Number(task.is_complete))
    );
  });
}
