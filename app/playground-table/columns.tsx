"use client";

import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { CheckboxInput } from "@/components/input/checkbox-input/CheckboxInput";

// Data extracted from your HTML
export const defaultData: Person[] = [
  {
    namaLengkap: "Aurelie Yukiko",
    matchRate: 90,
    email: "aurelieyukiko.yahoo.com",
    telepon: "082120908766",
    tahapan: "APPLIED",
    usia: 25,
    lastExperience: "Policy & Transformation Specialist",
    agama: "Islam",
    domisili: "Jakarta",
    jenisKelamin: "Perempuan",
    salary: "6.000.000",
  },
  {
    namaLengkap: "Dityo Hendyawan",
    matchRate: 97,
    email: "dityohendyawan@yahoo.com",
    telepon: "081184180678",
    tahapan: "APPLIED",
    usia: 25,
    lastExperience: "Policy & Transformation Specialist",
    agama: "Islam",
    domisili: "Jakarta",
    jenisKelamin: "Perempuan",
    salary: "6.000.000",
  },
  {
    namaLengkap: "Mira Workman",
    matchRate: 94,
    email: "miraworkman@yahoo.com",
    telepon: "081672007108",
    tahapan: "APPLIED",
    usia: 25,
    lastExperience: "Business Analyst",
    agama: "Islam",
    domisili: "Jakarta",
    jenisKelamin: "Perempuan",
    salary: "6.000.000",
  },
  {
    namaLengkap: "Paityn Culhane",
    matchRate: 88,
    email: "paitynculhane@yahoo.com",
    telepon: "081521500714",
    tahapan: "APPLIED",
    usia: 25,
    lastExperience: "Business Analyst",
    agama: "Islam",
    domisili: "Jakarta",
    jenisKelamin: "Laki-laki",
    salary: "6.000.000",
  },
  {
    namaLengkap: "Emerson Baptista",
    matchRate: 80,
    email: "emersonbaptista@yahoo.com",
    telepon: "082167008244",
    tahapan: "APPLIED",
    usia: 25,
    lastExperience: "Lead UX Designer",
    agama: "Islam",
    domisili: "Jakarta",
    jenisKelamin: "Laki-laki",
    salary: "6.000.000",
  },
  {
    namaLengkap: "Indra Zein",
    matchRate: 78,
    email: "indrazein@yahoo.com",
    telepon: "081181630568",
    tahapan: "APPLIED",
    usia: 25,
    lastExperience: "Lead UX Designer",
    agama: "Islam",
    domisili: "Jakarta",
    jenisKelamin: "Laki-laki",
    salary: "6.000.000",
  },
  {
    namaLengkap: "Joyce",
    matchRate: 98,
    email: "joyce@yahoo.com",
    telepon: "084288771015",
    tahapan: "APPLIED",
    usia: 25,
    lastExperience: "Lead UX Designer",
    agama: "Konguchu",
    domisili: "Jakarta",
    jenisKelamin: "Laki-laki",
    salary: "6.000.000",
  },
  {
    namaLengkap: "Eriberto",
    matchRate: 95,
    email: "eriberto@yahoo.com",
    telepon: "083862419121",
    tahapan: "APPLIED",
    usia: 25,
    lastExperience: "Lead UX Designer",
    agama: "Kristen",
    domisili: "Jakarta",
    jenisKelamin: "Laki-laki",
    salary: "6.000.000",
  },
  {
    namaLengkap: "Javon",
    matchRate: 97,
    email: "javon@yahoo.com",
    telepon: "083283445502",
    tahapan: "APPLIED",
    usia: 25,
    lastExperience: "Lead UX Designer",
    agama: "Kristen",
    domisili: "Jakarta",
    jenisKelamin: "Laki-laki",
    salary: "6.000.000",
  },
  {
    namaLengkap: "Emory",
    matchRate: 87,
    email: "emory@yahoo.com",
    telepon: "087188286367",
    tahapan: "APPLIED",
    usia: 25,
    lastExperience: "Lead UX Designer",
    agama: "Kristen",
    domisili: "Jakarta",
    jenisKelamin: "Laki-laki",
    salary: "6.000.000",
  },
  {
    namaLengkap: "Ella",
    matchRate: 88,
    email: "ella@yahoo.com",
    telepon: "088306913834",
    tahapan: "APPLIED",
    usia: 25,
    lastExperience: "Lead UX Designer",
    agama: "Islam",
    domisili: "Jakarta",
    jenisKelamin: "Laki-laki",
    salary: "6.000.000",
  },
  {
    namaLengkap: "Sylvan",
    matchRate: 83,
    email: "sylvan@yahoo.com",
    telepon: "087752105228",
    tahapan: "APPLIED",
    usia: 25,
    lastExperience: "Lead UX Designer",
    agama: "Islam",
    domisili: "Jakarta",
    jenisKelamin: "Laki-laki",
    salary: "6.000.000",
  },
  {
    namaLengkap: "Shanna",
    matchRate: 80,
    email: "shanna@yahoo.com",
    telepon: "082986235842",
    tahapan: "APPLIED",
    usia: 25,
    lastExperience: "Lead UX Designer",
    agama: "Islam",
    domisili: "Jakarta",
    jenisKelamin: "Laki-laki",
    salary: "6.000.000",
  },
  {
    namaLengkap: "Kristian",
    matchRate: 90,
    email: "kristian@yahoo.com",
    telepon: "088038897424",
    tahapan: "APPLIED",
    usia: 25,
    lastExperience: "Lead UX Designer",
    agama: "Budha",
    domisili: "Jakarta",
    jenisKelamin: "Laki-laki",
    salary: "6.000.000",
  },
  {
    namaLengkap: "Gail",
    matchRate: 92,
    email: "gail@yahoo.com",
    telepon: "086038195208",
    tahapan: "APPLIED",
    usia: 25,
    lastExperience: "Lead UX Designer",
    agama: "Budha",
    domisili: "Jakarta",
    jenisKelamin: "Perempuan",
    salary: "6.000.000",
  },
  {
    namaLengkap: "Dan",
    matchRate: 87,
    email: "dan@yahoo.com",
    telepon: "086337611921",
    tahapan: "APPLIED",
    usia: 25,
    lastExperience: "Lead UX Designer",
    agama: "Hindu",
    domisili: "Jakarta",
    jenisKelamin: "Perempuan",
    salary: "6.000.000",
  },
  {
    namaLengkap: "Marvin",
    matchRate: 93,
    email: "marvin@yahoo.com",
    telepon: "089625947956",
    tahapan: "APPLIED",
    usia: 25,
    lastExperience: "Lead UX Designer",
    agama: "Islam",
    domisili: "Jakarta",
    jenisKelamin: "Perempuan",
    salary: "6.000.000",
  },
  {
    namaLengkap: "Granville",
    matchRate: 89,
    email: "granville@yahoo.com",
    telepon: "083627955709",
    tahapan: "APPLIED",
    usia: 25,
    lastExperience: "Lead UX Designer",
    agama: "Islam",
    domisili: "Jakarta",
    jenisKelamin: "Perempuan",
    salary: "6.000.000",
  },
];

