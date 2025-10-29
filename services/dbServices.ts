import { openDB, DBSchema, IDBPDatabase } from "idb";
import {
  Job,
  // Removed JobApplicationConfiguration (it's now part of Job)
  JobPostingConfiguration,
  JobSpecificApplicationConfiguration, // Added this specific type
  Candidate,
  User,
  Application,
} from "@/types/dbTypes";
import {
  jobList,
  // Removed initialAppConfig (no longer separate)
  initialJobPostingConfig, // Use the correct initial data
  candidateList,
} from "@/data/initialData";
import { v4 as uuidv4 } from "uuid"; // Import uuid for generating unique IDs

/** The name of the IndexedDB database. */
const DB_NAME = "JobAppData";
/** The current version of the IndexedDB database schema. Increment version for schema changes. */
const DB_VERSION = 3; // <<<< Incremented version for schema change
/** Login link token validity duration in milliseconds (30 minutes). */
const LOGIN_TOKEN_VALIDITY_MS = 30 * 60 * 1000;
/** Key prefix for storing login tokens in sessionStorage. */
const LOGIN_TOKEN_PREFIX = "loginToken_";

/**
 * Defines the schema structure for the Job Application IndexedDB database.
 * Uses `idb`'s `DBSchema` interface for type safety.
 * (Updated jobConfiguration store)
 */
interface JobAppDB extends DBSchema {
  /** Object store for job postings. Includes application config now. */
  jobs: {
    key: string;
    value: Job;
    indexes: {
      "by-slug": string;
    };
  };
  /** Object store for job configurations (now only posting form config). */
  jobConfiguration: {
    /** The key type (fixed string 'postingConfig'). */
    key: string; // <<< Only postingConfig
    /** The value type (only Posting configuration). */
    value: JobPostingConfiguration; // <<< Only postingConfig
  };
  /** Object store for candidate profiles. */
  candidates: {
    key: string;
    value: Candidate;
  };
  /** Object store for user accounts. */
  users: {
    key: string;
    value: User;
    indexes: {
      /** Index for querying users by their email (unique). */
      "by-email": string;
    };
  };
  /** Object store for job applications (linking candidates to jobs). */
  applications: {
    key: string;
    value: Application;
    indexes: {
      /** Index for querying applications by job ID. */
      "by-jobId": string;
      /** Index for querying applications by candidate ID. */
      "by-candidateId": string;
    };
  };
}

/**
 * Initializes and opens the IndexedDB database.
 * Handles database upgrades and creation of object stores and indexes.
 * @returns {Promise<IDBPDatabase<JobAppDB>>} A promise that resolves with the opened database instance.
 */
