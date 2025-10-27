import { Job, JobConfiguration, Candidate } from "@/types/dbTypes";

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
 * Conforms to the `JobConfiguration` interface.
 * @type {JobConfiguration}
 */
export const jobConfiguration: JobConfiguration = {
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
 * Sample data structure containing a list of job candidates.
 * Each candidate has an ID and a list of attributes (key-value pairs with labels and order).
 * Conforms to the shape `{ data: Candidate[] }`.
 * Used for demonstrating or testing components that display candidate information.
 * @type {{ data: Candidate[] }}
 */
export const candidateList: { data: Candidate[] } = {
  data: [
    {
      id: "cand_20251008_0001",
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
        { key: "phone", label: "Phone", value: "+62 812-1234-5678", order: 3 },
        { key: "domicile", label: "Domicile", value: "Jakarta", order: 4 },
        { key: "gender", label: "Gender", value: "Female", order: 5 },
        {
          key: "linkedin_link",
          label: "LinkedIn",
          value: "https://linkedin.com/in/nadiaputri",
          order: 6,
        },
      ],
    },
  ],
};
