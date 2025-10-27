import { openDB, DBSchema, IDBPDatabase, IDBPTransaction } from "idb";
import {
  Job,
  JobApplicationConfiguration, // Updated type
  JobPostingConfiguration, // New type
  Candidate,
  User, // New type
  Application, // New type
} from "@/types/dbTypes";
import {
  jobList,
  jobConfiguration as initialAppConfig, // Rename imported variable
  candidateList,
  initialJobPostingConfig, // Import the new initial posting config
} from "@/data/initialData";
import { v4 as uuidv4 } from "uuid"; // Import uuid for generating unique IDs

/** The name of the IndexedDB database. */
const DB_NAME = "JobAppData";
/** The current version of the IndexedDB database schema. Increment version for schema changes. */
const DB_VERSION = 2; // Incremented version

/**
 * Defines the schema structure for the Job Application IndexedDB database.
 * Uses `idb`'s `DBSchema` interface for type safety.
 */
interface JobAppDB extends DBSchema {
  /** Object store for job postings. */
  jobs: {
    key: string;
    value: Job;
    indexes: {
      "by-slug": string;
    };
  };
  /** Object store for job configurations (application form and posting form). */
  jobConfiguration: {
    /** The key type (using fixed strings like 'applicationConfig', 'postingConfig'). */
    key: string;
    /** The value type (either Application or Posting configuration). */
    value: JobApplicationConfiguration | JobPostingConfiguration;
    // No indexes needed if fetching by known fixed keys
  };
  /** Object store for candidate profiles. */
  candidates: {
    key: string;
    value: Candidate;
  };
  /** Object store for user accounts. */
  users: {
    key: string; // User ID
    value: User;
    indexes: {
      /** Index for querying users by their email (unique). */
      "by-email": string;
    };
  };
  /** Object store for job applications (linking candidates to jobs). */
  applications: {
    key: string; // Application ID
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
     * @param {IDBPDatabase<JobAppDB>} db - The database instance during upgrade.
     * @param {number} oldVersion - The previous version number (0 if creating).
     * @param {number | null} newVersion - The new version number being upgraded to.
     * @param {IDBPTransaction<JobAppDB, ("jobs" | "jobConfiguration" | "candidates" | "users" | "applications")[], "versionchange">} transaction - The upgrade transaction.
     * @param {IDBPVersionChangeEvent} event - The version change event.
     */
    upgrade(db, oldVersion, newVersion, transaction, event) {
      console.log(`Upgrading DB from version ${oldVersion} to ${newVersion}`);

      // --- Create/Update Object Stores ---

      // Jobs (already exists, but good practice to keep the check)
      if (!db.objectStoreNames.contains("jobs")) {
        const jobStore = db.createObjectStore("jobs", { keyPath: "id" });
        jobStore.createIndex("by-slug", "slug");
        console.log("Created 'jobs' object store with 'by-slug' index.");
      }

      // Job Configuration (already exists, structure is flexible enough)
      if (!db.objectStoreNames.contains("jobConfiguration")) {
        // No keyPath, we use explicit keys ('applicationConfig', 'postingConfig')
        db.createObjectStore("jobConfiguration");
        console.log("Created 'jobConfiguration' object store.");
      }

      // Candidates (already exists)
      if (!db.objectStoreNames.contains("candidates")) {
        db.createObjectStore("candidates", { keyPath: "id" });
        console.log("Created 'candidates' object store.");
      }

      // Users (New in v2)
      if (!db.objectStoreNames.contains("users")) {
        const userStore = db.createObjectStore("users", { keyPath: "id" });
        // Ensure emails are unique for login purposes
        userStore.createIndex("by-email", "email", { unique: true });
        console.log("Created 'users' object store with 'by-email' index.");
      }

      // Applications (New in v2)
      if (!db.objectStoreNames.contains("applications")) {
        const applicationStore = db.createObjectStore("applications", {
          keyPath: "id",
        }); // Using explicit ID
        applicationStore.createIndex("by-jobId", "jobId");
        applicationStore.createIndex("by-candidateId", "candidateId");
        console.log("Created 'applications' object store with indexes.");
      }

      // --- Data Migration (Example: Ran when upgrading from v1 to v2) ---
      if (oldVersion < 2) {
        console.log("Running migration logic for v2...");
        // Migrate old 'mainConfig' key to 'applicationConfig'
        const configStore = transaction.objectStore("jobConfiguration");
        configStore
          .get("mainConfig")
          .then((oldConfig) => {
            if (oldConfig) {
              console.log("Migrating old 'mainConfig' key...");
              // Assume old config was application config and update its ID and add configType
              const newAppConfig: JobApplicationConfiguration = {
                ...(oldConfig as any), // Cast or adjust based on old structure
                id: "applicationConfig",
                configType: "application",
              };
              configStore.put(newAppConfig, "applicationConfig");
              configStore.delete("mainConfig");
              console.log(
                "Migration complete: 'mainConfig' -> 'applicationConfig'"
              );
            }
          })
          .catch((err) => console.error("Error during config migration:", err));
      }
      console.log("DB Upgrade finished");
    },
  });
  return db;
}

