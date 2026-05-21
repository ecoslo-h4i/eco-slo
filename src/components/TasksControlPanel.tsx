"use client";

import { useState, type ReactNode } from "react";
import { ControlFilterDropdown, ControlSearch, ControlStatusPills } from "@/components/ControlPanel";
import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import {
  controlLabelClassName,
  dropdownContentClassName,
  dropdownItemClassName,
  selectTriggerClassName,
} from "@/components/ui/form-controls";
import { cn } from "@/lib/utils";

interface TasksControlPanelProps {
  setStatusFunction: (status: string) => void;
  setSurveyFunction: (survey: string) => void;
  setAssigneesFunction: (assignees: string[]) => void;
  searchFunction: (query: string) => void;
  assignees: string[];
  selectedAssignees: string[];
}

export function TasksControlPanel(props: TasksControlPanelProps) {
  const CONTROL_STATUS_OPTIONS = ["All", "Done", "Incomplete"];
  const ASSIGNEE_STATUS_OPTIONS = props.assignees;
  const SURVEY_OPTIONS = ["All Tasks", "Surveys Needed", "Surveys Complete"];

  const [searchQuery, setSearchQuery] = useState("");
  const [statusActiveIndex, setStatusActiveIndex] = useState(0);
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
                  buttonClassName="w-full min-w-0 xl:w-[250px]"
                  activeIndex={statusActiveIndex}
                  onActiveIndexChange={setStatusActiveIndex}
                  text="Status"
                  options={CONTROL_STATUS_OPTIONS}
                  delay={QUERY_DELAY}
                  delayFunction={(status: string) => props.setStatusFunction(status)}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full min-w-0">
                <Select
                  className="w-full min-w-0 sm:flex-1 xl:w-[320px]"
                  triggerClassName="w-full min-w-0"
                  label="Assignees"
                  options={ASSIGNEE_STATUS_OPTIONS}
                  selectedItems={props.selectedAssignees}
                  onSelectedItemsChange={props.setAssigneesFunction}
                  checkedIcon={<Check className="h-4 w-4" />}
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

interface SelectProps {
  className?: string;
  triggerClassName?: string;
  label: string;
  checkedIcon?: ReactNode;
  options: string[];
  selectedItems: string[];
  onSelectedItemsChange: (items: string[]) => void;
}

function Select(props: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const options = props.options.filter((option, index, list) => option !== "All" && list.indexOf(option) === index);
  const selectedItems = props.selectedItems.filter((item) => options.includes(item));
  const selectedSet = new Set(selectedItems);

  const toggleItem = (item: string) => {
    const nextItems = selectedSet.has(item)
      ? selectedItems.filter((selected) => selected !== item)
      : [...selectedItems, item];

    props.onSelectedItemsChange(nextItems);
  };

  const clearSelection = () => {
    props.onSelectedItemsChange([]);
  };

  const triggerText =
    selectedItems.length === 0
      ? "All"
      : selectedItems.length <= 2
        ? selectedItems.join(", ")
        : `${selectedItems.length} selected`;

  return (
    <div className={cn("flex flex-col gap-2 select-none", props.className)}>
      <h2 className={controlLabelClassName}>{props.label}</h2>

      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger className={cn(selectTriggerClassName, props.triggerClassName ?? "w-32 lg:w-64")}>
          <span className="truncate">{triggerText}</span>

          <ChevronDown
            className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className={cn(dropdownContentClassName, "max-h-72")}>
          <DropdownMenuCheckboxItem
            className={dropdownItemClassName}
            checked={selectedItems.length === 0}
            checkedIcon={props.checkedIcon}
            onSelect={(event) => event.preventDefault()}
            onCheckedChange={clearSelection}
          >
            All
          </DropdownMenuCheckboxItem>

          <DropdownMenuSeparator />

          {options.length === 0 ? (
            <DropdownMenuItem className={dropdownItemClassName} disabled>
              No assignees
            </DropdownMenuItem>
          ) : (
            options.map((option) => (
              <DropdownMenuCheckboxItem
                key={option}
                className={dropdownItemClassName}
                checked={selectedSet.has(option)}
                checkedIcon={props.checkedIcon}
                onSelect={(event) => event.preventDefault()}
                onCheckedChange={() => toggleItem(option)}
              >
                {option}
              </DropdownMenuCheckboxItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
