import {
  Job,
  JobPostingConfiguration,
  JobSpecificApplicationConfiguration,
  Candidate,
  JobApplicationFieldConfig, // Import the updated type
} from "@/types/dbTypes";
import { v4 as uuidv4 } from "uuid";
import { DropdownOption } from "@/hooks/dropdown-popover/useDropdownPopover"; // Import DropdownOption

// --- Domicile Options ---
// Expanded list of Indonesian cities/regencies grouped by province
const domicileOptions: DropdownOption[] = [
  // DKI Jakarta
  { value: "jakarta_pusat", label: "Kota Jakarta Pusat - DKI Jakarta" },
  { value: "jakarta_selatan", label: "Kota Jakarta Selatan - DKI Jakarta" },
  { value: "jakarta_barat", label: "Kota Jakarta Barat - DKI Jakarta" },
  { value: "jakarta_timur", label: "Kota Jakarta Timur - DKI Jakarta" },
  { value: "jakarta_utara", label: "Kota Jakarta Utara - DKI Jakarta" },
  { value: "kep_seribu", label: "Kabupaten Kepulauan Seribu - DKI Jakarta" },
  // Jawa Barat
  { value: "bandung_kota", label: "Kota Bandung - Jawa Barat" },
  { value: "bandung_kab", label: "Kabupaten Bandung - Jawa Barat" },
  { value: "bandung_barat_kab", label: "Kabupaten Bandung Barat - Jawa Barat" },
  { value: "bekasi_kota", label: "Kota Bekasi - Jawa Barat" },
  { value: "bekasi_kab", label: "Kabupaten Bekasi - Jawa Barat" },
  { value: "bogor_kota", label: "Kota Bogor - Jawa Barat" },
  { value: "bogor_kab", label: "Kabupaten Bogor - Jawa Barat" },
  { value: "cimahi_kota", label: "Kota Cimahi - Jawa Barat" },
  { value: "cirebon_kota", label: "Kota Cirebon - Jawa Barat" },
  { value: "cirebon_kab", label: "Kabupaten Cirebon - Jawa Barat" },
  { value: "depok_kota", label: "Kota Depok - Jawa Barat" },
  { value: "sukabumi_kota", label: "Kota Sukabumi - Jawa Barat" },
  { value: "sukabumi_kab", label: "Kabupaten Sukabumi - Jawa Barat" },
  { value: "tasikmalaya_kota", label: "Kota Tasikmalaya - Jawa Barat" },
  { value: "tasikmalaya_kab", label: "Kabupaten Tasikmalaya - Jawa Barat" },
  // Jawa Tengah
  { value: "semarang_kota", label: "Kota Semarang - Jawa Tengah" },
  { value: "semarang_kab", label: "Kabupaten Semarang - Jawa Tengah" },
  { value: "salatiga_kota", label: "Kota Salatiga - Jawa Tengah" },
  { value: "surakarta_kota", label: "Kota Surakarta (Solo) - Jawa Tengah" },
  { value: "magelang_kota", label: "Kota Magelang - Jawa Tengah" },
  { value: "magelang_kab", label: "Kabupaten Magelang - Jawa Tengah" },
  { value: "pekalongan_kota", label: "Kota Pekalongan - Jawa Tengah" },
  { value: "pekalongan_kab", label: "Kabupaten Pekalongan - Jawa Tengah" },
  { value: "tegal_kota", label: "Kota Tegal - Jawa Tengah" },
  { value: "tegal_kab", label: "Kabupaten Tegal - Jawa Tengah" },
  // DI Yogyakarta
  { value: "yogyakarta_kota", label: "Kota Yogyakarta - DI Yogyakarta" },
  { value: "sleman_kab", label: "Kabupaten Sleman - DI Yogyakarta" },
  { value: "bantul_kab", label: "Kabupaten Bantul - DI Yogyakarta" },
  { value: "kulon_progo_kab", label: "Kabupaten Kulon Progo - DI Yogyakarta" },
  { value: "gunungkidul_kab", label: "Kabupaten Gunungkidul - DI Yogyakarta" },
  // Jawa Timur
  { value: "surabaya_kota", label: "Kota Surabaya - Jawa Timur" },
  { value: "malang_kota", label: "Kota Malang - Jawa Timur" },
  { value: "malang_kab", label: "Kabupaten Malang - Jawa Timur" },
  { value: "batu_kota", label: "Kota Batu - Jawa Timur" },
  { value: "kediri_kota", label: "Kota Kediri - Jawa Timur" },
  { value: "kediri_kab", label: "Kabupaten Kediri - Jawa Timur" },
  { value: "sidoarjo_kab", label: "Kabupaten Sidoarjo - Jawa Timur" },
  // Banten
  { value: "tangerang_kota", label: "Kota Tangerang - Banten" },
  { value: "tangerang_selatan_kota", label: "Kota Tangerang Selatan - Banten" },
  { value: "tangerang_kab", label: "Kabupaten Tangerang - Banten" },
  { value: "serang_kota", label: "Kota Serang - Banten" },
  { value: "serang_kab", label: "Kabupaten Serang - Banten" },
  { value: "cilegon_kota", label: "Kota Cilegon - Banten" },
  // Bali
  { value: "denpasar_kota", label: "Kota Denpasar - Bali" },
  { value: "badung_kab", label: "Kabupaten Badung - Bali" },
  // Sumatera Utara
  { value: "medan_kota", label: "Kota Medan - Sumatera Utara" },
  // Sumatera Selatan
  { value: "palembang_kota", label: "Kota Palembang - Sumatera Selatan" },
  // Riau
  { value: "pekanbaru_kota", label: "Kota Pekanbaru - Riau" },
  // Kalimantan Timur
  { value: "samarinda_kota", label: "Kota Samarinda - Kalimantan Timur" },
  { value: "balikpapan_kota", label: "Kota Balikpapan - Kalimantan Timur" },
  // Sulawesi Selatan
  { value: "makassar_kota", label: "Kota Makassar - Sulawesi Selatan" },
  // Add more cities/regencies and provinces as needed
];

