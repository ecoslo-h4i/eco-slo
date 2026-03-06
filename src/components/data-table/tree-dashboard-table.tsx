"use client";

import React from "react";
import Table from "./table/table";
import TableHeader from "./table/table-header";
import TableRow from "./table/table-row";
import TableHead from "./table/table-head";
import TableBody from "./table/table-body";
import TableCell from "./table/table-cell";
import { TreeSchema, treeWidgetSchema } from "./table-widget-defs";
import { ColumnDef } from "./table/column-def";
import { useTable } from "./table/table-types";

function TreeDashboardTable({
  className,
  data,
  cols,
}: {
  className?: string;
  data: TreeSchema[];
  cols: ColumnDef<TreeSchema>[];
}) {
  const table = useTable<TreeSchema>(data, cols);

  return (
    <Table className={className} tableClassName="bg-background">
      <TableHeader className="bg-card">
        <TableRow>
          {table.getColumns().map((col, i) => (
            <TableHead key={i} position={col.headPosition} columnWidth={col.columnWidth}>
              {table.getHead(col)}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length == 0 ? (
          <TableRow>
            <TableCell className="h-24" columnSpan={cols.length}>
              <p className="w-full text-center">Loading trees...</p>
            </TableCell>
          </TableRow>
        ) : (
          table.getRowModels().map((model, i) => (
            <TableRow key={i}>
              {model.cells.map(({ column, value }, j) => (
                <TableCell key={j} position={column.cellPosition} columnWidth={column.columnWidth}>
                  {table.getCell(column, value)}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export default TreeDashboardTable;