async function initDB(): Promise<IDBPDatabase<JobAppDB>> {
  const db = await openDB<JobAppDB>(DB_NAME, DB_VERSION, {
    /**
     * Called only when the database version changes or the database is first created.
     * Use this function to define the database schema (object stores and indexes).
     */
    upgrade(db, oldVersion, newVersion, transaction) {
      console.log(`Upgrading DB from version ${oldVersion} to ${newVersion}`);

      // Create stores if they don't exist (relevant for initial creation)
      if (!db.objectStoreNames.contains("jobs")) {
        const jobStore = db.createObjectStore("jobs", { keyPath: "id" });
        jobStore.createIndex("by-slug", "slug");
        console.log("Created 'jobs' object store with 'by-slug' index.");
      }

      if (!db.objectStoreNames.contains("jobConfiguration")) {
        // Just create the store, no indexes needed for a single config item
        db.createObjectStore("jobConfiguration");
        console.log("Created 'jobConfiguration' object store.");
      }

      if (!db.objectStoreNames.contains("candidates")) {
        db.createObjectStore("candidates", { keyPath: "id" });
        console.log("Created 'candidates' object store.");
      }

      if (!db.objectStoreNames.contains("users")) {
        const userStore = db.createObjectStore("users", { keyPath: "id" });
        userStore.createIndex("by-email", "email", { unique: true });
        console.log("Created 'users' object store with 'by-email' index.");
      }

      if (!db.objectStoreNames.contains("applications")) {
        const applicationStore = db.createObjectStore("applications", {
          keyPath: "id",
        });
        applicationStore.createIndex("by-jobId", "jobId");
        applicationStore.createIndex("by-candidateId", "candidateId");
        console.log("Created 'applications' object store with indexes.");
      }

      // --- Migrations ---
      if (oldVersion < 2) {
        // Migration from v1 to v2: Rename 'mainConfig' to 'applicationConfig'
        console.log("Running migration logic for v1 to v2...");
        // This logic might need adjustment if run again, but kept for history
        const configStore = transaction.objectStore("jobConfiguration");
        configStore
          .get("mainConfig")
          .then((oldConfig) => {
            if (oldConfig && oldConfig.configType !== "posting") {
              // Avoid overwriting if postingConfig exists somehow
              console.log("Migrating old 'mainConfig' key...");
              // We'll delete this applicationConfig key in the next migration
              configStore.put(oldConfig as unknown as JobPostingConfiguration, "applicationConfig");
              configStore.delete("mainConfig");
              console.log(
                "Migration v1->v2 complete: 'mainConfig' -> 'applicationConfig'"
              );
            }
          })
          .catch((err) =>
            console.error("Error during v1->v2 config migration:", err)
          );
      }

      if (oldVersion < 3) {
        // Migration from v2 to v3: Remove 'applicationConfig', ensure 'postingConfig' structure
        console.log("Running migration logic for v2 to v3...");
        const configStore = transaction.objectStore("jobConfiguration");
        // Delete the old separate applicationConfig if it exists
        configStore
          .delete("applicationConfig")
          .then(() =>
            console.log("Removed old 'applicationConfig' key if present.")
          )
          .catch((err) =>
            console.error("Error removing 'applicationConfig':", err)
          );

        // Check if postingConfig exists and has the correct shape (optional enhancement)
        configStore
          .get("postingConfig")
          .then((existingPostingConfig) => {
            if (
              existingPostingConfig &&
              existingPostingConfig.configType !== "posting"
            ) {
              console.warn(
                "Existing 'postingConfig' has incorrect type. Overwriting with default."
              );
              // Force overwrite if structure is wrong - Seed logic will handle this better
              configStore.delete("postingConfig");
            } else if (existingPostingConfig) {
              console.log("'postingConfig' already exists and seems valid.");
            }
          })
          .catch((err) =>
            console.error("Error checking existing 'postingConfig':", err)
          );
      }

      console.log("DB Upgrade finished");
    },
  });
  return db;
}

/**
 * Adds a new job posting to the 'jobs' object store.
 * Ensures the job has a UUID if an ID is not provided.
 * @param {Job} job - The job object to add (now includes applicationConfiguration).
 * @returns {Promise<string>} A promise that resolves with the key (ID) of the added job.
 */
export async function addJob(job: Job): Promise<string> {
  const db = await initDB();
  if (!job.id) job.id = uuidv4(); // Generate ID if needed
  // Generate slug if needed (simple example, might need more robust slug generation)
  if (!job.slug)
    job.slug = job.title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  // Add creation timestamp example
  // job.createdAt = new Date().toISOString();
  // job.updatedAt = job.createdAt;
  console.log("Adding/Updating Job:", job);
  return db.put("jobs", job); // Use put instead of add to allow updates
}
/**
 * Retrieves all job postings from the 'jobs' object store.
 * @returns {Promise<Job[]>} A promise that resolves with an array of all job objects.
 */
export async function getAllJobs(): Promise<Job[]> {
  const db = await initDB();
  return db.getAll("jobs");
}
/**
 * Retrieves a specific job posting by its ID.
 * @param {string} id - The ID of the job to retrieve.
 * @returns {Promise<Job | undefined>} A promise resolving to the Job object or undefined if not found.
 */