// --- Default Application Fields Configuration ---
// Define the fields with their types for candidate rendering
const defaultAppFields: JobApplicationFieldConfig[] = [
  {
    key: "photo_profile",
    validation: { required: true },
    isShown: true,
    label: "Photo profile",
    order: 1,
    type: "file",
  },
  {
    key: "full_name",
    validation: { required: true },
    isShown: true,
    label: "Full name",
    order: 2,
    type: "text",
  },
  {
    key: "date_of_birth",
    validation: { required: false },
    isShown: true,
    label: "Date of birth",
    order: 3,
    type: "date",
  },
  {
    key: "gender",
    validation: { required: true },
    isShown: true,
    label: "Gender",
    order: 4,
    type: "radio", // Example: Use radio buttons
    options: [
      // Provide options for radio/dropdown
      { value: "Male", label: "Male" },
      { value: "Female", label: "Female" },
      { value: "Other", label: "Other" },
      { value: "Prefer not to say", label: "Prefer not to say" },
    ],
  },
  {
    key: "domicile",
    validation: { required: false },
    isShown: true,
    label: "Domicile",
    order: 5,
    type: "dropdown", // Use dropdown
    options: domicileOptions, // Use the expanded options
    placeholder: "Select your domicile",
  },
  {
    key: "phone_number",
    validation: { required: true },
    isShown: true,
    label: "Phone number",
    order: 6,
    type: "phone",
  },
  {
    key: "email",
    validation: { required: true },
    isShown: true,
    label: "Email",
    order: 7,
    type: "email",
  },
  {
    key: "linkedin_link",
    validation: { required: true },
    isShown: true,
    label: "Linkedin link",
    order: 8,
    type: "url",
    placeholder: "https://linkedin.com/in/...",
  },
  // Add other potential fields here, maybe initially hidden?
  // { key: "resume", validation: { required: true }, isShown: false, label: "Resume/CV", order: 9, type: "file" },
  // { key: "cover_letter", validation: { required: false }, isShown: false, label: "Cover Letter", order: 10, type: "textarea" },
];

// --- Default Application Configuration (For the posting form's default) ---
const initialDefaultAppConfig: JobSpecificApplicationConfiguration = {
  sections: [
    {
      title: "Minimum Profile Information Required",
      fields: defaultAppFields, // Use the array defined above
    },
    // Add more sections like "Experience", "Education" if needed
  ],
};

