import React from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../dropdown-menu";
import { Table } from "./table/table-types";
import { ChevronDown } from "lucide-react";

export default function PaginationControls<T extends Record<string, unknown>>({ table }: { table: Table<T> }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="w-full h-full flex justify-between items-center px-6">
      <div className="flex gap-2 items-center">
        <p className="text-text-dark font-medium">Rows per page:</p>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger className="w-20 px-3 py-1 flex justify-between items-center bg-button-light border border-border text-text-dark rounded-xl hover:bg-button-light/80 transition-colors duration-50">
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
        <p className="text-text-muted">
          Showing <span>{table.getPageIndex() * table.getPageSize() + 1}</span> to{" "}
          <span>{Math.min((table.getPageIndex() + 1) * table.getPageSize(), table.getUnpaginatedRowCount())}</span> of{" "}
          <span>{table.getUnpaginatedRowCount()}</span> trees
        </p>
      </div>
      <div className="flex gap-4 items-center">
        <button
          className="px-3 py-1 bg-button border border-border text-text-dark rounded-xl hover:bg-button/80 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={!table.hasPreviousPage()}
          onClick={table.previousPage}
        >
          Previous
        </button>
        <p className="text-text-dark">
          Page <span>{table.getPageIndex() + 1}</span> of <span>{table.getPageCount()}</span>
        </p>
        <button
          className="px-3 py-1 bg-button border border-border text-text-dark rounded-xl hover:bg-button/80 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={!table.hasNextPage()}
          onClick={table.nextPage}
        >
          Next
        </button>
      </div>
    </div>
  );
}
