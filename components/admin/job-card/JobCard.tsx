"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Job } from "@/types/dbTypes";
import {
  UilToggleOn,
  UilToggleOff,
  UilSpinnerAlt,
} from "@iconscout/react-unicons";

/**
 * Props for the `JobCard` component.
 */
interface JobCardProps {
  /** The job data object to display. */
  job: Job;
  /**
   * Asynchronous callback function invoked when the user clicks the status toggle button.
   * Receives the job ID and the job's current status.
   * The parent component is responsible for handling the actual status update and potential errors.
   */
  onStatusToggle: (
    jobId: string,
    currentStatus: "active" | "closed" | "draft"
  ) => Promise<void>;
}

/**
 * Displays a summary card for a job opening in the admin view.
 * Includes job title, salary, status badge, post date, and action buttons (manage, status toggle).
 * Shows a loading indicator while the status toggle is in progress.
 * @param {JobCardProps} props - The component props.
 * @returns {React.ReactElement} The rendered job card component.
 */
const JobCard: React.FC<JobCardProps> = ({ job, onStatusToggle }) => {
  const [isToggling, setIsToggling] = useState(false);

  /**
   * Determines the appropriate JSX for the status badge based on the job's status.
   * @returns {React.ReactElement} The styled badge element.
   */
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
      case "closed":
      default:
        return (
          <div
            data-type="Inactive"
            className="flex items-center gap-2 rounded-lg bg-danger-surface px-3 py-1 text-sm outline outline-1 outline-offset-[-1px] outline-danger-border md:px-4 md:py-1 md:text-base"
          >
            <div className="font-bold text-danger-main">Inactive</div>
          </div>
        );
    }
  };

  /**
   * Handles the click event for the status toggle button.
   * Sets the loading state and calls the `onStatusToggle` prop.
   * Manages the loading state internally.
   */
  const handleToggleClick = async () => {
    if (job.status === "draft" || isToggling) return;
    setIsToggling(true);
    try {
      await onStatusToggle(job.id, job.status as "active" | "closed"); // Cast status here
    } catch (error) {
      // Parent component handles reverting state on error
    } finally {
      setIsToggling(false);
    }
  };

  const isActive = job.status === "active";

  return (
    <div className="self-stretch rounded-2xl bg-neutral-10 p-4 shadow-[0px_4px_8px_0px_rgba(0,0,0,0.10)] md:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 md:gap-4">
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          {getStatusBadge()}
          <div
            data-type="Dimulai"
            className="rounded px-3 py-1 text-sm outline outline-1 outline-offset-[-1px] outline-neutral-200 md:px-4 md:py-1 md:text-base"
          >
            <div className="text-neutral-700">
              {job.list_card?.started_on_text || "Date N/A"}
            </div>
          </div>
        </div>
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

      <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
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