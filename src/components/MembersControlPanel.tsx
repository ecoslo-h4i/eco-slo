"use client";

import { MutableRefObject, useState } from "react";
import { MemberSchema } from "./data-table/table-widget-defs";
import { Table } from "./data-table/table/table-types";
import { ControlSearch, ControlStatusPills } from "./ControlPanel";

export default function MembersControlPanel({ tableRef }: { tableRef: MutableRefObject<Table<MemberSchema> | null> }) {
  const ROLE_STATUS_OPTIONS = ["All", "Admin", "Tree Keeper"];

  const QUERY_DELAY = 0;
  const [searchQuery, setSearchQuery] = useState("");
  const [roleActiveIndex, setRoleActiveIndex] = useState(0);

  return (
    <div className="w-full flex flex-col lg:flex-row gap-4 rounded-xl bg-off-white border border-border shadow-sm p-4 lg:p-6">
      <div className="w-full lg:w-1/2">
        <ControlSearch
          placeholder="Search for member fields..."
          query={searchQuery}
          onQueryChange={setSearchQuery}
          searchDelay={QUERY_DELAY}
          searchFunction={(query: string) => {
            const trimmedQuery = query.trimStart();
            tableRef.current?.setSearchQuery(trimmedQuery);
          }}
        />
      </div>
      <ControlStatusPills
        className="flex-1"
        containerClassName="w-full h-full"
        buttonClassName="flex-1 min-w-0"
        options={ROLE_STATUS_OPTIONS}
        activeIndex={roleActiveIndex}
        onActiveIndexChange={setRoleActiveIndex}
        delay={QUERY_DELAY}
        delayFunction={(status: string) =>
          tableRef.current?.setColumnFilter("role", () => (status === "All" ? [] : [status.toLowerCase()]))
        }
      />
    </div>
  );
}
