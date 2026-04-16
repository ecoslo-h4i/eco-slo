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
  const table = useTable<TreeSchema>(data, cols);

  React.useEffect(() => {
    onTableReady?.(table);
  }, [table, onTableReady]);

  return (
    <Table
      className={className}
      tableClassName="bg-table-row-light text-text-dark"
      footer={true}
      footerClassName="bg-table-header h-16"
      footerContent={<PaginationControls />}
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
      <TableBody className="font-medium">
        {data.length == 0 ? (
          <TableRow>
            <TableCell className="h-24" columnSpan={cols.length}>
              <p className="w-full text-center">Loading trees...</p>
            </TableCell>
          </TableRow>
        ) : table.getRowModels().length ? (
          table.getRowModels().map((model, i) => (
            <TableRow
              key={i}
              data={data[i]}
              onClick={onRowClick}
              className={`${i % 2 === 0 ? "bg-table-row-light" : "bg-table-row-dark"} hover:bg-table-header cursor-pointer`}
            >
              {model.cells.map(({ column, value }, j) => (
                <TableCell
                  key={j}
                  className="px-4 h-16"
                  position={column.cellPosition}
                  columnWidth={column.columnWidth}
                >
                  {table.getCell(column, value)}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell className="h-24" columnSpan={cols.length}>
              <p className="w-full text-center">No results.</p>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export default TreePageTable;
