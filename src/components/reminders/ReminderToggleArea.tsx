import ToggleSwitch from "../ToggleSwitch";

interface ReminderToggleProps {
  label: string;
  checkedDescription: string;
  uncheckedDescription: string;
  checked: boolean;
  onChange?: (checked: boolean) => void;
}

export default function RemiderToggleArea(props: ReminderToggleProps) {
  return (
    <div className="flex h-20 shrink-0 flex-row items-center justify-between gap-3 rounded-3xl bg-table-header">
      <div className="flex flex-col gap-1 font-avenir text-sm ml-4">
        <span className="text-text-dark">{props.label}</span>
        <span className="text-text-muted">{props.checked ? props.checkedDescription : props.uncheckedDescription}</span>
      </div>
      <div className="mr-4">
        <ToggleSwitch checked={props.checked} onChange={props.onChange} />
      </div>
    </div>
  );
}
