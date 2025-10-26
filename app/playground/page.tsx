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

  const countryButtonRef = useRef<HTMLButtonElement>(null); // Ref for the trigger button
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null); // State to store the selected country

  // Use the custom hook
  const {
    isOpen: isCountryPopoverOpen,
    setIsOpen: setCountryPopoverOpen,
    popoverElement: countryPopoverElement,
  } = useCountryPhonePopover({
    anchorRef: countryButtonRef, // Pass the ref of the trigger element
    onSelectCountry: (country) => {
      setSelectedCountry(country); // Update state when a country is selected
      console.log("Selected Country:", country);
    },
    // initialIsOpen: true // Optionally start open
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

      <section>
        <h2 className="text-xl font-bold mb-4">Country Phone Popover Hook</h2>
        <div className="flex items-end gap-2">
          {/* Trigger Button */}
          <button
            ref={countryButtonRef} // Attach the ref here
            type="button"
            onClick={() => setCountryPopoverOpen(true)} // Open popover on click
            className="inline-flex items-center gap-2 px-3 py-2 border border-neutral-40 rounded-lg hover:border-neutral-70 focus:outline-none focus:ring-2 focus:ring-primary-focus/50"
          >
            {selectedCountry ? (
              <div className="w-5 h-auto overflow-hidden rounded-sm">
                {/* Use DynamicFlag helper here */}
                <DynamicFlag
                  countryCode={selectedCountry.iso}
                  title={selectedCountry.name}
                />
              </div>
            ) : (
              <span className="text-neutral-60">Select</span>
            )}
            <span className="text-sm">{selectedCountry?.code ?? "Code"}</span>
          </button>

          {/* Display Selected Country (Optional) */}
          {selectedCountry && (
            <p className="text-sm text-neutral-70">
              Selected: {selectedCountry.name} ({selectedCountry.code})
            </p>
          )}
        </div>
        {/* Render the popover element from the hook */}
        {countryPopoverElement}
      </section>
    </div>
  );
}
