"use client";

interface ToggleSwitchProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
}

export default function ToggleSwitch(props: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      onClick={() => props.onChange?.(!props.checked)}
      className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors duration-200 focus:outline-none hover:cursor-pointer ${
        props.checked ? "border-[#5d7a35] bg-primary" : "border-border bg-inactive-pill"
      }`}
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-table-header shadow-sm transition-transform duration-200 ${
          props.checked ? "translate-x-7" : "translate-x-1"
        }`}
      />
    </button>
  );
}
