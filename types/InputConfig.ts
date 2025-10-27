import { DropdownOption } from "@/hooks/dropdown-popover/useDropdownPopover";
import { RadioOption } from "@/components/input/radio-input/RadioInput";
import { Country } from "@/hooks/country-phone-popover/useCountryPhonePopover";

// Base props common to most inputs (can be extended)
interface BaseInputConfig {
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean | string;
  name?: string; // For form submission
}

// Config for TextInput
export interface TextInputConfig extends BaseInputConfig {
  type: "text" | "email" | "url" | "password" | "number" | "search";
  placeholder?: string;
  successMessage?: string;
  maxLength?: number;
}

// Config for RadioInput
export interface RadioInputConfig extends BaseInputConfig {
  type: "radio";
  options: RadioOption[];
  name: string;
  selectedValue?: string | null;
}

// Config for DropdownInput
export interface DropdownInputConfig extends BaseInputConfig {
  type: "dropdown";
  options: DropdownOption[];
  placeholder?: string;
  popoverWidth?: string;
}

// Config for DatePicker
export interface DatePickerConfig extends BaseInputConfig {
  type: "date";
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
}

// Define PhoneCountryChange type
export type PhoneCountryChange = (country: Country | null) => void;

// Config for PhoneNumberInput - ADDED selectedCountryIso and onCountryChange
export interface PhoneNumberInputConfig extends BaseInputConfig {
  type: "phone";
  placeholder?: string;
  defaultCountryIso?: string;
  disabledCountryIsos?: string[];
  selectedCountryIso?: string | null; // Optional controlled ISO prop
  onCountryChange?: PhoneCountryChange; // Optional callback for country change
}

// The Union Type
export type InputConfig =
  | TextInputConfig
  | RadioInputConfig
  | DropdownInputConfig
  | DatePickerConfig
  | PhoneNumberInputConfig;

// Union Type for the 'value' prop
export type InputValue = string | null | DropdownOption | null;

// Define a stricter type for the unified onChange prop's argument
export type UnifiedChangeValue = string | DropdownOption | null;

// Update InputOnChange to use the stricter value type, removing 'any'
export type InputOnChange = (value: UnifiedChangeValue) => void;

// Specific onChange signatures expected by each component
export type TextInputValue = string | null;
export type TextInputComponentOnChange = (
  event: React.ChangeEvent<HTMLInputElement>
) => void;

export type RadioValue = string | null;
export type RadioOnChange = (value: string) => void;

export type DropdownValue = DropdownOption | null;
export type DropdownOnChange = (option: DropdownOption | null) => void;

export type DatePickerValue = string | null;
export type DatePickerOnChange = (date: string) => void;

export type PhoneValue = string | null;
export type PhoneOnChange = (value: string | null) => void;
// PhoneCountryChange type is already defined above
