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
 * Defines the structure and validation rules for a single field
 * within a specific job's application form configuration.
 * (Updated based on user input, now includes input type)
 */
export interface JobApplicationFieldConfig {
  /** The unique key or identifier for this field (e.g., "fullName", "resumeFile"). */
  key: string;
  /** Validation rules for the field. */
  validation: {
    /** Whether this field is mandatory. */
    required: boolean;
  };
  isShown: boolean; // Whether to display this field in the application form
  label: string; // Label shown to the candidate
  order: number; // Display order in the form section
  // Add input type to guide rendering the application form
  type?: // Standard HTML input types + custom ones
  | "text"
    | "email"
    | "url"
    | "password" // (Less common for applications)
    | "number"
    | "search" // (Less common for applications)
    | "textarea"
    | "radio" // Requires options in config? Or predefined?
    | "dropdown" // Requires options in config? Or predefined?
    | "date"
    | "phone"
    | "file"; // For resume/photo uploads
  // Optional: Add options if type is radio/dropdown
  options?: { value: string; label: string }[];
  placeholder?: string; // Optional placeholder for the input
}

/**
 * Represents a section within a job application form configuration,
 * containing a title and a list of fields.
 * (Fields now use updated JobApplicationFieldConfig)
 */
export interface JobApplicationSection {
  /** The title displayed for this section of the form (e.g., "Personal Information", "Work Experience"). */
  title: string;
  /** An array of fields included in this section. */
  fields: JobApplicationFieldConfig[];
}

/**
 * Represents the configuration for a *specific job's* application form.
 * This structure will be *stored within the Job object itself*.
 */
export interface JobSpecificApplicationConfiguration {
  sections: JobApplicationSection[];
}

// --- Job Posting Configuration (Admin Form Definition) ---

/**
 * Represents the configuration for a field when an admin is *posting* a job.
 * (Includes type for the nested config editor)
 */
export interface JobPostingFieldConfig {
  key: string; // e.g., 'title', 'jobType', 'applicationConfig'
  label: string;
  // Added 'applicationConfigEditor' type
  type:
    | "text"
    | "textarea"
    | "number"
    | "currency" // Could be treated as number with specific formatting/validation
    | "select"
    | "applicationConfigEditor"; // Special type for the nested config
  required: boolean;
  options?: { value: string; label: string }[]; // For select types
  placeholder?: string;
  // Default value for application config editor
  defaultValue?: JobSpecificApplicationConfiguration;
  [key: string]: unknown;
}

/**
 * Represents the configuration for the form used by admins to *post* a new job.
 * Stored in IndexedDB under 'jobConfiguration' with id 'postingConfig'.
 */
export interface JobPostingConfiguration {
  id: "postingConfig";
  configType: "posting";
  fields: JobPostingFieldConfig[];
}

// --- Job Object (Stores the outcome of the posting form) ---

/**
 * Represents a job posting.
 * (Includes necessary fields from the posting form
 * and the specific application configuration for this job)
 */
export interface Job {
  id: string; // Key path
  slug: string; // URL-friendly identifier
  title: string; // From posting form (Job name)
  jobType?: string; // From posting form
  description?: string; // From posting form
  candidatesNeeded?: number; // From posting form
  status: "active" | "draft" | "closed"; // Controlled via posting form/management
  salary_range: SalaryRange; // From posting form (min/max)
  list_card: ListCard; // Generated or set during creation/update
  // Store the specific application configuration *for this job*
  applicationConfiguration: JobSpecificApplicationConfiguration;
  // Optional: Add creation/update timestamps if needed
  createdAt?: string;
  updatedAt?: string;
}

// --- Candidate, User, Application (Keep as previously defined) ---

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
