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
import { ArrowUpDown, ChevronDown, ChevronUp, EyeOff } from "lucide-react";

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
      <DropdownMenuTrigger
        className={`cursor-pointer select-none px-2 py-1.5 flex gap-x-2 items-center text-text-dark rounded-lg hover:bg-text-muted/15 transition-colors duration-100 ${isOpen && "bg-text-muted/15"}`}
      >
        <span>{title}</span>
        {canSort ? <ArrowUpDown className="w-3 h-3 text-text-muted" /> : <EyeOff className="w-3 h-3 text-text-muted" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="select-none w-48">
        {canSort && (
          <>
            <DropdownMenuItem
              className="group flex justify-between whitespace-nowrap px-3 py-2 font-medium"
              onClick={() => {
                table.setColumnSorting(columnId, false);
              }}
            >
              <span>Sort Ascending</span>
              <ChevronUp className="h-4 w-4 text-text-muted transition-colors group-hover:text-text-light group-focus:text-text-light" />
            </DropdownMenuItem>
            <DropdownMenuItem
              className="group flex justify-between whitespace-nowrap px-3 py-2 font-medium"
              onClick={() => {
                table.setColumnSorting(columnId, true);
              }}
            >
              <span>Sort Descending</span>
              <ChevronDown className="w-4 h-4 text-text-muted transition-colors group-hover:text-text-light group-focus:text-text-light" />
            </DropdownMenuItem>
          </>
        )}
        {canSort && canHide && <DropdownMenuSeparator />}
        {canHide ? (
          <DropdownMenuItem
            className="group flex justify-between whitespace-nowrap px-3 py-2 font-medium"
            onClick={() => {
              table.setColumnVisibility(columnId, () => false);
            }}
          >
            <span>Hide Column</span>
            <EyeOff className="w-4 h-4 text-text-muted transition-colors group-hover:text-text-light group-focus:text-text-light" />
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
