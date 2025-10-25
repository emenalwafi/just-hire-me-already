"use client";

import { useState } from "react";
import Chip from "@/components/chip/Chip";
import DatePicker from "@/components/date-picker/DatePicker";

export default function Home() {
  const [selectedChip, setSelectedChip] = useState<string | null>("rest");
  const [selectedDate1, setSelectedDate1] = useState<string | null>(null);
  const [selectedDate2, setSelectedDate2] = useState<string | null>(
    "2024-05-15"
  ); // Example initial date
  const [selectedDate3, setSelectedDate3] = useState<string | null>(
    "2022-08-20"
  ); // Example with bounds

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
    </div>
  );
}
