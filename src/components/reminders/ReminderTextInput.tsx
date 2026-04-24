interface ReminderTextInputProps {
  label: string;
  placeholder?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ReminderTextInput(props: ReminderTextInputProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <span className="font-avenir text-m">{props.label}</span>
      <input
        className="w-full h-10 rounded-full bg-white px-4 font-avenir text-m font-normal focus:outline-none"
        placeholder={props.placeholder || ""}
        value={props.value}
        onChange={props.onChange}
      />
    </div>
  );
}
