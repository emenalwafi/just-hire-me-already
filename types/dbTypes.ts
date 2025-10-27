/**
 * Represents a salary range with currency information.
 */
export interface SalaryRange {
  /** The minimum salary amount. */
  min: number;
  /** The maximum salary amount. */
  max: number;
  /** The currency code (e.g., "USD", "IDR"). */
  currency: string;
  /** A pre-formatted string representation of the salary range (e.g., "$50k - $70k"). */
  display_text: string;
}

/**
 * Represents metadata for displaying a job listing in a card format.
 */
export interface ListCard {
  /** Text for a badge or tag associated with the listing (e.g., "New", "Remote"). */
  badge: string;
  /** Text describing when the job was posted or started (e.g., "Posted 2 days ago"). */
  started_on_text: string;
  /** Text for the call-to-action button (e.g., "Apply Now"). */
  cta: string;
}

/**
 * Represents a job posting.
 */
export interface Job {
  /** Unique identifier for the job posting. */
  id: string; // Will be the key
  /** URL-friendly identifier for the job posting. */
  slug: string;
  /** The title of the job. */
  title: string;
  /** The current status of the job posting (e.g., "open", "closed", "draft"). */
  status: string;
  /** The salary range offered for the job. */
  salary_range: SalaryRange;
  /** Metadata for displaying the job in a list card format. */
  list_card: ListCard;
}

/**
 * Defines the structure and validation rules for a single field
 * within a job application form configuration.
 */
export interface JobApplicationFieldConfig {
  /** The unique key or identifier for this field (e.g., "fullName", "resumeFile"). */
  key: string;
  /** Validation rules for the field. */
  validation: {
    /** Whether this field is mandatory. */
    required: boolean;
  };
}

/**
 * Represents a section within a job application form configuration,
 * containing a title and a list of fields.
 */
export interface JobApplicationSection {
  /** The title displayed for this section of the form (e.g., "Personal Information", "Work Experience"). */
  title: string;
  /** An array of fields included in this section. */
  fields: JobApplicationFieldConfig[];
}

/**
 * Represents the configuration for a job's **application** form.
 */
export interface JobApplicationConfiguration {
  /** Unique identifier for this configuration document (use fixed key "applicationConfig"). */
  id: "applicationConfig";
  /** Type identifier for distinguishing configuration types. */
  configType: "application";
  /** Configuration details for the job's application form. */
  application_form: {
    /** An array of sections that make up the application form. */
    sections: JobApplicationSection[];
  };
}

/**
 * Represents the configuration for a field when an admin is **posting** a job.
 */
export interface JobPostingFieldConfig {
  key: string; // e.g., 'title', 'description', 'salaryMin', 'salaryMax', 'location'
  label: string; // e.g., 'Job Title', 'Job Description'
  type: "text" | "textarea" | "number" | "currency" | "select"; // Input type hint
  required: boolean;
  options?: { value: string; label: string }[]; // For select types
  placeholder?: string;
  // Add other relevant properties like validation rules, order etc.
}

/**
 * Represents the configuration for the form used by admins to **post** a new job.
 */
export interface JobPostingConfiguration {
  /** Unique identifier for this configuration document (use fixed key "postingConfig"). */
  id: "postingConfig";
  /** Type identifier for distinguishing configuration types. */
  configType: "posting";
  /** An array defining the fields in the job posting form. */
  fields: JobPostingFieldConfig[];
}

/**
 * Represents a single attribute or piece of information about a candidate.
 */
export interface CandidateAttribute {
  /** The unique key identifying the attribute (e.g., "email", "yearsExperience"). */
  key: string;
  /** The user-friendly label for the attribute (e.g., "Email Address", "Years of Experience"). */
  label: string;
  /** The value of the attribute, which can be a string, number, boolean, or null. */
  value: string | number | boolean | null;
  /** The display order or position of this attribute. */
  order: number;
}

/**
 * Represents a job candidate profile.
 */
export interface Candidate {
  /** Unique identifier for the candidate profile. */
  id: string; // Will be the key
  /** An array of attributes associated with the candidate. */
  attributes: CandidateAttribute[];
}

/**
 * Represents a user account in the system.
 */
export interface User {
  /** Unique user ID (e.g., generated UUID). */
  id: string; // Will be the key path
  /** Login email (must be unique). */
  email: string; // Indexed
  /** User's display name. */
  name: string;
  /** Store hashed passwords, NEVER plain text. Optional depending on auth strategy. */
  hashedPassword?: string;
  /** User role determining permissions. */
  role: "admin" | "candidate";
  /** Links to the ID in the 'candidates' store if role is 'candidate'. */
  candidateProfileId?: string;
}

/**
 * Represents the link between a Candidate and a Job, signifying an application.
 */
export interface Application {
  /** Unique identifier for the application instance. */
  id: string; // Key path (consider generating UUIDs or using `${jobId}_${candidateId}`)
  /** ID of the job being applied for. */
  jobId: string; // Indexed
  /** ID of the candidate profile applying. */
  candidateId: string; // Indexed
  /** Date the application was submitted (ISO string or Date). */
  applicationDate: string;
  /** Current status of the application within the hiring process. */
  status:
    | "applied"
    | "screening"
    | "interview"
    | "offer"
    | "hired"
    | "rejected";
}