// --- Service Functions ---

// -- Jobs --
export async function addJob(job: Job): Promise<string> {
  const db = await initDB();
  // Ensure job has an ID if not provided
  if (!job.id) job.id = uuidv4();
  return db.add("jobs", job);
}
export async function getAllJobs(): Promise<Job[]> {
  const db = await initDB();
  return db.getAll("jobs");
}
export async function getJobById(id: string): Promise<Job | undefined> {
  const db = await initDB();
  return db.get("jobs", id);
}
// Add updateJob, deleteJob etc. as needed

// -- Job Configurations --
export async function saveJobApplicationConfiguration(
  config: JobApplicationConfiguration
): Promise<string> {
  const db = await initDB();
  config.id = "applicationConfig"; // Ensure ID matches key
  config.configType = "application";
  return db.put("jobConfiguration", config, "applicationConfig");
}
export async function getJobApplicationConfiguration(): Promise<
  JobApplicationConfiguration | JobPostingConfiguration | undefined
> {
  const db = await initDB();
  return db.get("jobConfiguration", "applicationConfig");
}
export async function saveJobPostingConfiguration(
  config: JobPostingConfiguration
): Promise<string> {
  const db = await initDB();
  config.id = "postingConfig"; // Ensure ID matches key
  config.configType = "posting";
  return db.put("jobConfiguration", config, "postingConfig");
}
export async function getJobPostingConfiguration(): Promise<
  JobPostingConfiguration | JobApplicationConfiguration | undefined
> {
  const db = await initDB();
  return db.get("jobConfiguration", "postingConfig");
}

// -- Candidates --
export async function addCandidate(candidate: Candidate): Promise<string> {
  const db = await initDB();
  // Consider generating UUID if candidate.id isn't provided
  if (!candidate.id) candidate.id = uuidv4();
  return db.add("candidates", candidate);
}
export async function getAllCandidates(): Promise<Candidate[]> {
  const db = await initDB();
  return db.getAll("candidates");
}
export async function getCandidateById(
  id: string
): Promise<Candidate | undefined> {
  const db = await initDB();
  return db.get("candidates", id);
}
// Add updateCandidate, deleteCandidate etc. as needed

