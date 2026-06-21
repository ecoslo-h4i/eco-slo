import React from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../dropdown-menu";
import { Table } from "./table/table-types";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import {
  appButtonClassName,
  dropdownContentClassName,
  dropdownItemClassName,
  selectTriggerClassName,
} from "@/components/ui/form-controls";
import { cn } from "@/lib/utils";

export default function PaginationControls<T extends Record<string, unknown>>({
  table,
  itemNamePlural,
}: {
  table: Table<T>;
  itemNamePlural: string;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isHydrated, setIsHydrated] = React.useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    setIsHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const hasPreviousPage = table.hasPreviousPage();
  const hasNextPage = table.hasNextPage();
  const previousDisabled = isHydrated && !hasPreviousPage;
  const nextDisabled = isHydrated && !hasNextPage;

  return (
    <div className="w-full h-full flex justify-between items-center px-4 lg:px-6 gap-x-2">
      <div className="flex gap-2 items-center min-w-0">
        <p className="text-text-dark font-medium">
          Rows<span className="hidden lg:inline"> per page</span>:
        </p>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger
            className={cn(selectTriggerClassName, "min-h-8 max-lg:w-16 rounded-lg px-2 py-1 lg:w-20 lg:px-3")}
          >
            <span>{table.getPageSize()}</span>
            <ChevronDown
              className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isOpen && "rotate-180"}`}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className={dropdownContentClassName}>
            <DropdownMenuItem className={dropdownItemClassName} onClick={() => table.setPageSize(5)}>
              5
            </DropdownMenuItem>
            <DropdownMenuItem className={dropdownItemClassName} onClick={() => table.setPageSize(10)}>
              10
            </DropdownMenuItem>
            <DropdownMenuItem className={dropdownItemClassName} onClick={() => table.setPageSize(25)}>
              25
            </DropdownMenuItem>
            <DropdownMenuItem className={dropdownItemClassName} onClick={() => table.setPageSize(50)}>
              50
            </DropdownMenuItem>
            <DropdownMenuItem className={dropdownItemClassName} onClick={() => table.setPageSize(100)}>
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
      <div className="flex gap-1 items-center">
        <button
          className={appButtonClassName({ className: "max-lg:hidden", iconOnly: true, variant: "secondary" })}
          disabled={previousDisabled}
          onClick={table.firstPage}
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          className={appButtonClassName({ iconOnly: true, variant: "secondary" })}
          disabled={previousDisabled}
          onClick={table.previousPage}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <p className="mx-1 shrink-0 text-text-dark">
          <span className="hidden lg:inline">Page </span>
          <span>{table.getPageIndex() + 1}</span> of <span>{table.getPageCount()}</span>
        </p>
        <button
          className={appButtonClassName({ iconOnly: true, variant: "secondary" })}
          disabled={nextDisabled}
          onClick={table.nextPage}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          className={appButtonClassName({ className: "max-lg:hidden", iconOnly: true, variant: "secondary" })}
          disabled={nextDisabled}
          onClick={table.lastPage}
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
