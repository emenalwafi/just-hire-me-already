import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { UilSearch } from "@iconscout/react-unicons";
import {
  getCountries,
  getCountryCallingCode,
  CountryCode,
} from "libphonenumber-js/max";
import * as Flags from "country-flag-icons/react/3x2";

/**
 * Describes the data structure for a country.
 */
export interface Country {
  /** The full, localized name of the country (e.g., "Indonesia"). */
  name: string;
  /** The international phone calling code, including the '+' (e.g., "+62"). */
  code: string;
  /** The ISO 3166-1 alpha-2 country code (e.g., "ID"). */
  iso: string;
}

/**
 * Generates a sorted list of countries with their names, phone codes, and ISO codes.
 * It fetches data using `libphonenumber-js` and `Intl.DisplayNames`.
 * @returns {Country[]} A list of `Country` objects, sorted alphabetically by name.
 */
export const getAllCountryData = (): Country[] => {
  const countryCodes = getCountries();
  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

  const countryData: Country[] = [];

  countryCodes.forEach((isoCode: CountryCode) => {
    try {
      const callingCode = getCountryCallingCode(isoCode);
      const name = regionNames.of(isoCode);

      // Only include countries that have a valid flag, calling code, and name.
      if (Flags[isoCode as keyof typeof Flags] && callingCode && name) {
        countryData.push({
          name: name,
          code: `+${callingCode}`,
          iso: isoCode,
        });
      }
    } catch (error) {
      console.warn(error);
    }
  });

  return countryData.sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Props for the `useCountryPhonePopover` hook.
 */
export interface UseCountryPhonePopoverProps {
  /** A React ref to the element the popover should be anchored to. */
  anchorRef: React.RefObject<HTMLElement | null>;
  /** Callback function fired when a country is selected from the list. */
  onSelectCountry: (country: Country) => void;
  /** The ISO code of the currently selected country, used for highlighting. */
  selectedCountryIso?: string | null;
  /** An optional custom array of `Country` objects to use instead of the default. */
  countries?: Country[];
  /** Optional override for the initial open state of the popover. */
  initialIsOpen?: boolean;
  /** An optional array of country ISO codes to disable from selection. */
  disabledCountryIsos?: string[];
}

/**
 * The return value of the `useCountryPhonePopover` hook.
 */
interface UseCountryPhonePopoverReturn {
  /** Whether the popover is currently open. */
  isOpen: boolean;
  /** State setter function to open or close the popover. */
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  /** The React Portal element containing the popover. Render this in your component. */
  popoverElement: React.ReactPortal | null;
  /** The current value of the search input field. */
  searchTerm: string;
  /** State setter function to update the search term. */
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  /** The list of countries, filtered by the current `searchTerm`. */
  filteredCountries: Country[];
}

/**
 * A small helper component to dynamically render a flag from the `country-flag-icons` library.
 * @param {object} props - Component props.
 * @param {string} props.countryCode - The ISO 3166-1 alpha-2 code for the flag (e.g., "US").
 * @param {any} props.props - Any other props to pass down to the SVG flag component (e.g., `className`, `title`).
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
 * A React hook that provides the logic, state, and UI for a country phone code selector popover.
 *
 * @param {UseCountryPhonePopoverProps} props - The configuration props for the hook.
 * @returns {UseCountryPhonePopoverReturn} - An object containing state and the popover element.
 */
export function useCountryPhonePopover({
  anchorRef,
  onSelectCountry,
  selectedCountryIso,
  countries: countriesProp,
  initialIsOpen = false,
  disabledCountryIsos = [],
}: UseCountryPhonePopoverProps): UseCountryPhonePopoverReturn {
  /** Memoized list of countries, using the provided prop or generating a default list. */
  const countries = useMemo(
    () => countriesProp || getAllCountryData(),
    [countriesProp]
  );

  /** State controlling the visibility of the popover. */
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  /** State for the value in the search input field. */
  const [searchTerm, setSearchTerm] = useState("");
  /** A ref to the popover's main `div` element, used for click-outside detection. */
  const popoverRef = useRef<HTMLDivElement>(null);
  /** State storing the calculated `top` and `left` position for the popover. */
  const [popoverPosition, setPopoverPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  /** Memoized list of countries filtered by the `searchTerm`. */
  const filteredCountries = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    if (!lowerSearchTerm) {
      return countries;
    }
    return countries.filter(
      (country) =>
        country.name.toLowerCase().includes(lowerSearchTerm) ||
        country.code.includes(lowerSearchTerm) ||
        country.code.substring(1).includes(lowerSearchTerm) || // Search without '+'
        country.iso.toLowerCase().includes(lowerSearchTerm)
    );
  }, [searchTerm, countries]);

  /** Effect to calculate the popover's position when it opens or the anchor moves. */
  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + window.scrollY + 8, // Position 8px below the anchor
        left: rect.left + window.scrollX,
      });
    } else {
      setPopoverPosition(null);
    }
  }, [isOpen, anchorRef]);

  /** A stable function to close the popover and reset the search term. */
  const handleClose = useCallback(() => {
    setSearchTerm("");
    setIsOpen(false);
  }, []);

  /** Effect to add a "click outside" listener to close the popover. */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleClose, popoverRef, anchorRef]);

  /**
   * A stable function to handle selecting a country.
   * It calls the `onSelectCountry` prop and closes the popover.
   */
  const handleSelect = useCallback(
    (country: Country) => {
      if (disabledCountryIsos.includes(country.iso)) {
        return;
      }
      onSelectCountry(country);
      handleClose();
    },
    [onSelectCountry, handleClose, disabledCountryIsos]
  );

  /** Memoized JSX for the popover's content. */
  const popoverContent = useMemo(() => {
    if (!isOpen || !popoverPosition) return null;

    return (
      <div
        ref={popoverRef}
        role="dialog"
        aria-modal="true"
        aria-label="Select Country Code"
        style={{
          position: "absolute",
          top: `${popoverPosition.top}px`,
          left: `${popoverPosition.left}px`,
          zIndex: 50,
        }}
        className="w-80 py-2 bg-neutral-10 rounded-lg shadow-[0px_4px_8px_0px_rgba(0,0,0,0.10)] outline outline-1 outline-offset-[-1px] outline-neutral-40 inline-flex flex-col justify-start items-start overflow-hidden font-sans"
        onKeyDown={(e) => e.key === "Escape" && handleClose()}
      >
        {/* Search Input */}
        <div className="self-stretch px-4 pt-2 pb-4 flex flex-col justify-start items-start gap-2.5">
          <div className="self-stretch relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <UilSearch size="16" className="text-neutral-100" />
            </div>
            <input
              type="text"
              autoFocus
              placeholder="Search country or code"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="self-stretch w-full h-10 pl-10 pr-4 py-2 bg-neutral-10 rounded-lg outline outline-2 outline-offset-[-2px] outline-neutral-40 focus:outline-primary-main focus:outline-2 text-neutral-90 text-base placeholder:text-neutral-60"
            />
          </div>
        </div>
        {/* Separator */}
        <div className="self-stretch h-0 outline outline-1 outline-offset-[-0.50px] outline-neutral-40"></div>
        {/* Country List or Not Found Message */}
        <div className="self-stretch max-h-60 overflow-y-auto bg-neutral-10 flex flex-col justify-start items-start">
          {filteredCountries.length > 0 ? (
            filteredCountries.map((country) => {
              const isSelected = selectedCountryIso === country.iso;
              const isDisabled = disabledCountryIsos.includes(country.iso);

              let buttonClasses =
                "self-stretch w-full px-4 py-2 inline-flex justify-start items-center gap-2 text-left transition-colors";
              let nameClasses =
                "flex-1 justify-start text-sm font-bold truncate";
              let codeClasses = "justify-start text-sm";

              if (isDisabled) {
                buttonClasses += " bg-neutral-10 cursor-not-allowed";
                nameClasses += " text-neutral-60";
                codeClasses += " text-neutral-60";
              } else if (isSelected) {
                buttonClasses +=
                  " bg-primary-surface focus:outline-none cursor-pointer";
                nameClasses += " text-primary-main";
                codeClasses += " text-primary-main";
              } else {
                buttonClasses +=
                  " bg-neutral-10 hover:bg-neutral-20 focus:bg-neutral-20 focus:outline-none group cursor-pointer";
                nameClasses +=
                  " text-neutral-100 group-hover:text-primary-main";
                codeClasses +=
                  " text-neutral-100 group-hover:text-primary-main";
              }

              return (
                <button
                  key={country.iso}
                  type="button"
                  className={buttonClasses}
                  onClick={() => handleSelect(country)}
                  disabled={isDisabled}
                  aria-pressed={isSelected && !isDisabled}
                  aria-disabled={isDisabled}
                >
                  <div className="w-4 h-4 rounded-full overflow-hidden items-center-justify-center flex border border-neutral-40">
                    <DynamicFlag
                      countryCode={country.iso}
                      title={country.name}
                      className={`scale-200 ${isDisabled ? "opacity-50" : ""}`}
                    />
                  </div>
                  <span className={nameClasses}>{country.name}</span>
                  <span className={codeClasses}>{country.code}</span>
                </button>
              );
            })
          ) : (
            // "Not Found" message
            <div className="self-stretch py-4 inline-flex justify-center items-center gap-2.5">
              <div className="text-center justify-center">
                <span className="text-neutral-700 text-sm">Keyword </span>
                <strong className="text-neutral-700 text-base font-bold">
                  “{searchTerm}”
                </strong>
                <span className="text-neutral-700 text-sm">
                  {" "}
                  tidak ditemukan
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }, [
    isOpen,
    popoverPosition,
    searchTerm,
    setSearchTerm,
    filteredCountries,
    handleSelect,
    handleClose,
    selectedCountryIso,
    disabledCountryIsos,
  ]);

  /** Creates the React Portal for the popover, ensuring it only runs client-side. */
  const popoverElement =
    typeof document !== "undefined" && popoverContent
      ? createPortal(popoverContent, document.body)
      : null;

  return {
    isOpen,
    setIsOpen,
    popoverElement,
    searchTerm,
    setSearchTerm,
    filteredCountries,
  };
}
