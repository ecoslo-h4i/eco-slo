interface ReminderDropdownProps {
  label: string;
  options: string[];
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export default function ReminderDropdown(props: ReminderDropdownProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <span className="font-avenir text-m font-normal text-text-dark">{props.label}</span>

      <select
        className="w-full h-10 rounded-full bg-white px-3 font-avenir text-m focus:outline-none"
        onChange={props.onChange}
        defaultValue={""}
      >
        <option value="" disabled hidden>
          {props.placeholder ?? "Select an option"}
        </option>
        {props.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
