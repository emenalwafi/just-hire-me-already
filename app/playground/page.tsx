"use client";

import React, { useState, useMemo } from "react";
import Chip from "@/components/input/chip/Chip";
import Input from "@/components/input/Input";
import {
  InputConfig,
  TextInputConfig,
  RadioInputConfig,
  DropdownInputConfig,
  DatePickerConfig,
  PhoneNumberInputConfig,
  InputValue,
  InputOnChange,
  UnifiedChangeValue,
  PhoneCountryChange,
} from "@/types/InputConfig";
import { DropdownOption } from "@/hooks/dropdown-popover/useDropdownPopover";
import {
  Country,
  getAllCountryData,
} from "@/hooks/country-phone-popover/useCountryPhonePopover";

/**
 * Sample data for RadioInput options (Pronouns).
 * @type {Array<{value: string, label: string}>}
 */
const pronounOptions = [
  { value: "female", label: "She/her (Female)" },
  { value: "male", label: "He/him (Male)" },
  { value: "other", label: "They/them (Other)" },
];

/**
 * Sample data for DropdownInput options (Domiciles).
 * @type {DropdownOption[]}
 */
const domicileOptions: DropdownOption[] = [
  { id: "aceh_barat", label: "Kabupaten Aceh Barat - Aceh" },
  { id: "aceh_besar", label: "Kabupaten Aceh Besar - Aceh" },
  { id: "aceh_selatan", label: "Kabupaten Aceh Selatan - Aceh" },
  { id: "jakarta_1", label: "Jakarta Pusat - DKI Jakarta" },
  { id: "jakarta_2", label: "Jakarta Selatan - DKI Jakarta" },
  { id: "bandung_1", label: "Kota Bandung - Jawa Barat" },
  { id: "bogor_1", label: "Kota Bogor - Jawa Barat" },
];

/** Base configuration for a 'text' input for Full Name. */
const baseNameConfig: TextInputConfig = {
  type: "text",
  name: "name",
  label: "Full Name",
  placeholder: "Enter full name",
  required: true,
};
/** Base configuration for an 'email' input. */
const baseEmailConfig: TextInputConfig = {
  type: "email",
  name: "email",
  label: "Email",
  placeholder: "Enter email",
  required: true,
};
/** Base configuration for a 'password' input. */
const basePasswordConfig: TextInputConfig = {
  type: "password",
  name: "password",
  label: "Password",
  placeholder: "Enter password",
  required: true,
};
/** Base configuration for a 'radio' input for Pronouns. */
const basePronounConfig: RadioInputConfig = {
  type: "radio",
  name: "pronoun",
  label: "Pronoun",
  options: pronounOptions,
  required: true,
};
/** Base configuration for a 'dropdown' input for Domicile. */
const baseDomicileConfig: DropdownInputConfig = {
  type: "dropdown",
  name: "domicile",
  label: "Domicile",
  options: domicileOptions,
  placeholder: "Select domicile",
  required: true,
};
/** Base configuration for a 'date' input for Birth Date. */
const baseDateConfig: DatePickerConfig = {
  type: "date",
  name: "birthDate",
  label: "Birth Date",
  placeholder: "Select date",
  required: true,
};
/** Base configuration for a 'phone' input for Phone Number. */
const basePhoneConfig: PhoneNumberInputConfig = {
  type: "phone",
  name: "phone",
  label: "Phone Number",
  placeholder: "81xxxxxxx",
  required: true,
  defaultCountryIso: "ID",
};

/**
 * Defines the structure for configuring and displaying an input field example
 * in the playground component.
 */
interface InputFieldStateExample {
  /** Unique key for React mapping. */
  id: string;
  /** Title displayed above the input example. */
  title: string;
  /** The base configuration object for the input type. */
  config: InputConfig;
  /** The key within the main `formState` object that holds this input's value. */
  stateKey: string;
  /** Optional properties to override or add to the base `config` for this specific example. */
  stateProps?: Partial<InputConfig> & { selectedCountryIso?: string | null };
  /** The key within the `phoneIsoState` object for controlling the phone input's country ISO (if applicable). */
  countryStateKey?: string;
}

