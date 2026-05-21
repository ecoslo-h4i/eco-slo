"use client";

import { type MutableRefObject, useEffect, useState } from "react";
import { MemberSchema, memberColumns } from "./data-table/table-widget-defs";
import { Table } from "./data-table/table/table-types";
import MemberPageTable from "./data-table/member-page-table";
import { Database } from "@/database/database.types";

type AdminMembersResponse = {
  message?: Database["public"]["Tables"]["members"]["Row"][] | string;
  error?: string;
};

export async function getAdminMembers() {
  const response = await fetch("/api/admin/members");
  const payload = (await response.json()) as AdminMembersResponse;

  if (!response.ok) {
    throw new Error(payload.error ?? String(payload.message ?? "Failed to load members"));
  }

  if (!Array.isArray(payload.message)) return [];

  return payload.message.map((member) => ({
    ...member,
    name: `${member.firstname} ${member.lastname}`,
  }));
}

function MemberPageTableWidget({
  className,
  onRowClick,
  onTableReady,
  refetchRef,
}: {
  className?: string;
  onRowClick: (e: React.MouseEvent<HTMLTableRowElement, MouseEvent>, member: MemberSchema) => void;
  onTableReady?: (table: Table<MemberSchema>) => void;
  refetchRef?: MutableRefObject<(() => void) | null>;
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
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load members");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!refetchRef) return;
    refetchRef.current = async () => {
      const data = await getAdminMembers();
      setMembers(data);
    };
  }, [refetchRef]);

  return (
    <div className={`min-w-0 flex flex-col ${className || ""}`}>
      <div className="flex-1 min-h-0 min-w-0 flex flex-col">
        {error ? (
          <div className="w-full h-full flex justify-center items-center text-danger">{error}</div>
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

export default MemberPageTableWidget;
