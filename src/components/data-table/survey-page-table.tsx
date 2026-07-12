"use client";

import React from "react";
import TableHeader from "./table/table-header";
import TableRow from "./table/table-row";
import TableHead from "./table/table-head";
import TableBody from "./table/table-body";
import TableCell from "./table/table-cell";
import { SurveySchema } from "./table-widget-defs";
import { ColumnDef } from "./table/column-def";
import { Table as TableType, useTable } from "./table/table-types";
import Table from "./table/table";
import PaginationControls from "./pagination-controls";

function SurveyPageTable({
  className,
  data,
  cols,
  onRowClick,
  onTableReady,
  isLoading = false,
}: {
  className?: string;
  data: SurveySchema[];
  cols: ColumnDef<SurveySchema>[];
  onRowClick: (e: React.MouseEvent<HTMLTableRowElement, MouseEvent>, survey: SurveySchema) => void;
  onTableReady?: (table: TableType<SurveySchema>) => void;
  isLoading?: boolean;
}) {
  const table = useTable<SurveySchema>(data, cols, 5);

  const columns = table.getColumns();
  const rowModels = table.getRowModels();

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
              <TableCell key={j} className="px-4 h-16" position={col.cellPosition} columnWidth={col.columnWidth}>
                <span className="invisible">.</span>
              </TableCell>
            ))}
          </TableRow>
        );
      });
    },
    [columns],
  );

  React.useEffect(() => {
    onTableReady?.(table);
  }, [table, onTableReady]);

  return (
    <Table
      className={`${className} rounded-xl shadow-sm`}
      tableClassName="bg-off-white text-text-dark"
      footer={true}
      footerClassName="bg-off-white h-16"
      footerContent={<PaginationControls table={table} itemNamePlural="surveys" />}
    >
      <TableHeader className="bg-off-white">
        <TableRow>
          {table.getColumns().map((col, i) => (
            <TableHead key={i} position={col.headPosition} columnWidth={col.columnWidth} className="px-4 h-16 text-sm">
              {table.getHead(col)}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody className="divide-y divide-border font-medium">
        {isLoading ? (
          <>
            <TableRow>
              <TableCell className="h-16" columnSpan={cols.length}>
                <p className="sticky left-1/2 -translate-x-1/2 w-max">Loading surveys...</p>
              </TableCell>
            </TableRow>
            {renderPlaceholderRows(4, 1)}
          </>
        ) : data.length === 0 ? (
          <>
            <TableRow>
              <TableCell className="h-16" columnSpan={cols.length}>
                <p className="sticky left-1/2 -translate-x-1/2 w-max">No surveys to display.</p>
              </TableCell>
            </TableRow>
            {renderPlaceholderRows(4, 1)}
          </>
        ) : rowModels.length ? (
          <>
            {rowModels.map((model, i) => (
              <TableRow
                key={i}
                data={model.row}
                onClick={onRowClick}
                className={`${i % 2 === 0 ? "bg-table-row-light" : "bg-table-row-dark"} hover:bg-light-green-2/25 cursor-pointer`}
              >
                {model.cells.map(({ column, value, row }, j) => (
                  <TableCell
                    key={j}
                    className="px-4 h-16"
                    position={column.cellPosition}
                    columnWidth={column.columnWidth}
                  >
                    {table.getCell(column, value, row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </>
        ) : (
          <>
            <TableRow>
              <TableCell className="h-16" columnSpan={cols.length}>
                <p className="sticky left-1/2 -translate-x-1/2 w-max">No results.</p>
              </TableCell>
            </TableRow>
            {renderPlaceholderRows(4, 1)}
          </>
        )}
      </TableBody>
    </Table>
  );
}

export default SurveyPageTable;
