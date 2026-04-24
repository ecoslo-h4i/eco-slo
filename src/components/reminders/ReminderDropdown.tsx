"use client";
import { ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../dropdown-menu";
import { useState } from "react";

interface ReminderDropdownProps {
  label: string;
  options: string[];
  placeholder?: string;
  onOptionClick?: (s: string) => void;
}

export default function ReminderDropdown(props: ReminderDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentOption, setCurrentOption] = useState(props.placeholder || "");

  const handleOptionClick = (option: string) => {
    props.onOptionClick?.(option);
    setCurrentOption(option);
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <span className="font-avenir text-m font-normal">{props.label}</span>

      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger className="flex flex-row items-center justify-between w-full h-10 rounded-full bg-white px-4 font-avenir text-m focus:outline-none hover:cursor-pointer">
          <span className="text-text-dark">{currentOption}</span>
          <ChevronDown
            className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isOpen && "rotate-180"}`}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {props.options.map((option) => (
            <DropdownMenuItem key={option} className="font-medium" onClick={() => handleOptionClick(option)}>
              {option}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
