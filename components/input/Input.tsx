import React from "react";
import TextInput from "@/components/input/text-input/TextInput";
import RadioInput from "@/components/input/radio-input/RadioInput";
import DropdownInput from "@/components/input/dropdown-input/DropdownInput";
import DatePicker from "@/components/input/date-picker/DatePicker";
import PhoneNumberInput from "@/components/input/phone-number-input/PhoneNumberInput";

import {
  InputConfig,
  InputValue,
  InputOnChange,
  // Import specific value/onChange types for assertions
  TextInputValue,
  TextInputComponentOnChange,
  RadioValue,
  RadioOnChange,
  DropdownValue,
  DropdownOnChange,
  DatePickerValue,
  DatePickerOnChange,
  PhoneValue,
  PhoneOnChange,
  // Import PhoneCountryChange for the new prop
  PhoneCountryChange,
} from "@/types/InputConfig"; // Adjust path as needed

// Define Props for the Unified Input - ADDED onCountryChange
interface InputProps {
  config: InputConfig;
  value: InputValue;
  onChange: InputOnChange;
  onCountryChange?: PhoneCountryChange; // Optional callback for phone country change
}

/**
 * @component Input (Unified)
 * @description Renders a specific input component based on the provided configuration object.
 * Acts as a wrapper to simplify form building.
 *
 * @param {InputProps} props - The props for the Input component.
 * @returns {React.ReactElement | null} The rendered specific input component or null.
 */
const Input: React.FC<InputProps> = ({
  config,
  value,
  onChange,
  onCountryChange,
}) => {
  // Added onCountryChange
  // Extract common props that might exist on config
  const { label, required, disabled, error, name } = config;

  // --- Render based on type ---
  switch (config.type) {
    case "text":
    case "email":
    case "url":
    case "password":
    case "number":
    case "search":
      const handleTextChange: TextInputComponentOnChange = (event) => {
        onChange(event.target.value);
      };
      return (
        <TextInput
          label={label}
          required={required}
          disabled={disabled}
          error={error}
          name={name}
          value={value as TextInputValue}
          onChange={handleTextChange}
          type={config.type}
          placeholder={config.placeholder}
          successMessage={config.successMessage}
          maxLength={config.maxLength}
        />
      );

    case "radio":
      return (
        <RadioInput
          label={label}
          required={required}
          disabled={disabled}
          error={error}
          name={config.name}
          options={config.options}
          selectedValue={value as RadioValue}
          onChange={onChange as RadioOnChange}
        />
      );

    case "dropdown":
      return (
        <DropdownInput
          label={label}
          required={required}
          disabled={disabled}
          error={error}
          name={name}
          options={config.options}
          value={value as DropdownValue}
          onChange={onChange as DropdownOnChange}
          placeholder={config.placeholder}
        />
      );

    case "date":
      const handleDateChange: DatePickerOnChange = (dateString) => {
        onChange(dateString);
      };
      return (
        <DatePicker
          label={label}
          required={required}
          disabled={disabled}
          error={error}
          value={value as DatePickerValue}
          onChange={handleDateChange} // Use specific handler type if needed, cast works too
          placeholder={config.placeholder}
          minDate={config.minDate}
          maxDate={config.maxDate}
        />
      );

    case "phone":
      // Now pass down selectedCountryIso and onCountryChange
      return (
        <PhoneNumberInput
          label={label}
          required={required}
          disabled={disabled}
          error={error}
          value={value as PhoneValue}
          onChange={onChange as PhoneOnChange}
          selectedCountryIso={config.selectedCountryIso || ''} // Pass from config
          onCountryChange={onCountryChange} // Pass from InputProps
          placeholder={config.placeholder}
          defaultCountryIso={config.defaultCountryIso}
          disabledCountryIsos={config.disabledCountryIsos}
        />
      );

    default:
      const _exhaustiveCheck: never = config;
      console.error("Unhandled input type:", _exhaustiveCheck);
      return null;
  }
};

export default Input;