// -- Users --
/**
 * Adds a new user to the database. Assumes the password in the user object
 * has already been hashed using `hashPassword`.
 * @param user The user object with a hashed password.
 * @returns The ID of the added user.
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
  } catch (error: any) {
    if (error.name === "ConstraintError") {
      console.error(`Error adding user: Email "${user.email}" already exists.`);
      throw new Error(`Email "${user.email}" already exists.`);
    } else {
      console.error("Error adding user:", error);
      throw error; // Re-throw other errors
    }
  }
}
export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await initDB();
  return db.getFromIndex("users", "by-email", email);
}
export async function getUserById(id: string): Promise<User | undefined> {
  const db = await initDB();
  return db.get("users", id);
}
// Add updateUser, deleteUser etc. as needed

// -- Applications --
export async function addApplication(
  application: Application
): Promise<string> {
  const db = await initDB();
  // Ensure application has a unique ID
  if (!application.id) application.id = uuidv4();
  application.applicationDate = new Date().toISOString(); // Set current date on creation
  return db.add("applications", application);
}
export async function getApplicationsForJob(
  jobId: string
): Promise<Application[]> {
  const db = await initDB();
  return db.getAllFromIndex("applications", "by-jobId", jobId);
}
export async function getApplicationsForCandidate(
  candidateId: string
): Promise<Application[]> {
  const db = await initDB();
  return db.getAllFromIndex("applications", "by-candidateId", candidateId);
}
export async function getApplicationById(
  id: string
): Promise<Application | undefined> {
  const db = await initDB();
  return db.get("applications", id);
}
export async function updateApplication(
  application: Application
): Promise<string> {
  const db = await initDB();
  return db.put("applications", application);
}
// Add deleteApplication etc. as needed

/**
 * Populates the IndexedDB database with initial data if stores are empty.
 * Uses a single transaction. Includes hashing for seeded user passwords.
 * @returns {Promise<void>}
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
    // Seed Jobs
    const jobCount = await stores.jobs.count();
    if (jobCount === 0 && jobList.data.length > 0) {
      console.log("Seeding JobList...");
      for (const job of jobList.data) {
        await stores.jobs.add(job);
      }
      console.log("JobList seeded.");
    } else {
      console.log("JobList data exists or is empty, skipping seed.");
    }

    // Seed Job Application Configuration
    const appConfig = await stores.jobConfiguration.get("applicationConfig");
    if (!appConfig) {
      console.log("Seeding Job Application Configuration...");
      const configKey = "applicationConfig";
      const appConfigToSave: JobApplicationConfiguration = {
        ...initialAppConfig,
        id: configKey,
        configType: "application",
      };
      await stores.jobConfiguration.put(appConfigToSave, configKey);
      console.log("Job Application Configuration seeded.");
    } else {
      console.log("Job Application Configuration exists, skipping seed.");
    }

    // Seed Job Posting Configuration
    const postingConfig = await stores.jobConfiguration.get("postingConfig");
    if (!postingConfig && initialJobPostingConfig) {
      // Check if imported config exists
      console.log("Seeding Job Posting Configuration...");
      const configKey = "postingConfig";
      const postingConfigToSave: JobPostingConfiguration = {
        ...initialJobPostingConfig, // Use imported config
        id: configKey,
        configType: "posting",
      };
      await stores.jobConfiguration.put(postingConfigToSave, configKey);
      console.log("Job Posting Configuration seeded.");
    } else {
      console.log(
        "Job Posting Configuration exists or not provided, skipping seed."
      );
    }

    // Seed Candidates
    const candidateCount = await stores.candidates.count();
    if (candidateCount === 0 && candidateList.data.length > 0) {
      console.log("Seeding Candidate List...");
      for (const candidate of candidateList.data) {
        // Ensure candidate has an ID before adding
        if (!candidate.id) candidate.id = uuidv4();
        await stores.candidates.add(candidate);
      }
      console.log("Candidate List seeded.");
    } else {
      console.log("Candidate List data exists or is empty, skipping seed.");
    }

    // Seed Users (e.g., a default admin) - NOW WITH HASHING
    const userCount = await stores.users.count();
    if (userCount === 0) {
      console.log("Seeding Default Admin User...");
      // Use the actual hashPassword function for seeding too
      const adminPasswordHash = await hashPassword("password"); // Example password 'password'
      const adminUser: User = {
        id: uuidv4(),
        email: "admin@example.com",
        name: "Admin User",
        hashedPassword: adminPasswordHash,
        role: "admin",
      };
      await stores.users.add(adminUser);
      console.log("Default Admin User seeded.");

      if (candidateList.data.length > 0 && candidateList.data[0].id) {
        const candidatePasswordHash = await hashPassword("password"); // Example password 'password'
        const candidateUser: User = {
          id: uuidv4(),
          email: "nadia.putri@example.com", // Match candidate data
          name: "Nadia Putri",
          hashedPassword: candidatePasswordHash,
          role: "candidate",
          candidateProfileId: candidateList.data[0].id, // Link to the first candidate
        };
        await stores.users.add(candidateUser);
        console.log("Sample Candidate User seeded.");
      }
    } else {
      console.log("Users data exists, skipping seed.");
    }

    // Seed Applications (link first candidate to first job)
    const appCount = await stores.applications.count();
    // Ensure IDs exist before trying to link
    if (
      appCount === 0 &&
      jobList.data.length > 0 &&
      candidateList.data.length > 0 &&
      jobList.data[0].id &&
      candidateList.data[0].id
    ) {
      console.log("Seeding Sample Application...");
      const sampleApp: Application = {
        id: uuidv4(),
        jobId: jobList.data[0].id,
        candidateId: candidateList.data[0].id,
        applicationDate: new Date().toISOString(),
        status: "applied",
      };
      await stores.applications.add(sampleApp);
      console.log("Sample Application seeded.");
    } else {
      console.log(
        "Applications data exists or prerequisites missing, skipping seed."
      );
    }

    await tx.done;
    console.log("Seeding complete.");
  } catch (error) {
    console.error("Error during seeding transaction:", error);
    if (tx.error) {
      console.error("Transaction error details:", tx.error);
    }
    console.log("Seeding failed, transaction aborted.");
    // Avoid throwing here to prevent unhandled promise rejections if seed fails
  }
}

// --- Authentication Service Functions ---

/**
 * Attempts to log in a user with email and password.
 * @param email The user's email.
 * @param plainPassword The user's plain text password.
 * @returns The User object if login is successful.
 * @throws Error if email is not found or password does not match.
 */
