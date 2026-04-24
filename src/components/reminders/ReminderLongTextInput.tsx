interface ReminderLongTextInputProps {
  label: string;
  sublabel?: string;
  placeholder?: string;
  initialValue?: string;
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export default function ReminderTextInput(props: ReminderLongTextInputProps) {
  return (
    <div className="flex flex-col w-full">
      <span className="font-avenir text-m text-text-dark">{props.label}</span>
      <span className="font-avenir text-sm text-text-muted">{props.sublabel}</span>
      <textarea
        className="w-full min-h-30 rounded-3xl bg-white p-4 font-avenir text-m font-normal focus:outline-none mt-2"
        defaultValue={props.initialValue || ""}
        placeholder={props.placeholder || ""}
        onChange={props.onChange}
        spellCheck="false"
      />
    </div>
  );
}
