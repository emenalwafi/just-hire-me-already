"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { UilSearch, UilPlus } from "@iconscout/react-unicons"; // Added UilPlus for potential FAB
import type { RootState, AppDispatch } from "@/store/store";
import { logout } from "@/store/authSlice";
import { getAllJobs, addJob, getJobById } from "@/services/dbServices"; // Assuming addJob exists for status toggle later
import type { Job } from "@/types/dbTypes";
import JobCard from "@/components/admin/job-card/JobCard"; // <<< Import JobCard
import JobCreationDialog from "@/components/admin/job-creation-dialog/JobCreationDialog";
// import JobCreationDrawer from "@/components/admin/JobCreationDrawer"; // Keep commented for now

const AdminHomePage: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState<boolean>(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // --- Authentication Guard ---
  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.replace("/login");
    }
  }, [user, router]);

  // --- Data Fetching ---
  const fetchJobs = useCallback(async () => {
    // Only fetch if user is admin (avoids flicker on initial load before auth check)
    if (user?.role !== "admin") {
      setIsLoadingJobs(false); // Stop loading if not admin
      return;
    }
    setIsLoadingJobs(true);
    try {
      const fetchedJobs = await getAllJobs();
      setJobs(fetchedJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setJobs([]); // Set to empty array on error
    } finally {
      setIsLoadingJobs(false);
    }
  }, [user]); // Depend on user

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]); // Fetch jobs initially and when fetchJobs changes (due to user dependency)

  // --- Handlers ---
  const handleLogout = () => {
    dispatch(logout());
    // Router replacement is handled by the auth guard effect
  };

  const handleCreateNewJobClick = () => {
    setIsDialogOpen(true);
    console.log("Opening job creation drawer...");
  };

  // Placeholder for status toggle - needs implementation in dbServices and proper state update
  const handleStatusToggle = useCallback(
    async (jobId: string, currentStatus: "active" | "closed" | "draft") => {
      // Don't allow toggling for draft jobs via this UI
      if (currentStatus === "draft") return;

      const newStatus = currentStatus === "active" ? "closed" : "active";
      const originalJobs = [...jobs]; // Keep original state for potential revert

      // --- Optimistic UI Update ---
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

      // --- Actual DB Update ---
      try {
        console.log(
          `Attempting to update job ${jobId} status to ${newStatus}...`
        );
        const jobToUpdate = await getJobById(jobId); // Fetch the job data
        if (jobToUpdate) {
          const updatedJob: Job = {
            ...jobToUpdate,
            status: newStatus,
            list_card: {
              // Update list card badge as well
              ...jobToUpdate.list_card,
              badge: newStatus === "active" ? "Active" : "Inactive",
            },
            // Optionally update an 'updatedAt' timestamp here
          };
          await addJob(updatedJob); // Use addJob (as put) to update the record
          console.log(`Job ${jobId} status updated successfully in DB.`);
          // Optional: If you prefer pessimistic updates, call fetchJobs() here instead of optimistic update
          // fetchJobs();
        } else {
          console.error(`Job ${jobId} not found for status update.`);
          throw new Error(`Job ${jobId} not found.`); // Throw error to trigger catch block
        }
      } catch (error) {
        console.error(`Error updating job ${jobId} status in DB:`, error);
        // Revert optimistic update on failure
        setJobs(originalJobs);
        // TODO: Show an error message to the user (e.g., using a toast notification library)
        alert(`Failed to update job status for ${jobId}. Please try again.`);
        throw error; // Re-throw if the JobCard needs to handle it (e.g., stop loading spinner)
      }
    },
    [jobs]
  );

  // Filter jobs based on search term (simple example)
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

  // --- Render Logic ---
  if (!user || user.role !== "admin") {
    return null; // Or a loading indicator
  }

  return (
    <div className="flex flex-col h-screen bg-neutral-10 overflow-hidden font-sans">
      {/* Header */}
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
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden px-4 sm:px-6 pt-4 pb-4">
        {" "}
        {/* Added pb-4 */}
        <div className="flex flex-col lg:flex-row gap-4 h-full">
          {/* Left Panel: Search and Job List / Empty State */}
          <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
            {/* Search Bar */}
            <div className="relative flex-shrink-0">
              <input
                type="search" // Use search type
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

            {/* Job List or Empty State Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-16 lg:pb-4">
              {" "}
              {/* Added bottom padding for potential FAB */}
              {isLoadingJobs ? (
                <div className="flex justify-center items-center h-full">
                  <p className="text-neutral-60">Loading jobs...</p>
                  {/* TODO: Add a spinner component */}
                </div>
              ) : filteredJobs.length === 0 ? (
                // Empty State or No Search Results
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
                  {/* Only show create button in empty state if not searching */}
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
                // Job List - Render JobCards
                <div className="space-y-4">
                  {filteredJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      // Pass the toggle handler (needs implementation details refined)
                      onStatusToggle={() =>
                        handleStatusToggle(job.id, job.status)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Highlight Card (Hidden below lg screens) */}
          <div className="hidden lg:flex lg:flex-col justify-start items-center gap-6 flex-shrink-0 w-72">
            <div
              className="w-full p-6 rounded-2xl flex flex-col justify-center items-end gap-6 overflow-hidden bg-cover bg-center text-white"
              style={{
                backgroundImage: "url('/highlited-session.png')",
                backgroundColor: "rgba(0,0,0,0.7)",
                backgroundBlendMode: "multiply",
              }} // Added fallback color and blend mode
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
            {/* Potential other widgets or info can go here */}
          </div>
        </div>
      </main>

      {/* Mobile FAB for Create Job (Optional - shown below lg breakpoint when jobs exist) */}
      {!isLoadingJobs && jobs.length > 0 && (
        <button
          onClick={handleCreateNewJobClick}
          className="lg:hidden fixed bottom-6 right-6 z-30 p-3 bg-secondary-main rounded-full shadow-lg hover:bg-secondary-hover focus:outline-none focus:ring-2 focus:ring-secondary-focus focus:ring-offset-2 transition-colors"
          aria-label="Create new job"
        >
          <UilPlus className="size-6 text-neutral-90" />
        </button>
      )}

      {/* --- Job Creation Dialog --- */}
      <JobCreationDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onJobCreated={fetchJobs} // Pass fetchJobs to refresh the list
      />

      {/* Global Styles for Animations (can be moved to globals.css) */}
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
