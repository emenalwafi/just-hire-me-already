import React, { useState, InputHTMLAttributes } from "react";
import { UilCheckCircle, UilEye, UilEyeSlash } from "@iconscout/react-unicons";

/**
 * Props for the `TextInput` component.
 * Extends standard HTML input attributes while omitting and redefining
 * `onChange`, `value`, and `type` for controlled component behavior.
 */
interface TextInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "value" | "type"
  > {
  /** The current value of the input. */
  value: string | null;
  /** Callback function fired when the input value changes. */
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Optional label displayed above the input. */
  label?: string;
  /** Indicates if the input is required (adds a visual indicator). */
  required?: boolean;
  /** Sets the error state. A boolean shows a red border; a string also shows an error message. */
  error?: boolean | string;
  /** Optional success message to display below the input. */
  successMessage?: string;
  /** Optional custom icon node to display next to the success message. Defaults to a checkmark. */
  successIcon?: React.ReactNode; // <-- Added successIcon prop
  /** Optional custom icon node to display next to the error message. */
  errorIcon?: React.ReactNode; // <-- Added errorIcon prop
  /** The functional type of the input, which determines behavior (e.g., password toggle). */
  type?: "text" | "email" | "url" | "password" | "number" | "search";
}

/**
 * A styled text input component.
 *
 * This component provides a fully-featured text input with support for labels,
 * required fields, error and success states, and a visibility toggle for password fields.
 * It wraps a standard HTML `<input>` and applies styling based on its state.
 *
 * @param {TextInputProps} props - The component props.
 * @returns {React.ReactElement} The rendered TextInput component.
 */
const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  label,
  required = false,
  placeholder = "Enter value",
  disabled = false,
  error = false,
  successMessage,
  successIcon,
  errorIcon,
  type = "text",
  className,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const inputType = type === "password" && showPassword ? "text" : type;

  let containerClasses =
    "self-stretch h-10 px-4 py-2 rounded-lg outline outline-2 outline-offset-[-2px] inline-flex items-center gap-2 overflow-hidden transition-colors w-full";
  let inputClasses =
    "flex-1 w-full bg-transparent border-none outline-none focus:outline-none p-0 text-base placeholder:text-neutral-60";
  let labelClasses = "text-neutral-90 text-sm";
  let caretColorClass = "";
  let iconColorClass = "text-neutral-100";

  if (disabled) {
    containerClasses += " bg-neutral-30 outline-neutral-40 cursor-not-allowed";
    inputClasses += " text-neutral-60 cursor-not-allowed";
    labelClasses += " text-neutral-60";
    iconColorClass = "text-neutral-60";
  } else if (error) {
    containerClasses += " bg-white outline-danger-main";
    inputClasses += " text-neutral-90";
    caretColorClass = "caret-danger-main";
  } else if (isFocused) {
    containerClasses += " bg-white outline-primary-main";
    inputClasses += " text-neutral-90";
    caretColorClass = "caret-primary-main";
  } else {
    containerClasses +=
      " bg-neutral-10 outline-neutral-40 hover:outline-neutral-70";
    inputClasses += value ? " text-neutral-90" : " text-neutral-60";
  }

  const hasErrorMessage = typeof error === "string";
  const hasSuccessMessage = !error && successMessage;
  const showMessageContainer =
    !disabled && (hasErrorMessage || hasSuccessMessage);

  const togglePasswordVisibility = () => {
    if (!disabled) {
      setShowPassword((prev) => !prev);
    }
  };

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
            {required && <span id="asterisk" className="text-danger-main text-sm">*</span>}
          </label>
        </div>
      )}

      {/* Input Container */}
      <div className={containerClasses}>
        <input
          type={inputType}
          value={value || ""}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => !disabled && setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`${inputClasses} ${caretColorClass}`}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={
            showMessageContainer ? `${rest.id || rest.name}-message` : undefined
          }
          {...rest}
        />
        {/* Trailing Icon Slot - Password Toggle */}
        {type === "password" && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            disabled={disabled}
            className={`focus:outline-none p-1 -m-1 ${
              disabled ? "cursor-not-allowed" : "cursor-pointer"
            }`}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <UilEyeSlash size="16" className={iconColorClass} />
            ) : (
              <UilEye size="16" className={iconColorClass} />
            )}
          </button>
        )}
      </div>

      {/* Helper/Error/Success Message - Conditionally Rendered */}
      {showMessageContainer && (
        <div
          id={`${rest.id || rest.name}-message`}
          className="self-stretch min-h-[1.25rem] inline-flex justify-start items-center gap-1"
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

          {/* Render Success Icon (passed prop or default) */}
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

export default TextInput;
