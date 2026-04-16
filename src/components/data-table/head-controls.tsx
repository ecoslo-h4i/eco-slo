import Image from "next/image";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../dropdown-menu";
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

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className="flex cursor-pointer select-none items-center gap-x-2 overflow-hidden rounded-sm px-1.5 py-1 hover:bg-black/10">
        <span>{title}</span>
        <Image
          src="/icons/dropdown.svg"
          width={18}
          height={18}
          alt=""
          className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="select-none">
        {canSort && (
          <>
            <DropdownMenuItem
              className="whitespace-nowrap px-3 py-2 font-medium"
              onClick={() => {
                table.setColumnSorting(columnId, false);
              }}
            >
              Sort Ascending
            </DropdownMenuItem>
            <DropdownMenuItem
              className="whitespace-nowrap px-3 py-2 font-medium"
              onClick={() => {
                table.setColumnSorting(columnId, true);
              }}
            >
              Sort Descending
            </DropdownMenuItem>
          </>
        )}
        {canSort && canHide && <DropdownMenuSeparator />}
        {canHide ? (
          <DropdownMenuItem
            className="whitespace-nowrap px-3 py-2 font-medium"
            onClick={() => {
              table.setColumnVisibility(columnId, () => false);
            }}
          >
            Hide Column
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
