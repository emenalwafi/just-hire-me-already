import React, { useState, useRef, useEffect, useCallback } from "react";
import { UilAngleDown } from "@iconscout/react-unicons";
import { useDropdownPopover, DropdownOption } from "@/hooks/dropdown-popover/useDropdownPopover"; // Assuming hook is in hooks folder

interface DropdownInputProps {
  /** The currently selected option object, or null */
  value: DropdownOption | null;
  /** Callback function when an option is selected */
  onChange: (option: DropdownOption | null) => void;
  /** Array of options to display in the popover */
  options: DropdownOption[];
  /** Optional label for the input */
  label?: string;
  /** Indicates if the input is required */
  required?: boolean;
  /** Placeholder text when no option is selected */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Error state. Can be boolean or a string message */
  error?: boolean | string;
  /** Optional width override for the popover (Tailwind class) */
  popoverWidth?: string; // e.g., 'w-[572px]' or 'w-full'
  /** Optional: Name attribute for the hidden input */
  name?: string;
}

const DropdownInput: React.FC<DropdownInputProps> = ({
  value,
  onChange,
  options,
  label,
  required = false,
  placeholder = "Select an option",
  disabled = false,
  error = false,
  name, // Add name prop
}) => {
  const triggerRef = useRef<HTMLDivElement>(null); // Ref for the container div
  const inputRef = useRef<HTMLInputElement>(null); // Ref for the actual input
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false); // Track focus state for styling
  const [inputValue, setInputValue] = useState(value ? value.label : ""); // State for the input's text value
  const isSelectionInProgress = useRef(false); // Flag to prevent blur handler from reverting during selection

  // Sync input value if the external value prop changes
  useEffect(() => {
    setInputValue(value ? value.label : "");
  }, [value]);

  // Use the custom hook for the popover
  const { popoverElement } = useDropdownPopover({
    anchorRef: triggerRef, // Pass the ref of the container div
    options: options,
    selectedValue: value?.id,
    searchTerm: inputValue, // Pass the input's current value as searchTerm
    onSelectOption: (option) => {
      isSelectionInProgress.current = true; // Set flag before updating state
      onChange(option); // Update state via prop
      setInputValue(option.label); // Update the input display value
      setIsOpen(false); // Close popover
      setIsFocused(false); // Remove focus style on selection
      inputRef.current?.blur(); // Blur the input
      setTimeout(() => {
        isSelectionInProgress.current = false;
      }, 100); // Reset flag shortly after
    },
    isOpen: isOpen,
    onClose: () => {
      // Only close if not in the middle of a selection click
      if (!isSelectionInProgress.current) {
        setIsOpen(false);
      }
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true); // Open the popover when user types
    // Clear external selection if input doesn't match any option label exactly (optional behavior)
    // Or maybe just let the filtering happen and don't change external state until selection
    // Let's stick with just filtering for now.
  };

  const handleInputFocus = () => {
    if (!disabled) {
      setIsFocused(true);
      setIsOpen(true); // Open popover on focus
    }
  };

  const handleBlur = () => {
    // Use a small timeout to allow click events on the popover to register
    setTimeout(() => {
      if (!isOpen && !isSelectionInProgress.current) {
        // Check isOpen and the flag
        setIsFocused(false);
        // Revert input value if it doesn't match the selected value's label
        if (value && inputValue !== value.label) {
          setInputValue(value.label);
        } else if (!value && inputValue !== "") {
          // If no value is selected externally, clear the input if it has text
          // setInputValue(""); // Optional: clear if nothing selected
          // OR revert to placeholder logic? Let's just revert to selected value for now.
          setInputValue(""); // Clear if nothing selected
        }
      }
    }, 150); // Adjust timeout as needed
  };

  // --- Styling Logic ---
  let wrapperClasses =
    "self-stretch h-10 px-4 py-2 rounded-lg outline outline-2 outline-offset-[-2px] inline-flex justify-between items-center gap-2 overflow-hidden transition-colors w-full"; // Removed cursor-pointer
  let textClasses = "text-base"; // Input handles its own text color
  let iconColorClass = "text-neutral-100";
  let caretColorClass = "";

  if (disabled) {
    wrapperClasses += " bg-neutral-30 outline-neutral-40 cursor-not-allowed";
    textClasses = " text-neutral-60"; // Apply to input placeholder/value
    iconColorClass = "text-neutral-60";
  } else if (error) {
    wrapperClasses += " bg-white outline-danger-main";
    textClasses = value ? " text-neutral-90" : " text-neutral-60"; // This might need refinement based on inputValue
    iconColorClass = "text-neutral-100";
  } else if (isFocused || isOpen) {
    wrapperClasses += " bg-white outline-primary-main";
    textClasses = " text-neutral-90"; // Assume typing means text should be dark
    iconColorClass = "text-neutral-100";
    caretColorClass = "caret-primary-main"; // Set caret color for input
  } else {
    // Rest state
    wrapperClasses +=
      " bg-neutral-10 outline-neutral-40 hover:outline-neutral-70";
    textClasses = value ? " text-neutral-90" : " text-neutral-60"; // Placeholder vs Filled text color
    iconColorClass = "text-neutral-100";
  }

  // Determine text color class specifically for the input based on value and disabled state
  const inputTextColorClass = disabled
    ? "text-neutral-60"
    : // Use dark text if focused/open OR if there's a selected value externally
    isFocused || isOpen || value
    ? "text-neutral-90"
    : "text-neutral-60";

  return (
    <div
      className={`self-stretch inline-flex flex-col justify-start items-start gap-1 font-sans`}
    >
      {label && (
        <div className="self-stretch justify-start">
          <span className="text-neutral-90 text-sm">{label}</span>
          {required && <span className="text-danger-main text-sm">*</span>}
        </div>
      )}
      {/* Container div now primarily for layout and focus/blur capture */}
      <div
        ref={triggerRef}
        className={`${wrapperClasses} ${caretColorClass}`} // Apply caret color to container
        // Remove direct onClick handler, focus/typing opens popover
        // Can add onClick to maybe re-focus input if needed: onClick={() => inputRef.current?.focus()}
        tabIndex={-1} // Remove focusability from outer div
        // Use onFocusCapture/onBlurCapture to detect focus entering/leaving the entire component
        onFocusCapture={() => !disabled && setIsFocused(true)}
        onBlurCapture={(e) => {
          // Check if the related target (where focus is going) is still inside this component OR the popover
          const popoverElementCheck = document.getElementById(
            "dropdown-listbox-id"
          ); // Use a stable ID if possible
          if (
            !e.currentTarget.contains(e.relatedTarget as Node) &&
            !(
              popoverElementCheck &&
              popoverElementCheck.contains(e.relatedTarget as Node)
            )
          ) {
            // Use blur handler logic (with timeout)
            handleBlur();
          }
        }}
      >
        <input
          ref={inputRef}
          type="text"
          // Removed readOnly
          value={inputValue} // Use local state for input value
          onChange={handleInputChange} // Update local state on change
          onFocus={handleInputFocus} // Handle focus event
          // onBlur={handleBlur} // Use capture on parent instead
          placeholder={placeholder}
          disabled={disabled}
          // Apply text color, remove default input styles
          className={`flex-1 w-full bg-transparent border-none outline-none p-0 caret-primary-main ${textClasses} ${inputTextColorClass} placeholder:text-neutral-60 focus:outline-none ${
            disabled ? "cursor-not-allowed" : ""
          }`}
          aria-label={label || placeholder} // Repeat label for input accessibility
          role="combobox" // Input is the combobox
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? "dropdown-listbox-id" : undefined} // Link to popover ID
          autoComplete="off" // Prevent browser autocomplete interfering
        />
        {/* Make icon clickable to toggle dropdown */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`focus:outline-none ${
            disabled ? "cursor-not-allowed" : "cursor-pointer"
          }`}
          tabIndex={-1} // Prevent tabbing to the icon separately
          aria-label={isOpen ? "Close dropdown" : "Open dropdown"}
        >
          <UilAngleDown
            size="16"
            className={`${iconColorClass} flex-shrink-0 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Hidden input to potentially hold the value for form submission */}
        {name && <input type="hidden" name={name} value={value?.id || ""} />}
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
