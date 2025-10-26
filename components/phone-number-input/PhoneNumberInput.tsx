import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { UilAngleDown } from "@iconscout/react-unicons";
// Import hook, type, AND getAllCountryData
import {
  useCountryPhonePopover,
  Country,
  getAllCountryData,
} from "@/hooks/country-phone-popover/useCountryPhonePopover";
import * as Flags from "country-flag-icons/react/3x2";
// Import necessary functions from libphonenumber-js
import {
  AsYouType,
  CountryCode,
  parsePhoneNumberFromString,
} from "libphonenumber-js/max";

// Helper component to render flag dynamically
const DynamicFlag = ({
  countryCode,
  ...props
}: {
  countryCode: string;
  [key: string]: any;
}) => {
  const Flag = Flags[countryCode.toUpperCase() as keyof typeof Flags];
  return Flag ? (
    <Flag
      {...props}
      style={{ width: "100%", height: "auto", display: "block" }}
    />
  ) : null;
};

interface PhoneNumberInputProps {
  /** The full phone number value including country code, e.g., +6281... */
  value: string | null;
  /** Callback function when the phone number changes (full number string) */
  onChange: (value: string | null) => void;
  /** ISO code of the currently selected country (controlled) */
  selectedCountryIso: string | null;
  /** Optional: Callback when the selected country changes internally */
  onCountryChange?: (country: Country | null) => void;
  /** Optional label for the input */
  label?: string;
  /** Indicates if the input is required */
  required?: boolean;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Error state. Can be boolean or a string message */
  error?: boolean | string;
  /** Optional: Default country ISO code to select if value/selectedCountryIso are not provided */
  defaultCountryIso?: string;
  /** Optional: Placeholder for the phone number part */
  placeholder?: string;
  /** Optional: Array of ISO codes for countries to disable in the popover */
  disabledCountryIsos?: string[];
}

