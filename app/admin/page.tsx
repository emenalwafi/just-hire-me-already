"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { UilSearch, UilPlus, UilSignout } from "@iconscout/react-unicons";
import type { RootState, AppDispatch } from "@/store/store";
import { logout } from "@/store/authSlice";
import { getAllJobs, addJob, getJobById } from "@/services/dbServices";
import type { Job } from "@/types/dbTypes";
import JobCard from "@/components/admin/job-card/JobCard";
import JobCreationDialog from "@/components/admin/job-creation-dialog/JobCreationDialog";

/**
 * Admin home page component displaying a list of job postings,
 * allowing searching, status toggling, and creation of new jobs.
 * Includes an authentication guard to redirect non-admin users.
 * @returns {React.ReactElement | null} The rendered admin home page or null if redirecting.
 */
const AdminHomePage: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState<boolean>(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  /**
   * Effect hook for authentication guard. Redirects non-admin users to the login page.
   */
  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.replace("/login");
    }
  }, [user, router]);

  /**
   * Memoized callback function to fetch job postings from the database.
   * Only fetches if the user is authenticated as an admin.
   */
  const fetchJobs = useCallback(async () => {
    if (user?.role !== "admin") {
      setIsLoadingJobs(false);
      return;
    }
    setIsLoadingJobs(true);
    try {
      const fetchedJobs = await getAllJobs();
      setJobs(fetchedJobs);
    } catch (error) {
      setJobs([]);
    } finally {
      setIsLoadingJobs(false);
    }
  }, [user]);

  /**
   * Effect hook to fetch jobs on initial mount and when the user changes.
   */
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  /**
   * Handles user logout by dispatching the logout action.
   */
  const handleLogout = () => {
    dispatch(logout());
  };

  /**
   * Opens the job creation dialog.
   */
  const handleCreateNewJobClick = () => {
    setIsDialogOpen(true);
  };

  /**
   * Memoized callback to handle toggling the status ('active'/'closed') of a job posting.
   * Performs an optimistic UI update and then attempts to update the database.
   * Reverts the UI update and shows an alert on database update failure.
   * @param {string} jobId - The ID of the job to update.
   * @param {'active' | 'closed' | 'draft'} currentStatus - The current status of the job.
   */
  const handleStatusToggle = useCallback(
    async (jobId: string, currentStatus: "active" | "closed" | "draft") => {
      if (currentStatus === "draft") return;

      const newStatus = currentStatus === "active" ? "closed" : "active";
      const originalJobs = [...jobs];

      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.id === jobId
            ? {
                ...job,
                status: newStatus,
                list_card: {
                  ...job.list_card,
                  badge: newStatus === "active" ? "Active" : "Inactive",
                },
              }
            : job
        )
      );

      try {
        const jobToUpdate = await getJobById(jobId);
        if (jobToUpdate) {
          const updatedJob: Job = {
            ...jobToUpdate,
            status: newStatus,
            list_card: {
              ...jobToUpdate.list_card,
              badge: newStatus === "active" ? "Active" : "Inactive",
            },
          };
          await addJob(updatedJob);
        } else {
          throw new Error(`Job ${jobId} not found.`);
        }
      } catch (error) {
        setJobs(originalJobs);
        alert(`Failed to update job status for ${jobId}. Please try again.`);
        throw error;
      }
    },
    [jobs] // Removed addJob and getJobById as dependencies assuming they are stable service functions
  );

  /**
   * Memoized array of jobs filtered based on the current `searchTerm`.
   * Searches within job title, description, type, and status.
   * @returns {Job[]} The filtered list of jobs.
   */
  const filteredJobs = useMemo(() => {
    if (!searchTerm) {
      return jobs;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return jobs.filter(
      (job) =>
        job.title.toLowerCase().includes(lowerSearchTerm) ||
        job.description?.toLowerCase().includes(lowerSearchTerm) ||
        job.jobType?.toLowerCase().includes(lowerSearchTerm) ||
        job.status.toLowerCase().includes(lowerSearchTerm)
    );
  }, [jobs, searchTerm]);

  // Render null or loading indicator if auth check is in progress
  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-neutral-10 overflow-hidden font-sans">
      <header className="w-full h-16 bg-neutral-10 border-b border-neutral-40 flex-shrink-0">
        <div className="max-w-full h-full px-5 mx-auto flex justify-between items-center">
          <h1 className="text-neutral-100 text-xl font-bold">Job List</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-70 hidden sm:inline">
              {user.email} ({user.role})
            </span>
            <button onClick={handleLogout} aria-label="Logout">
              <div className="w-7 h-7 rounded-full border border-neutral-40 bg-neutral-100 flex items-center justify-center text-neutral-10 text-xs font-bold ring-1 ring-offset-1 ring-primary-main focus:ring-primary-focus">
                {user.name ? user.name.charAt(0).toUpperCase() : "A"}
              </div>
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 text-neutral-60 hover:text-danger-main hover:bg-danger-surface rounded-full transition-colors sm:p-2"
              title="Logout"
            >
              <UilSignout size="20" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden px-4 sm:px-6 pt-4 pb-4">
        <div className="flex flex-col lg:flex-row gap-4 h-full">
          <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
            <div className="relative flex-shrink-0">
              <input
                type="search"
                placeholder="Search by job details"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-4 py-2.5 bg-neutral-10 rounded-lg outline outline-2 outline-offset-[-2px] outline-gray-200 focus:outline-primary-main text-base text-neutral-90 placeholder:text-neutral-70"
                aria-label="Search jobs"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UilSearch className="size-5 text-primary-main" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-16 lg:pb-4">
              {isLoadingJobs ? (
                <div className="flex justify-center items-center h-full">
                  <p className="text-neutral-60">Loading jobs...</p>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="flex flex-col justify-center items-center gap-4 h-full text-center px-4">
                  <Image
                    src="/home-page-empty.png"
                    alt="No job openings illustration"
                    width={180}
                    height={180}
                    className="opacity-70"
                    onError={(e) =>
                      (e.currentTarget.src =
                        "https://placehold.co/180x180/E0E0E0/757575?text=Empty")
                    }
                  />
                  <div className="flex flex-col justify-center items-center gap-1">
                    <div className="text-neutral-90 text-heading-sm font-bold">
                      {searchTerm
                        ? "No Jobs Found"
                        : "No job openings available"}
                    </div>
                    <div className="text-neutral-90 text-base md:text-lg max-w-md">
                      {searchTerm
                        ? `Your search for "${searchTerm}" did not match any jobs.`
                        : "Create a job opening now and start the candidate process."}
                    </div>
                  </div>
                  {!searchTerm && (
                    <button
                      onClick={handleCreateNewJobClick}
                      className="mt-2 px-4 py-1.5 bg-secondary-main rounded-lg shadow-[0px_1px_2px_0px_rgba(0,0,0,0.12)] inline-flex justify-center items-center gap-1 hover:bg-secondary-hover focus:outline-none focus:ring-2 focus:ring-secondary-focus focus:ring-offset-1 transition-colors"
                    >
                      <span className="text-center justify-center text-neutral-90 text-lg font-bold">
                        Create a new job
                      </span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onStatusToggle={
                        () =>
                          handleStatusToggle(
                            job.id,
                            job.status as "active" | "closed" | "draft"
                          ) // Added type assertion
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="hidden lg:flex lg:flex-col justify-start items-center gap-6 flex-shrink-0 w-72">
            <div
              className="w-full p-6 rounded-2xl flex flex-col justify-center items-end gap-6 overflow-hidden bg-cover bg-center text-white"
              style={{
                backgroundImage: "url('/highlited-session.png')",
                backgroundColor: "rgba(0,0,0,0.7)",
                backgroundBlendMode: "multiply",
              }}
            >
              <div className="self-stretch flex flex-col justify-start items-start gap-1">
                <div className="self-stretch justify-start text-neutral-40 text-lg font-bold">
                  Recruit the best candidates
                </div>
                <div className="self-stretch justify-start text-neutral-10 text-base font-bold">
                  Create jobs, invite, and hire with ease
                </div>
              </div>
              <button
                onClick={handleCreateNewJobClick}
                className="self-stretch px-4 py-1.5 bg-primary-main rounded-lg shadow-[0px_1px_2px_0px_rgba(0,0,0,0.12)] inline-flex justify-center items-center gap-1 hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary-focus focus:ring-offset-1 transition-colors"
              >
                <div className="text-center justify-center text-neutral-10 text-lg font-bold">
                  Create a new job
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {!isLoadingJobs && jobs.length > 0 && (
        <button
          onClick={handleCreateNewJobClick}
          className="lg:hidden fixed bottom-6 right-6 z-30 p-3 bg-secondary-main rounded-full shadow-lg hover:bg-secondary-hover focus:outline-none focus:ring-2 focus:ring-secondary-focus focus:ring-offset-2 transition-colors"
          aria-label="Create new job"
        >
          <UilPlus className="size-6 text-neutral-90" />
        </button>
      )}

      <JobCreationDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onJobCreated={fetchJobs}
      />

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .scale-in {
          animation: scaleIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AdminHomePage;
