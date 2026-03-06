import Image from "next/image";
import React from "react";
import { Table } from "./table/table-types";
import { TreeSchema } from "./table-widget-defs";

type HeadControlsProps = {
  table: Table<TreeSchema>;
  columnId: string;
  title: string;
  canHide?: boolean;
  canSort?: boolean;
};

export default function HeadControls({ table, columnId, title, canHide = true, canSort = true }: HeadControlsProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative select-none">
      <button
        className="px-1.5 py-1 flex items-center gap-x-2 rounded-sm cursor-pointer overflow-hidden hover:bg-black/10"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{title}</span>
        <Image
          src="/icons/dropdown.svg"
          width={18}
          height={18}
          alt=""
          className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 bg-white rounded-xl z-200 shadow-md outline-1 outline-black/10 overflow-hidden">
          {canSort && (
            <div>
              <div
                className="pl-3 pr-8 py-2 cursor-pointer font-medium hover:bg-[#F1E6D9] transition-colors whitespace-nowrap"
                onClick={() => {
                  setIsOpen(false);
                  table.setColumnSorting(columnId, false);
                }}
              >
                Sort Ascending
              </div>
              <div
                className="pl-3 pr-8 py-2 cursor-pointer font-medium hover:bg-[#F1E6D9] transition-colors whitespace-nowrap"
                onClick={() => {
                  setIsOpen(false);
                  table.setColumnSorting(columnId, true);
                }}
              >
                Sort Descending
              </div>
            </div>
          )}
          {canHide && (
            <div
              className="pl-3 pr-8 py-2 cursor-pointer font-medium hover:bg-[#F1E6D9] transition-colors whitespace-nowrap"
              onClick={() => {
                setIsOpen(false);
                table.setColumnVisibility(columnId, (prev) => false);
              }}
            >
              Hide Column
            </div>
          )}
        </div>
      )}
    </div>
  );
}
