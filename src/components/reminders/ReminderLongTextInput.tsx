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
      <span className="font-avenir text-m text-text-dark">{props.label}</span>
      <span className="font-avenir text-sm text-text-muted">{props.sublabel}</span>
      <textarea
        className="w-full min-h-30 rounded-3xl bg-white p-4 font-avenir text-m font-normal focus:outline-none mt-2 disabled:bg-table-header disabled:text-text-dark disabled:opacity-100"
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
