import React, { useState, useRef } from "react";
import { UilAngleDown } from "@iconscout/react-unicons";
import {
  useDropdownPopover,
  DropdownOption,
} from "@/hooks/dropdown-popover/useDropdownPopover";

/**
 * Props for the `DropdownInput` component.
 */
interface DropdownInputProps {
  /** The currently selected option object, or null if no selection. */
  value: DropdownOption | null;
  /** Callback function fired when an option is selected from the dropdown. */
  onChange: (option: DropdownOption | null) => void;
  /** An array of all available options to display in the popover. */
  options: DropdownOption[];
  /** Optional label displayed above the input. */
  label?: string;
  /** Whether the input is required (adds a visual indicator). */
  required?: boolean;
  /** Placeholder text to display when `value` is null. */
  placeholder?: string;
  /** Whether the input is disabled. */
  disabled?: boolean;
  /** Sets the error state. A boolean shows a red border; a string also shows an error message. */
  error?: boolean | string;
  /** Optional `name` attribute to include a hidden input for form submissions. */
  name?: string;
}

/**
 * A searchable dropdown input component (combobox).
 *
 * This component functions as a text input that, when focused or typed in,
 * displays a popover of filterable options. It allows users to search for
 * and select an option, or clear the selection.
 *
 * @param {DropdownInputProps} props - The component props.
 * @returns {React.ReactElement} The rendered DropdownInput component.
 */
const DropdownInput: React.FC<DropdownInputProps> = ({
  value,
  onChange,
  options,
  label,
  required = false,
  placeholder = "Select an option",
  disabled = false,
  error = false,
  name,
}) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState(value ? value.label : "");
  const isSelectionInProgress = useRef(false);

  const displayValue = isFocused ? inputValue : value ? value.label : "";

  const { popoverElement } = useDropdownPopover({
    anchorRef: triggerRef,
    options: options,
    selectedValue: value?.value,
    searchTerm: inputValue,
    onSelectOption: (option) => {
      isSelectionInProgress.current = true;
      onChange(option);
      setInputValue(option.label);
      setIsOpen(false);
      setIsFocused(false);
      inputRef.current?.blur();
      setTimeout(() => {
        isSelectionInProgress.current = false;
      }, 100);
    },
    isOpen: isOpen,
    onClose: () => {
      if (!isSelectionInProgress.current) {
        setIsOpen(false);
      }
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    if (!disabled) {
      setIsFocused(true);
      setInputValue(value ? value.label : "");
      setIsOpen(true);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (!isOpen && !isSelectionInProgress.current) {
        setIsFocused(false);
        setInputValue("");
      }
    }, 150);
  };

  let wrapperClasses =
    "self-stretch h-10 px-4 py-2 rounded-lg outline outline-2 outline-offset-[-2px] inline-flex justify-between items-center gap-2 overflow-hidden transition-colors w-full";
  let textClasses = "text-base";
  let iconColorClass = "text-neutral-100";
  let caretColorClass = "";

  if (disabled) {
    wrapperClasses += " bg-neutral-30 outline-neutral-40 cursor-not-allowed";
    textClasses += " text-neutral-60";
    iconColorClass = "text-neutral-60";
  } else if (error) {
    wrapperClasses += " bg-white outline-danger-main";
    textClasses += value ? " text-neutral-90" : " text-neutral-60";
    iconColorClass = "text-neutral-100";
  } else if (isFocused || isOpen) {
    wrapperClasses += " bg-white outline-primary-main";
    textClasses += " text-neutral-90";
    iconColorClass = "text-neutral-100";
    caretColorClass = "caret-primary-main";
  } else {
    wrapperClasses +=
      " bg-neutral-10 outline-neutral-40 hover:outline-neutral-70";
    textClasses += value ? " text-neutral-90" : " text-neutral-60";
    iconColorClass = "text-neutral-100";
  }

  const inputTextColorClass = disabled
    ? "text-neutral-60"
    : isFocused || isOpen || value
    ? "text-neutral-90"
    : "text-neutral-60";

  return (
    <div
      className={`w-full self-stretch inline-flex flex-col justify-start items-start gap-1 font-sans`}
    >
      {label && (
        <div className="self-stretch justify-start">
          <span className="text-neutral-90 text-sm">{label}</span>
          {required && <span className="text-danger-main text-sm">*</span>}
        </div>
      )}
      <div
        ref={triggerRef}
        className={`${wrapperClasses} ${caretColorClass}`}
        onClick={() => {
          if (!disabled && inputRef.current) {
            handleInputFocus();
            inputRef.current.focus();
          }
        }}
        tabIndex={-1}
        onBlurCapture={(e) => {
          const popoverElementCheck = document.getElementById(
            "dropdown-listbox-id"
          );
          if (
            !e.currentTarget.contains(e.relatedTarget as Node) &&
            !(
              popoverElementCheck &&
              popoverElementCheck.contains(e.relatedTarget as Node)
            )
          ) {
            handleBlur();
          }
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`flex-1 w-full bg-transparent border-none outline-none p-0 caret-primary-main ${textClasses} ${inputTextColorClass} placeholder:text-neutral-60 focus:outline-none ${
            disabled ? "cursor-not-allowed" : ""
          }`}
          aria-label={label || placeholder}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? "dropdown-listbox-id" : undefined}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (disabled) return;
            if (isOpen) {
              setIsOpen(false);
              inputRef.current?.blur();
            } else {
              handleInputFocus();
              inputRef.current?.focus();
            }
          }}
          disabled={disabled}
          className={`focus:outline-none ${
            disabled ? "cursor-not-allowed" : "cursor-pointer"
          }`}
          tabIndex={-1}
          aria-label={isOpen ? "Close dropdown" : "Open dropdown"}
        >
          <UilAngleDown
            size="16"
            className={`${iconColorClass} flex-shrink-0 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {name && <input type="hidden" name={name} value={value?.value || ""} />}
      </div>

      {/* Error Message */}
      {typeof error === "string" && !disabled && (
        <div className="self-stretch inline-flex justify-start items-start gap-1">
          <div className="flex-1 justify-start text-danger-main text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Render Popover */}
      {popoverElement}
    </div>
  );
};

export default DropdownInput;
