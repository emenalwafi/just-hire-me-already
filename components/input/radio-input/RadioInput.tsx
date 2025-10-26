import React from "react";

/**
 * Defines the structure for a single radio button option.
 */
export interface RadioOption {
  /** The value submitted when this option is selected. Must be unique within the group. */
  value: string;
  /** The text label displayed next to the radio button. */
  label: string;
}

/**
 * Props for the `RadioInput` component.
 */
interface RadioInputProps {
  /** The value of the currently selected radio button within the group, or null if none is selected. */
  selectedValue: string | null;
  /** Callback function invoked when a radio button is selected. Receives the value of the selected option. */
  onChange: (value: string) => void;
  /** An array of `RadioOption` objects defining the available choices. */
  options: RadioOption[];
  /** The `name` attribute shared by all radio inputs in the group, ensuring they function as a single unit. */
  name: string;
  /** Optional label displayed above the entire radio group. */
  label?: string;
  /** Indicates if selecting an option is required (adds a visual indicator). */
  required?: boolean;
  /** Whether the entire radio group is disabled. */
  disabled?: boolean;
  /** Sets the error state. A boolean shows red styling; a string shows red styling and an error message. */
  error?: boolean | string;
}

/**
 * Renders a group of custom-styled radio buttons.
 *
 * This component creates an accessible radio button group using native `<input type="radio">`
 * elements (visually hidden) paired with custom `<div>` elements for styling.
 * It supports labels, required indicators, disabled states, and error states.
 *
 * @param {RadioInputProps} props - The props for the RadioInput component.
 * @returns {React.ReactElement} The rendered RadioInput component.
 */
const RadioInput: React.FC<RadioInputProps> = ({
  selectedValue,
  onChange,
  options,
  name,
  label,
  required = false,
  disabled = false,
  error = false,
}) => {
  const hasError = !!error;
  const groupLabelColorClass = disabled
    ? "text-neutral-60"
    : hasError
    ? "text-danger-main"
    : "text-neutral-90";

  return (
    <div className="self-stretch inline-flex flex-col justify-start items-start gap-2 font-sans">
      {label && (
        <div className="self-stretch justify-start">
          <span className={`${groupLabelColorClass} text-sm`}>{label}</span>
          {required && <span className="text-danger-main text-sm">*</span>}
        </div>
      )}

      <div className="inline-flex flex-wrap justify-start items-start gap-6">
        {options.map((option, index) => {
          const isSelected = selectedValue === option.value;
          const optionDisabled = disabled;
          const inputId = `${name}-${option.value}-${index}`;

          const optionLabelColor = optionDisabled
            ? "text-neutral-60"
            : hasError
            ? "text-danger-main"
            : "text-neutral-90";
          const ringFocusColor = hasError
            ? "ring-danger-main/50"
            : "ring-primary-focus/50";
          const outerBorderColor = optionDisabled
            ? "border-neutral-40"
            : hasError
            ? "border-danger-main"
            : isSelected
            ? "border-primary-main"
            : "border-neutral-90";
          const innerBgColor = optionDisabled
            ? "bg-neutral-40"
            : "bg-primary-main";

          return (
            <label
              key={option.value}
              htmlFor={inputId}
              className={`flex justify-start items-center gap-2 ${
                optionDisabled
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer"
              }`}
            >
              <input
                type="radio"
                id={inputId}
                name={name}
                value={option.value}
                checked={isSelected}
                onChange={() => !optionDisabled && onChange(option.value)}
                disabled={optionDisabled}
                className="peer sr-only"
                aria-describedby={
                  hasError && typeof error === "string"
                    ? `${name}-error-message`
                    : undefined
                }
              />

              <div
                className={`size-5 rounded-full border border-2 flex-shrink-0 flex items-center justify-center transition-colors duration-150 ease-in-out ${outerBorderColor} peer-focus-visible:ring-2 ${ringFocusColor} peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-neutral-10`}
                aria-hidden="true"
              >
                <div
                  className={`size-3 rounded-full transition-colors duration-150 ease-in-out ${
                    isSelected ? innerBgColor : "bg-transparent"
                  }`}
                />
              </div>

              <span className={`${optionLabelColor} text-base`}>
                {option.label}
              </span>
            </label>
          );
        })}
      </div>

      {typeof error === "string" && !disabled && (
        <div
          id={`${name}-error-message`}
          className="self-stretch inline-flex justify-start items-start gap-1 mt-1"
        >
          <div className="flex-1 justify-start text-danger-main text-sm">
            {error}
          </div>
        </div>
      )}
    </div>
  );
};

export default RadioInput;
