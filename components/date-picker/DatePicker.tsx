import React, { useRef } from "react";
import { UilCalendarAlt, UilAngleDown } from "@iconscout/react-unicons";
import { format } from "date-fns";
import { useDatePickerPopover } from "@/hooks/useDatePickerPopover";

// Props interface remains the same
interface DatePickerProps {
  value: string | null;
  onChange: (date: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
  error?: boolean | string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  required = false,
  placeholder = "Select date",
  disabled = false,
  minDate: minDateProp,
  maxDate: maxDateProp,
  error = false,
}) => {
  const triggerRef = useRef<HTMLButtonElement>(null); // Ref for the trigger

  // Use the custom hook
  const {
    isOpen,
    setIsOpen,
    popoverElement, // Get the popover JSX from the hook
    selectedDate, // Get parsed selectedDate from hook
    containerRef, // Get the container ref from the hook for outside click relative positioning
  } = useDatePickerPopover({
    value,
    onChange,
    minDateProp,
    maxDateProp,
    triggerRef, // Pass the triggerRef to the hook
  });

  // --- Styling Logic for Trigger Input ---
  let triggerWrapperClasses =
    "cursor-pointer self-stretch h-10 px-4 py-2 rounded-lg outline outline-2 outline-offset-[-2px] inline-flex justify-between items-center gap-2 overflow-hidden transition-colors";
  let triggerTextClasses = "flex-1 justify-start text-base text-left";
  let iconColorClass = "";

  if (disabled) {
    triggerWrapperClasses +=
      " bg-neutral-30 outline-neutral-40 cursor-not-allowed";
    triggerTextClasses += " text-neutral-60";
    iconColorClass = "text-neutral-60";
  } else if (error) {
    triggerWrapperClasses += " bg-white outline-danger-main";
    triggerTextClasses += selectedDate
      ? " text-neutral-90"
      : " text-neutral-60";
    iconColorClass = "text-neutral-100";
  } else {
    triggerWrapperClasses +=
      " bg-white outline-neutral-40 hover:outline-neutral-70 focus:outline-primary-main focus:outline-2";
    triggerTextClasses += selectedDate
      ? " text-neutral-90"
      : " text-neutral-60";
    iconColorClass = "text-neutral-100";
  }

  return (
    // Use the containerRef from the hook for the main wrapper
    <div
      className="relative inline-block w-full max-w-xs font-sans"
      ref={containerRef}
    >
      {/* 1. Label and Trigger Input */}
      {label && (
        <div className="self-stretch justify-start mb-1">
          <span className="text-neutral-90 text-sm">{label}</span>
          {required && <span className="text-danger-main text-sm">*</span>}
        </div>
      )}
      <button
        ref={triggerRef} // Attach the ref here
        type="button"
        className={triggerWrapperClasses}
        onClick={() => !disabled && setIsOpen(!isOpen)} // Use setIsOpen from hook
        disabled={disabled}
        aria-haspopup="true"
        aria-expanded={isOpen} // Use isOpen from hook
        aria-label={label || placeholder}
      >
        <span className="flex items-center gap-2 overflow-hidden">
          <UilCalendarAlt size="16" className={iconColorClass} />
          <span className={`${triggerTextClasses} truncate`}>
            {selectedDate ? format(selectedDate, "PPP") : placeholder}
          </span>
        </span>
        <UilAngleDown size="16" className={iconColorClass} />
      </button>

      {/* Helper Text for Error */}
      {typeof error === "string" && !disabled && (
        <div className="self-stretch inline-flex justify-start items-start gap-1 mt-1">
          <div className="flex-1 justify-start text-danger-main text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Render the popover element returned by the hook */}
      {popoverElement}
    </div>
  );
};

export default DatePicker;
