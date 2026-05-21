"use client";
import { ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../dropdown-menu";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  reminderDropdownContentClass,
  reminderDropdownItemClass,
  reminderDropdownTriggerClass,
  reminderFieldLabelClass,
} from "./reminderInputStyles";

interface ReminderDropdownProps {
  disabled?: boolean;
  label: string;
  options: string[];
  placeholder?: string;
  value?: string;
  onOptionClick?: (s: string) => void;
}

export default function ReminderDropdown(props: ReminderDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentOption, setCurrentOption] = useState(props.placeholder ?? "");
  const displayedOption = props.value || currentOption;
  const isPlaceholder = displayedOption === props.placeholder && !props.value;

  const handleOptionClick = (option: string) => {
    if (props.disabled) return;

    props.onOptionClick?.(option);
    setCurrentOption(option);
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <span className={reminderFieldLabelClass}>{props.label}</span>

      <DropdownMenu open={!props.disabled && isOpen} onOpenChange={props.disabled ? undefined : setIsOpen}>
        <DropdownMenuTrigger disabled={props.disabled} className={reminderDropdownTriggerClass}>
          <span
            className={cn(
              "truncate leading-normal [text-box:normal]",
              isPlaceholder ? "text-text-muted" : "text-text-dark",
            )}
          >
            {displayedOption}
          </span>
          {!props.disabled && (
            <ChevronDown
              className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isOpen && "rotate-180"}`}
            />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className={reminderDropdownContentClass}>
          {props.options.map((option) => (
            <DropdownMenuItem
              key={option}
              className={reminderDropdownItemClass}
              onClick={() => handleOptionClick(option)}
            >
              {option}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
