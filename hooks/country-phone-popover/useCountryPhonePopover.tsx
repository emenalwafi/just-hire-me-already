import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { UilSearch } from "@iconscout/react-unicons";
// Import from libphonenumber-js
import {
  getCountries,
  getCountryCallingCode,
  CountryCode,
} from "libphonenumber-js/max"; // Use /max for metadata
// Import the flag components dynamically or use a helper
import * as Flags from "country-flag-icons/react/3x2";

// Define the structure for our internal country object
export interface Country {
  name: string;
  code: string; // Phone code (e.g., '+62')
  iso: string; // ISO 3166-1 alpha-2 code (e.g., 'ID')
}

// Function to fetch and map country data using libphonenumber-js and Intl
const getAllCountryData = (): Country[] => {
  // Get ISO country codes supported by libphonenumber-js
  const countryCodes = getCountries();
  // Use Intl.DisplayNames to get country names
  const regionNames = new Intl.DisplayNames(["en"], { type: "region" }); // 'en' for English names

  const countryData: Country[] = [];

  countryCodes.forEach((isoCode: CountryCode) => {
    try {
      const callingCode = getCountryCallingCode(isoCode);
      // Ensure the ISO code exists in the Flags object and we have a calling code
      // Also filter out codes like '001' which might not have a standard name
      const name = regionNames.of(isoCode);
      if (Flags[isoCode as keyof typeof Flags] && callingCode && name) {
        countryData.push({
          name: name,
          code: `+${callingCode}`,
          iso: isoCode,
        });
      }
    } catch (error) {
      // Ignore countries where getCountryCallingCode might fail (e.g., '001')
      // console.warn(`Could not get calling code for ${isoCode}:`, error);
    }
  });

  // Sort alphabetically by country name
  return countryData.sort((a, b) => a.name.localeCompare(b.name));
};

// Props for the hook
interface UseCountryPhonePopoverProps {
  /** Ref of the element the popover should anchor to. Accepts null. */
  anchorRef: React.RefObject<HTMLElement | null>;
  /** Callback function when a country is selected */
  onSelectCountry: (country: Country) => void;
  /** ISO code of the currently selected country, or null */
  selectedCountryIso?: string | null;
  /** Optional: You can pass a custom list, otherwise uses the library */
  countries?: Country[];
  /** Optional: Initial open state */
  initialIsOpen?: boolean;
  /** Optional: Array of ISO codes for countries to disable */
  disabledCountryIsos?: string[];
}

// Return type of the hook
interface UseCountryPhonePopoverReturn {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  popoverElement: React.ReactPortal | null; // The popover JSX to render
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  filteredCountries: Country[];
}

// Helper component to render flag dynamically
const DynamicFlag = ({
  countryCode,
  ...props
}: {
  countryCode: string;
  [key: string]: any;
}) => {
  // Ensure countryCode is uppercase for the Flags object lookup
  const Flag = Flags[countryCode.toUpperCase() as keyof typeof Flags];
  // Apply width and height directly to the Flag component if possible, or wrap if needed
  // The library's components might already have inherent sizing. Adjust styling as necessary.
  return Flag ? (
    <Flag
      {...props}
      style={{ width: "100%", height: "auto", display: "block" }}
    />
  ) : null; // Render null if flag component doesn't exist
};

export function useCountryPhonePopover({
  anchorRef,
  onSelectCountry,
  selectedCountryIso, // Receive selected ISO code
  countries: countriesProp,
  initialIsOpen = false,
  disabledCountryIsos = [], // Default to empty array
}: UseCountryPhonePopoverProps): UseCountryPhonePopoverReturn {
  const countries = useMemo(
    () => countriesProp || getAllCountryData(),
    [countriesProp]
  );
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [searchTerm, setSearchTerm] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverPosition, setPopoverPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  // Filter countries based on search term
  const filteredCountries = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    if (!lowerSearchTerm) {
      return countries;
    }
    return countries.filter(
      (country) =>
        country.name.toLowerCase().includes(lowerSearchTerm) ||
        country.code.includes(lowerSearchTerm) ||
        country.code.substring(1).includes(lowerSearchTerm) ||
        country.iso.toLowerCase().includes(lowerSearchTerm)
    );
  }, [searchTerm, countries]);

  // --- Calculate Popover Position ---
  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
    } else {
      setPopoverPosition(null);
    }
  }, [isOpen, anchorRef]);

  // --- Close on Outside Click ---
  const handleClose = useCallback(() => {
    setSearchTerm(""); // Clear search term on close
    setIsOpen(false);
  }, []); // No dependencies needed for setters

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        handleClose(); // Use the combined close handler
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleClose, popoverRef, anchorRef]);

  const handleSelect = useCallback(
    (country: Country) => {
      // Prevent selection if country is disabled
      if (disabledCountryIsos.includes(country.iso)) {
        return;
      }
      onSelectCountry(country);
      handleClose(); // Close popover and clear search on selection
    },
    [onSelectCountry, handleClose, disabledCountryIsos]
  );

  // --- Popover JSX ---
  const popoverContent = useMemo(() => {
    if (!isOpen || !popoverPosition) return null;

    return (
      <div
        ref={popoverRef}
        role="dialog"
        aria-modal="true"
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
                buttonClasses += " bg-neutral-10 cursor-not-allowed"; // Disabled BG, no hover
                nameClasses += " text-neutral-60"; // Disabled text
                codeClasses += " text-neutral-60"; // Disabled text
              } else if (isSelected) {
                buttonClasses +=
                  " bg-primary-surface focus:outline-none cursor-pointer"; // Selected BG
                nameClasses += " text-primary-main"; // Selected Text
                codeClasses += " text-primary-main"; // Selected Text
              } else {
                buttonClasses +=
                  " bg-neutral-10 hover:bg-neutral-20 focus:bg-neutral-20 focus:outline-none group cursor-pointer"; // Default, add group for hover effect
                nameClasses +=
                  " text-neutral-100 group-hover:text-primary-main"; // Default text + hover effect
                codeClasses +=
                  " text-neutral-100 group-hover:text-primary-main"; // Default text + hover effect
              }

              return (
                <button
                  key={country.iso}
                  type="button"
                  className={buttonClasses}
                  onClick={() => handleSelect(country)}
                  disabled={isDisabled} // Add disabled attribute
                  aria-pressed={isSelected && !isDisabled} // Indicate selected state only if not disabled
                  aria-disabled={isDisabled} // Indicate disabled state
                >
                  {/* Apply styling to the flag container */}
                  <div className="w-4 h-4 rounded-full overflow-hidden items-center-justify-center flex border border-neutral-40">
                    {" "}
                    {/* Optional: dim flag */}
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
            // Updated "Not Found" message structure
            <div className="self-stretch py-4 inline-flex justify-center items-center gap-2.5">
              <div className="text-center justify-center">
                <span className="text-neutral-700 text-sm">Keyword </span>
                {/* Use strong for bold */}
                <strong className="text-neutral-700 text-base font-bold">
                  “{searchTerm}” {/* Display the actual search term */}
                </strong>
                <span className="text-neutral-700 text-sm">
                  {" "}
                  tidak ditemukan
                </span>{" "}
                {/* Assuming Indonesian based on example */}
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
  ]); // Add dependencies

  // Portal creation
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
