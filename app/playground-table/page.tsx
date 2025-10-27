"use client"; // Required because we are passing component-based columns

import { ColumnPinningState } from "@tanstack/react-table";

// 1. Import the generic table component
import { DataTable } from "@/components/data-table/DataTable";

import { columns, defaultData, Person } from "./columns";

export default function CandidatesPage() {
  // 3. Define the specific settings for this instance of the table
  const data = defaultData;

  const initialPinning: ColumnPinningState = {
    left: ["select", "namaLengkap"], // Specific to the candidate table
    right: [],
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Candidate Pipeline</h1>

      {/* 4. Render the generic table, passing in the
           data, columns, and settings.
      */}
      <DataTable<Person, unknown>
        columns={columns}
        data={data}
        initialPinning={initialPinning}
      />
    </div>
  );
}