export async function getJobById(id: string): Promise<Job | undefined> {
  const db = await initDB();
  return db.get("jobs", id);
}

// --- Removed saveJobApplicationConfiguration ---
// --- Removed getJobApplicationConfiguration ---

/**
 * Saves (adds or updates) the job posting configuration.
 * Uses the fixed key 'postingConfig'.
 * @param {JobPostingConfiguration} config - The posting configuration object.
 * @returns {Promise<"postingConfig">} A promise resolving to the key ('postingConfig').
 */
export async function saveJobPostingConfiguration(
  config: JobPostingConfiguration
): Promise<string> {
  const db = await initDB();
  // Ensure the ID and type are correct before saving
  const configToSave: JobPostingConfiguration = {
    ...config,
    id: "postingConfig",
    configType: "posting",
  };
  console.log("Saving Posting Configuration:", configToSave);
  return db.put("jobConfiguration", configToSave, "postingConfig");
}
/**
 * Retrieves the job posting configuration.
 * @returns {Promise<JobPostingConfiguration | undefined>} A promise resolving to the config object or undefined.
 */
export async function getJobPostingConfiguration(): Promise<
  JobPostingConfiguration | undefined
> {
  const db = await initDB();
  const config = await db.get("jobConfiguration", "postingConfig");
  // Basic validation
  if (
    config &&
    config.id === "postingConfig" &&
    config.configType === "posting"
  ) {
    return config;
  }
  if (config) {
    console.warn(
      "Retrieved configuration for 'postingConfig' has incorrect id/type:",
      config
    );
  }
  return undefined; // Return undefined if not found or invalid
}

/**
 * Adds a new candidate profile to the 'candidates' object store.
 * Generates a UUID if an ID is not provided.
 * @param {Candidate} candidate - The candidate object to add.
 * @returns {Promise<string>} A promise that resolves with the key (ID) of the added candidate.
 */
export async function addCandidate(candidate: Candidate): Promise<string> {
  const db = await initDB();
  if (!candidate.id) candidate.id = uuidv4();
  return db.add("candidates", candidate);
}
/**
 * Retrieves all candidate profiles from the 'candidates' object store.
 * @returns {Promise<Candidate[]>} A promise that resolves with an array of all candidate objects.
 */
export async function getAllCandidates(): Promise<Candidate[]> {
  const db = await initDB();
  return db.getAll("candidates");
}
/**
 * Retrieves a specific candidate profile by its ID.
 * @param {string} id - The ID of the candidate to retrieve.
 * @returns {Promise<Candidate | undefined>} A promise resolving to the Candidate object or undefined if not found.
 */
export async function getCandidateById(
  id: string
): Promise<Candidate | undefined> {
  const db = await initDB();
  return db.get("candidates", id);
}

// --- User and Application functions remain the same ---
// (addUser, getUserByEmail, getUserById, addApplication, getApplicationsForJob,
// getApplicationsForCandidate, getApplicationById, updateApplication)

/**
 * Adds a new user to the database. Assumes the password in the user object
 * has already been hashed using `hashPassword`. Handles potential unique email constraint errors.
 * Generates a UUID if an ID is not provided.
 * @param {User} user - The user object with a hashed password.
 * @returns {Promise<string>} The ID of the added user.
 * @throws {Error} If the email already exists or if the user object lacks a hashed password.
 */
export async function addUser(user: User): Promise<string> {
  const db = await initDB();
  if (!user.id) user.id = uuidv4();
  if (!user.hashedPassword) {
    console.error("Attempted to add user without a hashed password!");
    throw new Error("User password must be hashed before adding.");
  }
  try {
    return await db.add("users", user);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ConstraintError") {
      console.error(`Error adding user: Email "${user.email}" already exists.`);
      throw new Error(`Email "${user.email}" already exists.`);
    } else {
      console.error("Error adding user:", error);
      throw error;
    }
  }
}
/**
 * Retrieves a user by their email address using the 'by-email' index.
 * @param {string} email - The email address to search for.
 * @returns {Promise<User | undefined>} A promise resolving to the User object or undefined if not found.
 */
