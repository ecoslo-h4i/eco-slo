"use client";
import SurveyPageTableWidget from "@/components/SurveyPageTableWidget";
import SurveysControlPanel from "@/components/SurveysControlPanel";
import { useCallback, useRef, useState } from "react";
import { SurveySchema } from "@/components/data-table/table-widget-defs";
import SurveyDetailModal from "@/components/survey-detail-modal";
import { Table } from "@/components/data-table/table/table-types";
import { Download, Plus } from "lucide-react";
import { downloadSurveyCSV, dataToCSV } from "./utils/csv";
import { AppButton } from "@/components/ui/form-controls";
import { AdminPageShell } from "@/components/admin-page-shell";
import { useCurrentMember } from "@/hooks/useCurrentProvider";

export default function Surveys() {
  const { member, loading, isAdmin } = useCurrentMember();
  const tableRef = useRef<Table<SurveySchema> | null>(null);
  const refetchRef = useRef<(() => void) | null>(null);
  const [surveyModalOpen, setSurveyModalOpen] = useState(false);
  const [modalSurvey, setModalSurvey] = useState<SurveySchema | null>(null);

  const handleTableReady = useCallback((table: Table<SurveySchema>) => {
    tableRef.current = table;
  }, []);

  const handleAddSurveyClick = () => {
    setModalSurvey(null);
    setSurveyModalOpen(true);
  };

  const handleModalOpenChange = (open: boolean) => {
    setSurveyModalOpen(open);
    if (!open) setModalSurvey(null);
  };

  return (
    <AdminPageShell
      title="Surveys"
      actions={
        <>
          {isAdmin && (
            <AppButton
              variant="secondary"
              size="md"
              radius="small"
              icon={Download}
              onClick={() => {
                downloadSurveyCSV(
                  dataToCSV(
                    tableRef?.current?.getRowModels().map((rowModel) => {
                      const row: Record<string, unknown> = {};
                      rowModel.cells.forEach((cell) => {
                        row[cell.column.id] = cell.value;
                      });
                      return row;
                    }) ?? [],
                  ),
                );
              }}
            >
              Export CSV
            </AppButton>
          )}
          <AppButton radius="small" icon={Plus} onClick={handleAddSurveyClick}>
            Add Survey
          </AppButton>
        </>
      }
    >
      <SurveysControlPanel tableRef={tableRef} />
      {/* Wait for the member so Tree Keepers get their own-submissions scope
          on the first fetch (admins fetch everything). */}
      {!loading ? (
        <SurveyPageTableWidget
          refetchRef={refetchRef}
          onlySubmittedBy={isAdmin ? null : (member?.id ?? -1)}
          onRowClick={(event, survey) => {
            event.stopPropagation();
            setModalSurvey(survey);
            setSurveyModalOpen(true);
          }}
          onTableReady={handleTableReady}
          className="w-full max-w-full"
        />
      ) : null}
      <SurveyDetailModal
        survey={modalSurvey}
        open={surveyModalOpen}
        onOpenChange={handleModalOpenChange}
        onSaved={() => refetchRef.current?.()}
        isAdmin={isAdmin}
      />
    </AdminPageShell>
  );
}
