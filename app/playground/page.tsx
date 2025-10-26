"use client";

import { useState, useRef } from "react";
import Chip from "@/components/chip/Chip";
import DatePicker from "@/components/date-picker/DatePicker";

import {
  useCountryPhonePopover,
  Country,
} from "@/hooks/country-phone-popover/useCountryPhonePopover";
// Import the Flags object to render dynamically
import * as Flags from "country-flag-icons/react/3x2";

// Helper component to render flag dynamically based on selected country
const DynamicFlag = ({
  countryCode,
  ...props
}: {
  countryCode: string;
  [key: string]: any;
}) => {
  const Flag = Flags[countryCode.toUpperCase() as keyof typeof Flags];
  return Flag ? <Flag {...props} /> : null; // Render null if flag component doesn't exist
};

export default function Home() {
  const [selectedChip, setSelectedChip] = useState<string | null>("rest");
  const [selectedDate1, setSelectedDate1] = useState<string | null>(null);
  const [selectedDate2, setSelectedDate2] = useState<string | null>(
    "2024-05-15"
  ); // Example initial date
  const [selectedDate3, setSelectedDate3] = useState<string | null>(
    "2022-08-20"
  ); // Example with bounds

  // --- State and Refs for Country Phone Popover ---
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null); // State to hold the selected country object
  const countryTriggerRef = useRef<HTMLButtonElement>(null); // Ref for the trigger button
  const disabledCountryTriggerRef = useRef<HTMLButtonElement>(null); // Ref for the disabled trigger button

  // --- Control disabled state for the second button ---
  // const [isCountrySelectorDisabled, setIsCountrySelectorDisabled] = useState(true);

  // --- Example list of disabled country ISO codes ---
  const exampleDisabledIsos = ["US", "GB", "AU"]; // Disable United States, UK, Australia

  // Use the country popover hook for the ENABLED selector
  const {
    isOpen: isCountryPopoverOpen,
    setIsOpen: setCountryPopoverOpen,
    popoverElement: countryPopoverElement,
  } = useCountryPhonePopover({
    anchorRef: countryTriggerRef, // Pass the ref of the ENABLED trigger element
    onSelectCountry: setSelectedCountry, // Function to update selected country state
    selectedCountryIso: selectedCountry?.iso, // Pass the ISO of the currently selected country
    disabledCountryIsos: exampleDisabledIsos, // Pass the array of disabled ISOs
    initialIsOpen: false, // Start closed
  });

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-xl font-sans font-bold mb-4">Static Examples</h2>
        <div className="flex flex-wrap gap-4">
          <Chip>Resting Chip</Chip>
          <Chip selected>Selected Chip</Chip>
          <Chip disabled>Disabled Chip</Chip>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-sans font-bold mb-4">
          Interactive Example
        </h2>
        <p className="text-sm font-sans text-neutral-700 mb-4">
          Click a chip to select it.
        </p>
        <div className="flex flex-wrap gap-4">
          <Chip
            selected={selectedChip === "chip1"}
            onClick={() => setSelectedChip("chip1")}
          >
            Option 1
          </Chip>
          <Chip
            selected={selectedChip === "chip2"}
            onClick={() => setSelectedChip("chip2")}
          >
            Option 2
          </Chip>
          <Chip
            selected={selectedChip === "chip3"}
            onClick={() => setSelectedChip("chip3")}
          >
            Option 3
          </Chip>
          <Chip disabled>Disabled Option</Chip>
        </div>
      </div>
      {/* DatePicker Component Section */}
      <section>
        <h2 className="text-xl font-bold mb-4">DatePicker Component</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          {/* Example 1: Basic DatePicker */}
          <div>
            <label className="block text-sm font-medium text-neutral-70 mb-1">
              Basic DatePicker:
            </label>
            <DatePicker
              value={selectedDate1}
              onChange={setSelectedDate1}
              placeholder="Select any date"
            />
            <p className="text-xs text-neutral-60 mt-1">
              Selected: {selectedDate1 || "None"}
            </p>
          </div>

          {/* Example 2: DatePicker with Initial Value */}
          <div>
            <label className="block text-sm font-medium text-neutral-70 mb-1">
              With Initial Value:
            </label>
            <DatePicker value={selectedDate2} onChange={setSelectedDate2} />
            <p className="text-xs text-neutral-60 mt-1">
              Selected: {selectedDate2 || "None"}
            </p>
          </div>

          {/* Example 3: DatePicker with Min/Max Dates */}
          <div>
            <label className="block text-sm font-medium text-neutral-70 mb-1">
              Range (Aug 1, 2022 - Oct 31, 2023):
            </label>
            <DatePicker
              value={selectedDate3}
              onChange={setSelectedDate3}
              minDate="2022-08-01" // Minimum selectable date
              maxDate="2023-10-31" // Maximum selectable date
              placeholder="Select date in range"
            />
            <p className="text-xs text-neutral-60 mt-1">
              Selected: {selectedDate3 || "None"}
            </p>
          </div>

          {/* Example 4: Disabled DatePicker */}
          <div>
            <label className="block text-sm font-medium text-neutral-70 mb-1">
              Disabled DatePicker:
            </label>
            <DatePicker
              value={null}
              onChange={() => {}} // No-op
              disabled={true}
              placeholder="Cannot select"
            />
            <p className="text-xs text-neutral-60 mt-1">
              Selected: None (Disabled)
            </p>
          </div>
        </div>
      </section>

      {/* Country Phone Popover Section */}
      <section>
        <h2 className="text-xl font-bold mb-4">Country Phone Popover Hook</h2>
        <div className="flex flex-wrap gap-8 items-start">
          {" "}
          {/* Use flex for side-by-side */}
          {/* Enabled Example */}
          <div>
            <label className="block text-sm font-medium text-neutral-70 mb-1">
              Select Country Code (Enabled, US/GB/AU Disabled):
            </label>
            {/* Enabled Trigger Button */}
            <button
              ref={countryTriggerRef}
              type="button"
              onClick={() => setCountryPopoverOpen(true)} // Open the popover on click
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-neutral-40 rounded-md bg-white hover:bg-neutral-20 focus:outline-none focus:ring-2 focus:ring-primary-focus/50"
              aria-haspopup="true"
              aria-expanded={isCountryPopoverOpen}
            >
              {selectedCountry ? (
                <>
                  <div className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0">
                    <DynamicFlag
                      countryCode={selectedCountry.iso}
                      title={selectedCountry.name}
                    />
                  </div>
                  <span className="text-sm text-neutral-90">
                    {selectedCountry.code}
                  </span>
                </>
              ) : (
                <span className="text-sm text-neutral-60">Select Code</span>
              )}
              {/* Down Arrow */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-neutral-60"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <p className="text-xs text-neutral-60 mt-1">
              Selected:{" "}
              {selectedCountry
                ? `${selectedCountry.name} (${selectedCountry.code})`
                : "None"}
            </p>

            {/* Render the popover element associated with the enabled trigger */}
            {countryPopoverElement}
          </div>
          {/* Disabled Example */}
          <div>
            <label className="block text-sm font-medium text-neutral-70 mb-1">
              Select Country Code (Disabled):
            </label>
            {/* Disabled Trigger Button */}
            <button
              ref={disabledCountryTriggerRef}
              type="button"
              disabled // Add disabled attribute
              // Apply disabled styles
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-neutral-40 rounded-md bg-neutral-30 cursor-not-allowed"
            >
              {/* Always show placeholder text and disabled colors */}
              <span className="text-sm text-neutral-60">Select Code</span>
              {/* Down Arrow with disabled color */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-neutral-60"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <p className="text-xs text-neutral-60 mt-1">
              Selected: None (Disabled)
            </p>

            {/* Optionally render the popover for the disabled button if needed, but likely not */}
            {/* {disabledPopoverElement} */}
          </div>
          {/* Toggle Disabled State */}
          {/*
            <div className="w-full mt-4">
                 <button
                    onClick={() => setIsCountrySelectorDisabled(!isCountrySelectorDisabled)}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                 >
                     Toggle Disabled State for Second Button
                 </button>
            </div>
             */}
        </div>
      </section>
    </div>
  );
}
