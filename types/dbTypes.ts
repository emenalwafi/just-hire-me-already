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
export interface JobConfigurationField {
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
export interface JobConfigurationSection {
  /** The title displayed for this section of the form (e.g., "Personal Information", "Work Experience"). */
  title: string;
  /** An array of fields included in this section. */
  fields: JobConfigurationField[];
}

/**
 * Represents the overall configuration for a job, specifically
 * defining the structure of its application form.
 */
export interface JobConfiguration {
  /** Optional unique identifier for this configuration document. */
  id?: string; // Add an ID for the key, e.g., 'mainConfig'
  /** Configuration details for the job's application form. */
  application_form: {
    /** An array of sections that make up the application form. */
    sections: JobConfigurationSection[];
  };
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
 * Represents a job candidate.
 */
export interface Candidate {
  /** Unique identifier for the candidate. */
  id: string; // Will be the key
  /** An array of attributes associated with the candidate. */
  attributes: CandidateAttribute[];
}