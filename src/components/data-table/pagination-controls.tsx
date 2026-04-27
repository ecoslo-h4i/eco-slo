import React from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../dropdown-menu";
import { Table } from "./table/table-types";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

export default function PaginationControls<T extends Record<string, unknown>>({
  table,
  itemNamePlural,
}: {
  table: Table<T>;
  itemNamePlural: string;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="w-full h-full flex justify-between items-center px-4 lg:px-6 gap-x-2">
      <div className="flex gap-2 items-center min-w-0">
        <p className="text-text-dark font-medium">
          Rows<span className="hidden lg:inline"> per page</span>:
        </p>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger className="w-16 lg:w-20 px-2 lg:px-3 py-1 flex justify-between items-center bg-button-light border border-border text-text-dark rounded-xl hover:bg-button-light/80 transition-colors duration-50">
            <span>{table.getPageSize()}</span>
            <ChevronDown
              className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isOpen && "rotate-180"}`}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem className="font-medium" onClick={() => table.setPageSize(5)}>
              5
            </DropdownMenuItem>
            <DropdownMenuItem className="font-medium" onClick={() => table.setPageSize(10)}>
              10
            </DropdownMenuItem>
            <DropdownMenuItem className="font-medium" onClick={() => table.setPageSize(25)}>
              25
            </DropdownMenuItem>
            <DropdownMenuItem className="font-medium" onClick={() => table.setPageSize(50)}>
              50
            </DropdownMenuItem>
            <DropdownMenuItem className="font-medium" onClick={() => table.setPageSize(100)}>
              100
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <p className="min-w-0 flex-1 text-text-muted truncate">
          <span className="hidden lg:inline">Showing </span>
          <span>{table.getPageIndex() * table.getPageSize() + 1}</span> to{" "}
          <span>{Math.min((table.getPageIndex() + 1) * table.getPageSize(), table.getUnpaginatedRowCount())}</span> of{" "}
          <span>{table.getUnpaginatedRowCount()}</span>
          <span> {itemNamePlural}</span>
        </p>
      </div>
      <div className="flex gap-2 lg:gap-4 items-center">
        <button
          className="px-2 py-2 lg:px-3 lg:py-1 bg-button border border-border text-text-dark rounded-xl hover:bg-button/80 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={!table.hasPreviousPage()}
          onClick={table.previousPage}
        >
          <ChevronLeft className="w-4 h-4 lg:hidden" />
          <span className="hidden lg:inline">Previous</span>
        </button>
        <p className="shrink-0 text-text-dark">
          <span className="hidden lg:inline">Page </span>
          <span>{table.getPageIndex() + 1}</span> of <span>{table.getPageCount()}</span>
        </p>
        <button
          className="px-2 py-2 lg:px-3 lg:py-1 bg-button border border-border text-text-dark rounded-xl hover:bg-button/80 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={!table.hasNextPage()}
          onClick={table.nextPage}
        >
          <span className="hidden lg:inline">Next</span>
          <ChevronRight className="w-4 h-4 lg:hidden" />
        </button>
      </div>
    </div>
  );
}
