"use client";

import { useEffect, useState } from "react";
import { MemberSchema, memberColumns } from "./data-table/table-widget-defs";
import { Table } from "./data-table/table/table-types";
import MemberPageTable from "./data-table/member-page-table";

type AdminMembersResponse = {
  message?: MemberSchema[] | string;
  error?: string;
};

export async function getAdminMembers() {
  const response = await fetch("/api/admin/members");
  const payload = (await response.json()) as AdminMembersResponse;

  if (!response.ok) {
    throw new Error(payload.error ?? String(payload.message ?? "Failed to load members"));
  }

  if (!Array.isArray(payload.message)) return [];

  return payload.message;
}

function TreePageTableWidget({
  className,
  onRowClick,
  onTableReady,
}: {
  className?: string;
  onRowClick: (e: React.MouseEvent<HTMLTableRowElement, MouseEvent>, tree: MemberSchema) => void;
  onTableReady?: (table: Table<MemberSchema>) => void;
}) {
  const [members, setMembers] = useState<MemberSchema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = await getAdminMembers();
        if (mounted) {
          setMembers(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load trees");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className={`min-w-0 flex flex-col ${className || ""}`}>
      <div className="flex-1 min-h-0 min-w-0 flex flex-col">
        {error ? (
          <div className="w-full h-full flex justify-center items-center text-red-500">{error}</div>
        ) : (
          <MemberPageTable
            className="w-full max-w-full min-w-0"
            onRowClick={onRowClick}
            onTableReady={onTableReady}
            data={members}
            cols={memberColumns}
          />
        )}
      </div>
    </div>
  );
}

export default TreePageTableWidget;
