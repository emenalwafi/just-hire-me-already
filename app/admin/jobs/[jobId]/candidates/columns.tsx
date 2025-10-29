"use client";

import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { CheckboxInput } from "@/components/input/checkbox-input/CheckboxInput";
import { Application } from "@/types/dbTypes"; // Import base types if needed

// --- Combined Data Type ---
// This defines the structure of the data object passed to the DataTable
export type CombinedData = {
  id: string; // Application ID (unique key for the row)
  candidateId: string;
  jobId: string;
  name: string;
  email: string;
  phone: string;
  status: Application["status"]; // Use the specific status type
  applicationDate: string; // ISO String
  // Add other fields from Candidate Attributes or calculated values
  matchRate?: number | null; // Optional example
  usia?: number | null;
  lastExperience?: string | null;
  agama?: string | null;
  domisili?: string | null;
  jenisKelamin?: string | null;
  salary?: string | null; // Example expected salary
};

// --- Column Helper ---
const columnHelper = createColumnHelper<CombinedData>();

// --- Helper Function for Status Badge Styling ---
const getStatusBadgeClasses = (status: Application["status"]): string => {
  switch (status) {
    case "applied":
      return "bg-primary-surface text-primary-main border-primary-border";
    case "screening":
      return "bg-blue-100 text-blue-700 border-blue-300"; // Example style
    case "interview":
      return "bg-purple-100 text-purple-700 border-purple-300"; // Example style
    case "offer":
      return "bg-yellow-100 text-yellow-700 border-yellow-300"; // Example style
    case "hired":
      return "bg-success-surface text-success-main border-success-border";
    case "rejected":
      return "bg-danger-surface text-danger-main border-danger-border";
    default:
      return "bg-neutral-200 text-neutral-700 border-neutral-400";
  }
};

// --- Column Definitions ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const columns: ColumnDef<CombinedData, any>[] = [
  // Select Column (Pinned)
  columnHelper.display({
    id: "select",
    size: 64, // w-16
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        {" "}
        {/* Center checkbox */}
        <CheckboxInput
          index="header-all" // Use a unique index
          checked={table.getIsAllRowsSelected()}
          indeterminate={table.getIsSomeRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        {" "}
        {/* Center checkbox */}
        <CheckboxInput
          index={row.original.id} // Use a unique ID like application ID
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          indeterminate={row.getIsSomeSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  }),

  // Candidate Name (Pinned)
  columnHelper.accessor("name", {
    header: "NAMA LENGKAP",
    size: 208, // w-52
    cell: (info) => (
      <div className="text-base font-medium text-neutral-90 truncate">
        {info.getValue()}
      </div>
    ),
  }),

  // Application Status
  columnHelper.accessor("status", {
    header: "TAHAPAN",
    size: 144, // w-36
    cell: (info) => {
      const status = info.getValue();
      const badgeClasses = getStatusBadgeClasses(status);
      return (
        <div
          className={`inline-flex justify-center items-center px-2 py-0.5 rounded outline outline-1 outline-offset-[-1px] ${badgeClasses}`}
        >
          <div className="text-sm font-bold capitalize line-clamp-1">
            {" "}
            {/* Capitalize */}
            {status}
          </div>
        </div>
      );
    },
  }),

  // Application Date
  columnHelper.accessor("applicationDate", {
    header: "APPLICATION DATE",
    size: 160, // w-40
    cell: (info) => {
      const dateValue = info.getValue();
      try {
        // Format date nicely, e.g., "Oct 29, 2025"
        const formattedDate = new Date(dateValue).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        return (
          <div className="text-base text-neutral-700">{formattedDate}</div>
        );
      } catch (e) {
        return <div className="text-base text-neutral-700">{dateValue}</div>; // Fallback
      }
    },
  }),

  // Email Column
  columnHelper.accessor("email", {
    header: "ALAMAT EMAIL",
    size: 200, // w-50 Increased size
    cell: (info) => (
      <div className="text-base text-neutral-700 truncate">
        {info.getValue()}
      </div>
    ),
  }),

  // Telepon Column
  columnHelper.accessor("phone", {
    header: "NOMOR HP",
    size: 160, // w-40
    cell: (info) => (
      <div className="text-base text-neutral-700 truncate">
        {info.getValue()}
      </div>
    ),
  }),

  // Usia Column (Calculated in page.tsx)
  columnHelper.accessor("usia", {
    header: "USIA",
    size: 96, // w-24
    cell: (info) => (
      <div className="text-base text-neutral-700">
        {info.getValue() ?? "N/A"}
      </div>
    ),
  }),

  // Last Experience Column
  columnHelper.accessor("lastExperience", {
    header: "LAST EXPERIENCE",
    size: 200, // w-50 Increased size
    cell: (info) => (
      <div className="text-base text-neutral-700 truncate">
        {info.getValue() ?? "N/A"}
      </div>
    ),
  }),

  // --- Add other columns as needed based on CombinedData ---

  // Example: Domicile
  columnHelper.accessor("domisili", {
    header: "DOMISILI",
    size: 160, // w-40
    cell: (info) => (
      <div className="text-base text-neutral-700 truncate">
        {info.getValue() ?? "N/A"}
      </div>
    ),
  }),

  // Example: Gender
  columnHelper.accessor("jenisKelamin", {
    header: "JENIS KELAMIN",
    size: 140, // w-35
    cell: (info) => (
      <div className="text-base text-neutral-700 truncate">
        {info.getValue() ?? "N/A"}
      </div>
    ),
  }),
];