/**
 * An array containing definitions for all input field examples shown in the playground.
 * Each object specifies the base configuration, the state key for its value,
 * and any overrides needed to demonstrate different states (error, disabled, etc.).
 * @type {InputFieldStateExample[]}
 */
const inputFields: InputFieldStateExample[] = [
  // Text Inputs
  {
    id: "name-rest",
    title: "Text (Rest)",
    config: baseNameConfig,
    stateKey: "nameRest",
  },
  {
    id: "name-filled",
    title: "Text (Filled)",
    config: baseNameConfig,
    stateKey: "nameFilled",
  },
  {
    id: "name-error",
    title: "Text (Error)",
    config: baseNameConfig,
    stateKey: "nameError",
    stateProps: { error: "Name is required" },
  },
  {
    id: "name-disabled",
    title: "Text (Disabled)",
    config: baseNameConfig,
    stateKey: "nameDisabled",
    stateProps: { disabled: true },
  },
  {
    id: "email-success",
    title: "Email (Success)",
    config: baseEmailConfig,
    stateKey: "emailSuccess",
    stateProps: { successMessage: "Email looks good!" },
  },
  {
    id: "password-basic",
    title: "Password",
    config: basePasswordConfig,
    stateKey: "passwordBasic",
  },
  // Radio Inputs
  {
    id: "pronoun-rest",
    title: "Radio (Rest)",
    config: basePronounConfig,
    stateKey: "pronounRest",
  },
  {
    id: "pronoun-selected",
    title: "Radio (Selected)",
    config: basePronounConfig,
    stateKey: "pronounSelected",
  },
  {
    id: "pronoun-error",
    title: "Radio (Error)",
    config: basePronounConfig,
    stateKey: "pronounError",
    stateProps: { error: "Please select a pronoun" },
  },
  {
    id: "pronoun-disabled",
    title: "Radio (Disabled)",
    config: basePronounConfig,
    stateKey: "pronounDisabled",
    stateProps: { disabled: true },
  },
  // Dropdown Inputs
  {
    id: "domicile-rest",
    title: "Dropdown (Rest)",
    config: baseDomicileConfig,
    stateKey: "domicileRest",
  },
  {
    id: "domicile-selected",
    title: "Dropdown (Selected)",
    config: baseDomicileConfig,
    stateKey: "domicileSelected",
  },
  {
    id: "domicile-error",
    title: "Dropdown (Error)",
    config: baseDomicileConfig,
    stateKey: "domicileError",
    stateProps: { error: "Domicile is required" },
  },
  {
    id: "domicile-disabled",
    title: "Dropdown (Disabled)",
    config: baseDomicileConfig,
    stateKey: "domicileDisabled",
    stateProps: { disabled: true },
  },
  // Date Pickers
  {
    id: "date-rest",
    title: "DatePicker (Rest)",
    config: baseDateConfig,
    stateKey: "dateRest",
  },
  {
    id: "date-selected",
    title: "DatePicker (Selected)",
    config: baseDateConfig,
    stateKey: "dateSelected",
  },
  {
    id: "date-error",
    title: "DatePicker (Error)",
    config: baseDateConfig,
    stateKey: "dateError",
    stateProps: { error: "Invalid date" },
  },
  {
    id: "date-ranged",
    title: "DatePicker (Ranged)",
    config: { ...baseDateConfig, minDate: "2023-01-01", maxDate: "2023-12-31" },
    stateKey: "dateRanged",
  },
  {
    id: "date-disabled",
    title: "DatePicker (Disabled)",
    config: baseDateConfig,
    stateKey: "dateDisabled",
    stateProps: { disabled: true },
  },
  // Phone Inputs
  {
    id: "phone-rest",
    title: "Phone (Rest)",
    config: basePhoneConfig,
    stateKey: "phoneRest",
    countryStateKey: "phoneIsoRest",
  },
  {
    id: "phone-filled",
    title: "Phone (Filled)",
    config: basePhoneConfig,
    stateKey: "phoneFilled",
    countryStateKey: "phoneIsoFilled",
  },
  {
    id: "phone-error",
    title: "Phone (Error)",
    config: basePhoneConfig,
    stateKey: "phoneError",
    stateProps: { error: "Invalid phone number" },
    countryStateKey: "phoneIsoError",
  },
  {
    id: "phone-disabled",
    title: "Phone (Disabled)",
    config: basePhoneConfig,
    stateKey: "phoneDisabled",
    stateProps: { disabled: true },
    countryStateKey: "phoneIsoDisabled",
  },
];

