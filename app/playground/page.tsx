"use client"

import { useState } from 'react';
import Chip from '@/components/chip/Chip';
import DatePicker from '@/components/date-picker/DatePicker';

export default function Home() {
  const [selectedChip, setSelectedChip] = useState<string | null>('rest');
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

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
        <h2 className="text-xl font-sans font-bold mb-4">Interactive Example</h2>
        <p className="text-sm font-sans text-neutral-700 mb-4">
          Click a chip to select it.
        </p>
        <div className="flex flex-wrap gap-4">
          <Chip
            selected={selectedChip === 'chip1'}
            onClick={() => setSelectedChip('chip1')}
          >
            Option 1
          </Chip>
          <Chip
            selected={selectedChip === 'chip2'}
            onClick={() => setSelectedChip('chip2')}
          >
            Option 2
          </Chip>
          <Chip
            selected={selectedChip === 'chip3'}
            onClick={() => setSelectedChip('chip3')}
          >
            Option 3
          </Chip>
          <Chip disabled>Disabled Option</Chip>
        </div>
      </div>

<section className="mb-8">
        <h2 className="text-heading-s font-bold text-neutral-80 mb-4">
          DatePicker Component
        </h2>
        <div className="p-6 bg-white rounded-lg shadow-sm border border-neutral-30">
          <h3 className="text-l font-bold mb-3">Interactive Example</h3>
          <p className="text-m text-neutral-70 mb-4">
            Selected date: {selectedDate ? selectedDate : 'None'}
          </p>
          <div className="w-full max-w-xs">
            <DatePicker
              value={selectedDate}
              onChange={(date) => setSelectedDate(date)}
            />
          </div>

          <h3 className="text-l font-bold mt-6 mb-3">Disabled State</h3>
          <div className="w-full max-w-xs">
            <DatePicker
              value={null}
              onChange={() => {}}
              placeholder="You can't click me"
              disabled
            />
          </div>
        </div>
      </section>
    </div>
  );
}
