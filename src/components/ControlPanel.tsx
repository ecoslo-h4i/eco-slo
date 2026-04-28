"use client";

import { ChangeEvent, type MutableRefObject, type ReactNode, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { TreeSchema } from "./data-table/table-widget-defs";
import { Table } from "./data-table/table/table-types";
import { Check, ChevronDown, Search, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";

interface ControlSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  searchDelay: number;
  searchFunction: (query: string) => void;
  placeholder: string;
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

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    props.onQueryChange(next);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-border bg-foreground w-full">
      <Search className="text-text-muted w-5 h-5" />
      <input
        type="text"
        id="query"
        placeholder={props.placeholder}
        value={props.query}
        onChange={handleChange}
        className="flex-1 text-text-dark font-medium placeholder:text-text-muted outline-none"
      />
    </div>
  );
}

interface ControlButtonInterface {
  backgroundHex: string;
  hoverHex: string;
  textHex: string;
  text: string;
  iconPath?: string;
  function: () => void;
}

export function ControlButton(props: ControlButtonInterface) {
  const [hovering, setHovering] = useState(false);

  return (
    <div
      className="w-36 h-11 rounded-full outline-1 outline-black cursor-pointer select-none flex items-center justify-center px-5 gap-2.5"
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
      {props.iconPath && <Image src={props.iconPath} width={22} height={22} alt="" />}
    </div>
  );
}

interface ControlStatusPillsInterface {
  pillClassName?: string;
  text: string;
  options: string[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  delay: number; // Delay in ms before calling delayFunction
  delayFunction: (status: string) => void;
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
    <div className="flex flex-col gap-2 select-none">
      <h2 className="text-text-muted font-semibold">{props.text}</h2>
      <div className="flex gap-2">
        {props.options.map((option, index) => (
          <button
            key={index}
            className={`rounded-2xl cursor-pointer flex items-center justify-center px-2 min-w-16 lg:min-w-30 py-1 transition-colors
              ${index === props.activeIndex ? "bg-primary text-text-light hover:bg-primary/90" : "bg-button text-text-dark border border-border hover:bg-button/50"}
              ${props.pillClassName}`}
            onClick={() => handleSelect(index)}
          >
            <p className="font-medium lg:text-lg whitespace-nowrap">{option}</p>
          </button>
        ))}
      </div>
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
  const [isOpen, setIsOpen] = useState(false);
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
      <h2 className="text-text-muted font-semibold">{props.label}</h2>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger
          className={`px-4 py-1.5 flex justify-between items-center bg-button-light border border-border text-text-dark rounded-full hover:bg-button-light/80 transition-colors duration-50 
                    ${props.triggerClassName}`}
        >
          <span className="font-medium truncate">{props.dropDown[props.activeIndex]}</span>
          <ChevronDown
            className={`w-4 h-4 shrink-0 text-text-muted transition-transform duration-200 ${isOpen && "rotate-180"}`}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {props.dropDown.map((item, index) => (
            <DropdownMenuItem className="font-medium" onClick={() => handleSelect(index)} key={index}>
              {item}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
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
    <div className={`flex flex-col gap-2 select-none ${props.className}`}>
      <h2 className="text-text-muted font-semibold">{props.label}</h2>
      <DropdownMenu
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (open) syncItemsFromTable();
        }}
      >
        <DropdownMenuTrigger className="w-32 lg:w-64 px-4 py-1.5 flex justify-between items-center bg-button-light border border-border text-text-dark rounded-full hover:bg-button-light/80 transition-colors duration-50">
          <span className="font-medium">Visibility</span>
          <ChevronDown
            className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isOpen && "rotate-180"}`}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
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
              className="font-medium"
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
        query={searchQuery}
        onQueryChange={setSearchQuery}
        placeholder="Search by ECOSLO #, species, address, adopter..."
        searchDelay={QUERY_DELAY}
        searchFunction={(query: string) => {
          const trimmedQuery = query.trimStart();
          tableRef.current?.setSearchQuery(trimmedQuery);
        }}
      />

      <div className="flex justify-between items-start">
        <div className="flex gap-4 items-start justify-start flex-wrap">
          <ControlStatusPills
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
              className="self-end flex items-center gap-x-1 px-2 md:px-3 py-2 bg-transparent text-text-muted font-medium rounded-2xl hover:bg-black/5 transition-colors duration-100"
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
