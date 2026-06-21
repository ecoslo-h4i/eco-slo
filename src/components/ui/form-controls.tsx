"use client";

import { ChevronDown, Search, type LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  forwardRef,
  createElement,
  isValidElement,
  type ButtonHTMLAttributes,
  type ElementType,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonRadius = "full" | "small";
type ButtonSize = "sm" | "md" | "lg";

const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary: "border border-primary bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active",
  secondary: "border border-border bg-card text-text hover:bg-off-white-2",
  ghost: "border border-transparent bg-transparent text-text-muted hover:bg-text/5 hover:text-text",
  danger: "border border-danger-border bg-danger-bg text-danger hover:bg-danger-border/60",
};

const buttonRadiusClasses: Record<ButtonRadius, string> = {
  full: "rounded-full",
  small: "rounded-lg",
};

// Base sizes meet the 44px mobile touch-target guidance; md: restores the
// tighter desktop heights.
const buttonSizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-11 px-3 py-2 text-sm md:min-h-8",
  md: "min-h-11 px-4 py-2.5 text-base md:min-h-10",
  lg: "min-h-12 px-6 py-3 text-base",
};

export function appButtonClassName({
  className,
  iconOnly = false,
  radius = "full",
  size = "md",
  variant = "primary",
}: {
  className?: string;
  iconOnly?: boolean;
  radius?: ButtonRadius;
  size?: ButtonSize;
  variant?: ButtonVariant;
} = {}) {
  return cn(
    "inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 font-mulish font-medium leading-none transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
    "disabled:cursor-not-allowed disabled:opacity-50",
    buttonVariantClasses[variant],
    buttonRadiusClasses[iconOnly ? "small" : radius],
    iconOnly ? "h-11 w-11 p-0 md:h-9 md:w-9" : buttonSizeClasses[size],
    className,
  );
}

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: LucideIcon | ReactNode;
  iconOnly?: boolean;
  radius?: ButtonRadius;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

export const AppButton = forwardRef<HTMLButtonElement, AppButtonProps>(function AppButton(
  {
    children,
    className,
    icon,
    iconOnly = false,
    radius = "full",
    size = "md",
    type = "button",
    variant = "primary",
    ...props
  },
  ref,
) {
  const iconNode = icon
    ? isValidElement(icon)
      ? icon
      : createElement(icon as ElementType, {
          "aria-hidden": true,
          className: "h-4 w-4 shrink-0",
          strokeWidth: 2,
        })
    : null;

  return (
    <button
      ref={ref}
      type={type}
      className={appButtonClassName({ className, iconOnly, radius, size, variant })}
      {...props}
    >
      {iconNode}
      {!iconOnly ? children : <span className="sr-only">{children}</span>}
    </button>
  );
});

export const controlLabelClassName = "font-mulish text-sm font-bold text-text-muted";

export const textFieldClassName =
  "w-full rounded-full border border-border bg-card px-4 py-2.5 font-mulish text-base font-normal text-text outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:bg-disabled-bg disabled:text-text-muted disabled:opacity-100";

export const textareaFieldClassName =
  "w-full rounded-2xl border border-border bg-card px-4 py-3 font-mulish text-base font-normal text-text outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:bg-disabled-bg disabled:text-text-muted disabled:opacity-100";

export const TextField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function TextField(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(textFieldClassName, className)} {...props} />;
});

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextAreaField({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(textareaFieldClassName, className)} {...props} />;
  },
);

type SearchFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  onQueryChange: (query: string) => void;
  value: string;
};

export function SearchField({
  className,
  onQueryChange,
  placeholder = "Search...",
  value,
  ...props
}: SearchFieldProps) {
  return (
    <div
      className={cn(
        "flex min-h-10 w-full items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 font-mulish text-base text-text shadow-none",
        "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25",
        className,
      )}
    >
      <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-text-muted" strokeWidth={2} />
      <input
        {...props}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onQueryChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent font-mulish text-base font-normal text-text outline-none placeholder:text-text-muted"
      />
    </div>
  );
}

export type SelectOption = {
  disabled?: boolean;
  label: string;
  value: string;
};

export const selectTriggerClassName =
  "group flex min-h-10 w-full items-center justify-between gap-3 rounded-full border border-border bg-card px-4 py-2.5 font-mulish text-base font-normal text-text outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25 data-[state=open]:border-primary data-[state=open]:ring-2 data-[state=open]:ring-primary/25 disabled:cursor-not-allowed disabled:bg-disabled-bg disabled:text-text-muted disabled:opacity-100";

export const dropdownContentClassName =
  "max-h-80 min-w-[var(--dropdown-trigger-width)] overflow-y-auto rounded-xl border border-border bg-card p-1 font-mulish text-text shadow-panel";

export const dropdownItemClassName =
  "min-h-9 gap-2 rounded-lg px-3 py-2 font-mulish text-sm font-medium text-text hover:!bg-primary-soft hover:!text-text focus:!bg-primary-soft focus:!text-text disabled:opacity-50";

export type SelectFieldProps = {
  ariaDescribedBy?: string;
  ariaInvalid?: boolean;
  className?: string;
  disabled?: boolean;
  id?: string;
  label?: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  value: string;
};

export function SelectField({
  ariaDescribedBy,
  ariaInvalid,
  className,
  disabled,
  id,
  label,
  onChange,
  options,
  placeholder = "Select...",
  required,
  value,
}: SelectFieldProps) {
  const selectedOption = options.find((option) => option.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        id={id}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        aria-required={required}
        className={cn(selectTriggerClassName, className)}
      >
        <span className={cn("min-w-0 flex-1 truncate text-left", selectedOption ? "text-text" : "text-text-muted")}>
          {selectedOption?.label ?? label ?? placeholder}
        </span>
        {!disabled ? (
          <ChevronDown
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-text-muted transition-transform duration-200 group-data-[state=open]:rotate-180"
          />
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className={dropdownContentClassName}>
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            disabled={option.disabled}
            className={dropdownItemClassName}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type PillOption = {
  label: string;
  value: string;
};

type PillGroupProps = {
  activeValue: string;
  className?: string;
  optionClassName?: string;
  options: PillOption[];
  onChange: (value: string, index: number) => void;
};

export function PillGroup({ activeValue, className, optionClassName, options, onChange }: PillGroupProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option, index) => {
        const isActive = option.value === activeValue;

        return (
          <button
            key={`${option.value}-${index}`}
            type="button"
            className={cn(
              "inline-flex min-h-11 cursor-pointer select-none items-center justify-center rounded-full border px-3.5 py-1.5 font-mulish text-sm font-semibold leading-none transition-colors duration-150 md:min-h-8",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
              isActive
                ? "border-primary bg-primary text-on-primary hover:bg-primary-hover"
                : "border-border bg-foreground text-text hover:bg-off-white-3",
              optionClassName,
            )}
            onClick={() => onChange(option.value, index)}
          >
            <span className="truncate whitespace-nowrap">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export { DropdownMenuCheckboxItem, DropdownMenuSeparator };
