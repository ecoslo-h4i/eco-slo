"use client";

import { useState, type ReactNode } from "react";
import { ControlFilterDropdown, ControlSearch, ControlStatusPills } from "@/components/ControlPanel";
import { Check, ChevronDown, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import {
  appButtonClassName,
  controlLabelClassName,
  dropdownContentClassName,
  dropdownItemClassName,
  selectTriggerClassName,
} from "@/components/ui/form-controls";
import { cn } from "@/lib/utils";

export const STATUS_OPTIONS = ["All", "Open", "Completed"];
export const SURVEY_OPTIONS = ["All", "No Survey", "Survey Available", "Survey Required"];

interface TasksControlPanelProps {
  setStatusFunction: (status: string) => void;
  setSurveyFunction: (survey: string) => void;
  setAssigneesFunction: (assignees: string[]) => void;
  searchFunction: (query: string) => void;
  assignees: string[];
  selectedAssignees: string[];
  isAdmin: boolean;
}

export function TasksControlPanel(props: TasksControlPanelProps) {
  const ASSIGNEE_STATUS_OPTIONS = props.assignees;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusActiveIndex, setStatusActiveIndex] = useState(1);
  const [surveysActiveIndex, setSurveyActiveIndex] = useState(0);

  const QUERY_DELAY = 0;

  const resetFilters = () => {
    setSearchQuery("");
    setStatusActiveIndex(1);
    setSurveyActiveIndex(0);
    props.searchFunction("");
    props.setStatusFunction(STATUS_OPTIONS[1]);
    props.setSurveyFunction(SURVEY_OPTIONS[0]);
    props.setAssigneesFunction([]);
  };

  return (
    <div className="w-full flex flex-col gap-4 rounded-xl bg-off-white border border-border shadow-sm p-4 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="w-full lg:w-1/2">
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
        </div>
        <ControlStatusPills
          className="flex-1"
          containerClassName="w-full h-full"
          buttonClassName="flex-1 min-w-0"
          activeIndex={statusActiveIndex}
          onActiveIndexChange={setStatusActiveIndex}
          options={STATUS_OPTIONS}
          delay={QUERY_DELAY}
          delayFunction={(status: string) => props.setStatusFunction(status)}
        />
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div
          className={cn(
            "grid min-w-0 flex-1 grid-cols-1 gap-4",
            props.isAdmin ? "md:grid-cols-2" : "md:grid-cols-1 md:max-w-sm",
          )}
        >
          {props.isAdmin ? (
            <Select
              triggerClassName="w-full"
              label="Assignees"
              options={ASSIGNEE_STATUS_OPTIONS}
              selectedItems={props.selectedAssignees}
              onSelectedItemsChange={props.setAssigneesFunction}
              checkedIcon={<Check className="h-4 w-4" />}
            />
          ) : null}
          <ControlFilterDropdown
            triggerClassName="w-full"
            label="Surveys"
            activeIndex={surveysActiveIndex}
            onActiveIndexChange={setSurveyActiveIndex}
            dropDown={SURVEY_OPTIONS}
            delay={QUERY_DELAY}
            delayFunction={(status: string) => props.setSurveyFunction(status)}
          />
        </div>

        {(searchQuery !== "" ||
          statusActiveIndex !== 1 ||
          surveysActiveIndex !== 0 ||
          props.selectedAssignees.length > 0) && (
          <button
            type="button"
            className={appButtonClassName({
              className: "self-start px-2 md:px-3 xl:self-end",
              radius: "small",
              size: "sm",
              variant: "ghost",
            })}
            onClick={resetFilters}
          >
            <X className="w-4 h-4" />
            <span className="text-sm lg:text-md">Clear Filters</span>
          </button>
        )}
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
