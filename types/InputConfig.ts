import { DropdownOption } from "@/hooks/dropdown-popover/useDropdownPopover";
import { RadioOption } from "@/components/input/radio-input/RadioInput";
import { Country } from "@/hooks/country-phone-popover/useCountryPhonePopover";

/**
 * Base properties common to most input configuration types.
 */
interface BaseInputConfig {
  /** Optional label displayed above the input field. */
  label?: string;
  /** Whether the input is required (adds a visual indicator, often '*'). */
  required?: boolean;
  /** Whether the input field is disabled. */
  disabled?: boolean;
  /**
   * Sets the error state.
   * - `true`: Applies error styling (e.g., red border).
   * - `string`: Applies error styling and displays the string as an error message.
   * - `false` or `undefined`: No error state.
   */
  error?: boolean | string;
  /** The `name` attribute for the input, used for form submission. */
  name?: string;
}

/**
 * Configuration specific to the `TextInput` component.
 * Extends {@link BaseInputConfig}.
 */
export interface TextInputConfig extends BaseInputConfig {
  /** The functional type of the text input, determining behavior and semantics. */
  type: "text" | "email" | "url" | "password" | "number" | "search";
  /** Placeholder text displayed when the input is empty. */
  placeholder?: string;
  /** Optional success message displayed below the input when valid. */
  successMessage?: string;
  /** Optional custom icon node to display next to the success message. Defaults to a checkmark. */
  successIcon?: React.ReactNode;
   /** Optional custom icon node to display next to the error message. */
  errorIcon?: React.ReactNode;
  /** Maximum number of characters allowed in the input. */
  maxLength?: number;
}

/**
 * Configuration specific to the `RadioInput` component.
 * Extends {@link BaseInputConfig}.
 */
export interface RadioInputConfig extends BaseInputConfig {
  /** The type identifier for radio inputs. */
  type: "radio";
  /** An array of options available for selection. */
  options: RadioOption[];
  /** The `name` attribute shared by all radio buttons in the group. **Required**. */
  name: string;
  /** The value of the currently selected option (used internally by some components, not the unified Input directly). */
  selectedValue?: string | null; // Note: The unified Input component uses `value` prop, not this.
}

/**
 * Configuration specific to the `DropdownInput` component.
 * Extends {@link BaseInputConfig}.
 */
export interface DropdownInputConfig extends BaseInputConfig {
  /** The type identifier for dropdown inputs. */
  type: "dropdown";
  /** An array of options available for selection in the dropdown. */
  options: DropdownOption[];
  /** Placeholder text displayed when no option is selected. */
  placeholder?: string;
  /** Optional Tailwind CSS class to override the popover width (e.g., 'w-full', 'w-[300px]'). */
  popoverWidth?: string;
}

/**
 * Configuration specific to the `DatePicker` component.
 * Extends {@link BaseInputConfig}.
 */
export interface DatePickerConfig extends BaseInputConfig {
  /** The type identifier for date picker inputs. */
  type: "date";
  /** Placeholder text displayed when no date is selected. */
  placeholder?: string;
  /** The minimum selectable date in "yyyy-MM-dd" format. */
  minDate?: string;
  /** The maximum selectable date in "yyyy-MM-dd" format. */
  maxDate?: string;
}

/**
 * Type definition for the callback function invoked when the selected country
 * changes in a `PhoneNumberInput` component.
 * @param {Country | null} country - The newly selected country object, or null if cleared/invalid.
 */
export type PhoneCountryChange = (country: Country | null) => void;

/**
 * Configuration specific to the `PhoneNumberInput` component.
 * Extends {@link BaseInputConfig}.
 */
export interface PhoneNumberInputConfig extends BaseInputConfig {
  /** The type identifier for phone number inputs. */
  type: "phone";
  /** Placeholder text for the national number part of the input. */
  placeholder?: string;
  /** The default country ISO code (e.g., "ID") to select if no value or `selectedCountryIso` is provided. */
  defaultCountryIso?: string;
  /** An array of country ISO codes to disable in the country selector popover. */
  disabledCountryIsos?: string[];
  /** Optional controlled ISO 3166-1 alpha-2 code for the selected country flag and code. */
  selectedCountryIso?: string | null;
  /**
   * @deprecated This property is part of the config but the actual callback should be passed directly to the unified `Input` component's `onCountryChange` prop.
   */
  onCountryChange?: PhoneCountryChange;
}

/**
 * A discriminated union type representing the configuration object for any supported input type.
 * The `type` property acts as the discriminant.
 */
export type InputConfig =
  | TextInputConfig
  | RadioInputConfig
  | DropdownInputConfig
  | DatePickerConfig
  | PhoneNumberInputConfig;

/**
 * A union type representing the possible value types for the unified `Input` component's `value` prop.
 * It accommodates strings (for text, radio, date, phone) and `DropdownOption` objects (for dropdown).
 */
export type InputValue = string | DropdownOption | null;

/**
 * A union type defining the specific value structure expected by the unified `InputOnChange` callback.
 * This ensures type safety within the callback.
 */
export type UnifiedChangeValue = string | DropdownOption | null;

/**
 * Type definition for the unified `onChange` callback prop of the main `Input` component.
 * It receives a value whose type corresponds to `UnifiedChangeValue`.
 * @param {UnifiedChangeValue} value - The new value from the input component.
 */
export type InputOnChange = (value: UnifiedChangeValue) => void;

// --- Specific Value and onChange Signatures ---
// These types represent the exact props expected by the individual, non-unified components.

/** The value type expected by the `TextInput` component. */
export type TextInputValue = string | null;
/** The `onChange` signature expected by the `TextInput` component. */
export type TextInputComponentOnChange = (
  event: React.ChangeEvent<HTMLInputElement>
) => void;

/** The value type expected by the `RadioInput` component's `selectedValue` prop. */
export type RadioValue = string | null;
/** The `onChange` signature expected by the `RadioInput` component. */
export type RadioOnChange = (value: string) => void;

/** The value type expected by the `DropdownInput` component. */
export type DropdownValue = DropdownOption | null;
/** The `onChange` signature expected by the `DropdownInput` component. */
export type DropdownOnChange = (option: DropdownOption | null) => void;

/** The value type expected by the `DatePicker` component (ISO date string). */
export type DatePickerValue = string | null;
/** The `onChange` signature expected by the `DatePicker` component. */
export type DatePickerOnChange = (date: string | null) => void; // Allow null for clearing

/** The value type expected by the `PhoneNumberInput` component (full number string). */
export type PhoneValue = string | null;
/** The `onChange` signature expected by the `PhoneNumberInput` component. */
export type PhoneOnChange = (value: string | null) => void;
// PhoneCountryChange type is already defined above
