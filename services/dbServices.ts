import { openDB, DBSchema, IDBPDatabase } from "idb";
import { Job, JobConfiguration, Candidate } from "@/types/dbTypes";
import { jobList, jobConfiguration, candidateList } from "@/data/initialData";

/** The name of the IndexedDB database. */
const DB_NAME = "JobAppData";
/** The current version of the IndexedDB database schema. */
const DB_VERSION = 1;

/**
 * Defines the schema structure for the Job Application IndexedDB database.
 * Uses `idb`'s `DBSchema` interface for type safety.
 */
interface JobAppDB extends DBSchema {
  /** Object store for job postings. */
  jobs: {
    /** The key type (job ID string). */
    key: string;
    /** The value type (Job object). */
    value: Job;
    /** Indexes for querying jobs. */
    indexes: {
      /** Index for querying jobs by their slug. */
      "by-slug": string;
    };
  };
  /** Object store for job configuration (e.g., application form structure). */
  jobConfiguration: {
    /** The key type (using a fixed string like 'mainConfig'). */
    key: string;
    /** The value type (JobConfiguration object). */
    value: JobConfiguration;
  };
  /** Object store for candidate profiles. */
  candidates: {
    /** The key type (candidate ID string). */
    key: string;
    /** The value type (Candidate object). */
    value: Candidate;
    // indexes: { 'by-name': string }; // Example index, complex for nested arrays
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
     * @param {IDBPTransaction<JobAppDB, ("jobs" | "jobConfiguration" | "candidates")[], "versionchange">} transaction - The upgrade transaction.
     */
    upgrade(db, oldVersion, newVersion, transaction) {
      console.log(`Upgrading DB from version ${oldVersion} to ${newVersion}`);

      // Create 'jobs' object store if it doesn't exist
      if (!db.objectStoreNames.contains("jobs")) {
        const jobStore = db.createObjectStore("jobs", {
          keyPath: "id", // Use the 'id' field as the primary key
        });
        // Create an index on the 'slug' field
        jobStore.createIndex("by-slug", "slug");
        console.log("Created 'jobs' object store with 'by-slug' index.");
      }
      // Create 'jobConfiguration' object store if it doesn't exist
      if (!db.objectStoreNames.contains("jobConfiguration")) {
        // No keyPath needed if we use explicit keys ('mainConfig')
        db.createObjectStore("jobConfiguration");
        console.log("Created 'jobConfiguration' object store.");
      }
      // Create 'candidates' object store if it doesn't exist
      if (!db.objectStoreNames.contains("candidates")) {
        const candidateStore = db.createObjectStore("candidates", {
          keyPath: "id", // Use the 'id' field as the primary key
        });
        // Example: Add indexes if needed later
        // candidateStore.createIndex('by-email', 'attributes.value'); // More complex indexing
        console.log("Created 'candidates' object store.");
      }
      console.log("DB Upgrade finished");
    },
  });
  return db;
}

/**
 * Adds a new job posting to the 'jobs' object store.
 * @param {Job} job - The job object to add.
 * @returns {Promise<string>} A promise that resolves with the key (ID) of the added job.
 */
export async function addJob(job: Job): Promise<string> {
  const db = await initDB();
  return db.add("jobs", job);
}

/**
 * Saves (adds or updates) the main job configuration in the 'jobConfiguration' object store.
 * Uses a fixed key 'mainConfig'.
 * @param {JobConfiguration} config - The job configuration object to save.
 * @returns {Promise<string>} A promise that resolves with the key ('mainConfig') used to save the configuration.
 */
export async function saveJobConfiguration(
  config: JobConfiguration
): Promise<string> {
  const db = await initDB();
  const configKey = "mainConfig"; // Fixed key for the single configuration object
  config.id = configKey; // Assign ID for consistency if needed within the object itself
  // Use 'put' to either add or update the configuration at the specified key
  return db.put("jobConfiguration", config, configKey);
}

/**
 * Adds a new candidate profile to the 'candidates' object store.
 * @param {Candidate} candidate - The candidate object to add.
 * @returns {Promise<string>} A promise that resolves with the key (ID) of the added candidate.
 */
export async function addCandidate(candidate: Candidate): Promise<string> {
  const db = await initDB();
  return db.add("candidates", candidate);
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
 * Retrieves the main job configuration from the 'jobConfiguration' object store.
 * @returns {Promise<JobConfiguration | undefined>} A promise that resolves with the job configuration object,
 * or undefined if it hasn't been saved yet.
 */
export async function getJobConfiguration(): Promise<
  JobConfiguration | undefined
> {
  const db = await initDB();
  return db.get("jobConfiguration", "mainConfig"); // Fetch using the fixed key
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
 * Populates the IndexedDB database with initial data (jobs, configuration, candidates)
 * if the respective object stores are empty. Uses a single transaction for efficiency.
 * @returns {Promise<void>} A promise that resolves when the seeding process is complete or skipped.
 */
export async function seedInitialData(): Promise<void> {
  console.log("Attempting to seed initial data...");
  const db = await initDB();
  // Start a readwrite transaction encompassing all stores to be seeded
  const tx = db.transaction(
    ["jobs", "jobConfiguration", "candidates"],
    "readwrite"
  );
  // Get references to the object stores within the transaction
  const stores = {
    jobs: tx.objectStore("jobs"),
    jobConfiguration: tx.objectStore("jobConfiguration"),
    candidates: tx.objectStore("candidates"),
  };

  try {
    // Seed Jobs only if the store is empty
    const jobCount = await stores.jobs.count();
    if (jobCount === 0) {
      console.log("Seeding JobList...");
      for (const job of jobList.data) {
        await stores.jobs.add(job); // Use the store from the transaction
      }
      console.log("JobList seeded.");
    } else {
      console.log("JobList data already exists, skipping seed.");
    }

    // Seed Job Configuration only if it doesn't exist
    const config = await stores.jobConfiguration.get("mainConfig");
    if (!config) {
      console.log("Seeding Job Configuration...");
      const configKey = "mainConfig";
      jobConfiguration.id = configKey;
      await stores.jobConfiguration.put(jobConfiguration, configKey); // Use the store from the transaction
      console.log("Job Configuration seeded.");
    } else {
      console.log("Job Configuration already exists, skipping seed.");
    }

    // Seed Candidates only if the store is empty
    const candidateCount = await stores.candidates.count();
    if (candidateCount === 0) {
      console.log("Seeding Candidate List...");
      for (const candidate of candidateList.data) {
        await stores.candidates.add(candidate); // Use the store from the transaction
      }
      console.log("Candidate List seeded.");
    } else {
      console.log("Candidate List data already exists, skipping seed.");
    }

    // Wait for the transaction to complete successfully
    await tx.done;
    console.log("Seeding complete.");
  } catch (error) {
    console.error("Error during seeding transaction:", error);
    // Log specific transaction error if available
    if (tx.error) {
      console.error("Transaction error details:", tx.error);
    }
    // Transaction automatically aborts on any error within the try block
    console.log("Seeding failed, transaction aborted.");
    // Optionally re-throw the error if the caller needs to handle it
    // throw error;
  }
}
