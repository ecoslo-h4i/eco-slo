interface ReminderTextInputProps {
  label: string;
  placeholder?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ReminderTextInput(props: ReminderTextInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-avenir text-m font-normal text-text-dark">{props.label}</span>
      <input
        className="w-full h-10 rounded-full bg-white px-4 font-avenir text-m focus:outline-none"
        placeholder={props.placeholder}
        onChange={props.onChange}
      />
    </div>
  );
}
