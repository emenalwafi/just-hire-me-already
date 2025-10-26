"use client";

import { useMemo, useState } from "react"; // Removed useRef as it's handled within PhoneNumberInput
import Chip from "@/components/chip/Chip";
import DatePicker from "@/components/date-picker/DatePicker";
// Import the PhoneNumberInput component
import PhoneNumberInput from "@/components/phone-number-input/PhoneNumberInput";
import {
  Country,
  getAllCountryData,
} from "@/hooks/country-phone-popover/useCountryPhonePopover";
import DropdownInput from "@/components/dropdown-input/DropdownInput";
import { DropdownOption } from "@/hooks/dropdown-popover/useDropdownPopover";

// Sample options for Dropdown examples
const domicileOptions: DropdownOption[] = [
  { id: "aceh_barat", label: "Kabupaten Aceh Barat - Aceh" },
  { id: "aceh_besar", label: "Kabupaten Aceh Besar - Aceh" },
  { id: "aceh_selatan", label: "Kabupaten Aceh Selatan - Aceh" },
  { id: "aceh_tamiang", label: "Kabupaten Aceh Tamiang - Aceh" },
  { id: "aceh_tengah", label: "Kabupaten Aceh Tengah - Aceh" },
  { id: "aceh_tenggara", label: "Kabupaten Aceh Tenggara - Aceh" },
  { id: "aceh_utara", label: "Kabupaten Aceh Utara - Aceh" },
  { id: "banda_aceh", label: "Kota Banda Aceh - Aceh" },
  // Add more options as needed for scrolling example
  { id: "jawa_barat_1", label: "Kabupaten Bandung - Jawa Barat" },
  { id: "jawa_barat_2", label: "Kota Bandung - Jawa Barat" },
  { id: "jawa_barat_3", label: "Kabupaten Bogor - Jawa Barat" },
  { id: "jawa_barat_4", label: "Kota Bogor - Jawa Barat" },
  { id: "jakarta_1", label: "Jakarta Pusat - DKI Jakarta" },
  { id: "jakarta_2", label: "Jakarta Selatan - DKI Jakarta" },
];

