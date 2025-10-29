"use client";

import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { CheckboxInput } from "@/components/input/checkbox-input/CheckboxInput";
import { Application } from "@/types/dbTypes";

/**
 * Defines the combined data structure used for each row in the Candidate List DataTable.
 * This aggregates data from `Application` and `Candidate` (including extracted attributes).
 */
export type CombinedData = {
  /** The unique identifier for the row, typically the Application ID. */
  id: string;
  /** The ID of the candidate associated with this application. */
  candidateId: string;
  /** The ID of the job associated with this application. */
  jobId: string;
  /** The full name of the candidate. */
  name: string;
  /** The email address of the candidate. */
  email: string;
  /** The phone number of the candidate. */
  phone: string;
  /** The current status of the job application (e.g., 'applied', 'screening'). */
  status: Application["status"];
  /** The date the application was submitted (ISO string format). */
  applicationDate: string;
  /** Optional match rate score (example calculated field). */
  matchRate?: number | null;
  /** The calculated age of the candidate, or null if not available. */
  usia?: number | null;
  /** The candidate's last reported work experience, or null. */
  lastExperience?: string | null;
  /** The candidate's reported religion, or null. */
  agama?: string | null;
  /** The candidate's reported domicile, or null. */
  domisili?: string | null;
  /** The candidate's reported gender, or null. */
  jenisKelamin?: string | null;
  /** The candidate's expected salary, or null. */
  salary?: string | null;
};

/**
 * Instance of `@tanstack/react-table`'s `createColumnHelper` typed for the `CombinedData` structure.
 * Used for defining table columns with type safety.
 */
const columnHelper = createColumnHelper<CombinedData>();

/**
 * Helper function to determine the appropriate Tailwind CSS classes for rendering a status badge.
 * @param {Application["status"]} status - The application status string.
 * @returns {string} A string containing Tailwind CSS classes for the badge.
 */
const getStatusBadgeClasses = (status: Application["status"]): string => {
  switch (status) {
    case "applied":
      return "bg-primary-surface text-primary-main border-primary-border";
    case "screening":
      return "bg-blue-100 text-blue-700 border-blue-300";
    case "interview":
      return "bg-purple-100 text-purple-700 border-purple-300";
    case "offer":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case "hired":
      return "bg-success-surface text-success-main border-success-border";
    case "rejected":
      return "bg-danger-surface text-danger-main border-danger-border";
    default:
      return "bg-neutral-200 text-neutral-700 border-neutral-400";
  }
};

/**
 * An array of `ColumnDef` objects defining the columns for the Candidate List DataTable.
 * Includes definitions for selection, candidate name, status, application date, and other attributes.
 * @type {ColumnDef<CombinedData, any>[]}
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const columns: ColumnDef<CombinedData, any>[] = [
  columnHelper.display({
    id: "select",
    size: 64,
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <CheckboxInput
          index="header-all"
          checked={table.getIsAllRowsSelected()}
          indeterminate={table.getIsSomeRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <CheckboxInput
          index={row.original.id}
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

  columnHelper.accessor("name", {
    header: "NAMA LENGKAP",
    size: 208,
    cell: (info) => (
      <div className="text-base font-medium text-neutral-90 truncate">
        {info.getValue()}
      </div>
    ),
  }),

  columnHelper.accessor("status", {
    header: "TAHAPAN",
    size: 144,
    cell: (info) => {
      const status = info.getValue();
      const badgeClasses = getStatusBadgeClasses(status);
      return (
        <div
          className={`inline-flex justify-center items-center px-2 py-0.5 rounded outline outline-1 outline-offset-[-1px] ${badgeClasses}`}
        >
          <div className="text-sm font-bold capitalize line-clamp-1">
            {status}
          </div>
        </div>
      );
    },
  }),

  columnHelper.accessor("applicationDate", {
    header: "APPLICATION DATE",
    size: 160,
    cell: (info) => {
      const dateValue = info.getValue();
      try {
        const formattedDate = new Date(dateValue).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        return (
          <div className="text-base text-neutral-700">{formattedDate}</div>
        );
      } catch (e) {
        return <div className="text-base text-neutral-700">{dateValue}</div>;
      }
    },
  }),

  columnHelper.accessor("email", {
    header: "ALAMAT EMAIL",
    size: 200,
    cell: (info) => (
      <div className="text-base text-neutral-700 truncate">
        {info.getValue()}
      </div>
    ),
  }),

  columnHelper.accessor("phone", {
    header: "NOMOR HP",
    size: 160,
    cell: (info) => (
      <div className="text-base text-neutral-700 truncate">
        {info.getValue()}
      </div>
    ),
  }),

  columnHelper.accessor("usia", {
    header: "USIA",
    size: 96,
    cell: (info) => (
      <div className="text-base text-neutral-700">
        {info.getValue() ?? "N/A"}
      </div>
    ),
  }),

  columnHelper.accessor("lastExperience", {
    header: "LAST EXPERIENCE",
    size: 200,
    cell: (info) => (
      <div className="text-base text-neutral-700 truncate">
        {info.getValue() ?? "N/A"}
      </div>
    ),
  }),

  columnHelper.accessor("domisili", {
    header: "DOMISILI",
    size: 160,
    cell: (info) => (
      <div className="text-base text-neutral-700 truncate">
        {info.getValue() ?? "N/A"}
      </div>
    ),
  }),

  columnHelper.accessor("jenisKelamin", {
    header: "JENIS KELAMIN",
    size: 140,
    cell: (info) => (
      <div className="text-base text-neutral-700 truncate">
        {info.getValue() ?? "N/A"}
      </div>
    ),
  }),
];
