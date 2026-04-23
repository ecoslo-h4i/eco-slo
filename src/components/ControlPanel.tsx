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
}

function ControlSearch(props: ControlSearchProps) {
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
        placeholder="Search for tree fields..."
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

function ControlButton(props: ControlButtonInterface) {
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
  text: string;
  options: string[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  delay: number; // Delay in ms before calling delayFunction
  delayFunction: (status: string) => void;
}

function ControlStatusPills(props: ControlStatusPillsInterface) {
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
              ${index === props.activeIndex ? "bg-primary text-text-light hover:bg-primary/90" : "bg-button text-text-dark border border-border hover:bg-button/50"}`}
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

function ControlFilterDropdown(props: ControlFilterDropdownInterface) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  //const longestItem = props.dropDown.reduce((a, b) => (a.length > b.length ? a : b), "");
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
    // <div className="flex flex-col gap-1.5 relative select-none w-fit">
    //   <h2 className="text-lg font-medium text-black">{props.text}</h2>

    //   <div
    //     className="h-11 rounded-full cursor-pointer bg-[#FFFCF5] outline-1 outline-black overflow-hidden"
    //     onMouseDown={() => setIsOpen(!isOpen)}
    //   >
    //     <div className="relative h-full px-4">
    //       <div
    //         className="invisible h-0 flex items-center gap-6 text-lg font-medium whitespace-nowrap"
    //         aria-hidden="true"
    //       >
    //         {longestItem}
    //         <div className="w-4" />
    //       </div>

    //       <div className="absolute inset-0 px-4 flex items-center justify-between gap-2.5 text-base font-medium">
    //         <span className="truncate">{props.dropDown[activeIndex]}</span>
    //         <Image
    //           src="/icons/dropdown.svg"
    //           width={18}
    //           height={18}
    //           alt=""
    //           className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
    //         />
    //       </div>
    //     </div>
    //   </div>

    //   {isOpen && (
    //     <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl z-200 shadow-md outline-1 outline-black/10 overflow-hidden">
    //       {props.dropDown.map((item, index) => (
    //         <div
    //           key={index}
    //           className={`px-4 py-2.5 cursor-pointer text-lg font-medium hover:bg-[#F1E6D9] transition-colors whitespace-nowrap ${
    //             index === activeIndex ? "bg-[#F1E6D9]" : ""
    //           }`}
    //           onClick={() => handleSelect(index)}
    //         >
    //           {item}
    //         </div>
    //       ))}
    //     </div>
    //   )}
    // </div>
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