const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  value,
  onChange,
  selectedCountryIso: selectedCountryIsoProp, // Renamed prop
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

  // --- State Management ---
  // Internal state for selected country, derived from props or value
  const [internalSelectedCountry, setInternalSelectedCountry] =
    useState<Country | null>(null);
  // State for the national number part
  const [nationalNumber, setNationalNumber] = useState<string>("");

  // --- Effect to Determine and Sync Selected Country and National Number ---
  useEffect(() => {
    let determinedCountry: Country | null = null;
    let determinedNationalNum = "";

    // 1. Prioritize controlled selectedCountryIso prop
    if (selectedCountryIsoProp) {
      determinedCountry =
        countries.find((c) => c.iso === selectedCountryIsoProp.toUpperCase()) ||
        null;
    }

    // 2. If no controlled ISO, try parsing the value prop
    if (!determinedCountry && value) {
      const phoneNumberInstance = parsePhoneNumberFromString(value);
      if (phoneNumberInstance?.country) {
        determinedCountry =
          countries.find((c) => c.iso === phoneNumberInstance.country) || null;
      }
    }

    // 3. If still no country, use the default ISO
    if (!determinedCountry) {
      determinedCountry =
        countries.find((c) => c.iso === defaultCountryIso.toUpperCase()) ||
        countries[0] ||
        null;
    }

    // Now determine the national number based on the determined country and value
    if (
      value &&
      determinedCountry &&
      value.startsWith(determinedCountry.code)
    ) {
      // Simple case: value starts with the determined country's code
      determinedNationalNum = value.substring(determinedCountry.code.length);
    } else if (value) {
      // Advanced case: Try parsing again, maybe it matches a *different* country's code
      const phoneNumberInstance = parsePhoneNumberFromString(value);
      if (
        phoneNumberInstance?.nationalNumber &&
        determinedCountry?.iso === phoneNumberInstance.country
      ) {
        // Parsed number's country matches the determined country, use parsed national number
        determinedNationalNum = phoneNumberInstance.nationalNumber;
      } else {
        // Value exists but doesn't match the determined country code and parsing didn't help,
        // Treat the whole value as national number for now? Or clear it? Let's clear it for safety.
        determinedNationalNum = ""; // Clear if value doesn't align with determined country
      }
    } else {
      // Value is null or empty
      determinedNationalNum = "";
    }

    // Update internal states only if they differ to prevent infinite loops
    if (determinedCountry?.iso !== internalSelectedCountry?.iso) {
      setInternalSelectedCountry(determinedCountry);
      // Do NOT call onCountryChange here, as this effect runs on prop changes too,
      // which could cause loops if the parent uses onCountryChange to set selectedCountryIsoProp.
      // onCountryChange is called only on explicit user selection from the popover.
    }
    if (determinedNationalNum !== nationalNumber) {
      setNationalNumber(determinedNationalNum);
    }

    // Dependencies: Watch props that influence the derivation
    // IMPORTANT: Avoid including internalSelectedCountry and nationalNumber directly
    // if this effect is supposed to primarily react to EXTERNAL prop changes.
    // Including them can sometimes lead to feedback loops. Fine-tune if issues arise.
  }, [value, selectedCountryIsoProp, defaultCountryIso, countries]); // Removed internal states from deps

  // --- Popover Hook ---
  const {
    isOpen: isCountryPopoverOpen,
    setIsOpen: setCountryPopoverOpen,
    popoverElement: countryPopoverElement,
  } = useCountryPhonePopover({
    anchorRef: triggerRef,
    onSelectCountry: (country) => {
      // User explicitly selected a country from the popover
      const previousCountryIso = internalSelectedCountry?.iso;
      setInternalSelectedCountry(country); // Update internal state FIRST

      // Only call onCountryChange if the ISO code actually changed
      if (country.iso !== previousCountryIso) {
        onCountryChange?.(country); // Notify parent of the change
      }

      // Trigger primary onChange with the new country code + existing digits
      const currentDigits = nationalNumber.replace(/\D/g, "");
      onChange(
        currentDigits ? `${country.code}${currentDigits}` : country.code
      );
      inputRef.current?.focus();
    },
    selectedCountryIso: internalSelectedCountry?.iso, // Pass internal state to hook for highlighting
    disabledCountryIsos: disabledCountryIsos,
  });

  // --- Input Change Handler ---
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const currentDigits = rawValue.replace(/\D/g, "");

    // Use AsYouType formatter based on the *internally selected* country
    const formatter = new AsYouType(
      internalSelectedCountry?.iso as CountryCode | undefined
    );
    formatter.input(currentDigits);
    // Use the formatter's output for display
    const formattedDisplayNumber =
      formatter.getNumber()?.nationalNumber ?? currentDigits;

    setNationalNumber(formattedDisplayNumber); // Update display state

    // Combine code and *raw digits* for the final onChange value
    const fullNumber =
      internalSelectedCountry && currentDigits
        ? `${internalSelectedCountry.code}${currentDigits}`
        : internalSelectedCountry
        ? internalSelectedCountry.code
        : null; // Send code even if num empty
    onChange(fullNumber);
  };

  // --- Styling Logic ---
  let wrapperClasses =
    "self-stretch h-10 px-4 py-2 rounded-lg outline outline-2 outline-offset-[-2px] inline-flex items-center gap-2 overflow-hidden transition-colors";
  let iconColorClass = "text-neutral-100";
  let countryCodeTextColor = "text-neutral-90";
  let separatorColor = "outline-neutral-40";
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
    <div className="w-96 inline-flex flex-col justify-start items-start gap-1">
      {label && (
        <div className="self-stretch justify-start">
          <span className="text-neutral-90 text-sm">{label}</span>
          {required && <span className="text-danger-main text-sm">*</span>}
        </div>
      )}
      <div
        className={wrapperClasses}
        // Add focus/blur handlers to manage focus state across children
        onFocusCapture={() => !disabled && setIsFocused(true)}
        onBlurCapture={(e) => {
          // Check if the related target (where focus is going) is still inside this component
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
          // Removed individual focus/blur handlers here, handled by parent div
        >
          <div
            className={`w-4 h-4 rounded-full overflow-hidden items-center justify-center flex border ${
              disabled ? "border-neutral-60 opacity-60" : "border-neutral-40"
            }`}
          >
            {internalSelectedCountry ? (
              <DynamicFlag
                countryCode={internalSelectedCountry.iso}
                title={internalSelectedCountry.name}
                className="scale-200" // This scale might need adjustment depending on flag aspect ratio
              />
            ) : (
              <div className="w-full h-full bg-neutral-40"></div>
            )}
          </div>
          <UilAngleDown size="16" className={iconColorClass} />
        </button>

        {/* Separator */}
        <div
          className={`w-px h-6 rotate-0 outline outline-1 outline-offset-[-0.50px] ${separatorColor} mx-1`}
        ></div>

        {/* Country Code */}
        <div className={`justify-center text-base ${countryCodeTextColor}`}>
          {internalSelectedCountry?.code || "+?"}
        </div>

        {/* Phone Number Input */}
        <input
          ref={inputRef}
          type="tel"
          value={nationalNumber}
          onChange={handlePhoneNumberChange}
          // Removed individual focus/blur handlers here, handled by parent div
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
