"use client";

import { type MutableRefObject, useCallback, useState } from "react";
import { SurveySchema } from "./data-table/table-widget-defs";
import { Table } from "./data-table/table/table-types";
import { Check, X } from "lucide-react";
import { ControlColumnsSelect, ControlFilterDropdown, ControlSearch, ControlStatusPills } from "./ControlPanel";
import { appButtonClassName } from "@/components/ui/form-controls";
import { SURVEY_ISSUE_OPTIONS } from "@/types/survey";

interface SurveysControlPanelProps {
  tableRef: MutableRefObject<Table<SurveySchema> | null>;
}

export default function SurveysControlPanel({ tableRef }: SurveysControlPanelProps) {
  const ISSUE_FILTER_OPTIONS = ["All", ...SURVEY_ISSUE_OPTIONS.map((option) => option.label)];
  // Self-describing labels — the pills render without a header so they stay
  // height-aligned with the search bar, matching the other dashboards.
  const CONTACT_FILTER_OPTIONS = ["All", "Contact OK", "No Contact"];
  const LINKED_FILTER_OPTIONS = ["All", "Linked", "Unlinked"];
  const QUERY_DELAY = 0;

  const [searchQuery, setSearchQuery] = useState("");
  const [contactActiveIndex, setContactActiveIndex] = useState(0);
  const [issueActiveIndex, setIssueActiveIndex] = useState(0);
  const [linkedActiveIndex, setLinkedActiveIndex] = useState(0);

  const searchSurveys = useCallback(
    (query: string) => {
      const trimmedQuery = query.trimStart();
      tableRef.current?.setSearchQuery(trimmedQuery);
    },
    [tableRef],
  );

  const filterByContact = useCallback(
    (contact: string) => {
      tableRef.current?.setColumnFilter("admin_contact", () =>
        contact === "All" ? [] : [contact === "Contact OK" ? "yes" : "no"],
      );
    },
    [tableRef],
  );

  const filterByIssue = useCallback(
    (issue: string) => {
      tableRef.current?.setColumnFilter("issue", () => (issue === "All" ? [] : [issue.toLowerCase()]));
    },
    [tableRef],
  );

  const filterByLinked = useCallback(
    (linked: string) => {
      tableRef.current?.setColumnFilter("tree_label", () => (linked === "All" ? [] : [linked.toLowerCase()]));
    },
    [tableRef],
  );

  const resetFilters = () => {
    setSearchQuery("");
    setContactActiveIndex(0);
    setIssueActiveIndex(0);
    setLinkedActiveIndex(0);
    tableRef.current?.setSearchQuery("");
    tableRef.current?.setColumnFilter("admin_contact", () => []);
    tableRef.current?.setColumnFilter("issue", () => []);
    tableRef.current?.setColumnFilter("tree_label", () => []);
  };

  return (
    <div className="w-full flex flex-col gap-4 rounded-xl bg-off-white border border-border shadow-sm p-4 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="w-full lg:w-1/2">
          <ControlSearch
            placeholder="Search for survey fields..."
            query={searchQuery}
            onQueryChange={setSearchQuery}
            searchDelay={QUERY_DELAY}
            searchFunction={searchSurveys}
          />
        </div>
        <ControlStatusPills
          className="flex-1"
          containerClassName="w-full h-full"
          buttonClassName="min-w-0 sm:flex-1"
          options={CONTACT_FILTER_OPTIONS}
          activeIndex={contactActiveIndex}
          onActiveIndexChange={setContactActiveIndex}
          delay={QUERY_DELAY}
          delayFunction={filterByContact}
        />
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 md:grid-cols-3">
          <ControlFilterDropdown
            triggerClassName="w-full"
            label="Issue"
            dropDown={ISSUE_FILTER_OPTIONS}
            activeIndex={issueActiveIndex}
            onActiveIndexChange={setIssueActiveIndex}
            delay={QUERY_DELAY}
            delayFunction={filterByIssue}
          />
          <ControlFilterDropdown
            triggerClassName="w-full"
            label="Linked Tree"
            dropDown={LINKED_FILTER_OPTIONS}
            activeIndex={linkedActiveIndex}
            onActiveIndexChange={setLinkedActiveIndex}
            delay={QUERY_DELAY}
            delayFunction={filterByLinked}
          />
          <ControlColumnsSelect
            label="Columns"
            tableRef={tableRef}
            triggerClassName="w-full"
            checkedIcon={<Check />}
            onCheckedItem={(item: string) => tableRef.current?.setColumnVisibility(item, (visible) => !visible)}
          />
        </div>

        {(searchQuery !== "" || contactActiveIndex !== 0 || issueActiveIndex !== 0 || linkedActiveIndex !== 0) && (
          <button
            type="button"
            className={appButtonClassName({
              className: "self-start px-2 md:px-3 xl:self-end",
              radius: "small",
              size: "sm",
              variant: "ghost",
            })}
            onClick={resetFilters}
          >
            <X className="w-4 h-4" />
            <span className="text-sm lg:text-md">Clear Filters</span>
          </button>
        )}
      </div>
    </div>
  );
}