// --- Job List (Example - Ensure fields match updated Job type) ---
export const jobList: { data: Job[] } = {
  data: [
    {
      id: "job_20251029_0001", // Example ID
      slug: "frontend-developer-example",
      title: "Frontend Developer Example",
      jobType: "Full-time",
      description: "Example job description...",
      candidatesNeeded: 1,
      status: "active",
      salary_range: {
        min: 7000000,
        max: 8000000,
        currency: "IDR",
        display_text: "Rp7.000.000 - Rp8.000.000",
      },
      list_card: {
        badge: "Active",
        started_on_text: "Posted on Oct 29, 2025",
        cta: "Manage Job",
      },
      // IMPORTANT: Include the specific application config for this seeded job
      applicationConfiguration: initialDefaultAppConfig, // Use the default for this example
    },
  ],
};

// --- Initial Job Posting Configuration (Updated) ---
export const initialJobPostingConfig: Omit<
  JobPostingConfiguration,
  "id" | "configType"
> = {
  fields: [
    {
      key: "title",
      label: "Job name",
      type: "text",
      required: true,
      placeholder: "e.g., Senior Frontend Engineer",
    },
    {
      key: "jobType",
      label: "Job type",
      type: "select",
      required: true,
      options: [
        { value: "Full-time", label: "Full-time" },
        { value: "Part-time", label: "Part-time" },
        { value: "Contract", label: "Contract" },
        { value: "Internship", label: "Internship" },
      ],
    },
    {
      key: "description",
      label: "Job description",
      type: "textarea",
      required: true,
      placeholder: "Describe the role...",
    },
    {
      key: "candidatesNeeded",
      label: "Number of candidates needed",
      type: "number",
      required: false,
      placeholder: "e.g., 1",
    },
    {
      key: "salaryMin",
      label: "Job salary minimum (IDR)",
      type: "number",
      required: false,
      placeholder: "e.g., 7000000",
    }, // Changed type to number
    {
      key: "salaryMax",
      label: "Job salary maximum (IDR)",
      type: "number",
      required: false,
      placeholder: "e.g., 9000000",
    }, // Changed type to number
    {
      key: "applicationConfig", // Key for the nested configuration
      label: "Job Application Configuration",
      type: "applicationConfigEditor", // Special type for the UI component
      required: true,
      defaultValue: initialDefaultAppConfig, // Provide the default structure
    },
    // General status field for draft/active/closed
    {
      key: "status",
      label: "Job Status",
      type: "select",
      required: true,
      options: [
        { value: "active", label: "Active" },
        { value: "draft", label: "Draft" },
        { value: "closed", label: "Closed" },
      ],
    },
  ],
};

// --- Candidate List (Remains the same) ---
export const candidateList: { data: Candidate[] } = {
  data: [
    {
      id: uuidv4(),
      attributes: [
        {
          key: "full_name",
          label: "Full Name",
          value: "Nadia Putri",
          order: 1,
        },
        {
          key: "email",
          label: "Email",
          value: "nadia.putri@example.com",
          order: 2,
        },
        {
          key: "phone_number",
          label: "Phone",
          value: "+6281212345678",
          order: 3,
        },
        {
          key: "domicile",
          label: "Domicile",
          value: "Kota Jakarta Selatan - DKI Jakarta",
          order: 4,
        }, // Example using new label
        { key: "gender", label: "Gender", value: "Female", order: 5 },
        {
          key: "linkedin_link",
          label: "LinkedIn",
          value: "https://linkedin.com/in/nadiaputri",
          order: 6,
        },
        {
          key: "photo_profile",
          label: "Photo Profile URL",
          value: null,
          order: 7,
        },
        { key: "date_of_birth", label: "Date of Birth", value: null, order: 8 },
      ],
    },
    {
      id: uuidv4(),
      attributes: [
        {
          key: "full_name",
          label: "Full Name",
          value: "Budi Santoso",
          order: 1,
        },
        { key: "email", label: "Email", value: "budi.s@example.com", order: 2 },
        {
          key: "phone_number",
          label: "Phone",
          value: "+6285678901234",
          order: 3,
        },
        {
          key: "domicile",
          label: "Domicile",
          value: "Kota Bandung - Jawa Barat",
          order: 4,
        }, // Example using new label
        { key: "gender", label: "Gender", value: "Male", order: 5 },
        {
          key: "linkedin_link",
          label: "LinkedIn",
          value: "https://linkedin.com/in/budisantoso",
          order: 6,
        },
        {
          key: "photo_profile",
          label: "Photo Profile URL",
          value: "https://example.com/budi.jpg",
          order: 7,
        },
        {
          key: "date_of_birth",
          label: "Date of Birth",
          value: "1995-03-10",
          order: 8,
        },
      ],
    },
  ],
};
