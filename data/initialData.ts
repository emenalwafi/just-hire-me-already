import {
  Job,
  JobApplicationConfiguration,
  JobPostingConfiguration,
  Candidate,
} from "@/types/dbTypes";
import { v4 as uuidv4 } from "uuid"; // Import uuid

/**
 * Sample data structure containing a list of job postings.
 * Conforms to the shape `{ data: Job[] }`.
 * Used for demonstrating or testing components that display job lists.
 * @type {{ data: Job[] }}
 */
export const jobList: { data: Job[] } = {
  data: [
    {
      id: "job_20251001_0001",
      slug: "frontend-developer",
      title: "Frontend Developer",
      status: "active",
      salary_range: {
        min: 7000000,
        max: 8000000,
        currency: "IDR",
        display_text: "Rp7.000.000 - Rp8.000.000",
      },
      list_card: {
        badge: "Active",
        started_on_text: "started on 1 Oct 2025",
        cta: "Manage Job",
      },
    },
  ],
};

/**
 * Sample configuration object for a job's application form.
 * Defines the sections and fields required for a job application, including validation rules.
 * Conforms to the `JobApplicationConfiguration` interface.
 * @type {JobApplicationConfiguration}
 */
// Ensure this matches the updated interface structure
export const jobConfiguration: Omit<
  JobApplicationConfiguration,
  "id" | "configType"
> = {
  application_form: {
    sections: [
      {
        title: "Minimum Profile Information Required",
        fields: [
          { key: "full_name", validation: { required: true } },
          { key: "photo_profile", validation: { required: true } },
          { key: "gender", validation: { required: true } },
          { key: "domicile", validation: { required: false } },
          { key: "email", validation: { required: true } },
          { key: "phone_number", validation: { required: true } },
          { key: "linkedin_link", validation: { required: true } },
          { key: "date_of_birth", validation: { required: false } },
        ],
      },
    ],
  },
};

/**
 * Sample configuration object for the form used to post jobs.
 * Conforms to the `JobPostingConfiguration` interface.
 * @type {JobPostingConfiguration}
 */
// Ensure this matches the new interface structure
export const initialJobPostingConfig: Omit<
  JobPostingConfiguration,
  "id" | "configType"
> = {
  fields: [
    {
      key: "title",
      label: "Job Title",
      type: "text",
      required: true,
      placeholder: "e.g., Senior Frontend Engineer",
    },
    {
      key: "description",
      label: "Job Description",
      type: "textarea",
      required: true,
      placeholder: "Describe the role and responsibilities...",
    },
    {
      key: "salaryMin",
      label: "Minimum Salary (IDR)",
      type: "number",
      required: false,
      placeholder: "e.g., 7000000",
    },
    {
      key: "salaryMax",
      label: "Maximum Salary (IDR)",
      type: "number",
      required: false,
      placeholder: "e.g., 9000000",
    },
    {
      key: "location",
      label: "Location",
      type: "text",
      required: false,
      placeholder: "e.g., Jakarta, Remote",
    },
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

/**
 * Sample data structure containing a list of job candidates.
 * Each candidate has an ID and a list of attributes (key-value pairs with labels and order).
 * Conforms to the shape `{ data: Candidate[] }`.
 * Used for demonstrating or testing components that display candidate information.
 * @type {{ data: Candidate[] }}
 */
export const candidateList: { data: Candidate[] } = {
  data: [
    {
      // id: "cand_20251008_0001", // Using UUID now
      id: uuidv4(), // Generate UUID for candidate ID
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
          value: "+62 812-1234-5678",
          order: 3,
        },
        { key: "domicile", label: "Domicile", value: "Jakarta", order: 4 },
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
        {
          key: "email",
          label: "Email",
          value: "budi.s@example.com",
          order: 2,
        },
        {
          key: "phone_number",
          label: "Phone",
          value: "+62 856-7890-1234",
          order: 3,
        },
        { key: "domicile", label: "Domicile", value: "Bandung", order: 4 },
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
