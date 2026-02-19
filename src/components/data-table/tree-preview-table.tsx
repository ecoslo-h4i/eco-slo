import React from "react";
import Table from "./table/table";
import TableHeader from "./table/table-header";
import TableRow from "./table/table-row";
import TableHead from "./table/table-head";
import TableBody from "./table/table-body";
import TableCell from "./table/table-cell";
import { treeWidgetSchema } from "./table-widget-defs";
import { ColumnDef } from "./table/column-def";

function TreePreviewTable({ data, cols }: { data: treeWidgetSchema[]; cols: ColumnDef<treeWidgetSchema>[] }) {
  return (
    <Table className="w-full h-full bg-background">
      <TableHeader>
        <TableRow>
          {cols.map((col, i) => (
            <TableHead key={i} position={col.headPosition}>
              {col.name}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, i) => (
          <TableRow key={i}>
            {cols.map((col, j) => (
              <TableCell key={j} position={col.cellPosition}>
                {col.cell(row[col.accessorKey])}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default TreePreviewTable;