export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await initDB();
  return db.getFromIndex("users", "by-email", email);
}
/**
 * Retrieves a user by their ID.
 * @param {string} id - The ID of the user to retrieve.
 * @returns {Promise<User | undefined>} A promise resolving to the User object or undefined if not found.
 */
export async function getUserById(id: string): Promise<User | undefined> {
  const db = await initDB();
  return db.get("users", id);
}

/**
 * Adds a new job application to the 'applications' object store.
 * Generates a UUID if an ID is not provided and sets the application date.
 * @param {Application} application - The application object to add.
 * @returns {Promise<string>} A promise resolving to the ID of the added application.
 */
export async function addApplication(
  application: Application
): Promise<string> {
  const db = await initDB();
  if (!application.id) application.id = uuidv4();
  application.applicationDate = new Date().toISOString();
  return db.add("applications", application);
}
/**
 * Retrieves all applications associated with a specific job ID using the 'by-jobId' index.
 * @param {string} jobId - The ID of the job.
 * @returns {Promise<Application[]>} A promise resolving to an array of matching Application objects.
 */
export async function getApplicationsForJob(
  jobId: string
): Promise<Application[]> {
  const db = await initDB();
  return db.getAllFromIndex("applications", "by-jobId", jobId);
}
/**
 * Retrieves all applications associated with a specific candidate ID using the 'by-candidateId' index.
 * @param {string} candidateId - The ID of the candidate.
 * @returns {Promise<Application[]>} A promise resolving to an array of matching Application objects.
 */
export async function getApplicationsForCandidate(
  candidateId: string
): Promise<Application[]> {
  const db = await initDB();
  return db.getAllFromIndex("applications", "by-candidateId", candidateId);
}
/**
 * Retrieves a specific application by its ID.
 * @param {string} id - The ID of the application to retrieve.
 * @returns {Promise<Application | undefined>} A promise resolving to the Application object or undefined if not found.
 */
export async function getApplicationById(
  id: string
): Promise<Application | undefined> {
  const db = await initDB();
  return db.get("applications", id);
}
/**
 * Updates an existing application in the 'applications' object store.
 * Uses 'put' which will overwrite or add the record.
 * @param {Application} application - The application object with updated data. Must include the ID.
 * @returns {Promise<string>} A promise resolving to the ID of the updated application.
 */
export async function updateApplication(
  application: Application
): Promise<string> {
  const db = await initDB();
  return db.put("applications", application);
}

/**
 * Populates the IndexedDB database with initial data if stores are empty.
 * Uses a single transaction. Includes hashing for seeded user passwords.
 * (Updated seeding logic)
 * @returns {Promise<void>} A promise that resolves when seeding is complete or skipped, or rejects on error.
 */
