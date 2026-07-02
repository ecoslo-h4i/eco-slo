"use client";
import { useEffect, useRef, useState } from "react";
import { PillGroup, SearchField } from "@/components/ui/form-controls";
import type { MapTree } from "@/types/map";

export enum Visibility {
  Public = "Public",
  Private = "Private",
}

export enum Status {
  Active = "Active",
  Graduated = "Graduated",
}

type FilterOption = {
  label: string;
  value: Status | Visibility | "All";
};

interface ControlSearchProps {
  searchDelay: number;
  searchFunction: (status: string) => void;
}

function ControlSearch({ searchDelay, searchFunction }: ControlSearchProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      searchFunction(query);
    }, searchDelay);

    return () => {
      clearTimeout(handler);
    };
  }, [query, searchDelay, searchFunction]);

  const handleChange = (next: string) => setQuery(next);

  return <SearchField id="query" placeholder="Search location..." value={query} onQueryChange={handleChange} />;
}

interface ControlPanelProps {
  trees: MapTree[];
  onFilter: (filtered: MapTree[]) => void;
  onCenter: () => void;
}

interface ControlStatusPillsInterface {
  options: FilterOption[];
  delay: number; // Delay in ms before calling delayFunction
  delayFunction: (status: FilterOption["value"]) => void;
  activeFilter: string;
}

function ControlStatusPills(props: ControlStatusPillsInterface) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleSelect = (index: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      props.delayFunction(props.options[index].value);
    }, props.delay);
  };

  return (
    <PillGroup
      activeValue={props.activeFilter}
      className="flex-nowrap"
      options={props.options.map((option) => ({ label: option.label, value: option.value }))}
      onChange={(_, index) => handleSelect(index)}
    />
  );
}

export default function ControlPanel(props: ControlPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<Visibility | null>(null);
  const [statusFilter, setStatusFilter] = useState<Status | null>(null);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters(visibilityFilter, statusFilter, query);
  };

  const handleVisibilityFilter = (filter: Visibility) => {
    const newFilter = visibilityFilter === filter ? null : filter;
    setVisibilityFilter(newFilter);
    applyFilters(newFilter, statusFilter, searchQuery);
  };

  const handleStatusFilter = (filter: Status) => {
    const newFilter = statusFilter === filter ? null : filter;
    setStatusFilter(newFilter);
    applyFilters(visibilityFilter, newFilter, searchQuery);
  };

  const handleClearFilters = () => {
    setVisibilityFilter(null);
    setStatusFilter(null);
    applyFilters(null, null, searchQuery);
  };

  const applyFilters = (visibility: Visibility | null, status: Status | null, query: string) => {
    let filtered: MapTree[] = props.trees;

    if (visibility !== null) {
      switch (visibility) {
        case Visibility.Public:
          filtered = filtered.filter((tree) => tree.is_public);
          break;
        case Visibility.Private:
          filtered = filtered.filter((tree) => !tree.is_public);
          break;
      }
    }

    if (status !== null) {
      switch (status) {
        case Status.Active:
          filtered = filtered.filter((tree) => tree.status === Status.Active);
          break;
        case Status.Graduated:
          filtered = filtered.filter((tree) => tree.status === Status.Graduated);
          break;
      }
    }

    if (query.trim()) {
      filtered = filtered.filter((tree) => tree.address.toLowerCase().includes(query.toLowerCase()));
    }

    props.onFilter(filtered);
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <ControlSearch searchDelay={300} searchFunction={handleSearch} />
      <div className="flex flex-row flex-wrap items-center gap-2">
        <ControlStatusPills
          options={[{ label: "All Trees", value: "All" }]}
          delay={0}
          delayFunction={handleClearFilters}
          activeFilter={!visibilityFilter && !statusFilter ? "All" : ""}
        />
        <ControlStatusPills
          options={[
            { label: "Active", value: Status.Active },
            { label: "Graduated", value: Status.Graduated },
          ]}
          delay={0}
          delayFunction={(option) => {
            handleStatusFilter(option as Status);
          }}
          activeFilter={statusFilter ?? ""}
        />
        <ControlStatusPills
          options={[
            { label: "Public", value: Visibility.Public },
            { label: "Private", value: Visibility.Private },
          ]}
          delay={0}
          delayFunction={(option) => {
            handleVisibilityFilter(option as Visibility);
          }}
          activeFilter={visibilityFilter ?? ""}
        />
      </div>
    </div>
  );
}
