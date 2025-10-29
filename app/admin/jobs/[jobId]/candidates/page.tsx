"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { UilSignout, UilAngleRight } from "@iconscout/react-unicons";
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
import { DataTable } from "@/components/data-table/DataTable";
import { columns, CombinedData } from "./columns";
import { ColumnPinningState } from "@tanstack/react-table";

/**
 * Helper function to retrieve the value of a specific attribute from a candidate's attribute list.
 * @param {CandidateAttribute[]} attributes - The array of candidate attributes.
 * @param {string} key - The key of the attribute to find.
 * @returns {string | number | boolean | null} The value of the attribute, or null if not found.
 */
const getAttributeValue = (
  attributes: CandidateAttribute[],
  key: string
): string | number | boolean | null => {
  const attribute = attributes.find((attr) => attr.key === key);
  return attribute ? attribute.value : null;
};

/**
 * Page component for administrators to view and manage candidates for a specific job posting.
 * Displays candidate information in a data table. Includes authentication guard.
 * @returns {React.ReactElement | null} The rendered candidate list page or loading/redirect state.
 */
const CandidateListPage: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const router = useRouter();
  const params = useParams();
  const jobId = params?.jobId as string | undefined;

  const { user } = useSelector((state: RootState) => state.auth);

  const [jobDetails, setJobDetails] = useState<Job | null>(null);
  const [candidatesData, setCandidatesData] = useState<CombinedData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Effect hook for authentication guard. Redirects non-admin users.
   */
  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (user.role !== "admin") {
      router.push("/");
    }
  }, [user, router]);

  /**
   * Memoized callback function to fetch job details, associated applications,
   * and the corresponding candidate data. Combines the data for table display.
   * Handles loading and error states.
   */
  const fetchData = useCallback(async () => {
    if (!jobId || user?.role !== "admin") {
      setIsLoading(false);
      if (!jobId) setError("Job ID not found in URL.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const job = await getJobById(jobId);
      if (!job) {
        throw new Error(`Job with ID ${jobId} not found.`);
      }
      setJobDetails(job);

      const applications = await getApplicationsForJob(jobId);

      const candidatePromises = applications.map((app) =>
        getCandidateById(app.candidateId)
      );
      const candidates = await Promise.all(candidatePromises);

      const combinedData: CombinedData[] = applications.map((app, index) => {
        const candidate = candidates[index];
        if (!candidate) {
          return {
            id: app.id,
            candidateId: app.candidateId,
            jobId: app.jobId,
            name: "Unknown Candidate",
            email: "N/A",
            phone: "N/A",
            status: app.status,
            applicationDate: app.applicationDate,
            matchRate: 0,
            usia: null,
            lastExperience: null,
            agama: null,
            domisili: null,
            jenisKelamin: null,
            salary: null,
          };
        }

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
          : null;
        const lastExperience = getAttributeValue(
          candidate.attributes,
          "last_experience"
        ) as string | null;
        const agama = getAttributeValue(candidate.attributes, "agama") as
          | string
          | null;
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
        ) as string | null;

        return {
          id: app.id,
          candidateId: candidate.id,
          jobId: app.jobId,
          name: name,
          email: email,
          phone: phone,
          status: app.status,
          applicationDate: app.applicationDate,
          matchRate: 0,
          usia: usia,
          lastExperience: lastExperience,
          agama: agama,
          domisili: domisili,
          jenisKelamin: jenisKelamin,
          salary: salary,
        };
      });

      setCandidatesData(combinedData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load candidate data."
      );
      setJobDetails(null);
      setCandidatesData([]);
    } finally {
      setIsLoading(false);
    }
  }, [jobId, user?.role]);

  /**
   * Effect hook to trigger data fetching when the component mounts or `fetchData` changes.
   */
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Handles user logout by dispatching the logout action and redirecting to login.
   */
  const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
  };

  /**
   * Calculates age based on a date of birth string.
   * @param {string | null} dobString - Date of birth in a string format parseable by `new Date()`.
   * @returns {number | null} The calculated age in years, or null if input is invalid.
   */
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

  /**
   * Memoized initial column pinning state for the DataTable.
   * Pins the 'select' and 'name' columns to the left by default.
   * @type {ColumnPinningState}
   */
  const initialPinning: ColumnPinningState = useMemo(
    () => ({
      left: ["select", "name"],
      right: [],
    }),
    []
  );

  if (!user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-10">
        Checking permissions...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-neutral-10 font-sans">
      <div className="relative top-0 z-10 h-16 w-full bg-neutral-10 border-b border-neutral-300 px-4 md:px-6">
        <div className="mx-auto flex h-full max-w-screen-xl md:max-w-screen items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="flex items-center gap-1 rounded-lg px-3 py-1 text-sm font-bold text-neutral-600 shadow-sm outline outline-1 outline-neutral-300 hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-1 md:px-4 md:py-1 md:text-base"
            >
              Job list
            </Link>
            <UilAngleRight />
            <div className="rounded-lg bg-neutral-200 px-3 py-1 text-sm font-bold text-neutral-800 outline outline-1 outline-neutral-400 md:px-4 md:py-1 md:text-base">
              Manage Candidate
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-neutral-70 hidden sm:inline">
                    {user.email} ({user.role})
                  </span>
                  <button aria-label="Logout">
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

      <main className="mx-auto max-w-screen-xl md:max-w-screen h-full px-4 pb-10 pt-4 md:px-6 md:pt-6">
        <div className="flex flex-col gap-6 h-">
          <div className="text-xl font-bold text-neutral-100">
            {isLoading
              ? "Loading Job Title..."
              : jobDetails?.title || "Job Not Found"}
          </div>

          <div className="overflow-hidden relative h-[79vh] lg:h-[86vh] rounded-lg border border-neutral-300 shadow-[0px_4px_8px_0px_rgba(0,0,0,0.05)]">
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