/**
 * Extracts the national number part from a full phone number string based on the country code.
 * @param {string | null} phoneNumber - The full phone number (e.g., "+6281...") or null.
 * @param {string | null} iso - The ISO code of the country (e.g., "ID").
 * @returns {string} The national number part, or the original string if country/code doesn't match, or empty string.
 */
function getNationalNumber(
  phoneNumber: string | null,
  iso: string | null
): string {
  if (!phoneNumber) return "";
  const countries = getAllCountryData();
  const country = countries.find((c) => c.iso === iso?.toUpperCase());
  if (country && phoneNumber.startsWith(country.code)) {
    return phoneNumber.substring(country.code.length);
  }
  return phoneNumber; // Return original if no match or no country found
}

/**
 * The main playground component demonstrating various input components and their states.
 * Uses a unified `Input` component driven by configuration objects.
 * @returns {React.ReactElement} The rendered playground page.
 */
export default function Home() {
  /**
   * Central state object holding the values for all input examples.
   * Keys correspond to `stateKey` in the `inputFields` array.
   */
  const [formState, setFormState] = useState<Record<string, InputValue>>({
    nameRest: null,
    nameFilled: "John Doe",
    nameError: null,
    nameDisabled: "Cannot Edit",
    emailSuccess: "valid@email.com",
    passwordBasic: null,
    pronounRest: null,
    pronounSelected: "male",
    pronounError: null,
    pronounDisabled: "female",
    domicileRest: null,
    domicileSelected: domicileOptions[1],
    domicileError: null,
    domicileDisabled: domicileOptions[0],
    dateRest: null,
    dateSelected: "2024-10-27",
    dateError: null,
    dateRanged: null,
    dateDisabled: "2023-05-01",
    phoneRest: null,
    phoneFilled: "+442071234567",
    phoneError: "+123",
    phoneDisabled: "+62812000000",
  });

  /**
   * Separate state object holding the explicitly controlled ISO country codes
   * for the phone input examples. Keys correspond to `countryStateKey`.
   */
  const [phoneIsoState, setPhoneIsoState] = useState<
    Record<string, string | null>
  >({
    phoneIsoRest: "ID",
    phoneIsoFilled: null,
    phoneIsoError: null,
    phoneIsoDisabled: null,
  });

  /**
   * Generic handler to update the central `formState`.
   * @param {string} key - The state key corresponding to the input.
   * @param {UnifiedChangeValue} value - The new value from the Input component.
   */
  const handleChange = (key: string, value: UnifiedChangeValue) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * Generic handler to update the `phoneIsoState` when a phone input's country changes.
   * Also updates the main `formState` value if the national number part is empty.
   * @param {string} key - The state key corresponding to the phone input's ISO code.
   * @param {Country | null} country - The newly selected country object, or null.
   */
  const handlePhoneCountryChange = (key: string, country: Country | null) => {
    setPhoneIsoState((prev) => ({ ...prev, [key]: country?.iso || null }));

    const currentPhoneValue = formState[key] as string | null;
    const nationalNum = getNationalNumber(
      currentPhoneValue,
      country?.iso || null
    );
    if (!nationalNum && country) {
      setFormState((prev) => ({ ...prev, [key]: country.code }));
    }
  };

  /** State for managing the selected Chip component example. */
  const [selectedChip, setSelectedChip] = useState<string | null>("rest");

  return (
    <div className="p-8 space-y-12 font-sans">
      <section>
        <h2 className="text-xl font-bold mb-4">Chip Component</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Chip
            selected={selectedChip === "rest"}
            onClick={() => setSelectedChip("rest")}
          >
            Resting Chip
          </Chip>
          <Chip
            selected={selectedChip === "selected"}
            onClick={() => setSelectedChip("selected")}
          >
            Selected Chip
          </Chip>
          <Chip disabled>Disabled Chip</Chip>
        </div>
        <p className="text-xs text-neutral-60 mt-2">
          Selected: {selectedChip || "None"}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">
          Unified Input Component Examples
        </h2>
        <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 items-start">
          {inputFields.map((field) => {
            let currentConfig: InputConfig = {
              ...field.config,
              ...field.stateProps,
            } as InputConfig;

            const currentValue = formState[field.stateKey];
            const currentPhoneIso = field.countryStateKey
              ? phoneIsoState[field.countryStateKey]
              : undefined;

            let dynamicError: string | boolean | undefined =
              currentConfig.error;

            if (
              currentConfig.required &&
              !currentConfig.disabled &&
              !currentValue
            ) {
              if (field.id === "name-error-req")
                dynamicError = "Name is required";
              if (field.id === "pronoun-error")
                dynamicError = "Please select a pronoun";
              if (field.id === "domicile-error")
                dynamicError = "Domicile is required";
            }

            if (
              currentConfig.type === "email" &&
              field.id === "email-validation"
            ) {
              const emailVal = currentValue as string | null;
              if (emailVal) {
                const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
                if (isValid) {
                  currentConfig.successMessage = "Email looks good!";
                  dynamicError = false;
                } else {
                  dynamicError = "Invalid email format";
                }
              } else if (currentConfig.required) {
                dynamicError = "Email is required";
              }
            }

            currentConfig.error = dynamicError;

            if (currentConfig.type === "phone" && field.countryStateKey) {
              currentConfig.selectedCountryIso = currentPhoneIso;
            }

            const onChangeAdapter = (newValue: UnifiedChangeValue) => {
              handleChange(field.stateKey, newValue);
            };
            const onCountryChangeAdapter =
              field.countryStateKey && currentConfig.type === "phone"
                ? (country: Country | null) =>
                    handlePhoneCountryChange(field.countryStateKey!, country)
                : undefined;

            return (
              <InputWrapper key={field.id} title={field.title}>
                <Input
                  config={currentConfig}
                  value={currentValue}
                  onChange={onChangeAdapter}
                  onCountryChange={onCountryChangeAdapter}
                />
                {currentConfig.type === "dropdown" ? (
                  <StateDisplay
                    value={(currentValue as DropdownOption | null)?.label}
                    prefix="Selected: "
                  />
                ) : currentConfig.type === "password" ? (
                  <StateDisplay value={currentValue ? "******" : null} />
                ) : currentConfig.type === "phone" ? (
                  <StateDisplay
                    value={currentValue as string | null}
                    prefix={`ISO: ${currentPhoneIso ?? "Derived"} | Val: `}
                  />
                ) : (
                  <StateDisplay value={currentValue as string | null} />
                )}
              </InputWrapper>
            );
          })}
        </form>
      </section>
    </div>
  );
}

/**
 * A simple wrapper component for displaying input examples in the playground.
 * @param {object} props - Component props.
 * @param {string} props.title - The title to display above the input.
 * @param {React.ReactNode} props.children - The input component and state display to render.
 * @returns {React.ReactElement} The wrapped input example.
 */
const InputWrapper: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="border border-dashed border-neutral-300 p-4 rounded-md min-h-[100px]">
    <h3 className="text-md font-semibold mb-3 text-neutral-700">{title}</h3>
    {children}
  </div>
);

/**
 * A small component to display the current state value below an input example.
 * @param {object} props - Component props.
 * @param {string | null | undefined} props.value - The value to display.
 * @param {string} [props.prefix="Value: "] - Optional prefix string.
 * @returns {React.ReactElement} The state display paragraph.
 */
const StateDisplay: React.FC<{
  value: string | null | undefined;
  prefix?: string;
}> = ({ value, prefix = "Value: " }) => (
  <p className="text-xs text-neutral-60 mt-1 h-4">
    {prefix}
    {value || "None"}
  </p>
);
