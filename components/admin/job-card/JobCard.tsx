import React from "react";
import Link from "next/link";
import type { Job } from "@/types/dbTypes"; // Assuming Job type is defined here
import { UilToggleOn, UilToggleOff } from "@iconscout/react-unicons"; // Example icons for toggle

interface JobCardProps {
  job: Job;
  onStatusToggle: (jobId: string, newStatus: 'active' | 'closed') => void;
}

const JobCard: React.FC<JobCardProps> = ({ job /*, onStatusToggle */ }) => {
  // Determine status badge styling based on job.status
  const getStatusBadge = () => {
    switch (job.status) {
      case "active":
        return (
          <div
            data-type="Active"
            className="px-4 py-1 bg-success-surface rounded-lg outline outline-1 outline-offset-[-1px] outline-success-border flex justify-start items-center gap-2"
          >
            <div className="text-right justify-start text-success-main text-sm md:text-base font-bold">
              {" "}
              {/* Adjusted font size for responsiveness */}
              Active
            </div>
          </div>
        );
      case "draft":
        return (
          <div
            data-type="Drafted"
            className="px-4 py-1 bg-secondary-surface rounded-lg outline outline-1 outline-offset-[-1px] outline-secondary-border inline-flex justify-start items-center gap-2"
          >
            <div className="text-right justify-start text-secondary-main text-sm md:text-base font-bold">
              {" "}
              {/* Adjusted font size */}
              Draft
            </div>
          </div>
        );
      case "closed": // Treat 'closed' as 'Inactive' for display
      default:
        return (
          <div
            data-type="Not Active"
            className="px-4 py-1 bg-danger-surface rounded-lg outline outline-1 outline-offset-[-1px] outline-danger-border inline-flex justify-start items-center gap-2"
          >
            <div className="text-right justify-start text-danger-main text-sm md:text-base font-bold">
              {" "}
              {/* Adjusted font size */}
              Inactive
            </div>
          </div>
        );
    }
  };

  // Placeholder handler for the toggle
  const handleToggleClick = () => {
    // const newStatus = job.status === 'active' ? 'closed' : 'active';
    // onStatusToggle(job.id, newStatus);
    console.log(`Toggle status for job ${job.id}`); // Placeholder action
  };

  return (
    <div className="self-stretch p-4 md:p-6 bg-neutral-10 rounded-2xl shadow-[0px_4px_8px_0px_rgba(0,0,0,0.10)] flex flex-col justify-start items-start gap-3">
      {/* Top Row: Status Badges and Toggle */}
      <div className="self-stretch flex flex-wrap justify-between items-center gap-2 md:gap-4">
        {" "}
        {/* Added flex-wrap and gap */}
        {/* Status Area */}
        <div className="flex justify-start items-center gap-2 md:gap-4">
          {" "}
          {/* Adjusted gap */}
          {getStatusBadge()}
          <div
            data-type="Dimulai"
            className="px-4 py-1 rounded outline outline-1 outline-offset-[-1px] outline-neutral-200 flex justify-start items-center gap-2"
          >
            <div className="justify-start text-neutral-90 text-xs md:text-base whitespace-nowrap">
              {" "}
              {/* Adjusted font size and wrapping */}
              {job.list_card.started_on_text || "Date N/A"}
            </div>
          </div>
        </div>
        {/* Status Toggle (Show only if not draft) */}
        {job.status !== "draft" && (
          <button
            onClick={handleToggleClick}
            className="flex items-center gap-1 text-sm text-neutral-70 hover:text-primary-main focus:outline-none focus:ring-1 focus:ring-primary-focus rounded p-1"
            aria-label={
              job.status === "active" ? "Deactivate job" : "Activate job"
            }
          >
            {job.status === "active" ? (
              <UilToggleOn size="24" className="text-success-main" />
            ) : (
              <UilToggleOff size="24" className="text-neutral-500" />
            )}
            <span className="hidden sm:inline">
              {job.status === "active" ? "Active" : "Inactive"}
            </span>
          </button>
        )}
      </div>

      {/* Bottom Row: Job Title, Salary, Manage Button */}
      <div className="self-stretch flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
        {/* Job Title and Salary */}
        <div className="flex flex-col justify-start items-start gap-1 md:gap-2 flex-grow min-w-0">
          {" "}
          {/* Allow shrinking */}
          <div className="justify-start text-neutral-100 text-lg md:text-xl font-bold truncate w-full">
            {" "}
            {/* Added truncate */}
            {job.title || "Untitled Job"}
          </div>
          <div className="justify-start text-zinc-600 text-sm md:text-lg">
            {job.salary_range.display_text || "Salary not specified"}
          </div>
        </div>

        {/* Manage Button */}
        <div className="flex-shrink-0">
          {" "}
          {/* Prevent button from shrinking */}
          <Link
            href={`/admin/jobs/${job.id}/candidates`} // Link to candidate list page
            className="px-4 py-1 bg-primary-main rounded-lg shadow-[0px_1px_2px_0px_rgba(0,0,0,0.12)] flex justify-center items-center gap-1 hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary-focus focus:ring-offset-1 transition-colors"
          >
            <div className="text-center justify-center text-neutral-10 text-base font-bold whitespace-nowrap">
              {job.list_card.cta || "Manage Job"}
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
