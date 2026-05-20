"use client";
import { ChangeEvent, type MutableRefObject, useEffect, useRef, useState } from "react";

type Member = {
  id: number;
  firstname: string;
  lastname: string;
};

type Tree = {
  id: number;
  latitude: number;
  longitude: number;
  member: Member | null;
  species_name?: string | null;
  common_name: string;
  address: string;
  status: string;
  date_planted: string;
  notes: string;
  is_public: boolean;
};

export enum Visibility {
  Public = "Public",
  Private = "Private",
}

export enum Status {
  Active = "Active",
  Graduated = "Graduated",
}

interface ControlSearchProps {
  searchDelay: number;
  searchFunction: (status: string) => void;
}

function ControlSearch(props: ControlSearchProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      props.searchFunction(query);
    }, props.searchDelay);

    return () => {
      clearTimeout(handler);
    };
  }, [query, props.searchDelay, props.searchFunction]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setQuery(next);
  };

  return (
    <div className="h-[44px] flex itesm-center rounded-2xl bg-white border solid border-border">
      <input
        type="text"
        id="query"
        placeholder="Search by address"
        value={query}
        onChange={handleChange}
        className="w-full px-[24px] py-[12px] text-lg text-text placeholder:text-text-muted outline-none bg-transparent"
      />
    </div>
  );
}

interface ControlPanelProps {
  trees: Tree[];
  onFilter: (filtered: Tree[]) => void;
  onCenter: () => void;
}

interface ControlStatusPillsInterface {
  text: string;
  options: string[];
  delay: number; // Delay in ms before calling delayFunction
  delayFunction: (status: string) => void;
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
      props.delayFunction(props.options[index]);
    }, props.delay);
  };

  return (
    <div className="flex flex-col gap-1.5 select-none">
      <h2 className="text-lg font-medium text-text">{props.text}</h2>
      <div className="flex gap-2 flex-wrap">
        {props.options.map((option, index) => (
          <button
            key={option}
            type="button"
            className={`h-9 rounded-xl cursor-pointer flex items-center justify-center px-3 transition-colors text-sm ${
              option === props.activeFilter
                ? "bg-primary text-on-primary border-none"
                : "bg-off-white-2 text-text border border-border"
            }`}
            onClick={() => handleSelect(index)}
          >
            <p className="font-medium text-lg whitespace-nowrap">{option}</p>
          </button>
        ))}
      </div>
    </div>
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
    const newFilter = visibilityFilter === filter ? null : filter; // Toggle filter
    setVisibilityFilter(newFilter);
    applyFilters(visibilityFilter, statusFilter, searchQuery);
  };

  const handleStatusFilter = (filter: Status) => {
    const newFilter = statusFilter === filter ? null : filter; // Toggle filter
    setStatusFilter(newFilter);
    applyFilters(visibilityFilter, statusFilter, searchQuery);
  };

  const handleClearFilters = () => {
    setVisibilityFilter(null);
    setStatusFilter(null);
    applyFilters(null, null, searchQuery);
  };

  const applyFilters = (visibility: Visibility | null, status: Status | null, query: string) => {
    let filtered: Tree[] = props.trees;

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
    <div className="w-full h-full p-2 flex flex-col gap-4">
      <ControlSearch searchDelay={300} searchFunction={handleSearch} />
      <div className="flex flex-row flex-wrap items-center gap-2">
        <ControlStatusPills
          text=""
          options={["All"]}
          delay={0}
          delayFunction={handleClearFilters}
          activeFilter={!visibilityFilter && !statusFilter ? "All" : ""}
        />
        <ControlStatusPills
          text=""
          options={[Visibility.Public, Visibility.Private]}
          delay={0}
          delayFunction={(option: string) => {
            handleVisibilityFilter(option as Visibility);
          }}
          activeFilter={visibilityFilter ?? ""}
        />
        <ControlStatusPills
          text=""
          options={[Status.Active, Status.Graduated]}
          delay={0}
          delayFunction={(option: string) => {
            handleStatusFilter(option as Status);
          }}
          activeFilter={statusFilter ?? ""}
        />
      </div>
    </div>
  );
}
