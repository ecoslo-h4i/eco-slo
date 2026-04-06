"use client";

import { type MutableRefObject, useEffect, useState } from "react";
import Image from "next/image";
import { TreeSchema } from "./data-table/table-widget-defs";
import { Table } from "./data-table/table/table-types";
import { Console } from "console";
import { treeSchemaToDownloadCSV } from "@/app/(admin)/trees/utils/csv";

interface ControlSearchProps {
  searchDelay: number;
  searchFunction: (status: string) => void;
}

function ControlSearch(props: ControlSearchProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      props.searchFunction(query);
    }, props.searchDelay);

    return () => {
      clearTimeout(handler);
    };
  }, [query, props.searchDelay, props.searchFunction, props]);

  const handleChange = (e: any) => {
    const next = e.target.value;
    setQuery(next);
  };

  return (
    <div className="h-14 rounded-2xl outline-1 outline-black bg-[#FFFCF5]">
      <input
        type="text"
        id="query"
        placeholder="Search by Tree # or Species..."
        value={query}
        onChange={handleChange}
        className="w-full px-4 py-3.5 text-lg text-black placeholder:text-black outline-none bg-transparent"
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
  delay: number;
  delayFunction: (status: string) => void;
  activeBackgroundHex: string;
  activeTextHex: string;
}

function ControlStatusPills(props: ControlStatusPillsInterface) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (countdown === null || pendingIndex === null) return;

    if (countdown <= 0) {
      props.delayFunction(props.options[pendingIndex]);
      setCountdown(null);
      setPendingIndex(null);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, pendingIndex, props]);

  const handleSelect = (index: number) => {
    setActiveIndex(index);
    setPendingIndex(index);
    setCountdown(props.delay);
  };

  return (
    <div className="flex flex-col gap-1.5 select-none">
      <h2 className="text-lg font-medium text-black">{props.text}</h2>
      <div className="flex gap-2">
        {props.options.map((option, index) => (
          <div
            key={index}
            className="h-11 rounded-xl cursor-pointer outline-1 outline-black flex items-center justify-center px-5 transition-colors"
            onClick={() => handleSelect(index)}
            style={{
              backgroundColor: index === activeIndex ? props.activeBackgroundHex : "#FFFCF5",
              color: index === activeIndex ? props.activeTextHex : "#000000",
            }}
          >
            <p className="font-medium text-lg whitespace-nowrap">{option}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ControlFilterDropdownInterface {
  text: string;
  dropDown: string[];
  delay: number;
  delayFunction: (filter: string) => void;
}

function ControlFilterDropdown(props: ControlFilterDropdownInterface) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const longestItem = props.dropDown.reduce((a, b) => (a.length > b.length ? a : b), "");

  useEffect(() => {
    if (countdown === null) return;

    if (countdown <= 0) {
      props.delayFunction(props.dropDown[activeIndex]);
      setCountdown(null);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [activeIndex, countdown, props]);

  return (
    <div className="flex flex-col gap-1.5 relative select-none w-fit">
      <h2 className="text-lg font-medium text-black">{props.text}</h2>

      <div
        className="h-11 rounded-full cursor-pointer bg-[#FFFCF5] outline-1 outline-black overflow-hidden"
        onMouseDown={() => setIsOpen(!isOpen)}
      >
        <div className="relative h-full px-4">
          <div
            className="invisible h-0 flex items-center gap-6 text-lg font-medium whitespace-nowrap"
            aria-hidden="true"
          >
            {longestItem}
            <div className="w-4" />
          </div>

          <div className="absolute inset-0 px-4 flex items-center justify-between gap-2.5 text-base font-medium">
            <span className="truncate">{props.dropDown[activeIndex]}</span>
            <Image
              src="/icons/dropdown.svg"
              width={18}
              height={18}
              alt=""
              className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl z-200 shadow-md outline-1 outline-black/10 overflow-hidden">
          {props.dropDown.map((item, index) => (
            <div
              key={index}
              className={`px-4 py-2.5 cursor-pointer text-lg font-medium hover:bg-[#F1E6D9] transition-colors whitespace-nowrap ${
                index === activeIndex ? "bg-[#F1E6D9]" : ""
              }`}
              onClick={() => {
                setActiveIndex(index);
                setIsOpen(false);
                setCountdown(props.delay);
              }}
            >
              {item}
            </div>
          ))}
        </div>
      )}
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

  return (
    <div className="w-full">
      <div className="flex w-full min-h-43 flex-col justify-center rounded-[40px] bg-inherit px-10 py-8">
        <div className="flex justify-between items-center w-full gap-10">
          <div className="flex flex-col gap-4 w-full">
            <div className="w-256">
              <ControlSearch
                searchDelay={QUERY_DELAY}
                searchFunction={(query: string) => {
                  const trimmedQuery = query.trimStart();
                  tableRef.current?.setSearchQuery(trimmedQuery);
                }}
              />
            </div>

            <div className="flex gap-6 items-start">
              <div className="pr-16">
                <ControlStatusPills
                  text="Status"
                  options={CONTROL_STATUS_OPTIONS}
                  delay={QUERY_DELAY}
                  delayFunction={(status: string) =>
                    tableRef.current?.setColumnFilter("status", (prev) =>
                      status === "All" ? [] : [status.toLowerCase()],
                    )
                  }
                  activeBackgroundHex="#78855b"
                  activeTextHex="#FFFFFF"
                />
              </div>
              <div className="flex gap-16">
                <ControlFilterDropdown
                  text="Condition"
                  dropDown={CONDITION_STATUS_OPTIONS}
                  delay={QUERY_DELAY}
                  delayFunction={(status: string) =>
                    tableRef.current?.setColumnFilter("status", (prev) =>
                      status === "All" ? [] : [status.toLowerCase()],
                    )
                  }
                />
                <ControlFilterDropdown
                  text="Visibility"
                  dropDown={VISIBILITY_STATUS_OPTIONS}
                  delay={QUERY_DELAY}
                  delayFunction={(status: string) =>
                    tableRef.current?.setColumnFilter("is_public", (prev) =>
                      status === "All" ? [] : [status.toLowerCase()],
                    )
                  }
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 shrink-0">
            <ControlButton
              backgroundHex="#FFFFFF"
              hoverHex="#F5F5F5"
              textHex="#000000"
              text="Export CSV"
              iconPath="/icons/download.svg"
              function={() => treeSchemaToDownloadCSV(tableRef.current?.data ?? [])}
            />
            <ControlButton
              backgroundHex="#8A9573"
              hoverHex="#7A8563"
              textHex="#FFFFFF"
              text="Add Tree"
              iconPath="/icons/plus.svg"
              function={() => console.log("Add function called")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
