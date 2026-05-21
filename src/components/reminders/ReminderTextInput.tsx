import { reminderFieldLabelClass, reminderInputClass } from "./reminderInputStyles";

interface ReminderTextInputProps {
  disabled?: boolean;
  label: string;
  placeholder?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ReminderTextInput(props: ReminderTextInputProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <span className={reminderFieldLabelClass}>{props.label}</span>
      <input
        className={reminderInputClass}
        disabled={props.disabled}
        placeholder={props.placeholder || ""}
        value={props.value}
        onChange={props.onChange}
      />
    </div>
  );
}
