"use client";

import { type MutableRefObject, type ReactNode, useEffect, useRef, useState } from "react";
import { TreeSchema } from "./data-table/table-widget-defs";
import { Table } from "./data-table/table/table-types";
import { Check, ChevronDown, X, type LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import {
  PillGroup,
  SearchField,
  SelectField,
  appButtonClassName,
  controlLabelClassName,
  dropdownContentClassName,
  dropdownItemClassName,
  selectTriggerClassName,
} from "@/components/ui/form-controls";
import { cn } from "@/lib/utils";

interface ControlSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  searchDelay: number;
  searchFunction: (query: string) => void;
  placeholder?: string;
}

export function ControlSearch(props: ControlSearchProps) {
  useEffect(() => {
    const handler = setTimeout(() => {
      props.searchFunction(props.query);
    }, props.searchDelay);

    return () => {
      clearTimeout(handler);
    };
  }, [props.query, props.searchDelay, props.searchFunction, props]);

  return (
    <SearchField
      id="query"
      placeholder={props.placeholder || "Search..."}
      value={props.query}
      onQueryChange={props.onQueryChange}
    />
  );
}

interface ControlButtonInterface {
  backgroundHex: string;
  hoverHex: string;
  textHex: string;
  text: string;
  icon?: LucideIcon;
  function: () => void;
}

export function ControlButton(props: ControlButtonInterface) {
  const [hovering, setHovering] = useState(false);
  const Icon = props.icon;

  return (
    <button
      type="button"
      className={appButtonClassName({ className: "w-36", variant: "primary" })}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={() => props.function()}
      style={{
        backgroundColor: hovering ? props.hoverHex : props.backgroundHex,
        color: props.textHex,
        containerType: "inline-size",
      }}
    >
      <p className="font-medium text-base whitespace-nowrap" style={{ fontSize: "clamp(0.75rem, 15cqw, 1.125rem)" }}>
        {props.text}
      </p>
      {Icon ? <Icon aria-hidden="true" className="h-[22px] w-[22px]" strokeWidth={2} /> : null}
    </button>
  );
}

interface ControlStatusPillsInterface {
  buttonClassName?: string;
  text?: string;
  options: string[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  delay: number; // Delay in ms before calling delayFunction
  delayFunction: (status: string) => void;
  containerClassName?: string;
  className?: string;
}

export function ControlStatusPills(props: ControlStatusPillsInterface) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleSelect = (index: number) => {
    props.onActiveIndexChange(index);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      props.delayFunction(props.options[index]);
    }, props.delay);
  };

  return (
    <div className={cn("flex flex-col gap-2 select-none", props.className)}>
      {props.text && <h2 className={controlLabelClassName}>{props.text}</h2>}
      <PillGroup
        activeValue={props.options[props.activeIndex]}
        className={props.containerClassName}
        optionClassName={props.buttonClassName}
        options={props.options.map((option) => ({ label: option, value: option }))}
        onChange={(_, index) => handleSelect(index)}
      />
    </div>
  );
}

interface ControlFilterDropdownInterface {
  triggerClassName?: string;
  label: string;
  dropDown: string[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  delay: number; // Delay in ms before calling delayFunction
  delayFunction: (filter: string) => void;
}

export function ControlFilterDropdown(props: ControlFilterDropdownInterface) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleSelect = (index: number) => {
    props.onActiveIndexChange(index);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      props.delayFunction(props.dropDown[index]);
    }, props.delay);
  };

  return (
    <div className="flex flex-col gap-2 select-none">
      <h2 className={controlLabelClassName}>{props.label}</h2>
      <SelectField
        className={props.triggerClassName}
        value={props.dropDown[props.activeIndex]}
        onChange={(value) => handleSelect(props.dropDown.indexOf(value))}
        options={props.dropDown.map((item) => ({ label: item, value: item }))}
      />
    </div>
  );
}

interface SelectProps {
  className?: string;
  label: string;
  checkedIcon?: ReactNode;
  tableRef: MutableRefObject<Table<TreeSchema> | null>;
  onCheckedItem: (item: string) => void;
}

type SelectItem = {
  checked: boolean;
  id: string;
  name: string;
};

