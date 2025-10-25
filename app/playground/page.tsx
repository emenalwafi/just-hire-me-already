"use client"

import { useState } from 'react';
import Chip from '@/components/chip/Chip';

export default function Home() {
  const [selectedChip, setSelectedChip] = useState<string | null>('rest');

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
    </div>
  );
}
