import React, { useState, InputHTMLAttributes } from "react";
// Import eye icons for password toggle
import { UilCheckCircle, UilEye, UilEyeSlash } from "@iconscout/react-unicons";

// Extend standard Input attributes
interface TextInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "value" | "type"
  > {
  // Omit type as well, handle internally
  /** The current value of the input */
  value: string | null;
  /** Callback function when the input value changes */
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Optional label displayed above the input */
  label?: string;
  /** Indicates if the input is required (adds *) */
  required?: boolean;
  /** Error state. Boolean shows red border, string shows border + message */
  error?: boolean | string;
  /** Success message to display below (e.g., for valid URL/Email) */
  successMessage?: string;
  /** Functional type of the input */
  type?: "text" | "email" | "url" | "password" | "number" | "search";
}

/**
 * @component TextInput
 * @description A basic text input component with various states (rest, focused, error, disabled)
 * and optional label, required indicator, helper/success messages, and password visibility toggle.
 *
 * @param {TextInputProps} props - The props for the TextInput component.
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
  type = "text", // Original functional type
  className,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  // State to manage password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Determine the actual input type attribute based on state
  const inputType = type === "password" && showPassword ? "text" : type;

  // --- Styling Logic ---
  let containerClasses =
    "self-stretch h-10 px-4 py-2 rounded-lg outline outline-2 outline-offset-[-2px] inline-flex items-center gap-2 overflow-hidden transition-colors w-full";
  let inputClasses =
    "flex-1 w-full bg-transparent border-none outline-none focus:outline-none p-0 text-base placeholder:text-neutral-60";
  let labelClasses = "text-neutral-90 text-sm";
  let caretColorClass = "";
  let iconColorClass = "text-neutral-100"; // Color for trailing icons

  if (disabled) {
    containerClasses += " bg-neutral-30 outline-neutral-40 cursor-not-allowed";
    inputClasses += " text-neutral-60 cursor-not-allowed";
    labelClasses += " text-neutral-60";
    iconColorClass = "text-neutral-60"; // Dim icon when disabled
  } else if (error) {
    containerClasses += " bg-white outline-danger-main";
    inputClasses += " text-neutral-90";
    caretColorClass = "caret-danger-main";
    // iconColorClass remains neutral-100
  } else if (isFocused) {
    containerClasses += " bg-white outline-primary-main";
    inputClasses += " text-neutral-90";
    caretColorClass = "caret-primary-main";
    // iconColorClass remains neutral-100
  } else {
    // Rest state
    containerClasses +=
      " bg-neutral-10 outline-neutral-40 hover:outline-neutral-70";
    inputClasses += value ? " text-neutral-90" : " text-neutral-60";
    // iconColorClass remains neutral-100
  }

  // Determine if there is a message to display
  const hasErrorMessage = typeof error === "string";
  const hasSuccessMessage = !error && successMessage;
  const showMessageContainer =
    !disabled && (hasErrorMessage || hasSuccessMessage);

  // Toggle password visibility handler
  const togglePasswordVisibility = () => {
    if (!disabled) {
      setShowPassword((prev) => !prev);
    }
  };

  return (
    <div
      className={`self-stretch inline-flex flex-col justify-start items-start gap-1 font-sans ${className} w-full `}
    >
      {/* Label */}
      {label && (
        <div className="self-stretch justify-start">
          <label htmlFor={rest.id || rest.name} className={labelClasses}>
            {label}
            {required && <span className="text-danger-main text-sm">*</span>}
          </label>
        </div>
      )}

      {/* Input Container */}
      <div className={containerClasses}>
        {/* Add optional leading icon slot here if needed in future */}
        <input
          // Use the dynamic inputType
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
            className={`focus:outline-none ${
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
        {/* Add other potential trailing icons here */}
      </div>

      {/* Helper/Error/Success Message - Conditionally Rendered */}
      {showMessageContainer && (
        <div
          id={`${rest.id || rest.name}-message`}
          className="self-stretch min-h-[1.25rem] inline-flex justify-start items-center gap-1"
        >
          {hasErrorMessage && (
            <div className="flex-1 justify-start text-danger-main text-sm">
              {error}
            </div>
          )}
          {hasSuccessMessage && (
            <>
              <UilCheckCircle
                size="16"
                className="text-primary-main flex-shrink-0"
              />
              <div className="flex-1 justify-start text-primary-main text-sm">
                {successMessage}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TextInput;
