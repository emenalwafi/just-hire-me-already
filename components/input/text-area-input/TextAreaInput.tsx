import React, { useState, TextareaHTMLAttributes } from "react";
import { UilCheckCircle } from "@iconscout/react-unicons";

/**
 * Props for the `TextAreaInput` component.
 * Extends standard HTML textarea attributes, omitting and redefining `onChange` and `value`.
 */
interface TextAreaInputProps
  extends Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    "onChange" | "value"
  > {
  /** The current value of the textarea. */
  value: string | null;
  /** Callback function fired when the textarea value changes. */
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  /** Optional label displayed above the textarea. */
  label?: string;
  /** Indicates if the input is required (adds a visual indicator). */
  required?: boolean;
  /** Sets the error state. A boolean shows a red border; a string also shows an error message. */
  error?: boolean | string;
  /** Optional success message to display below the textarea. */
  successMessage?: string;
  /** Optional custom icon node to display next to the success message. Defaults to a checkmark. */
  successIcon?: React.ReactNode;
  /** Optional custom icon node to display next to the error message. */
  errorIcon?: React.ReactNode;
  /** Number of visible text lines for the textarea. Defaults to 3. */
  rows?: number;
}

/**
 * A styled textarea input component for multi-line text entry.
 *
 * Modeled after TextInput, it supports labels, required fields, error/success states,
 * and standard textarea attributes like `rows`.
 *
 * @param {TextAreaInputProps} props - The component props.
 * @returns {React.ReactElement} The rendered TextAreaInput component.
 */
const TextAreaInput: React.FC<TextAreaInputProps> = ({
  value,
  onChange,
  label,
  required = false,
  placeholder = "Enter text",
  disabled = false,
  error = false,
  successMessage,
  successIcon,
  errorIcon,
  rows = 3, // Default to 3 rows
  className,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);

  // --- Class Calculation Logic (similar to TextInput) ---
  let containerClasses =
    "self-stretch px-4 py-2 rounded-lg outline outline-2 outline-offset-[-2px] inline-flex items-start gap-2 overflow-hidden transition-colors w-full"; // items-start for textarea
  let textAreaClasses =
    "flex-1 w-full bg-transparent border-none outline-none focus:outline-none p-0 text-base placeholder:text-neutral-60 resize-none"; // Added resize-none
  let labelClasses = "text-neutral-90 text-sm";
  let caretColorClass = "";

  // Adjust height based on focus/content - use min-h based on rows, allow growth
  containerClasses += ` min-h-[${(rows * 1.5 + 1).toFixed(2)}rem]`; // Estimate min-height based on rows + padding (adjust multiplier as needed)

  if (disabled) {
    containerClasses += " bg-neutral-30 outline-neutral-40 cursor-not-allowed";
    textAreaClasses += " text-neutral-60 cursor-not-allowed";
    labelClasses += " text-neutral-60";
  } else if (error) {
    containerClasses += " bg-white outline-danger-main";
    textAreaClasses += " text-neutral-90";
    caretColorClass = "caret-danger-main";
  } else if (isFocused) {
    containerClasses += " bg-white outline-primary-main";
    textAreaClasses += " text-neutral-90";
    caretColorClass = "caret-primary-main";
  } else {
    containerClasses +=
      " bg-neutral-10 outline-neutral-40 hover:outline-primary-main";
    textAreaClasses += value ? " text-neutral-90" : " text-neutral-60";
  }

  const hasErrorMessage = typeof error === "string";
  const hasSuccessMessage = !error && successMessage;
  const showMessageContainer =
    !disabled && (hasErrorMessage || hasSuccessMessage);

  const defaultSuccessIcon = (
    <UilCheckCircle size="16" className="text-primary-main flex-shrink-0" />
  );

  return (
    <div
      className={`self-stretch inline-flex flex-col justify-start items-start gap-1 font-sans ${className} w-full `}
    >
      {/* Label */}
      {label && (
        <div className="self-stretch justify-start">
          <label htmlFor={rest.id || rest.name} className={labelClasses}>
            {label}
            {required && (
              <span id="asterisk" className="text-danger-main text-sm">
                *
              </span>
            )}
          </label>
        </div>
      )}

      {/* Textarea Container */}
      <div className={containerClasses}>
        <textarea
          value={value || ""}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => !disabled && setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          rows={rows} // Use the rows prop
          className={`${textAreaClasses} ${caretColorClass}`}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={
            showMessageContainer ? `${rest.id || rest.name}-message` : undefined
          }
          {...rest}
        />
      </div>

      {/* Helper/Error/Success Message */}
      {showMessageContainer && (
        <div
          id={`${rest.id || rest.name}-message`}
          className="self-stretch min-h-[1.25rem] inline-flex justify-start items-center gap-1" // Adjusted alignment slightly
          role={hasErrorMessage ? "alert" : undefined}
          aria-live={hasErrorMessage ? "assertive" : undefined}
        >
          {/* Render Error Icon if provided */}
          {hasErrorMessage && errorIcon && (
            <span className="flex-shrink-0 w-4 h-4 text-danger-main">
              {errorIcon}
            </span>
          )}
          {/* Render Error Message */}
          {hasErrorMessage && (
            <div className="flex-1 justify-start text-danger-main text-sm">
              {error}
            </div>
          )}

          {/* Render Success Icon */}
          {hasSuccessMessage && (
            <span className="flex-shrink-0 w-4 h-4 text-primary-main">
              {successIcon || defaultSuccessIcon}
            </span>
          )}
          {/* Render Success Message */}
          {hasSuccessMessage && (
            <div className="flex-1 justify-start text-primary-main text-sm">
              {successMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TextAreaInput;
