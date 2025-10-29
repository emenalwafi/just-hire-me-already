"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useRouter } from "next/navigation"; // Use useParams for dynamic route
import Link from "next/link";
import Image from "next/image";
import {
  UilSignout,
  UilArrowLeft,
  UilAngleRight,
} from "@iconscout/react-unicons"; // Added UilArrowLeft
import { AppDispatch, RootState } from "@/store/store";
import { logout } from "@/store/authSlice";
import {
  getJobById,
  getApplicationsForJob,
  getCandidateById,
} from "@/services/dbServices";
import {
  Job,
  Candidate,
  Application,
  CandidateAttribute,
} from "@/types/dbTypes";
import { DataTable } from "@/components/data-table/DataTable"; // Import DataTable
import { columns, CombinedData } from "./columns"; // Import columns and CombinedData type
import { ColumnPinningState } from "@tanstack/react-table";

// Helper function to get specific attribute value
const getAttributeValue = (
  attributes: CandidateAttribute[],
  key: string
): string | number | boolean | null => {
  const attribute = attributes.find((attr) => attr.key === key);
  return attribute ? attribute.value : null;
};

const CandidateListPage: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const router = useRouter();
  const params = useParams(); // Get route parameters
  const jobId = params?.jobId as string | undefined; // Extract jobId

  const { user } = useSelector((state: RootState) => state.auth);

  const [jobDetails, setJobDetails] = useState<Job | null>(null);
  const [candidatesData, setCandidatesData] = useState<CombinedData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Authentication Guard
  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (user.role !== "admin") {
      console.warn("Non-admin user attempted to access admin candidate page.");
      router.push("/"); // Or appropriate redirect
    }
  }, [user, router]);

  // Fetch Job, Applications, and Candidate Data
  const fetchData = useCallback(async () => {
    if (!jobId || user?.role !== "admin") {
      setIsLoading(false); // Stop loading if no jobId or not admin
      if (!jobId) setError("Job ID not found in URL.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Fetch job details
      const job = await getJobById(jobId);
      if (!job) {
        throw new Error(`Job with ID ${jobId} not found.`);
      }
      setJobDetails(job);

      // Fetch applications for this job
      const applications = await getApplicationsForJob(jobId);

      // Fetch candidate details for each application
      const candidatePromises = applications.map((app) =>
        getCandidateById(app.candidateId)
      );
      const candidates = await Promise.all(candidatePromises);

      // Combine data
      const combinedData: CombinedData[] = applications.map((app, index) => {
        const candidate = candidates[index];
        if (!candidate) {
          // Handle case where candidate data might be missing (optional)
          console.warn(
            `Candidate data not found for application ${app.id}, candidateId ${app.candidateId}`
          );
          return {
            id: app.id, // Use application ID as key if candidate missing? Or filter out?
            candidateId: app.candidateId,
            jobId: app.jobId,
            name: "Unknown Candidate",
            email: "N/A",
            phone: "N/A",
            status: app.status,
            // Add default/fallback values for other fields
            applicationDate: app.applicationDate,
            matchRate: 0, // Example fallback
            // Add other candidate attributes with fallbacks
            usia: null,
            lastExperience: null,
            agama: null,
            domisili: null,
            jenisKelamin: null,
            salary: null,
          };
        }

        // Extract attributes safely
        const name =
          (getAttributeValue(candidate.attributes, "full_name") as string) ||
          "N/A";
        const email =
          (getAttributeValue(candidate.attributes, "email") as string) || "N/A";
        const phone =
          (getAttributeValue(candidate.attributes, "phone_number") as string) ||
          "N/A";
        const usia = getAttributeValue(candidate.attributes, "date_of_birth")
          ? calculateAge(
              getAttributeValue(candidate.attributes, "date_of_birth") as string
            )
          : null; // Example age calc
        const lastExperience = getAttributeValue(
          candidate.attributes,
          "last_experience"
        ) as string | null; // Assuming this key exists
        const agama = getAttributeValue(candidate.attributes, "agama") as
          | string
          | null; // Assuming this key exists
        const domisili = getAttributeValue(candidate.attributes, "domicile") as
          | string
          | null;
        const jenisKelamin = getAttributeValue(
          candidate.attributes,
          "gender"
        ) as string | null;
        const salary = getAttributeValue(
          candidate.attributes,
          "expected_salary"
        ) as string | null; // Assuming this key exists

        return {
          id: app.id, // Unique ID for the row (application ID)
          candidateId: candidate.id,
          jobId: app.jobId,
          name: name,
          email: email,
          phone: phone,
          status: app.status,
          applicationDate: app.applicationDate,
          // Example: Add other fields required by columns.tsx
          matchRate: 0, // Placeholder - Calculate if needed
          usia: usia,
          lastExperience: lastExperience,
          agama: agama,
          domisili: domisili,
          jenisKelamin: jenisKelamin,
          salary: salary,
          // Add any other combined data needed for the table columns
        };
      });

      setCandidatesData(combinedData);
    } catch (err) {
      console.error("Error fetching candidate list data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load candidate data."
      );
      setJobDetails(null); // Clear job details on error
      setCandidatesData([]); // Clear candidate data on error
    } finally {
      setIsLoading(false);
    }
  }, [jobId, user?.role]); // Depend on jobId and user role

  // Fetch data on mount/jobId change
  useEffect(() => {
    fetchData();
  }, [fetchData]); // Use fetchData as dependency

  const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
  };

  // Simple age calculation helper (move to utils if needed)
  const calculateAge = (dobString: string | null): number | null => {
    if (!dobString) return null;
    try {
      const birthDate = new Date(dobString);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch (e) {
      return null;
    }
  };

  // Define initial pinning for this specific table instance
  const initialPinning: ColumnPinningState = useMemo(
    () => ({
      left: ["select", "name"], // Example: Pin select and name columns
      right: [], // Example: No right pinned columns initially
    }),
    []
  );

  // --- Render Logic ---
  if (!user || user.role !== "admin") {
    // Render loading or null while redirecting
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-10">
        Checking permissions...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-neutral-10 font-sans">
      {/* Header */}
      <div className="relative top-0 z-10 h-16 w-full bg-neutral-10 border-b border-neutral-300 px-4 md:px-6">
        <div className="mx-auto flex h-full max-w-screen-xl md:max-w-screen items-center justify-between">
          {/* Breadcrumb/Navigation */}
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="flex items-center gap-1 rounded-lg px-3 py-1 text-sm font-bold text-neutral-600 shadow-sm outline outline-1 outline-neutral-300 hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-1 md:px-4 md:py-1 md:text-base"
            >
              Job list
            </Link>
            {/* Separator - simple SVG example */}
            <UilAngleRight />

            <div className="rounded-lg bg-neutral-200 px-3 py-1 text-sm font-bold text-neutral-800 outline outline-1 outline-neutral-400 md:px-4 md:py-1 md:text-base">
              Manage Candidate
            </div>
          </div>
          {/* User Section */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-neutral-70 hidden sm:inline">
                    {user.email} ({user.role})
                  </span>
                  <button onClick={handleLogout} aria-label="Logout">
                    <div className="w-7 h-7 rounded-full border border-neutral-40 bg-neutral-100 flex items-center justify-center text-neutral-10 text-xs font-bold ring-1 ring-offset-1 ring-primary-main focus:ring-primary-focus">
                      {user.name ? user.name.charAt(0).toUpperCase() : "A"}
                    </div>
                  </button>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-neutral-60 hover:text-danger-main hover:bg-danger-surface rounded-full transition-colors sm:p-2"
                  title="Logout"
                >
                  <UilSignout size="20" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-screen-xl md:max-w-screen h-full px-4 pb-10 pt-4 md:px-6 md:pt-6">
        <div className="flex flex-col gap-6 h-">
          {/* Job Title */}
          <div className="text-xl font-bold text-neutral-100">
            {isLoading
              ? "Loading Job Title..."
              : jobDetails?.title || "Job Not Found"}
          </div>

          {/* Data Table Section */}
          <div className="overflow-hidden relative h-[79vh] lg:h-[86vh] rounded-lg border border-neutral-300 shadow-[0px_4px_8px_0px_rgba(0,0,0,0.05)]">
            {" "}
            {/* Added border and adjusted shadow */}
            {isLoading && (
              <div className="flex h-60 items-center justify-center p-6 text-neutral-500">
                Loading candidates...
              </div>
            )}
            {error && !isLoading && (
              <div className="flex h-60 items-center justify-center bg-danger-surface p-6 text-center text-danger-main">
                Error: {error}
              </div>
            )}
            {!isLoading && !error && (
              <DataTable<CombinedData, unknown>
                columns={columns}
                data={candidatesData}
                initialPinning={initialPinning}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CandidateListPage;