export async function seedInitialData(): Promise<void> {
  console.log("Attempting to seed initial data...");
  const db = await initDB();
  const tx = db.transaction(
    ["jobs", "jobConfiguration", "candidates", "users", "applications"],
    "readwrite"
  );
  const stores = {
    jobs: tx.objectStore("jobs"),
    jobConfiguration: tx.objectStore("jobConfiguration"),
    candidates: tx.objectStore("candidates"),
    users: tx.objectStore("users"),
    applications: tx.objectStore("applications"),
  };

  try {
    // Seed Jobs (ensure they include applicationConfiguration)
    const jobCount = await stores.jobs.count();
    if (jobCount === 0 && jobList.data.length > 0) {
      console.log("Seeding JobList...");
      for (const job of jobList.data) {
        // Ensure required fields for the Job type are present
        const jobToSeed: Job = {
          id: job.id || uuidv4(),
          slug:
            job.slug ||
            job.title
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]/g, ""),
          title: job.title,
          jobType: job.jobType || "Full-time", // Add default if missing
          description: job.description || "No description provided.",
          candidatesNeeded: job.candidatesNeeded || 1,
          status: job.status || "active",
          salary_range: job.salary_range || {
            min: null,
            max: null,
            currency: "IDR",
            display_text: "Not specified",
          },
          list_card: job.list_card || {
            badge: "New",
            started_on_text: `Posted ${new Date().toLocaleDateString()}`,
            cta: "Details",
          },
          applicationConfiguration: job.applicationConfiguration, // This should come from initialData.ts
          // createdAt: new Date().toISOString(),
          // updatedAt: new Date().toISOString(),
        };
        await stores.jobs.add(jobToSeed);
      }
      console.log("JobList seeded.");
    } else {
      console.log(
        "JobList data exists or initial data is empty, skipping seed."
      );
    }

    // --- Removed Application Configuration Seeding ---

    // Seed Job Posting Configuration
    const postingConfig = await stores.jobConfiguration.get("postingConfig");
    if (!postingConfig && initialJobPostingConfig) {
      console.log("Seeding Job Posting Configuration...");
      const postingConfigToSave: JobPostingConfiguration = {
        ...initialJobPostingConfig, // Spread fields from initialData
        id: "postingConfig", // Set required properties
        configType: "posting",
      };
      await stores.jobConfiguration.put(postingConfigToSave, "postingConfig");
      console.log("Job Posting Configuration seeded.");
    } else if (postingConfig) {
      // Optional: Verify existing config structure here if needed
      console.log("Job Posting Configuration exists, skipping seed.");
    } else {
      console.log(
        "Initial Job Posting Configuration not provided, skipping seed."
      );
    }

    // Seed Candidates
    const candidateCount = await stores.candidates.count();
    if (candidateCount === 0 && candidateList.data.length > 0) {
      console.log("Seeding Candidate List...");
      for (const candidate of candidateList.data) {
        // Ensure ID is present (already done in initialData.ts using uuid)
        await stores.candidates.add(candidate);
      }
      console.log("Candidate List seeded.");
    } else {
      console.log(
        "Candidate List data exists or initial data is empty, skipping seed."
      );
    }

    // Seed Users (Admin and potentially linked Candidate)
    const userCount = await stores.users.count();
    if (userCount === 0) {
      console.log("Seeding Default Admin User...");
      const adminPasswordHash = await hashPassword("password"); // Example password
      const adminUser: User = {
        id: uuidv4(),
        email: "admin@example.com",
        name: "Admin User",
        hashedPassword: adminPasswordHash,
        role: "admin",
      };
      await stores.users.add(adminUser);
      console.log("Default Admin User seeded.");

      // Seed sample candidate user only if candidates were seeded
      if (candidateList.data.length > 0 && candidateList.data[0].id) {
        console.log(
          "Seeding Sample Candidate User (linked to first candidate)..."
        );
        const candidatePasswordHash = await hashPassword("password"); // Example password
        const candidateUser: User = {
          id: uuidv4(),
          // Use the email from the first sample candidate
          email:
            (candidateList.data[0].attributes.find(
              (attr) => attr.key === "email"
            )?.value as string) || "candidate@example.com",
          name:
            (candidateList.data[0].attributes.find(
              (attr) => attr.key === "full_name"
            )?.value as string) || "Sample Candidate",
          hashedPassword: candidatePasswordHash,
          role: "candidate",
          candidateProfileId: candidateList.data[0].id, // Link to the first candidate's ID
        };
        // Check if email already exists before adding (unlikely here, but good practice)
        try {
          await stores.users.add(candidateUser);
          console.log("Sample Candidate User seeded.");
        } catch (userAddError) {
          console.error("Failed to seed sample candidate user:", userAddError);
        }
      }
    } else {
      console.log("Users data exists, skipping seed.");
    }

    // Seed Sample Application (linking first job and first candidate)
    const appCount = await stores.applications.count();
    // Ensure both job and candidate lists have data before creating a link
    const firstJobId = jobList.data[0]?.id;
    const firstCandidateId = candidateList.data[0]?.id;

    if (appCount === 0 && firstJobId && firstCandidateId) {
      console.log("Seeding Sample Application...");
      const sampleApp: Application = {
        id: uuidv4(),
        jobId: firstJobId,
        candidateId: firstCandidateId,
        applicationDate: new Date().toISOString(),
        status: "applied", // Initial status
      };
      await stores.applications.add(sampleApp);
      console.log("Sample Application seeded.");
    } else if (appCount > 0) {
      console.log("Applications data exists, skipping seed.");
    } else {
      console.log(
        "Prerequisites for seeding sample application missing (no jobs or candidates in initial data), skipping seed."
      );
    }

    await tx.done;
    console.log("Seeding transaction complete.");
  } catch (error) {
    console.error("Error during seeding transaction:", error);
    try {
      // Attempt to abort the transaction on error
      tx.abort();
      console.log("Seeding transaction aborted due to error.");
    } catch (abortError) {
      console.error("Error aborting seeding transaction:", abortError);
    }
  }
}

