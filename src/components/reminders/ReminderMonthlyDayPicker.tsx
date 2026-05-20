"use client";

import { cn } from "@/lib/utils";
import { reminderElevationHoverClass } from "./reminderInputStyles";

interface ReminderMonthlyDayPickerProps {
  /** Day of month, 1-31. `null` means nothing selected yet. */
  value: number | null;
  onChange: (day: number) => void;
  disabled?: boolean;
  className?: string;
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

/**
 * Day-of-month picker for monthly cron schedules.
 *
 * Deliberately *not* weekday-aligned: a monthly reminder fires on the same
 * day-of-month regardless of weekday, so showing a calendar for a specific
 * month (with the day "1" in some weekday column) would be misleading.
 *
 * Days 29-31 are still selectable — pg_cron will simply skip months that
 * don't have that day. The footnote tells the admin what to expect.
 */
export default function ReminderMonthlyDayPicker({
  value,
  onChange,
  disabled = false,
  className,
}: ReminderMonthlyDayPickerProps) {
  return (
    <div className={cn("rounded-3xl bg-white p-4", disabled && "bg-table-header", className)}>
      <div className="grid grid-cols-7 gap-1.5">
        {DAYS.map((day) => {
          const isSelected = value === day;

          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              aria-label={`Day ${day} of the month`}
              aria-pressed={isSelected}
              onClick={() => onChange(day)}
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

      {value !== null && value >= 29 && (
        <p className="mt-3 font-lato text-xs text-text-muted">
          {value === 31
            ? "Note: months with fewer than 31 days (Feb, Apr, Jun, Sep, Nov) will be skipped."
            : value === 30
              ? "Note: February will be skipped — it has 28 or 29 days."
              : "Note: February will be skipped in non-leap years."}
        </p>
      )}
    </div>
  );
}