function Select(props: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<SelectItem[]>([]);

  const syncItemsFromTable = () => {
    const table = props.tableRef.current;
    if (!table) return;

    setItems(
      table.getHideableColumns().map((column) => ({
        checked: table.getColumnVisibility(column.id),
        id: column.id,
        name: column.name,
      })),
    );
  };

  const onCheckedChange = (item: string) => {
    setItems((prev) => prev.map((entry) => (entry.id === item ? { ...entry, checked: !entry.checked } : entry)));
    props.onCheckedItem(item);
  };

  return (
    <div className={cn("flex flex-col gap-2 select-none", props.className)}>
      <h2 className={controlLabelClassName}>{props.label}</h2>
      <DropdownMenu
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (open) syncItemsFromTable();
        }}
      >
        <DropdownMenuTrigger className={cn(selectTriggerClassName, "w-32 lg:w-64")}>
          <span className="truncate">Visibility</span>
          <ChevronDown
            className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isOpen && "rotate-180"}`}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className={dropdownContentClassName}>
          <DropdownMenuItem
            className={dropdownItemClassName}
            onClick={() => {
              items.forEach((item) => {
                if (!item.checked) onCheckedChange(item.id);
                return item.checked;
              });
            }}
          >
            <span className="font-medium">Enable All</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {items.map((item) => (
            <DropdownMenuCheckboxItem
              className={dropdownItemClassName}
              checked={item.checked}
              checkedIcon={props.checkedIcon}
              onCheckedChange={() => onCheckedChange(item.id)}
              key={item.id}
            >
              {item.name}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface ControlPanelProps {
  tableRef: MutableRefObject<Table<TreeSchema> | null>;
}

export default function ControlPanel({ tableRef }: ControlPanelProps) {
  void tableRef;

  const CONTROL_STATUS_OPTIONS = ["All", "Active", "Graduated"];
  const CONDITION_STATUS_OPTIONS = ["All", "Good", "Fair", "Poor"];
  const VISIBILITY_STATUS_OPTIONS = ["All", "Public", "Private"];
  const QUERY_DELAY = 0;
  const [searchQuery, setSearchQuery] = useState("");
  const [statusActiveIndex, setStatusActiveIndex] = useState(0);
  const [conditionActiveIndex, setConditionActiveIndex] = useState(0);
  const [visibilityActiveIndex, setVisibilityActiveIndex] = useState(0);

  const resetFilters = () => {
    setSearchQuery("");
    setStatusActiveIndex(0);
    setConditionActiveIndex(0);
    setVisibilityActiveIndex(0);
    tableRef.current?.setSearchQuery("");
    tableRef.current?.setColumnFilter("status", () => []);
    tableRef.current?.setColumnFilter("condition", () => []);
    tableRef.current?.setColumnFilter("is_public", () => []);
  };

  return (
    <div className="w-full flex flex-col gap-4 rounded-xl bg-card border border-border shadow-sm p-6 lg:p-8">
      <ControlSearch
        placeholder="Search for tree fields..."
        query={searchQuery}
        onQueryChange={setSearchQuery}
        searchDelay={QUERY_DELAY}
        searchFunction={(query: string) => {
          const trimmedQuery = query.trimStart();
          tableRef.current?.setSearchQuery(trimmedQuery);
        }}
      />

      <div className="flex justify-between items-start">
        <div className="flex gap-4 items-start justify-start flex-wrap">
          <ControlStatusPills
            buttonClassName="min-w-16 lg:min-w-30"
            text="Status"
            options={CONTROL_STATUS_OPTIONS}
            activeIndex={statusActiveIndex}
            onActiveIndexChange={setStatusActiveIndex}
            delay={QUERY_DELAY}
            delayFunction={(status: string) =>
              tableRef.current?.setColumnFilter("status", () => (status === "All" ? [] : [status.toLowerCase()]))
            }
          />
          <Select
            className="block md:hidden"
            label="Columns"
            tableRef={tableRef}
            checkedIcon={<Check />}
            onCheckedItem={(item: string) => tableRef.current?.setColumnVisibility(item, (visible) => !visible)}
          />
          <div className="flex gap-4 min-w-0">
            <ControlFilterDropdown
              triggerClassName="w-32 lg:w-64"
              label="Condition"
              dropDown={CONDITION_STATUS_OPTIONS}
              activeIndex={conditionActiveIndex}
              onActiveIndexChange={setConditionActiveIndex}
              delay={QUERY_DELAY}
              delayFunction={(status: string) =>
                tableRef.current?.setColumnFilter("condition", () => (status === "All" ? [] : [status.toLowerCase()]))
              }
            />
            <ControlFilterDropdown
              triggerClassName="w-32 lg:w-64"
              label="Visibility"
              dropDown={VISIBILITY_STATUS_OPTIONS}
              activeIndex={visibilityActiveIndex}
              onActiveIndexChange={setVisibilityActiveIndex}
              delay={QUERY_DELAY}
              delayFunction={(status: string) =>
                tableRef.current?.setColumnFilter("is_public", () => (status === "All" ? [] : [status.toLowerCase()]))
              }
            />
          </div>
          {(searchQuery !== "" ||
            statusActiveIndex !== 0 ||
            conditionActiveIndex !== 0 ||
            visibilityActiveIndex !== 0) && (
            <button
              type="button"
              className={appButtonClassName({
                className: "self-end px-2 md:px-3",
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

        <Select
          className="hidden md:block"
          label="Columns"
          tableRef={tableRef}
          checkedIcon={<Check />}
          onCheckedItem={(item: string) => tableRef.current?.setColumnVisibility(item, (visible) => !visible)}
        />
      </div>
    </div>
  );
}
