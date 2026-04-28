"use client";

import { ControlFilterDropdown, ControlSearch, ControlStatusPills } from "@/components/ControlPanel";
import { TaskSchema } from "@/components/data-table/table-widget-defs";
import { useState } from "react";

export default function Tasks() {
  //TODO: integrate backend instead of using mock data
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

  return (
    <main className="flex-1 min-w-0 bg-[#f6f2ec]">
      <div className="flex flex-col ml-[20px] mt-[15px] mr-[20px] gap-[20px]">
        <header className="flex items-center justify-between pt-5">
          <h1 className="flex text-[36px] font-[Constantia] font-bold">Tasks</h1>
        </header>

        <div className="rounded-xl border-[1px] border-[#d8d3ca] drop-shadow-sm bg-[#ebe7de] w-auto h-auto">
          <TasksControlPanel
            setStatusFunction={setStatus}
            setSurveyFunction={setSurveys}
            searchFunction={() => console.log("placeholder")}
          />
        </div>

        <div className="flex flex-col rounded-xl border-[1px] border-[#d8d3ca] drop-shadow-sm bg-[#ebe7de] w-auto h-[570px] overflow-hidden">
          <div className="flex-1 overflow-y-scroll no-scrollbar p-[15px]">
            <div className="flex flex-col gap-[10px]">
              {filter(tasks, status, surveys).map((task) => {
                return <TaskCard key={String(task.id)} task={task} />;
              })}
            </div>
          </div>

          <div className="border-t border-[#ded9cf] border-t-[1.5px] px-[15px] py-[10px] text-[#6b6661] text-[14px] bg-[#ebe7de] font-semibold">
            Showing {filter(tasks, status, surveys).length} tasks
          </div>
        </div>
      </div>
    </main>
  );
}

interface TaskControlPanelProps {
  setStatusFunction: (status: string) => void;
  setSurveyFunction: (survey: string) => void;
  searchFunction: (query: string) => void;
}

//TODO: integrate filterability
function TasksControlPanel(props: TaskControlPanelProps) {
  const CONTROL_STATUS_OPTIONS = ["All", "Done"];
  const ASSIGNEE_STATUS_OPTIONS = ["All Assignees"];
  const SURVEY_OPTIONS = ["All Tasks", "Surveys Needed", "Surveys Complete"];
  const [searchQuery, setSearchQuery] = useState("");
  const [statusActiveIndex, setStatusActiveIndex] = useState(0);
  const [assigneesActiveIndex, setAssigneesActiveIndex] = useState(0);
  const [surveysActiveIndex, setSurveyActiveIndex] = useState(0);
  const QUERY_DELAY = 0;

  return (
    <div className="w-full">
      <div className="flex w-full flex-col justify-center rounded-[24px] sm:rounded-[32px] bg-inherit px-4 sm:px-6 lg:px-10 py-6 sm:py-8 gap-6">
        <ControlSearch
          query={searchQuery}
          onQueryChange={setSearchQuery}
          searchDelay={QUERY_DELAY}
          searchFunction={(query: string) => {
            const trimmedQuery = query.trimStart();
            props.searchFunction(trimmedQuery);
          }}
          placeholder={"Search tasks, messages, or assignees..."}
        />
        <div className="w-full">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-4 w-full xl:flex-row xl:items-end">
              <div className="w-full xl:w-auto">
                <ControlStatusPills
                  pillClassName="w-full sm:w-auto sm:min-w-[220px] lg:min-w-[256px]"
                  activeIndex={statusActiveIndex}
                  onActiveIndexChange={setStatusActiveIndex}
                  text="Status"
                  options={CONTROL_STATUS_OPTIONS}
                  delay={QUERY_DELAY}
                  delayFunction={(status: string) => props.setStatusFunction(status)}
                />
              </div>
              <div className="flex flex-col gap-4 w-full sm:flex-row">
                <ControlFilterDropdown
                  triggerClassName="w-full min-w-0 sm:w-[240px] lg:w-[456px]"
                  label="Assignee"
                  activeIndex={assigneesActiveIndex}
                  onActiveIndexChange={setAssigneesActiveIndex}
                  dropDown={ASSIGNEE_STATUS_OPTIONS}
                  delay={QUERY_DELAY}
                  delayFunction={() =>
                    //TODO: once backend is implemented, implement assignee filter logic
                    console.log("PlaceHolder")
                  }
                />
                <ControlFilterDropdown
                  triggerClassName="w-full min-w-0 sm:w-[240px] lg:w-[456px]"
                  label="Surveys"
                  activeIndex={surveysActiveIndex}
                  onActiveIndexChange={setSurveyActiveIndex}
                  dropDown={SURVEY_OPTIONS}
                  delay={QUERY_DELAY}
                  delayFunction={(status: string) => props.setSurveyFunction(status)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskCard(props: { task: TaskSchema }) {
  const task = props.task;
  return (
    <div className="flex flex-col rounded-xl bg-[#ffffff] w-auto h-fit p-[16px]">
      <div className="flex flex-col gap-[10px] mb-[15px]">
        <p className="text-black text-[16px] font-[Constantia] font-semibold">{task.title}</p>
        <p className="text-[#6b6661] text-[16px] font-[Constantia]">{task.message}</p>
      </div>
      <hr className="border-[.5px] border-[#e8e6e0]"></hr>
      <div className="flex flex-row gap-[8px]">
        <div className="flex flex-row gap-[5px]">
          <p className="font-semibold">{task.assignees?.length} </p>
          <p className="text-[#6b6661]">assignees</p>
        </div>
        <div className="flex flex-row">
          <p className="font-semibold">{task.is_complete ? task.surveys_needed : 0}</p>
          <p className="text-[#6b6661]">/{task.surveys_needed}</p>
        </div>
        <div className="flex flex-row">
          <p className="text-[#6b6661]">Due {task.completion_date?.substring(0, 11)}</p>
        </div>
      </div>
    </div>
  );
}

function filter(tasks: TaskSchema[], status: string, surveys: string) {
  tasks = tasks.filter((task) => {
    return (
      (status == "All" || task.is_complete) &&
      (surveys == "All Tasks" || Number(surveys == "Surveys Needed") ^ Number(task.is_complete))
    );
  });
  return tasks;
}
