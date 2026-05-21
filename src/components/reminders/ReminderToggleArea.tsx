import ToggleSwitch from "../ToggleSwitch";

interface ReminderToggleProps {
  label: string;
  checkedDescription: string;
  uncheckedDescription: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

export default function RemiderToggleArea(props: ReminderToggleProps) {
  return (
    <div className="flex h-full min-h-20 shrink-0 flex-row items-center justify-between gap-3 rounded-lg bg-table-header px-4 py-3">
      <div className="flex flex-col gap-1 font-mulish text-m">
        <span className="font-semibold text-text-dark">{props.label}</span>
        <span className="text-text-muted">{props.checked ? props.checkedDescription : props.uncheckedDescription}</span>
      </div>
      <ToggleSwitch checked={props.checked} disabled={props.disabled} onChange={props.onChange} />
    </div>
  );
}
