import React, { useRef } from "react";
import { UilCalendarAlt, UilAngleDown } from "@iconscout/react-unicons";
import { format } from "date-fns";
import { useDatePickerPopover } from "@/hooks/date-picker-popover/useDatePickerPopover";

/**
 * @interface DatePickerProps
 * @description Props for the DatePicker component.
 */
interface DatePickerProps {
  /**
   * The selected date value, formatted as an ISO string (e.g., "YYYY-MM-DD").
   * Use `null` for no selection.
   */
  value: string | null;
  /**
   * Callback function triggered when a new date is selected.
   * It receives the date as an ISO string.
   */
  onChange: (date: string) => void;
  /**
   * Optional text label displayed above the date picker.
   */
  label?: string;
  /**
   * If `true`, a red asterisk is displayed next to the label.
   * @default false
   */
  required?: boolean;
  /**
   * Placeholder text shown when no date is selected.
   * @default "Select date"
   */
  placeholder?: string;
  /**
   * If `true`, the date picker will be disabled and non-interactive.
   * @default false
   */
  disabled?: boolean;
  /**
   * The minimum selectable date, formatted as an ISO string (e.g., "YYYY-MM-DD").
   */
  minDate?: string;
  /**
   * The maximum selectable date, formatted as an ISO string (e.g., "YYYY-MM-DD").
   */
  maxDate?: string;
  /**
   * If `true`, displays the error state. If a `string` is provided,
   * it also displays the string as a helper text message below the input.
   * @default false
   */
  error?: boolean | string;
}

/**
 * @component DatePicker
 * @description A controlled date selection component that displays a formatted date
 * and provides a popover calendar for selection.
 *
 * @remarks
 * This component acts as the "trigger" and "display" for the date picker.
 * The core popover logic (positioning, calendar rendering, date management)
 * is abstracted into the `useDatePickerPopover` hook, which provides
 * the `popoverElement` to be rendered.
 *
 * It handles various states:
 * - **Default:** Standard interactive state.
 * - **Error:** Displays a red border and an optional error message.
 * - **Disabled:** Appears grayed out and is non-interactive.
 *
 * @param {DatePickerProps} props - The props for the DatePicker component.
 * @returns {React.ReactElement} A fully interactive date picker input field.
 *
 * @example
 * // 1. Controlled component with state
 * const [selected, setSelected] = useState('2025-10-26');
 *
 * <DatePicker
 * label="Event Date"
 * value={selected}
 * onChange={(date) => setSelected(date)}
 * required
 * />
 *
 * @example
 * // 2. With error message
 * <DatePicker
 * label="Due Date"
 * value={null}
 * onChange={...}
 * error="This field is required."
 * />
 *
 * @example
 * // 3. With date restrictions
 * <DatePicker
 * label="Booking Date"
 * value={date}
 * onChange={setDate}
 * minDate="2025-10-25"
 * maxDate="2025-11-10"
 * />
 *
 * @example
 * // 4. Disabled state
 * <DatePicker
 * label="Start Date"
 * value="2025-01-01"
 * onChange={...}
 * disabled
 * />
 */
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
  const triggerRef = useRef<HTMLButtonElement>(null);

  const { isOpen, setIsOpen, popoverElement, selectedDate, containerRef } =
    useDatePickerPopover({
      value,
      onChange,
      minDateProp,
      maxDateProp,
      triggerRef,
    });

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
        ref={triggerRef}
        type="button"
        className={triggerWrapperClasses}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
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
        <div className="self-stretch justify-start items-start gap-1 mt-1">
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
