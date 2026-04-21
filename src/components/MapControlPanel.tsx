"use client";
import { ChangeEvent, type MutableRefObject, useEffect, useRef, useState } from "react";
import Image from "next/image";

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
    <div className="h-[44px] flex itesm-center rounded-2xl bg-white border solid border-[#D6D1C7]">
      <input
        type="text"
        id="query"
        placeholder="Search by address"
        value={query}
        onChange={handleChange}
        className="w-full px-[24px] py-[12px] text-lg text-[#2B2B2B] placeholder:text-[#6B6B6B] outline-none bg-transparent"
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
  activeBackgroundHex: string;
  activeTextHex: string;
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
      <h2 className="text-lg font-medium text-[#2B2B2B]">{props.text}</h2>
      <div className="flex gap-2 flex-wrap">
        {props.options.map((option, index) => (
          <button
            key={option}
            type="button"
            className="h-9 rounded-xl cursor-pointer flex items-center justify-center px-3 transition-colors text-sm"
            onClick={() => handleSelect(index)}
            style={{
              backgroundColor: option === props.activeFilter ? props.activeBackgroundHex : "#E7E2D8",
              color: option === props.activeFilter ? props.activeTextHex : "#2B2B2B",
              border: option === props.activeFilter ? "none" : "1px solid #D6D1C7",
            }}
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
  const [activeFilter, setActiveFilter] = useState("All");

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters(activeFilter, query);
  };
  const handleFilter = (filter: string) => {
    const newFilter = activeFilter === filter ? "All" : filter; // Toggle filter
    setActiveFilter(newFilter);
    applyFilters(newFilter, searchQuery);
  };

  const applyFilters = (filter: string, query: string) => {
    let filtered: Tree[] = props.trees;

    switch (filter) {
      case "All":
        break;
      case "Public":
        filtered = filtered.filter((tree) => tree.is_public);
        break;
      case "Private":
        filtered = filtered.filter((tree) => !tree.is_public);
        break;
      case "Active":
        filtered = filtered.filter((tree) => tree.status === "Active");
        break;
      case "Graduated":
        filtered = filtered.filter((tree) => tree.status === "Graduated");
        break;
    }

    if (query.trim()) {
      filtered = filtered.filter((tree) => tree.address.toLowerCase().includes(query.toLowerCase()));
    }

    props.onFilter(filtered);
  };

  return (
    <div className="w-full h-full p-6 flex flex-col gap-6">
      <ControlSearch searchDelay={300} searchFunction={handleSearch} />
      <ControlStatusPills
        text=""
        options={["All", "Public", "Private", "Active", "Graduated"]}
        delay={0}
        delayFunction={handleFilter}
        activeBackgroundHex="#6F7C58"
        activeTextHex="white"
        activeFilter={activeFilter}
      />
    </div>
  );
}
