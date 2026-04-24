import { Clock } from "lucide-react";

interface ReminderTimePickerProps {
  label: string;
  value?: string;
  defaultValue?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ReminderTimePicker(props: ReminderTimePickerProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <span className="font-avenir text-m font-normal">{props.label}</span>
      <div className="relative w-full">
        <input
          type="time"
          className="w-full h-10 rounded-full bg-white px-4 pr-11 font-avenir text-m font-normal text-text-dark selection:bg-primary selection:text-text-light focus:outline-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
          value={props.value}
          defaultValue={props.defaultValue}
          onChange={props.onChange}
        />
        <Clock className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
      </div>
    </div>
  );
}
