import React, { useRef, useMemo, useState } from "react";
import { UilAngleDown } from "@iconscout/react-unicons";
import {
  useCountryPhonePopover,
  Country,
  getAllCountryData,
} from "@/hooks/country-phone-popover/useCountryPhonePopover";
import * as Flags from "country-flag-icons/react/3x2";
import {
  AsYouType,
  CountryCode,
  parsePhoneNumberFromString,
} from "libphonenumber-js/max";

/**
 * A helper component to dynamically render a flag from the `country-flag-icons` library.
 * @param {object} props - Component props.
 * @param {string} props.countryCode - The ISO 3166-1 alpha-2 code for the flag (e.g., "US").
 * @param {any} props.props - Any other props to pass down to the SVG flag component.
 * @returns {React.ReactElement | null} A flag SVG component or null if the code is invalid.
 */
const DynamicFlag = ({
  countryCode,
  ...props
}: {
  countryCode: string;
  [key: string]: unknown;
}) => {
  const Flag = Flags[countryCode.toUpperCase() as keyof typeof Flags];
  return Flag ? (
    <Flag
      {...props}
      style={{ width: "100%", height: "auto", display: "block" }}
    />
  ) : null;
};

/**
 * Props for the `PhoneNumberInput` component.
 */
export interface PhoneNumberInputProps {
  /** The full phone number value including country code (e.g., "+6281..."). */
  value: string | null;
  /** Callback fired when the phone number changes. Returns the full number string or null. */
  onChange: (value: string | null) => void;
  /** The controlled ISO 3166-1 alpha-2 code of the selected country. */
  selectedCountryIso: string | null;
  /** Optional callback fired when the user selects a new country from the popover. */
  onCountryChange?: (country: Country | null) => void;
  /** Optional label displayed above the input field. */
  label?: string;
  /** Whether the input is required (adds a visual indicator). */
  required?: boolean;
  /** Whether the input is disabled. */
  disabled?: boolean;
  /** Sets the error state. A boolean shows a red border; a string also shows an error message. */
  error?: boolean | string;
  /**
   * Optional default country ISO code to use if `value` and `selectedCountryIso` are not provided.
   * @default "ID"
   */
  defaultCountryIso?: string;
  /**
   * Optional placeholder text for the national number part of the input.
   * @default "81XXXXXXXXX"
   */
  placeholder?: string;
  /** Optional array of country ISO codes to disable in the country selector popover. */
  disabledCountryIsos?: string[];
}

/**
 * A controlled phone number input component.
 *
 * It features a country code selector popover, dynamic flag rendering,
 * and "as-you-type" formatting for the national number based on the selected country.
 * The component's value is the full E.164-like number (e.g., "+628123456789").
 *
 * @param {PhoneNumberInputProps} props - The component props.
 * @returns {React.ReactElement} The rendered phone number input.
 */