export async function loginUser(
  email: string,
  plainPassword: string
): Promise<User> {
  const user = await getUserByEmail(email);

  if (!user) {
    console.warn(`Login failed: Email "${email}" not found.`);
    throw new Error("Invalid email or password.");
  }

  if (!user.hashedPassword) {
    console.error(`Login failed: User "${email}" has no password set.`);
    throw new Error("User account is not properly configured."); // Should not happen with current setup
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
  // Omit hashedPassword before returning user object to frontend state
  const { hashedPassword, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Registers a new user. Hashes the password before adding to the database.
 * @param userData Object containing name, email, plainPassword, role, and optional candidateProfileId.
 * @returns The newly created User object (without the hashed password).
 * @throws Error if the email already exists or hashing fails.
 */
export async function registerUser(
  userData: Omit<User, "id" | "hashedPassword"> & { plainPassword: string }
): Promise<Omit<User, "hashedPassword">> {
  const { email, plainPassword, name, role, candidateProfileId } = userData;

  // Check if user already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error(`Email "${email}" is already registered.`);
  }

  // Hash the password
  const hashedPassword = await hashPassword(plainPassword);

  // Create the new user object
  const newUser: User = {
    id: uuidv4(), // Generate ID here
    email,
    name,
    hashedPassword,
    role,
    candidateProfileId: role === "candidate" ? candidateProfileId : undefined,
  };

  // Add user to the database (addUser handles potential constraint errors)
  await addUser(newUser);

  console.log(`Registration successful for user: ${newUser.email}`);
  // Return the user object without the hash
  const { hashedPassword: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

// --- Password Hashing Helpers (Client-Side using Web Crypto API) ---
// IMPORTANT: Read security note above. Not for production use without server-side handling.

/**
 * Converts an ArrayBuffer to a hexadecimal string.
 * @param buffer The ArrayBuffer to convert.
 * @returns A hexadecimal string representation.
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.prototype.map
    .call(new Uint8Array(buffer), (x) => ("00" + x.toString(16)).slice(-2))
    .join("");
}

/**
 * Hashes a password using SHA-256 via the Web Crypto API.
 * NOTE: This is basic hashing without salting or key stretching (like bcrypt/Argon2).
 * It's better than plain text but NOT cryptographically secure against modern attacks.
 * @param password The plain text password.
 * @returns A promise resolving to the SHA-256 hash as a hex string.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashHex = bufferToHex(hashBuffer);
  console.log(
    `Hashing password "${password}" to ${hashHex.substring(0, 10)}...`
  ); // Log for demo
  return hashHex;
}

/**
 * Verifies a plain text password against a stored SHA-256 hash.
 * @param plainPassword The password entered by the user.
 * @param storedHash The hash retrieved from the database.
 * @returns A promise resolving to true if the password matches the hash, false otherwise.
 */
export async function verifyPassword(
  plainPassword: string,
  storedHash: string
): Promise<boolean> {
  if (!storedHash) return false; // Cannot verify if no hash is stored
  const hashOfInput = await hashPassword(plainPassword);
  return hashOfInput === storedHash;
}
