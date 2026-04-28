"use client";

import { useState } from "react";
import { ControlFilterDropdown, ControlSearch, ControlStatusPills } from "@/components/ControlPanel";

interface TasksControlPanelProps {
  setStatusFunction: (status: string) => void;
  setSurveyFunction: (survey: string) => void;
  searchFunction: (query: string) => void;
}

export function TasksControlPanel(props: TasksControlPanelProps) {
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
      <div className="flex w-full flex-col justify-center rounded-[24px] sm:rounded-[32px] bg-inherit px-4 sm:px-6 lg:px-8 py-6 gap-6">
        <ControlSearch
          query={searchQuery}
          onQueryChange={setSearchQuery}
          searchDelay={QUERY_DELAY}
          searchFunction={(query: string) => {
            const trimmedQuery = query.trimStart();
            props.searchFunction(trimmedQuery);
          }}
          placeholder="Search tasks, messages, or assignees..."
        />

        <div className="w-full">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-4 w-full xl:flex-row xl:items-end">
              <div className="w-full xl:w-auto">
                <ControlStatusPills
                  pillClassName="w-full min-w-0 xl:w-[340px]"
                  activeIndex={statusActiveIndex}
                  onActiveIndexChange={setStatusActiveIndex}
                  text="Status"
                  options={CONTROL_STATUS_OPTIONS}
                  delay={QUERY_DELAY}
                  delayFunction={(status: string) => props.setStatusFunction(status)}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full min-w-0">
                <ControlFilterDropdown
                  triggerClassName="w-full min-w-0 sm:flex-1 xl:w-[320px]"
                  label="Assignee"
                  activeIndex={assigneesActiveIndex}
                  onActiveIndexChange={setAssigneesActiveIndex}
                  dropDown={ASSIGNEE_STATUS_OPTIONS}
                  delay={QUERY_DELAY}
                  delayFunction={() => console.log("PlaceHolder")}
                />

                <ControlFilterDropdown
                  triggerClassName="w-full min-w-0 sm:flex-1 xl:w-[320px]"
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
