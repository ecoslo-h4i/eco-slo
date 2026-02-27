"use client";

import React from "react";
import Table from "./table/table";
import TableHeader from "./table/table-header";
import TableRow from "./table/table-row";
import TableHead from "./table/table-head";
import TableBody from "./table/table-body";
import TableCell from "./table/table-cell";
import { treeWidgetSchema } from "./table-widget-defs";
import { ColumnDef } from "./table/column-def";
import { useTable } from "./table/table-types";

function TreePreviewTable({ data, cols }: { data: treeWidgetSchema[]; cols: ColumnDef<treeWidgetSchema>[] }) {
  const table = useTable<treeWidgetSchema>(data, cols);

  return (
    <div className="w-full h-full flex flex-col gap-y-4 justify-between">
      <Table className="w-full" tableClassName="bg-background">
        <TableHeader>
          <TableRow>
            {table.getColumns().map((col, i) => (
              <TableHead key={i} position={col.headPosition} columnWidth={col.columnWidth}>
                {table.getHead(col)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.getRowModels().map((model, i) => (
            <TableRow key={i}>
              {model.cells.map(({ column, value }, j) => (
                <TableCell key={j} position={column.cellPosition} columnWidth={column.columnWidth}>
                  {table.getCell(column, value)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="w-full flex justify-start gap-x-2">
        <button
          className="py-1 px-2 bg-secondary hover:bg-secondary/90 text-foreground rounded-md"
          onClick={() =>
            table.setColumnFilter("status", (prev) =>
              prev.includes("good") ? prev.filter((s) => s !== "good") : [...prev, "good"],
            )
          }
        >
          Filter Good
        </button>
        <button
          className="py-1 px-2 bg-secondary hover:bg-secondary/90 text-foreground rounded-md"
          onClick={() =>
            table.setColumnFilter("status", (prev) =>
              prev.includes("fair") ? prev.filter((s) => s !== "fair") : [...prev, "fair"],
            )
          }
        >
          Filter Fair
        </button>
        <button
          className="py-1 px-2 bg-secondary hover:bg-secondary/90 text-foreground rounded-md"
          onClick={() =>
            table.setColumnFilter("status", (prev) =>
              prev.includes("poor") ? prev.filter((s) => s !== "poor") : [...prev, "poor"],
            )
          }
        >
          Filter Poor
        </button>
        <button
          className="py-1 px-2 bg-secondary hover:bg-secondary/90 text-foreground rounded-md"
          onClick={() => table.setColumnSorting("ecosloNumber", !table.getColumnSorting().desc)}
        >
          Sort EcoSlo #
        </button>
        <input
          className="py-1 px-2 bg-secondary text-foreground rounded-md"
          placeholder="Filter by Treekeeper #..."
          value={table.getColumnSearchFilterValue("treekeeper")}
          onChange={(e) => table.setColumnSearchFilter("treekeeper", e.target.value)}
        ></input>
      </div>
    </div>
  );
}

export default TreePreviewTable;
