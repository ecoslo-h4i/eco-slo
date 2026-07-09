"use client";

import { type MutableRefObject, useCallback, useEffect, useState } from "react";
import { surveyColumns, SurveySchema } from "./data-table/table-widget-defs";
import { Table } from "./data-table/table/table-types";
import SurveyPageTable from "./data-table/survey-page-table";
import { getSurveys } from "@/lib/get-surveys";

function SurveyPageTableWidget({
  className,
  onRowClick,
  onTableReady,
  refetchRef,
  onlySubmittedBy,
}: {
  className?: string;
  onRowClick: (e: React.MouseEvent<HTMLTableRowElement, MouseEvent>, survey: SurveySchema) => void;
  onTableReady?: (table: Table<SurveySchema>) => void;
  refetchRef?: MutableRefObject<(() => void) | null>;
  /** Restrict to one member's submissions (Tree Keepers); null for no restriction (admins). */
  onlySubmittedBy?: number | null;
}) {
  const [surveys, setSurveys] = useState<SurveySchema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSurveys = useCallback(() => getSurveys({ onlySubmittedBy }), [onlySubmittedBy]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = await loadSurveys();
        if (mounted) {
          setSurveys(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load surveys");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [loadSurveys]);

  useEffect(() => {
    if (!refetchRef) return;
    refetchRef.current = async () => {
      const data = await loadSurveys();
      setSurveys(data);
    };
  }, [refetchRef, loadSurveys]);

  return (
    <div className={`min-w-0 flex flex-col ${className || ""}`}>
      <div className="flex-1 min-h-0 min-w-0 flex flex-col">
        {error ? (
          <div className="w-full h-full flex justify-center items-center text-danger">{error}</div>
        ) : (
          <SurveyPageTable
            className="w-full max-w-full min-w-0"
            onRowClick={onRowClick}
            onTableReady={onTableReady}
            data={surveys}
            cols={surveyColumns}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}

export default SurveyPageTableWidget;
