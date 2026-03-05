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

function TreePageTable({
  className,
  data,
  cols,
  onRowClick,
}: {
  className?: string;
  data: TreeSchema[];
  cols: ColumnDef<TreeSchema>[];
  onRowClick: (e: React.MouseEvent<HTMLTableRowElement, MouseEvent>, tree: TreeSchema) => void;
}) {
  const table = useTable<TreeSchema>(data, cols);

  return (
    <Table className={className} tableClassName="bg-background">
      <TableHeader>
        <TableRow>
          {table.getColumns().map((col, i) => (
            <TableHead key={i} position={col.headPosition} columnWidth={col.columnWidth} className="bg-primary-muted">
              {table.getHead(col)}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {table.getRowModels().map((model, i) => (
          <TableRow key={i} data={data[i]} onClick={onRowClick} className="hover:bg-card/50">
            {model.cells.map(({ column, value }, j) => (
              <TableCell key={j} position={column.cellPosition} columnWidth={column.columnWidth}>
                {table.getCell(column, value)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default TreePageTable;
