"use client";

import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "../dropdown-menu";
import { cn } from "@/lib/utils";

export type NestedMultiSelectOption = {
  label: string;
  value: string;
};

export type NestedMultiSelectGroup = NestedMultiSelectOption & {
  options: NestedMultiSelectOption[];
};

export type NestedMultiSelectValue = Record<string, string[]>;

interface ReminderNestedMultiSelectDropdownProps {
  disabled?: boolean;
  label: string;
  options: NestedMultiSelectGroup[];
  placeholder?: string;
  defaultValue?: NestedMultiSelectValue;
  value?: NestedMultiSelectValue;
  onChange?: (value: NestedMultiSelectValue) => void;
}

function getAllNestedValues(group: NestedMultiSelectGroup) {
  return group.options.map((option) => option.value);
}

function getSelectedCount(value: NestedMultiSelectValue) {
  return Object.values(value).reduce((count, selectedValues) => count + selectedValues.length, 0);
}

export default function ReminderNestedMultiSelectDropdown({
  defaultValue,
  disabled = false,
  label,
  onChange,
  options,
  placeholder = "Select recipients",
  value,
}: ReminderNestedMultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [internalSelectedValue, setInternalSelectedValue] = useState<NestedMultiSelectValue>(() => defaultValue ?? {});
  const selectedValue = value ?? internalSelectedValue;

  const selectedParentOptions = useMemo(
    () => options.filter((option) => selectedValue[option.value]?.length),
    [options, selectedValue],
  );

  const triggerText = useMemo(() => {
    const selectedCount = getSelectedCount(selectedValue);

    if (selectedCount === 0) return placeholder;
    if (selectedParentOptions.length === 1) {
      return `${selectedParentOptions[0].label} (${selectedCount})`;
    }

    return `${selectedParentOptions.length} groups (${selectedCount})`;
  }, [placeholder, selectedParentOptions, selectedValue]);

  const updateSelectedValue = (nextValue: NestedMultiSelectValue) => {
    if (disabled) return;

    setInternalSelectedValue(nextValue);
    onChange?.(nextValue);
  };

  const toggleGroup = (group: NestedMultiSelectGroup) => {
    const isSelected = Boolean(selectedValue[group.value]?.length);
    const nextValue = { ...selectedValue };

    if (isSelected) {
      delete nextValue[group.value];
    } else {
      nextValue[group.value] = getAllNestedValues(group);
      setOpenGroups((current) => ({ ...current, [group.value]: true }));
    }

    updateSelectedValue(nextValue);
  };

  const toggleNestedOption = (group: NestedMultiSelectGroup, nestedOption: NestedMultiSelectOption) => {
    const currentNestedValues = selectedValue[group.value] ?? [];
    const nextNestedValues = currentNestedValues.includes(nestedOption.value)
      ? currentNestedValues.filter((value) => value !== nestedOption.value)
      : [...currentNestedValues, nestedOption.value];
    const nextValue = { ...selectedValue };

    if (nextNestedValues.length === 0) {
      delete nextValue[group.value];
    } else {
      nextValue[group.value] = nextNestedValues;
    }

    updateSelectedValue(nextValue);
  };

  return (
    <div className="flex w-full flex-col gap-1">
      <span className="font-avenir text-m font-normal">{label}</span>

      <DropdownMenu open={!disabled && isOpen} onOpenChange={disabled ? undefined : setIsOpen}>
        <DropdownMenuTrigger
          disabled={disabled}
          className="flex h-10 w-full flex-row items-center justify-between rounded-full bg-white px-4 font-avenir text-m focus:outline-none hover:cursor-pointer disabled:cursor-default disabled:bg-table-header disabled:opacity-100"
        >
          <span className={cn("truncate", getSelectedCount(selectedValue) > 0 ? "text-text-dark" : "text-text-muted")}>
            {triggerText}
          </span>
          {!disabled && (
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-text-muted transition-transform duration-200",
                isOpen && "rotate-180",
              )}
            />
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-72 p-2 font-avenir">
          <div className="flex max-h-80 flex-col gap-1 overflow-auto">
            {options.map((group) => {
              const selectedNestedValues = selectedValue[group.value] ?? [];
              const isGroupSelected = selectedNestedValues.length > 0;
              const allNestedSelected = selectedNestedValues.length === group.options.length;
              const isGroupOpen = openGroups[group.value] ?? isGroupSelected;

              return (
                <div key={group.value} className="rounded-lg">
                  <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-table-header">
                    <input
                      type="checkbox"
                      disabled={disabled}
                      checked={isGroupSelected}
                      onChange={() => toggleGroup(group)}
                      className="h-4 w-4 accent-primary"
                    />
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleGroup(group)}
                      className="min-w-0 flex-1 text-left font-medium text-text-dark disabled:cursor-default"
                    >
                      <span className="block truncate">{group.label}</span>
                    </button>
                  </div>
                  <div className="ml-6 mt-1 flex flex-col gap-1 border-l border-border pl-3">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => setOpenGroups((current) => ({ ...current, [group.value]: !isGroupOpen }))}
                      className="flex items-center justify-between rounded-lg bg-white px-2 py-1.5 text-left text-xs font-medium text-text-muted transition-colors hover:cursor-pointer hover:bg-table-header disabled:cursor-default disabled:bg-table-header disabled:hover:bg-table-header"
                    >
                      <span>{allNestedSelected ? "All selected" : `${selectedNestedValues.length} selected`}</span>
                      {!disabled && (
                        <ChevronDown
                          className={cn("h-4 w-4 transition-transform duration-200", isGroupOpen && "rotate-180")}
                        />
                      )}
                    </button>
                    {isGroupOpen &&
                      group.options.map((nestedOption) => (
                        <label
                          key={nestedOption.value}
                          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-text-dark transition-colors hover:bg-table-header"
                        >
                          <input
                            type="checkbox"
                            disabled={disabled}
                            checked={selectedNestedValues.includes(nestedOption.value)}
                            onChange={() => toggleNestedOption(group, nestedOption)}
                            className="h-4 w-4 accent-primary"
                          />
                          <span className="min-w-0 flex-1 truncate">{nestedOption.label}</span>
                        </label>
                      ))}
                    {isGroupOpen && group.options.length === 0 && (
                      <span className="rounded-lg px-2 py-1.5 text-sm text-text-muted">No options available</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