const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  value,
  onChange,
  selectedCountryIso: selectedCountryIsoProp,
  onCountryChange,
  label,
  required = false,
  disabled = false,
  error = false,
  defaultCountryIso = "ID",
  placeholder = "81XXXXXXXXX",
  disabledCountryIsos,
}) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const countries = useMemo(() => getAllCountryData(), []);

  const { selectedCountry, nationalNumberToDisplay } = useMemo(() => {
    let determinedCountry: Country | null = null;
    let determinedNationalNum = "";

    if (selectedCountryIsoProp) {
      determinedCountry =
        countries.find((c) => c.iso === selectedCountryIsoProp.toUpperCase()) ||
        null;
    }

    if (!determinedCountry && value) {
      const phoneNumberInstance = parsePhoneNumberFromString(value);
      if (phoneNumberInstance?.country) {
        determinedCountry =
          countries.find((c) => c.iso === phoneNumberInstance.country) || null;
      }
    }

    if (!determinedCountry) {
      determinedCountry =
        countries.find((c) => c.iso === defaultCountryIso.toUpperCase()) ||
        countries[0] ||
        null;
    }

    if (
      value &&
      determinedCountry &&
      value.startsWith(determinedCountry.code)
    ) {
      determinedNationalNum = value.substring(determinedCountry.code.length);
    } else if (value) {
      const phoneNumberInstance = parsePhoneNumberFromString(value);
      if (
        phoneNumberInstance?.nationalNumber &&
        determinedCountry?.iso === phoneNumberInstance.country
      ) {
        determinedNationalNum = phoneNumberInstance.nationalNumber;
      }
    }
    const formatter = new AsYouType(
      determinedCountry?.iso as CountryCode | undefined
    );
    formatter.input(determinedNationalNum);
    const formattedDisplayNumber =
      formatter.getNumber()?.nationalNumber ?? determinedNationalNum;

    return {
      selectedCountry: determinedCountry,
      nationalNumberToDisplay: formattedDisplayNumber,
    };
  }, [value, selectedCountryIsoProp, defaultCountryIso, countries]);

  const {
    isOpen: isCountryPopoverOpen,
    setIsOpen: setCountryPopoverOpen,
    popoverElement: countryPopoverElement,
  } = useCountryPhonePopover({
    anchorRef: triggerRef,
    onSelectCountry: (country) => {
      onCountryChange?.(country);

      const currentDigits = nationalNumberToDisplay.replace(/\D/g, "");
      onChange(
        currentDigits ? `${country.code}${currentDigits}` : country.code
      );
      inputRef.current?.focus();
    },
    selectedCountryIso: selectedCountry?.iso,
    disabledCountryIsos: disabledCountryIsos,
  });

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const currentDigits = rawValue.replace(/\D/g, "");

    const fullNumber =
      selectedCountry && currentDigits
        ? `${selectedCountry.code}${currentDigits}`
        : selectedCountry
        ? selectedCountry.code
        : null;
    onChange(fullNumber);
  };

  let wrapperClasses =
    "self-stretch h-10 px-4 py-2 rounded-lg outline outline-2 outline-offset-[-2px] inline-flex items-center gap-2 overflow-hidden transition-colors";
  let iconColorClass = "text-neutral-100";
  let countryCodeTextColor = "text-neutral-90";
  let placeholderColor = "text-neutral-60";

  if (disabled) {
    wrapperClasses += " bg-neutral-30 outline-neutral-40 cursor-not-allowed";
    iconColorClass = "text-neutral-60";
    countryCodeTextColor = "text-neutral-60";
    placeholderColor = "text-neutral-60";
  } else if (error) {
    wrapperClasses += " bg-white outline-danger-main";
  } else if (isFocused) {
    wrapperClasses += " bg-white outline-primary-main";
  } else {
    wrapperClasses +=
      " bg-neutral-10 outline-neutral-40 hover:outline-neutral-70";
  }

  return (
    <div className="w-full inline-flex flex-col justify-start items-start gap-1">
      {label && (
        <div className="self-stretch justify-start">
          <span className="text-neutral-90 text-sm">{label}</span>
          {required && <span className="text-danger-main text-sm">*</span>}
        </div>
      )}
      <div
        className={wrapperClasses}
        onFocusCapture={() => !disabled && setIsFocused(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsFocused(false);
          }
        }}
      >
        {/* Country Selector Button */}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => !disabled && setCountryPopoverOpen(true)}
          disabled={disabled}
          className={`flex justify-start items-center gap-1 focus:outline-none ${
            disabled ? "cursor-not-allowed" : "cursor-pointer"
          }`}
          aria-haspopup="true"
          aria-expanded={isCountryPopoverOpen}
          aria-label="Select country code"
        >
          <div
            className={`w-4 h-4 rounded-full overflow-hidden items-center justify-center flex border ${
              disabled ? "border-neutral-60 opacity-60" : "border-neutral-40"
            }`}
          >
            {selectedCountry ? (
              <DynamicFlag
                countryCode={selectedCountry.iso}
                title={selectedCountry.name}
                className="scale-200"
              />
            ) : (
              <div className="w-full h-full bg-neutral-40"></div>
            )}
          </div>
          <UilAngleDown size="16" className={iconColorClass} />
        </button>

        {/* Separator */}
        <div
          className={`w-px h-6 rotate-0 outline outline-1 outline-offset-[-0.50px] outline-neutral-40 mx-1`}
        ></div>

        {/* Country Code */}
        <div className={`justify-center text-base ${countryCodeTextColor}`}>
          {selectedCountry?.code || "+?"}
        </div>

        {/* Phone Number Input */}
        <input
          ref={inputRef}
          type="tel"
          // Use the derived national number
          value={nationalNumberToDisplay}
          onChange={handlePhoneNumberChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`flex-1 w-full bg-transparent text-base focus:outline-none ${
            disabled ? placeholderColor : "text-neutral-90"
          } placeholder:${placeholderColor}`}
          aria-label="Phone number"
          aria-required={required}
          aria-invalid={!!error}
        />
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
      {countryPopoverElement}
    </div>
  );
};

export default PhoneNumberInput;
