"use client";

import React from "react";
import TableHeader from "./table/table-header";
import TableRow from "./table/table-row";
import TableHead from "./table/table-head";
import TableBody from "./table/table-body";
import TableCell from "./table/table-cell";
import { TreeSchema, treeWidgetSchema } from "./table-widget-defs";
import { ColumnDef } from "./table/column-def";
import { Table as TableType, useTable } from "./table/table-types";
import Table from "./table/table";

function TreePageTable({
  className,
  data,
  cols,
  onTableReady,
}: {
  className?: string;
  data: TreeSchema[];
  cols: ColumnDef<TreeSchema>[];
  onTableReady?: (table: TableType<TreeSchema>) => void;
}) {
  const table = useTable<TreeSchema>(data, cols);

  React.useEffect(() => {
    onTableReady?.(table);
  }, [table, onTableReady]);

  return (
    <Table className={className} tableClassName="bg-background">
      <TableHeader className="bg-primary-muted">
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
        ) : table.getRowModels().length ? (
          table.getRowModels().map((model, i) => (
            <TableRow key={i} className="hover:bg-card/50">
              {model.cells.map(({ column, value }, j) => (
                <TableCell key={j} position={column.cellPosition} columnWidth={column.columnWidth}>
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
