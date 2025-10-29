import React from "react";
import TextInput from "@/components/input/text-input/TextInput";
import TextAreaInput from "@/components/input/text-area-input/TextAreaInput";
import RadioInput from "@/components/input/radio-input/RadioInput";
import DropdownInput from "@/components/input/dropdown-input/DropdownInput";
import DatePicker from "@/components/input/date-picker/DatePicker";
import PhoneNumberInput from "@/components/input/phone-number-input/PhoneNumberInput";

import {
  InputConfig,
  InputValue,
  InputOnChange,
  TextInputValue,
  TextInputComponentOnChange,
  TextAreaValue,
  TextAreaComponentOnChange,
  RadioValue,
  RadioOnChange,
  DropdownValue,
  DropdownOnChange,
  DatePickerValue,
  DatePickerOnChange,
  PhoneValue,
  PhoneOnChange,
  PhoneCountryChange,
  TextInputConfig,
} from "@/types/InputConfig";

/**
 * Props for the unified `Input` component.
 */
interface InputProps {
  /** The configuration object defining the type and properties of the input to render. */
  config: InputConfig;
  /** The current value of the input. Type depends on the `config.type`. */
  value: InputValue;
  /** The unified callback function invoked when the input's value changes. */
  onChange: InputOnChange;
  /** Optional callback function invoked specifically when the country selection changes in a 'phone' type input. */
  onCountryChange?: PhoneCountryChange;
}

/**
 * A unified input component that renders a specific input field
 * (TextInput, RadioInput, DropdownInput, DatePicker, PhoneNumberInput)
 * based on the provided `config` object.
 *
 * This component acts as a wrapper to abstract away the different input types,
 * allowing for dynamic form generation based on configuration. It handles passing
 * the correct props and adapting the `onChange` handler for each specific input type.
 *
 * @param {InputProps} props - The props for the Input component.
 * @param {InputConfig} props.config - Configuration object determining the input type and its specific props.
 * @param {InputValue} props.value - The current value for the input field.
 * @param {InputOnChange} props.onChange - The unified callback function to handle value changes.
 * @param {PhoneCountryChange} [props.onCountryChange] - Optional callback for phone input country changes.
 * @returns {React.ReactElement | null} The rendered specific input component based on the config, or null if the type is unhandled.
 */
const Input: React.FC<InputProps> = ({
  config,
  value,
  onChange,
  onCountryChange,
}) => {
  const { label, required, disabled, error, name } = config;

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
      const { successIcon, errorIcon } = config;
      const textConfig = config as TextInputConfig;
      return (
        <TextInput
          label={label}
          required={required}
          disabled={disabled}
          error={error}
          name={name}
          value={value as TextInputValue}
          onChange={handleTextChange}
          type={textConfig.type}
          placeholder={textConfig.placeholder}
          successMessage={textConfig.successMessage}
          successIcon={textConfig.successIcon}
          errorIcon={textConfig.errorIcon}
          maxLength={textConfig.maxLength}
          prefixCustom={textConfig.prefixCustom}
        />
      );

    case "textarea":
      // Use specific onChange type for TextAreaInput
      const handleTextAreaChange: TextAreaComponentOnChange = (event) => {
        onChange(event.target.value);
      };
      // Destructure icons specific to TextAreaInputConfig
      const { successIcon: taSuccessIcon, errorIcon: taErrorIcon } = config;
      return (
        <TextAreaInput
          label={label}
          required={required}
          disabled={disabled}
          error={error}
          name={name}
          value={value as TextAreaValue} // Cast value
          onChange={handleTextAreaChange} // Use adapted handler
          placeholder={config.placeholder}
          rows={config.rows}
          maxLength={config.maxLength}
          successMessage={config.successMessage}
          successIcon={taSuccessIcon}
          errorIcon={taErrorIcon}
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

    case "select":
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
          onChange={handleDateChange}
          placeholder={config.placeholder}
          minDate={config.minDate}
          maxDate={config.maxDate}
        />
      );

    case "phone":
      return (
        <PhoneNumberInput
          label={label}
          required={required}
          disabled={disabled}
          error={error}
          value={value as PhoneValue}
          onChange={onChange as PhoneOnChange}
          selectedCountryIso={config.selectedCountryIso ?? null}
          onCountryChange={onCountryChange}
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