// --- Auth functions remain the same ---
// (loginUser, registerUser, requestLoginLink, verifyLoginToken, hashPassword, verifyPassword)

/**
 * Attempts to log in a user with email and password. Verifies the password against the stored hash.
 * @param {string} email - The user's email.
 * @param {string} plainPassword - The user's plain text password.
 * @returns {Promise<Omit<User, "hashedPassword">>} The User object (excluding the hashedPassword) if login is successful.
 * @throws {Error} If email is not found, password does not match, or the user account is improperly configured.
 */
export async function loginUser(
  email: string,
  plainPassword: string
): Promise<Omit<User, "hashedPassword">> {
  const user = await getUserByEmail(email);

  if (!user) {
    console.warn(`Login failed: Email "${email}" not found.`);
    throw new Error(
      "Email ini belum terdaftar sebagai akun di Rakamin Academy."
    );
  }

  if (!user.hashedPassword) {
    console.error(`Login failed: User "${email}" has no password set.`);
    throw new Error("Invalid email or password.");
  }

  const isPasswordCorrect = await verifyPassword(
    plainPassword,
    user.hashedPassword
  );

  if (!isPasswordCorrect) {
    console.warn(`Login failed: Incorrect password for email "${email}".`);
    throw new Error("Invalid email or password.");
  }

  console.log(`Login successful for user: ${user.email}`);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hashedPassword: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Registers a new user. Hashes the password before adding to the database.
 * Checks for existing email addresses.
 * @param {Omit<User, "id" | "hashedPassword"> & { plainPassword: string }} userData - Object containing name, email, plainPassword, role, and optional candidateProfileId.
 * @returns {Promise<Omit<User, "hashedPassword">>} The newly created User object (without the hashed password).
 * @throws {Error} If the email already exists, hashing fails, or database add fails.
 */
export async function registerUser(
  userData: Omit<User, "id" | "hashedPassword"> & { plainPassword: string }
): Promise<Omit<User, "hashedPassword">> {
  const { email, plainPassword, name, role, candidateProfileId } = userData;

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error(`Email "${email}" is already registered.`);
  }

  const hashedPassword = await hashPassword(plainPassword);

  const newUser: User = {
    id: uuidv4(),
    email,
    name,
    hashedPassword,
    role,
    candidateProfileId: role === "candidate" ? candidateProfileId : undefined,
  };

  await addUser(newUser);

  console.log(`Registration successful for user: ${newUser.email}`);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hashedPassword: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

/**
 * Simulates requesting a login link. Checks if the user exists.
 * In a real app, this would generate a token and trigger an email.
 * @param email The email address to send the link to.
 * @returns The token generated for the login link.
 * @throws Error if the email is not found or session storage is unavailable.
 */
export async function requestLoginLink(email: string): Promise<string> {
  if (typeof window === "undefined" || typeof sessionStorage === "undefined") {
    throw new Error("Session storage is not available.");
  }

  const user = await getUserByEmail(email);

  if (!user) {
    console.warn(`Login link request failed: Email "${email}" not found.`);
    throw new Error(
      "Email ini belum terdaftar sebagai akun di Rakamin Academy."
    );
  }

  const token = uuidv4();
  const expiresAt = Date.now() + LOGIN_TOKEN_VALIDITY_MS;

  try {
    const tokenData = JSON.stringify({ userId: user.id, expiresAt });
    sessionStorage.setItem(`${LOGIN_TOKEN_PREFIX}${token}`, tokenData);
    console.log(
      `SIMULATING sending login link for user: ${user.email}. Token: ${token}`
    );
    // In a real app, you would send an email containing a link like:
    // https://yourapp.com/login?verify=${token}
    return token;
  } catch (error) {
    console.error("Error storing login token in sessionStorage:", error);
    throw new Error("Failed to prepare login link.");
  }
}

/**
 * Verifies a login token stored in sessionStorage.
 * Checks for existence, expiry, and removes the token if valid.
 * Fetches the user associated with the token if valid.
 * @param token The login token from the URL.
 * @returns The User object (without hash) if valid, null otherwise.
 */
export async function verifyLoginToken(
  token: string
): Promise<Omit<User, "hashedPassword"> | null> {
  if (typeof window === "undefined" || typeof sessionStorage === "undefined") {
    console.error("Cannot verify token: Session storage not available.");
    return null;
  }

  const storageKey = `${LOGIN_TOKEN_PREFIX}${token}`;
  const tokenDataString = sessionStorage.getItem(storageKey);

  // Remove the token after attempting to retrieve it, regardless of validity
  sessionStorage.removeItem(storageKey);

  if (!tokenDataString) {
    console.warn("Token verification failed: Token not found in storage.");
    return null;
  }

  try {
    const tokenData = JSON.parse(tokenDataString);
    if (!tokenData.userId || !tokenData.expiresAt) {
      console.warn("Token verification failed: Invalid token data format.");
      return null;
    }

    if (Date.now() >= tokenData.expiresAt) {
      console.warn("Token verification failed: Token expired.");
      return null; // Consider throwing specific error for expired token if needed
    }

    // Token is valid and not expired, fetch the user
    const user = await getUserById(tokenData.userId);
    if (!user) {
      console.error(
        "Token verification failed: User associated with token not found."
      );
      return null;
    }

    console.log(`Token verification successful for user: ${user.email}`);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { hashedPassword, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error("Error during token verification:", error);
    return null; // Return null on parsing errors or other exceptions
  }
}

/**
 * Converts an ArrayBuffer to a hexadecimal string.
 * @param {ArrayBuffer} buffer - The ArrayBuffer to convert.
 * @returns {string} A hexadecimal string representation.
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.prototype.map
    .call(new Uint8Array(buffer), (x) => ("00" + x.toString(16)).slice(-2))
    .join("");
}

/**
 * Hashes a password using SHA-256 via the Web Crypto API.
 * NOTE: This is basic hashing without salting or key stretching. Not suitable for production security.
 * @param {string} password - The plain text password.
 * @returns {Promise<string>} A promise resolving to the SHA-256 hash as a hex string.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle?.digest("SHA-256", data);
  const hashHex = bufferToHex(hashBuffer);
  // console.log(`Hashing password "${password}" to ${hashHex.substring(0, 10)}...`); // Optional logging
  return hashHex;
}

/**
 * Verifies a plain text password against a stored SHA-256 hash.
 * @param {string} plainPassword - The password entered by the user.
 * @param {string} storedHash - The hash retrieved from the database.
 * @returns {Promise<boolean>} A promise resolving to true if the password matches the hash, false otherwise.
 */
export async function verifyPassword(
  plainPassword: string,
  storedHash: string
): Promise<boolean> {
  if (!storedHash) return false; // Cannot verify if no hash is stored
  const hashOfInput = await hashPassword(plainPassword);
  return hashOfInput === storedHash;
}
