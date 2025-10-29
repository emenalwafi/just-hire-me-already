import React, { useState } from "react";
import Link from "next/link";
import { Job } from "@/types/dbTypes";
import {
  UilToggleOn,
  UilToggleOff,
  UilSpinnerAlt,
} from "@iconscout/react-unicons"; // Added UilSpinnerAlt for loading

interface JobCardProps {
  job: Job;
  // Callback to notify parent about status toggle request
  onStatusToggle: (
    jobId: string,
    currentStatus: "active" | "closed" | "draft"
  ) => Promise<void>; // Make it async
}

/**
 * Displays a summary card for a job opening in the admin view.
 * Includes job title, salary, status badge, post date, and action buttons.
 */
const JobCard: React.FC<JobCardProps> = ({ job, onStatusToggle }) => {
  const [isToggling, setIsToggling] = useState(false); // State for loading indicator

  // Determine badge style based on job status
  const getStatusBadge = () => {
    switch (job.status) {
      case "active":
        return (
          <div
            data-type="Active"
            className="flex items-center gap-2 rounded-lg bg-success-surface px-3 py-1 text-sm outline outline-1 outline-offset-[-1px] outline-success-border md:px-4 md:py-1 md:text-base"
          >
            <div className="font-bold text-success-main">Active</div>
          </div>
        );
      case "draft":
        return (
          <div
            data-type="Drafted"
            className="flex items-center gap-2 rounded-lg bg-secondary-surface px-3 py-1 text-sm outline outline-1 outline-offset-[-1px] outline-secondary-border md:px-4 md:py-1 md:text-base"
          >
            <div className="font-bold text-secondary-main">Draft</div>
          </div>
        );
      case "closed": // Treat 'closed' as 'inactive' for display
      default:
        return (
          <div
            data-type="Inactive" // Changed data-type for clarity
            className="flex items-center gap-2 rounded-lg bg-danger-surface px-3 py-1 text-sm outline outline-1 outline-offset-[-1px] outline-danger-border md:px-4 md:py-1 md:text-base"
          >
            <div className="font-bold text-danger-main">Inactive</div>
          </div>
        );
    }
  };

  const handleToggleClick = async () => {
    // Prevent toggling drafts or if already toggling
    if (job.status === "draft" || isToggling) return;
    setIsToggling(true);
    try {
      // Call the async function passed from the parent
      await onStatusToggle(job.id, job.status);
    } catch (error) {
      console.error("Error toggling status in JobCard:", error);
      // Error handling (e.g., showing a notification) could be done here
      // or rely on the parent component's error handling which reverts the state.
    } finally {
      setIsToggling(false);
    }
  };

  const isActive = job.status === "active";

  return (
    <div className="self-stretch rounded-2xl bg-neutral-10 p-4 shadow-[0px_4px_8px_0px_rgba(0,0,0,0.10)] md:p-6">
      {/* Top Row: Badges & Toggle */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 md:gap-4">
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          {getStatusBadge()}
          <div
            data-type="Dimulai"
            className="rounded px-3 py-1 text-sm outline outline-1 outline-offset-[-1px] outline-neutral-200 md:px-4 md:py-1 md:text-base"
          >
            <div className="text-neutral-700">
              {" "}
              {/* Adjusted text color */}
              {job.list_card?.started_on_text || "Date N/A"}
            </div>
          </div>
        </div>
        {/* Status Toggle - Don't show for drafts */}
        {job.status !== "draft" && (
          <button
            onClick={handleToggleClick}
            disabled={isToggling}
            className={`flex items-center gap-1 rounded-full px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 ${
              isActive
                ? "text-success-main hover:bg-success-surface focus:ring-success-main"
                : "text-danger-main hover:bg-danger-surface focus:ring-danger-main"
            }`}
            aria-label={isActive ? "Deactivate Job" : "Activate Job"}
            title={isActive ? "Deactivate Job" : "Activate Job"}
          >
            {isToggling ? (
              <UilSpinnerAlt size="24" className="animate-spin" />
            ) : isActive ? (
              <UilToggleOn size="24" />
            ) : (
              <UilToggleOff size="24" />
            )}
            <span className="hidden sm:inline">
              {isActive ? "Active" : "Inactive"}
            </span>
          </button>
        )}
      </div>

      {/* Bottom Row: Info & Manage Button */}
      <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
        {/* Job Title & Salary */}
        <div className="w-full md:w-auto">
          <div
            className="mb-1 truncate text-lg font-bold text-neutral-100 md:mb-2 md:text-xl"
            title={job.title}
          >
            {job.title || "Untitled Job"}
          </div>
          <div className="text-base text-neutral-700 md:text-lg">
            {job.salary_range?.display_text || "Salary not specified"}
          </div>
        </div>

        {/* Manage Button */}
        <div className="flex-shrink-0">
          <Link
            href={`/admin/jobs/${job.id}/candidates`}
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-primary-main px-4 py-1 text-sm font-bold text-neutral-10 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.12)] hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary-focus focus:ring-offset-1 md:text-base"
          >
            {job.list_card?.cta || "Manage Job"}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
