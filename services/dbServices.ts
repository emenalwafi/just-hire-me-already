import { openDB, DBSchema, IDBPDatabase } from "idb";
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
const DB_VERSION = 2;

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
     * @param {IDBPDatabase<JobAppDB>} db - The database instance during upgrade.
     * @param {number} oldVersion - The previous version number (0 if creating).
     * @param {number | null} newVersion - The new version number being upgraded to.
     * @param {IDBPTransaction<JobAppDB, ("jobs" | "jobConfiguration" | "candidates" | "users" | "applications")[], "versionchange">} transaction - The upgrade transaction.
     */
    upgrade(db, oldVersion, newVersion, transaction) {
      console.log(`Upgrading DB from version ${oldVersion} to ${newVersion}`);

      if (!db.objectStoreNames.contains("jobs")) {
        const jobStore = db.createObjectStore("jobs", { keyPath: "id" });
        jobStore.createIndex("by-slug", "slug");
        console.log("Created 'jobs' object store with 'by-slug' index.");
      }

      if (!db.objectStoreNames.contains("jobConfiguration")) {
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

      if (oldVersion < 2) {
        console.log("Running migration logic for v2...");
        const configStore = transaction.objectStore("jobConfiguration");
        configStore
          .get("mainConfig")
          .then((oldConfig) => {
            if (oldConfig) {
              console.log("Migrating old 'mainConfig' key...");
              const newAppConfig: JobApplicationConfiguration = {
                ...(oldConfig as JobApplicationConfiguration),
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

/**
 * Adds a new job posting to the 'jobs' object store.
 * Ensures the job has a UUID if an ID is not provided.
 * @param {Job} job - The job object to add.
 * @returns {Promise<string>} A promise that resolves with the key (ID) of the added job.
 */
export async function addJob(job: Job): Promise<string> {
  const db = await initDB();
  if (!job.id) job.id = uuidv4();
  return db.add("jobs", job);
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

/**
 * Saves (adds or updates) the job application configuration.
 * Uses the fixed key 'applicationConfig'.
 * @param {JobApplicationConfiguration} config - The application configuration object.
 * @returns {Promise<string>} A promise resolving to the key ('applicationConfig').
 */
export async function saveJobApplicationConfiguration(
  config: JobApplicationConfiguration
): Promise<string> {
  const db = await initDB();
  config.id = "applicationConfig";
  config.configType = "application";
  return db.put("jobConfiguration", config, "applicationConfig");
}
/**
 * Retrieves the job application configuration.
 * @returns {Promise<JobApplicationConfiguration | JobPostingConfiguration | undefined>} A promise resolving to the configuration object or undefined.
 */
export async function getJobApplicationConfiguration(): Promise<
  JobApplicationConfiguration | JobPostingConfiguration | undefined
> {
  const db = await initDB();
  return db.get("jobConfiguration", "applicationConfig");
}
/**
 * Saves (adds or updates) the job posting configuration.
 * Uses the fixed key 'postingConfig'.
 * @param {JobPostingConfiguration} config - The posting configuration object.
 * @returns {Promise<string>} A promise resolving to the key ('postingConfig').
 */
export async function saveJobPostingConfiguration(
  config: JobPostingConfiguration
): Promise<string> {
  const db = await initDB();
  config.id = "postingConfig";
  config.configType = "posting";
  return db.put("jobConfiguration", config, "postingConfig");
}
/**
 * Retrieves the job posting configuration.
 * @returns {Promise<JobPostingConfiguration | JobApplicationConfiguration | undefined>} A promise resolving to the configuration object or undefined.
 */
export async function getJobPostingConfiguration(): Promise<
  JobPostingConfiguration | JobApplicationConfiguration | undefined
> {
  const db = await initDB();
  return db.get("jobConfiguration", "postingConfig");
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

    const postingConfig = await stores.jobConfiguration.get("postingConfig");
    if (!postingConfig && initialJobPostingConfig) {
      console.log("Seeding Job Posting Configuration...");
      const configKey = "postingConfig";
      const postingConfigToSave: JobPostingConfiguration = {
        ...initialJobPostingConfig,
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

    const candidateCount = await stores.candidates.count();
    if (candidateCount === 0 && candidateList.data.length > 0) {
      console.log("Seeding Candidate List...");
      for (const candidate of candidateList.data) {
        if (!candidate.id) candidate.id = uuidv4();
        await stores.candidates.add(candidate);
      }
      console.log("Candidate List seeded.");
    } else {
      console.log("Candidate List data exists or is empty, skipping seed.");
    }

    const userCount = await stores.users.count();
    if (userCount === 0) {
      console.log("Seeding Default Admin User...");
      const adminPasswordHash = await hashPassword("password");
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
        const candidatePasswordHash = await hashPassword("password");
        const candidateUser: User = {
          id: uuidv4(),
          email: "nadia.putri@example.com",
          name: "Nadia Putri",
          hashedPassword: candidatePasswordHash,
          role: "candidate",
          candidateProfileId: candidateList.data[0].id,
        };
        await stores.users.add(candidateUser);
        console.log("Sample Candidate User seeded.");
      }
    } else {
      console.log("Users data exists, skipping seed.");
    }

    const appCount = await stores.applications.count();
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
  }
}

/**
 * Attempts to log in a user with email and password. Verifies the password against the stored hash.
 * @param {string} email - The user's email.
 * @param {string} plainPassword - The user's plain text password.
 * @returns {Promise<User>} The User object (excluding the hashedPassword) if login is successful.
 * @throws {Error} If email is not found, password does not match, or the user account is improperly configured.
 */
export async function loginUser(
  email: string,
  plainPassword: string
): Promise<Omit<User, "hashedPassword">> {
  const user = await getUserByEmail(email);

  if (!user) {
    console.warn(`Login failed: Email "${email}" not found.`);
    throw new Error("Invalid email or password.");
  }

  if (!user.hashedPassword) {
    console.error(`Login failed: User "${email}" has no password set.`);
    throw new Error("User account is not properly configured.");
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
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashHex = bufferToHex(hashBuffer);
  console.log(
    `Hashing password "${password}" to ${hashHex.substring(0, 10)}...`
  );
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
  if (!storedHash) return false;
  const hashOfInput = await hashPassword(plainPassword);
  return hashOfInput === storedHash;
}
