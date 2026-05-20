"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { reminderElevationHoverClass } from "./reminderInputStyles";

export interface YearlyDate {
  /** 1-12 */
  month: number;
  /** 1-31, must be valid for the chosen month */
  day: number;
}

interface ReminderYearlyDatePickerProps {
  value: YearlyDate | null;
  onChange: (value: YearlyDate) => void;
  disabled?: boolean;
  className?: string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const;

/**
 * Reference year for laying out the calendar grid. 2024 is a leap year so
 * Feb 29 is selectable; the warning footnote explains the consequence.
 *
 * The reference year is *not* stored anywhere. Only `month` and `day` flow
 * out of this component; the cron for yearly schedules is `M H D Mo *` —
 * no year component.
 */
const REFERENCE_YEAR = new Date().getUTCFullYear();

function getDaysInMonth(month: number): number {
  // month is 1-indexed; Date(year, month, 0) gives the last day of month-1.
  return new Date(REFERENCE_YEAR, month, 0).getDate();
}

function getFirstWeekdayOfMonth(month: number): number {
  return new Date(REFERENCE_YEAR, month - 1, 1).getDay();
}

/**
 * Month-navigable date picker for yearly cron schedules. Year is hidden
 * because the reminder repeats annually — only month + day matter.
 */
export default function ReminderYearlyDatePicker({
  value,
  onChange,
  disabled = false,
  className,
}: ReminderYearlyDatePickerProps) {
  const [viewMonth, setViewMonth] = useState<number>(value?.month ?? new Date().getMonth() + 1);

  // If the parent swaps the value (e.g. switching between reminders), jump
  // the calendar view to the new value's month.
  const [prevValueMonth, setPrevValueMonth] = useState<number | undefined>(value?.month);
  if (value?.month !== prevValueMonth) {
    setPrevValueMonth(value?.month);
    if (value?.month) setViewMonth(value.month);
  }

  const daysInMonth = getDaysInMonth(viewMonth);
  const firstWeekday = getFirstWeekdayOfMonth(viewMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handlePrev = () => {
    if (disabled) return;
    setViewMonth((m) => (m === 1 ? 12 : m - 1));
  };

  const handleNext = () => {
    if (disabled) return;
    setViewMonth((m) => (m === 12 ? 1 : m + 1));
  };

  const handleSelect = (day: number) => {
    if (disabled) return;
    onChange({ month: viewMonth, day });
  };

  const showLeapWarning = value?.month === 2 && value?.day === 29;

  return (
    <div className={cn("rounded-3xl bg-white p-4", disabled && "bg-table-header", className)}>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          disabled={disabled}
          onClick={handlePrev}
          aria-label="Previous month"
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-150",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
            disabled ? "cursor-default opacity-50" : `cursor-pointer ${reminderElevationHoverClass}`,
          )}
        >
          <ChevronLeft className="h-4 w-4 text-text-dark" />
        </button>

        <span className="font-lato text-m font-medium text-text-dark">{MONTH_NAMES[viewMonth - 1]}</span>

        <button
          type="button"
          disabled={disabled}
          onClick={handleNext}
          aria-label="Next month"
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-150",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
            disabled ? "cursor-default opacity-50" : `cursor-pointer ${reminderElevationHoverClass}`,
          )}
        >
          <ChevronRight className="h-4 w-4 text-text-dark" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1.5">
        {WEEKDAY_LABELS.map((label, idx) => (
          <span
            key={`${label}-${idx}`}
            className="flex h-6 items-center justify-center font-lato text-xs text-text-muted"
          >
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {/* Empty cells before the 1st */}
        {Array.from({ length: firstWeekday }).map((_, i) => (
          <div key={`pad-${i}`} className="h-9 w-9" aria-hidden="true" />
        ))}

        {days.map((day) => {
          const isSelected = value?.month === viewMonth && value?.day === day;

          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              aria-label={`${MONTH_NAMES[viewMonth - 1]} ${day}`}
              aria-pressed={isSelected}
              onClick={() => handleSelect(day)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full font-lato text-sm transition-colors duration-150",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                isSelected ? "bg-primary text-text-light" : "text-text-dark",
                !disabled && !isSelected && reminderElevationHoverClass,
                disabled && !isSelected && "opacity-50",
                disabled ? "cursor-default" : "cursor-pointer",
              )}
            >
              {day}
            </button>
          );
        })}
      </div>

      {showLeapWarning && (
        <p className="mt-3 font-lato text-xs text-text-muted">
          Note: February 29 only exists in leap years — this reminder will fire once every four years.
        </p>
      )}
    </div>
  );
}
