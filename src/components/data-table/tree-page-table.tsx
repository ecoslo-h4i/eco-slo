"use client";

import React from "react";
import TableHeader from "./table/table-header";
import TableRow from "./table/table-row";
import TableHead from "./table/table-head";
import TableBody from "./table/table-body";
import TableCell from "./table/table-cell";
import { TreeSchema } from "./table-widget-defs";
import { ColumnDef } from "./table/column-def";
import { Table as TableType, useTable } from "./table/table-types";
import Table from "./table/table";
import PaginationControls from "./pagination-controls";

function TreePageTable({
  className,
  data,
  cols,
  onRowClick,
  onTableReady,
}: {
  className?: string;
  data: TreeSchema[];
  cols: ColumnDef<TreeSchema>[];
  onRowClick: (e: React.MouseEvent<HTMLTableRowElement, MouseEvent>, tree: TreeSchema) => void;
  onTableReady?: (table: TableType<TreeSchema>) => void;
}) {
  const table = useTable<TreeSchema>(data, cols, 5);

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
      tableClassName="bg-table-row-light text-text-dark"
      footer={true}
      footerClassName="bg-table-header h-16"
      footerContent={<PaginationControls table={table} itemNamePlural="trees" />}
    >
      <TableHeader className="bg-table-header">
        <TableRow>
          {table.getColumns().map((col, i) => (
            <TableHead key={i} position={col.headPosition} columnWidth={col.columnWidth} className="px-4 h-16 text-sm">
              {table.getHead(col)}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody className="divide-y divide-border font-medium">
        {data.length == 0 ? (
          <>
            <TableRow>
              <TableCell className="h-16" columnSpan={cols.length}>
                <p className="sticky left-1/2 -translate-x-1/2 w-max">Loading trees...</p>
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
                className={`${i % 2 === 0 ? "bg-table-row-light" : "bg-table-row-dark"} hover:bg-table-header cursor-pointer`}
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

export default TreePageTable;