// --- TypeScript Type Definition ---
export type Person = {
  namaLengkap: string;
  matchRate: number;
  email: string;
  telepon: string;
  tahapan: string;
  usia: number;
  lastExperience: string;
  agama: string;
  domisili: string;
  jenisKelamin: string;
  salary: string;
};

// --- Column Helper ---
const columnHelper = createColumnHelper<Person>();

// --- Column Definitions ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const columns: ColumnDef<Person, any>[] = [
  // Select Column (Pinned)
  columnHelper.display({
    id: "select",
    size: 64, // w-16
    header: ({ table }) => (
      <CheckboxInput
        {...{
          index: "all",
          checked: table.getIsAllRowsSelected(),
          indeterminate: table.getIsSomeRowsSelected(),
          onChange: table.getToggleAllRowsSelectedHandler(),
        }}
      />
    ),
    cell: ({ row }) => (
      <CheckboxInput
        {...{
          index: row.index,
          checked: row.getIsSelected(),
          disabled: !row.getCanSelect(),
          indeterminate: row.getIsSomeSelected(),
          onChange: row.getToggleSelectedHandler(),
        }}
      />
    ),
  }),

  columnHelper.accessor("namaLengkap", {
    header: "NAMA LENGKAP",
    size: 208, // w-52
    cell: (info) => <div className="text-base">{info.getValue()}</div>,
  }),

  // Match Rate Column
  columnHelper.accessor("matchRate", {
    header: "MATCH RATE 🔥",
    size: 128, // w-32
    cell: (info) => (
      <div className="text-base">
        <span>🤩 </span>
        <span className="font-bold">{info.getValue()}%</span>
      </div>
    ),
  }),

  // Email Column
  columnHelper.accessor("email", {
    header: "ALAMAT EMAIL",
    size: 144, // w-36
    cell: (info) => <div className="text-base truncate">{info.getValue()}</div>,
  }),

  // Telepon Column
  columnHelper.accessor("telepon", {
    header: "NOMOR HP",
    size: 144, // w-36
    cell: (info) => <div className="text-base truncate">{info.getValue()}</div>,
  }),

  // Tahapan Column
  columnHelper.accessor("tahapan", {
    header: "TAHAPAN",
    size: 144, // w-36
    cell: (info) => (
      <div className="w-18 flex justify-center items-center px-2 py-0.5 bg-primary-surface rounded outline outline-1 outline-offset-[-1px] outline-primary-border">
        <div className="text-primary-main text-sm font-bold line-clamp-1">
          {info.getValue()}
        </div>
      </div>
    ),
  }),

  // Usia Column
  columnHelper.accessor("usia", {
    header: "USIA",
    size: 96, // w-24
    cell: (info) => <div className="text-base">{info.getValue()}</div>,
  }),

  // Last Experience Column
  columnHelper.accessor("lastExperience", {
    header: "LAST EXPERIENCE",
    size: 144, // w-36
    cell: (info) => <div className="text-base truncate">{info.getValue()}</div>,
  }),

  // Agama Column
  columnHelper.accessor("agama", {
    header: "AGAMA",
    size: 112, // w-28
    cell: (info) => <div className="text-base truncate">{info.getValue()}</div>,
  }),

  // Domisili Column
  columnHelper.accessor("domisili", {
    header: "DOMISILI",
    size: 112, // w-28
    cell: (info) => <div className="text-base truncate">{info.getValue()}</div>,
  }),

  // Jenis Kelamin Column
  columnHelper.accessor("jenisKelamin", {
    header: "JENIS KELAMIN",
    size: 112, // w-28
    cell: (info) => <div className="text-base truncate">{info.getValue()}</div>,
  }),

  // Salary Column
  columnHelper.accessor("salary", {
    header: "SALARY",
    size: 112, // w-28
    cell: (info) => <div className="text-base truncate">{info.getValue()}</div>,
  }),
];
