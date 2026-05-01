"use client";

import React from "react";
import Table from "./table/table";
import TableHeader from "./table/table-header";
import TableRow from "./table/table-row";
import TableHead from "./table/table-head";
import TableBody from "./table/table-body";
import TableCell from "./table/table-cell";
import { DashboardTreeSchema } from "./table-widget-defs";
import { ColumnDef } from "./table/column-def";
import { useTable } from "./table/table-types";

function TreeDashboardTable({
  className,
  data,
  cols,
}: {
  className?: string;
  data: DashboardTreeSchema[];
  cols: ColumnDef<DashboardTreeSchema>[];
}) {
  const table = useTable<DashboardTreeSchema>(data, cols, 5);
  const columns = table.getColumns();
  const rowModels = table.getRowModels();
  const placeholderRowCount = Math.max(table.getPageSize() - rowModels.length, 0);

  const renderPlaceholderRows = React.useCallback(
    (count: number, startIndex: number) => {
      return Array.from({ length: count }).map((_, i) => {
        const rowIndex = startIndex + i;

        return (
          <TableRow
            key={`placeholder-${startIndex}-${i}`}
            aria-hidden="true"
            className={`${rowIndex % 2 === 0 ? "bg-table-row-light" : "bg-table-row-dark"}`}
          >
            {columns.map((col, j) => (
              <TableCell key={j} className="px-4 h-12" position={col.cellPosition} columnWidth={col.columnWidth}>
                <span className="invisible">.</span>
              </TableCell>
            ))}
          </TableRow>
        );
      });
    },
    [columns],
  );

  return (
    <Table className={className} tableClassName="bg-table-row-light text-text-dark rounded-xl shadow-sm">
      <TableHeader className="bg-table-header">
        <TableRow>
          {table.getColumns().map((col, i) => (
            <TableHead key={i} position={col.headPosition} columnWidth={col.columnWidth} className="px-4 h-12 text-sm">
              {table.getHead(col)}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody className="divide-y divide-border font-medium">
        {data.length == 0 ? (
          <>
            <TableRow>
              <TableCell className="h-12" columnSpan={cols.length}>
                <p className="sticky left-1/2 -translate-x-1/2 w-max">Loading trees...</p>
              </TableCell>
            </TableRow>
            {renderPlaceholderRows(Math.max(placeholderRowCount - 1, 0), 1)}
          </>
        ) : rowModels.length ? (
          <>
            {rowModels.map((model, i) => (
              <TableRow key={i} className={`${i % 2 === 0 ? "bg-table-row-light" : "bg-table-row-dark"}`}>
                {model.cells.map(({ column, value, row }, j) => (
                  <TableCell
                    key={j}
                    className="px-4 h-12"
                    position={column.cellPosition}
                    columnWidth={column.columnWidth}
                  >
                    {table.getCell(column, value, row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {renderPlaceholderRows(placeholderRowCount, rowModels.length)}
          </>
        ) : (
          <>
            <TableRow>
              <TableCell className="h-12" columnSpan={cols.length}>
                <p className="sticky left-1/2 -translate-x-1/2 w-max">No results.</p>
              </TableCell>
            </TableRow>
            {renderPlaceholderRows(Math.max(placeholderRowCount - 1, 0), 1)}
          </>
        )}
      </TableBody>
    </Table>
  );
}

export default TreeDashboardTable;