export default function Home() {
  const [selectedChip, setSelectedChip] = useState<string | null>("rest");
  const [selectedDate1, setSelectedDate1] = useState<string | null>(null);
  const [selectedDate2, setSelectedDate2] = useState<string | null>(
    "2024-05-15"
  ); // Example initial date
  const [selectedDate3, setSelectedDate3] = useState<string | null>(
    "2022-08-20"
  ); // Example with bounds

  const [phoneNumber1, setPhoneNumber1] = useState<string | null>(null);
  const [iso1, setIso1] = useState<string | null>("ID"); // Default ISO for example 1

  const [phoneNumber2, setPhoneNumber2] = useState<string | null>("+44");
  const [iso2, setIso2] = useState<string | null>(null); // ISO will be derived from value initially

  const [phoneNumber3, setPhoneNumber3] = useState<string | null>("+124212345");
  const [iso3, setIso3] = useState<string | null>(null); // ISO will be derived initially

  const [phoneNumber4, setPhoneNumber4] = useState<string | null>(
    "+628123456789"
  );
  const [iso4, setIso4] = useState<string | null>(null); // ISO will be derived initially

  const [phoneNumberControlled, setPhoneNumberControlled] = useState<
    string | null
  >(null);
  const [controlledIso, setControlledIso] = useState<string | null>("US"); // Start with US selected

  const [selectedDomicile1, setSelectedDomicile1] =
    useState<DropdownOption | null>(null);
  const [selectedDomicile2, setSelectedDomicile2] =
    useState<DropdownOption | null>(domicileOptions[1]);

  // --- Handlers for country change in each example ---
  const handleCountryChange1 = (country: Country | null) => {
    console.log("Country 1 Changed:", country);
    setIso1(country?.iso || null);
    // If number part is empty, update value to just the new code
    if (!nationalNumber1) {
      setPhoneNumber1(country?.code || null);
    }
  };
  const handleCountryChange2 = (country: Country | null) => {
    console.log("Country 2 Changed:", country);
    setIso2(country?.iso || null);
    if (!nationalNumber2) {
      setPhoneNumber2(country?.code || null);
    }
  };
  const handleCountryChange3 = (country: Country | null) => {
    console.log("Country 3 Changed:", country);
    setIso3(country?.iso || null);
    if (!nationalNumber3) {
      setPhoneNumber3(country?.code || null);
    }
  };
  const handleCountryChange4 = (country: Country | null) => {
    console.log("Country 4 Changed:", country);
    setIso4(country?.iso || null);
    if (!nationalNumber4) {
      setPhoneNumber4(country?.code || null);
    }
  };
  const handleCountryChangeControlled = (country: Country | null) => {
    console.log("Country Controlled Changed:", country);
    setControlledIso(country?.iso || null);
    if (!nationalNumberControlled) {
      setPhoneNumberControlled(country?.code || null);
    }
  };

  // --- Helper logic to display national number (repeated for each example) ---
  const nationalNumber1 = useMemo(() => {
    if (!phoneNumber1) return "";
    const countries = getAllCountryData();
    const country = countries.find((c) => c.iso === iso1?.toUpperCase());
    if (country && phoneNumber1.startsWith(country.code)) {
      return phoneNumber1.substring(country.code.length);
    }
    return phoneNumber1;
  }, [phoneNumber1, iso1]);

  const nationalNumber2 = useMemo(() => {
    if (!phoneNumber2) return "";
    const countries = getAllCountryData();
    const country = countries.find((c) => c.iso === iso2?.toUpperCase());
    if (country && phoneNumber2.startsWith(country.code)) {
      return phoneNumber2.substring(country.code.length);
    }
    return phoneNumber2;
  }, [phoneNumber2, iso2]);

  const nationalNumber3 = useMemo(() => {
    if (!phoneNumber3) return "";
    const countries = getAllCountryData();
    const country = countries.find((c) => c.iso === iso3?.toUpperCase());
    if (country && phoneNumber3.startsWith(country.code)) {
      return phoneNumber3.substring(country.code.length);
    }
    return phoneNumber3;
  }, [phoneNumber3, iso3]);

  const nationalNumber4 = useMemo(() => {
    if (!phoneNumber4) return "";
    const countries = getAllCountryData();
    const country = countries.find((c) => c.iso === iso4?.toUpperCase());
    if (country && phoneNumber4.startsWith(country.code)) {
      return phoneNumber4.substring(country.code.length);
    }
    return phoneNumber4;
  }, [phoneNumber4, iso4]);

  const nationalNumberControlled = useMemo(() => {
    if (!phoneNumberControlled) return "";
    const countries = getAllCountryData();
    const country = countries.find(
      (c) => c.iso === controlledIso?.toUpperCase()
    );
    if (country && phoneNumberControlled.startsWith(country.code)) {
      return phoneNumberControlled.substring(country.code.length);
    }
    return phoneNumberControlled;
  }, [phoneNumberControlled, controlledIso]);

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
            <DatePicker value={selectedDate2} onChange={setSelectedDate2} error={'This field is Not Valid'} />
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

      {/* --- Phone Number Input Section --- */}
      <section>
        <h2 className="text-xl font-bold mb-4">
          Phone Number Input (Controlled ISO)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12 items-start">
          {" "}
          {/* Increased vertical gap */}
          {/* Example 1: Basic */}
          <div>
            <PhoneNumberInput
              label="Phone number (ID Default)"
              required
              value={phoneNumber1}
              onChange={setPhoneNumber1}
              selectedCountryIso={iso1} // Pass controlled ISO
              onCountryChange={handleCountryChange1} // Handle country change
              defaultCountryIso="ID" // Fallback if selectedCountryIso is null initially
              disabledCountryIsos={["US", "GB"]}
            />
            <p className="text-xs text-neutral-60 mt-1">
              Value: {phoneNumber1 || "None"} | ISO: {iso1 || "None"} | NatNum:{" "}
              {nationalNumber1}
            </p>
          </div>
          {/* Example 2: Initial Country Code (GB) */}
          <div>
            <PhoneNumberInput
              label="UK Number (from value)"
              value={phoneNumber2}
              onChange={setPhoneNumber2}
              selectedCountryIso={iso2} // Pass controlled ISO
              onCountryChange={handleCountryChange2} // Handle country change
              defaultCountryIso="ID" // Fallback
            />
            <p className="text-xs text-neutral-60 mt-1">
              Value: {phoneNumber2 || "None"} | ISO: {iso2 || "None"} | NatNum:{" "}
              {nationalNumber2}
            </p>
          </div>
          {/* Example 3: Error State */}
          <div>
            <PhoneNumberInput
              label="Phone with Error"
              required
              value={phoneNumber3}
              onChange={setPhoneNumber3}
              selectedCountryIso={iso3} // Pass controlled ISO
              onCountryChange={handleCountryChange3} // Handle country change
              error="Please enter a valid phone number."
            />
            <p className="text-xs text-neutral-60 mt-1">
              Value: {phoneNumber3 || "None"} | ISO: {iso3 || "None"} | NatNum:{" "}
              {nationalNumber3}
            </p>
          </div>
          {/* Example 4: Disabled State */}
          <div>
            <PhoneNumberInput
              label="Disabled Input"
              value={phoneNumber4}
              onChange={setPhoneNumber4}
              selectedCountryIso={iso4} // Pass controlled ISO
              onCountryChange={handleCountryChange4} // Handle country change (won't be called if disabled)
              disabled={true}
            />
            <p className="text-xs text-neutral-60 mt-1">
              Value: {phoneNumber4 || "None"} | ISO: {iso4 || "None"} (Disabled)
              | NatNum: {nationalNumber4}
            </p>
          </div>
          {/* Example 5: Controlled Country Selection (already done) */}
          <div className="md:col-span-2">
            <PhoneNumberInput
              label="Phone Number (Externally Controlled Country)"
              required
              value={phoneNumberControlled}
              onChange={setPhoneNumberControlled}
              selectedCountryIso={controlledIso}
              onCountryChange={handleCountryChangeControlled}
              defaultCountryIso="JP"
              placeholder="Enter phone number"
            />
            <p className="text-xs text-neutral-60 mt-1">
              Full Value: {phoneNumberControlled || "None"} | Selected ISO:{" "}
              {controlledIso || "None"} | National Num:{" "}
              {nationalNumberControlled}
            </p>
            <div className="mt-2 space-x-2">
              <button
                onClick={() => setControlledIso("ID")}
                className="text-xs p-1 border rounded bg-neutral-10"
              >
                Set ID
              </button>
              <button
                onClick={() => setControlledIso("GB")}
                className="text-xs p-1 border rounded bg-neutral-10"
              >
                Set GB
              </button>
              <button
                onClick={() => setControlledIso("CA")}
                className="text-xs p-1 border rounded bg-neutral-10"
              >
                Set CA
              </button>
              <button
                onClick={() => setControlledIso(null)}
                className="text-xs p-1 border rounded bg-neutral-10"
              >
                Set Null (Fallback to Default)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* --- Dropdown Input Section --- */}
      <section>
        <h2 className="text-xl font-bold mb-4">Dropdown Input</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12 items-start">
          {/* Example 1: Basic Dropdown */}
          <div className="w-72">
            {" "}
            {/* Constrain width for example */}
            <DropdownInput
              label="Domicile (Basic)"
              required
              placeholder="Choose your domicile"
              options={domicileOptions}
              value={selectedDomicile1}
              onChange={setSelectedDomicile1}
              popoverWidth="w-popover"
            />
            <p className="text-xs text-neutral-60 mt-1">
              Selected ID: {selectedDomicile1?.id || "None"}
            </p>
          </div>

          {/* Example 2: Pre-selected & Error */}
          <div className="w-72">
            <DropdownInput
              label="Domicile (Pre-selected & Error)"
              required
              placeholder="Choose your domicile"
              options={domicileOptions}
              value={selectedDomicile2}
              onChange={setSelectedDomicile2}
              popoverWidth="w-popover"
              error="This field is required" // Example error message
            />
            <p className="text-xs text-neutral-60 mt-1">
              Selected ID: {selectedDomicile2?.id || "None"}
            </p>
          </div>

          {/* Example 3: Disabled */}
          <div className="w-72">
            <DropdownInput
              label="Domicile (Disabled)"
              placeholder="Cannot select domicile"
              options={domicileOptions}
              value={null} // Usually null when disabled, unless pre-filled
              onChange={() => {}} // No-op
              disabled={true}
            />
            <p className="text-xs text-neutral-60 mt-1">
              Selected ID: None (Disabled)
            </p>
          </div>

          {/* Example 4: Custom Popover Width (Example, matches trigger width) */}
          <div className="w-72">
            <DropdownInput
              label="Domicile (Popover Matches Trigger)"
              placeholder="Choose domicile"
              options={domicileOptions}
              value={selectedDomicile1} // Reusing state for example
              onChange={setSelectedDomicile1}
              popoverWidth="w-full" // Use w-full to match trigger
            />
            <p className="text-xs text-neutral-60 mt-1">
              Selected ID: {selectedDomicile1?.id || "None"}
            </p>
          </div>

          {/* Example 5: Fixed Popover Width */}
          <div className="w-72">
            <DropdownInput
              label="Domicile (Fixed Popover Width)"
              placeholder="Choose domicile"
              options={domicileOptions}
              value={selectedDomicile1} // Reusing state for example
              onChange={setSelectedDomicile1}
              popoverWidth="w-popover" // Use specific width
            />
            <p className="text-xs text-neutral-60 mt-1">
              Selected ID: {selectedDomicile1?.id || "None"}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
