import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { reminderFieldLabelClass, reminderInputClass } from "./reminderInputStyles";

interface ReminderTimePickerProps {
  inputClassName?: string;
  disabled?: boolean;
  label: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ReminderTimePicker(props: ReminderTimePickerProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <span className={reminderFieldLabelClass}>{props.label}</span>
      <div className="relative w-full">
        <input
          type="time"
          className={cn(
            reminderInputClass,
            "pr-11 selection:bg-table-header selection:text-text-dark [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none",
            props.inputClassName,
          )}
          disabled={props.disabled}
          value={props.value}
          defaultValue={props.defaultValue}
          placeholder={props.placeholder || ""}
          onChange={props.onChange}
        />
        <Clock className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
      </div>
    </div>
  );
}
