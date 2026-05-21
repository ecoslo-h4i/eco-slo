import { reminderFieldLabelClass, reminderTextareaClass } from "./reminderInputStyles";

interface ReminderLongTextInputProps {
  disabled?: boolean;
  label: string;
  sublabel?: string;
  placeholder?: string;
  initialValue?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export default function ReminderTextInput(props: ReminderLongTextInputProps) {
  return (
    <div className="flex flex-col w-full">
      {props.label && <span className={reminderFieldLabelClass}>{props.label}</span>}
      {props.sublabel && <span className="font-mulish text-sm text-text-muted">{props.sublabel}</span>}
      <textarea
        className={`${reminderTextareaClass} mt-2 min-h-30`}
        defaultValue={props.value === undefined ? props.initialValue || "" : undefined}
        value={props.value}
        disabled={props.disabled}
        readOnly={props.disabled}
        placeholder={props.placeholder || ""}
        onChange={props.onChange}
        spellCheck="false"
      />
    </div>
  );
}
