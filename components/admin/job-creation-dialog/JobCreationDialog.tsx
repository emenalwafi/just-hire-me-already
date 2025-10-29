"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { UilTimes, UilDollarSignAlt } from "@iconscout/react-unicons";
import { addJob, getJobPostingConfiguration } from "@/services/dbServices"; // <<< Import addJob
import {
  JobPostingConfiguration,
  JobSpecificApplicationConfiguration,
  Job,
  SalaryRange,
  JobPostingFieldConfig,
} from "@/types/dbTypes"; // <<< Import Job type
import { v4 as uuidv4 } from "uuid"; // <<< Import uuid
import Input from "@/components/input/Input";
import ApplicationConfigEditor from "@/components/input/application-config-editor/ApplicationConfigEditor";
import { InputConfig } from "@/types/InputConfig";

interface JobCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: () => void; // Callback after successful creation
}

// Helper function to format number as Rupiah string
const formatRupiah = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === "") return "";
  const numStr = String(value).replace(/[^0-9]/g, ""); // Remove non-digits
  if (numStr === "") return "";
  try {
    const number = parseInt(numStr, 10);
    return number.toLocaleString("id-ID"); // Format with Indonesian locale (uses '.')
  } catch {
    return ""; // Return empty if parsing fails
  }
};

// Helper function to parse Rupiah string back to number
const parseRupiah = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const numStr = String(value).replace(/[^0-9]/g, "");
  if (numStr === "") return null;
  try {
    return parseInt(numStr, 10);
  } catch {
    return null;
  }
};

const JobCreationDialog: React.FC<JobCreationDialogProps> = ({
  isOpen,
  onClose,
  onJobCreated,
}) => {
  const [postingConfig, setPostingConfig] =
    useState<JobPostingConfiguration | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // State to track validation errors for each field
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Fetch configuration when dialog opens
  useEffect(() => {
    if (isOpen && !postingConfig) {
      setIsLoading(true);
      setError(null);
      setValidationErrors({}); // Clear validation errors on open
      getJobPostingConfiguration()
        .then((config) => {
          if (config) {
            console.log(config, 'hey check this out');
            
            setPostingConfig(config);
            const initialData: Record<string, any> = {};
            config.fields.forEach((field) => {
              if (
                field.type === "applicationConfigEditor" &&
                field.defaultValue
              ) {
                initialData[field.key] = JSON.parse(
                  JSON.stringify(field.defaultValue)
                );
              } else {
                initialData[field.key] = null; // Default other fields to null
              }
            });
            setFormData(initialData);
          } else {
            setError("Could not load job posting configuration.");
            console.error("Job Posting Configuration not found in DB.");
          }
        })
        .catch((err) => {
          console.error("Error fetching job posting configuration:", err);
          setError("Failed to load configuration.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (!isOpen) {
      // Reset state when closing fully
      // Moved this inside if(!isOpen) block
      setPostingConfig(null);
      setFormData({});
      setError(null);
      setValidationErrors({});
      setIsLoading(false);
      setIsSubmitting(false);
    }
  }, [isOpen]); // <<<< Removed postingConfig dependency to prevent re-fetching/resetting formData

  // Handler for form input changes, including salary formatting
  const handleFormChange = useCallback(
    (key: string, value: any) => {
      // Clear validation error for this field on change
      if (validationErrors[key]) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[key];
          return newErrors;
        });
      }

      if (key === "salaryMin" || key === "salaryMax") {
        // Format Rupiah, store formatted string
        const formattedValue = formatRupiah(value);
        setFormData((prev) => ({
          ...prev,
          [key]: formattedValue || null, // Store null if empty/invalid
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [key]: value,
        }));
      }
    },
    [validationErrors]
  ); // Added validationErrors dependency

  // Validate form data based on configuration
  const validateForm = useCallback(() => {
    if (!postingConfig) return false;
    const errors: Record<string, string> = {};
    let isValid = true;

    postingConfig.fields.forEach((field) => {
      if (field.required) {
        const value = formData[field.key];
        let isEmpty =
          value === null || value === undefined || String(value).trim() === "";

        // Special check for dropdowns/objects that might be stored as {id: ..., label: ...}
        if (
          field.type === "select" &&
          typeof value === "object" &&
          value !== null &&
          !value.value
        ) {
          isEmpty = true; // Treat empty dropdown object as empty
        }
        // Special check for application config (ensure it's not empty/default - could add more checks)
        if (
          field.type === "applicationConfigEditor" &&
          (!value || !value.sections || value.sections.length === 0)
        ) {
          isEmpty = true;
        }

        if (isEmpty) {
          errors[field.key] = `${field.label} is required.`;
          isValid = false;
        }
      }
      // Add more specific validation if needed (e.g., number ranges, email format)
      if (field.key === "salaryMin" || field.key === "salaryMax") {
        const numVal = parseRupiah(formData[field.key]);
        if (formData[field.key] && (numVal === null || numVal < 0)) {
          errors[field.key] = `${field.label} must be a valid positive number.`;
          isValid = false;
        }
      }
      // Check if max salary is less than min salary
      const minSalary = parseRupiah(formData["salaryMin"]);
      const maxSalary = parseRupiah(formData["salaryMax"]);
      if (minSalary !== null && maxSalary !== null && maxSalary < minSalary) {
        if (!errors["salaryMax"]) {
          // Avoid duplicate error messages
          errors["salaryMax"] =
            "Maximum salary cannot be less than minimum salary.";
        }
        isValid = false;
      }
    });

    setValidationErrors(errors);
    return isValid;
  }, [postingConfig, formData]);

  // Handler for the publish action
  const handlePublish = useCallback(async () => {
    setError(null);
    setValidationErrors({}); // Clear previous validation errors
    if (!postingConfig || !validateForm()) {
      setError("Please fill in all required fields correctly.");
      return; // Stop if validation fails or config not loaded
    }

    setIsSubmitting(true);

    // Construct Job object
    const title = formData.title || "Untitled Job";
    const slug = title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const minSalaryNum = parseRupiah(formData.salaryMin);
    const maxSalaryNum = parseRupiah(formData.salaryMax);

    const newJob: Job = {
      id: uuidv4(),
      slug: `${slug}-${Date.now()}`, // Add timestamp for uniqueness
      title: title,
      jobType: formData.jobType?.value || formData.jobType || "Not Specified", // Handle dropdown object or plain value
      description: formData.description || "",
      candidatesNeeded: formData.candidatesNeeded
        ? parseInt(formData.candidatesNeeded, 10) || undefined
        : undefined,
      status: formData.status?.value || formData.status || "draft", // Handle dropdown or plain value
      salary_range: {
        min: minSalaryNum ?? 0,
        max: maxSalaryNum ?? 0,
        currency: "IDR",
        // Generate display text dynamically
        display_text:
          minSalaryNum === null && maxSalaryNum === null
            ? "Not specified"
            : `Rp${minSalaryNum?.toLocaleString("id-ID") ?? "?"} - Rp${
                maxSalaryNum?.toLocaleString("id-ID") ?? "?"
              }`,
      },
      // Use the application config from formData
      applicationConfiguration:
        formData.applicationConfig as JobSpecificApplicationConfiguration,
      // Create default list_card info
      list_card: {
        badge: formData.status?.value || formData.status || "Draft",
        started_on_text: `Created ${new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}`,
        cta: "Manage Job",
      },
    };

    console.log("Publishing Job:", newJob);

    try {
      await addJob(newJob);
      console.log("Job created successfully.");
      onJobCreated(); // Call callback to refresh list
      onClose(); // Close dialog
    } catch (publishError: any) {
      console.error("Error creating job:", publishError);
      setError(publishError.message || "Failed to create job.");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, postingConfig, onClose, onJobCreated, validateForm]); // Added validateForm

  // Handle click on overlay to close
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  // --- Render Logic ---
  if (!isOpen) {
    return null;
  }

  // Define the Rupiah prefix component
  const rupiahPrefix = (
    <span className="font-bold text-neutral-90 mr-1">Rp</span>
  );

  // Function to get config with error message and potentially prefix
  const getConfigForInput = (field: JobPostingFieldConfig): InputConfig => {
    const configWithError = {
      ...field,
      error: validationErrors[field.key] || field.error, // Combine static and dynamic errors
    };
    // Add prefix for salary fields
    if (field.key === "salaryMin" || field.key === "salaryMax") {
      return {
        ...configWithError,
        type: "text", // Use text type for formatting
        inputMode: "numeric", // Hint for mobile keyboards
        prefixCustom: rupiahPrefix,
      } as InputConfig; // Cast necessary because TS doesn't narrow well here
    }
    // Ensure correct type for candidateNeeded
    if (field.key === "candidatesNeeded") {
      return {
        ...configWithError,
        type: "number", // Ensure it's number type
      } as InputConfig;
    }

    // For select types, ensure options are passed correctly
    if (field.type === "select" && field.options) {
      return { ...configWithError, options: field.options } as InputConfig;
    }

    return configWithError as InputConfig; // Cast to base InputConfig
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 fade-in"
      onClick={handleOverlayClick}
    >
      <div
        className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-neutral-10 shadow-xl scale-in max-h-[90vh]" // Increased max-w-4xl
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-neutral-30 p-4 md:p-6">
          <h2
            id="dialog-title"
            className="text-lg font-bold text-neutral-90 md:text-xl"
          >
            Create a New Job Opening
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full p-1 text-neutral-60 hover:bg-neutral-20 disabled:opacity-50"
            aria-label="Close dialog"
          >
            <UilTimes size="24" />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          {isLoading && (
            <p className="text-center text-neutral-60">
              Loading configuration...
            </p>
          )}
          {!isLoading && error && !postingConfig && (
            <p className="text-center text-danger-main">{error}</p>
          )}
          {postingConfig ? (
            // Added space-y-6 for vertical spacing between elements
            <form
              id="job-creation-form"
              onSubmit={(e) => {
                e.preventDefault();
                handlePublish();
              }}
              className="space-y-6"
            >
              {/* --- Render Standard Fields --- */}
              {postingConfig.fields
                .filter((field) => field.type !== "applicationConfigEditor") // Exclude the special editor type
                .map((field) => {
                  // Specific layout for salary fields
                  if (field.key === "salaryMin" || field.key === "salaryMax") {
                    // Render salary fields only once, within their container
                    if (field.key === "salaryMin") {
                      const maxField = postingConfig.fields.find(
                        (f) => f.key === "salaryMax"
                      );
                      return (
                        <div
                          key="salary-section"
                          className="self-stretch flex flex-col justify-start items-start gap-4 pt-6"
                        >
                          {" "}
                          {/* Added pt-6 */}
                          <div className="self-stretch h-0 outline outline-1 outline-offset-[-0.50px] outline-neutral-40" />
                          <div className="w-full justify-start text-neutral-90 text-sm font-semibold mb-2">
                            Job Salary
                          </div>{" "}
                          {/* Adjusted styling */}
                          <div className="self-stretch flex flex-col sm:flex-row justify-start items-start gap-4">
                            {/* Min Salary */}
                            <div className="flex-1 w-full sm:w-auto">
                              <Input
                                config={getConfigForInput(field)}
                                value={formData[field.key]}
                                onChange={(value) =>
                                  handleFormChange(field.key, value)
                                }
                              />
                            </div>
                            {/* Separator */}
                            <div className="hidden sm:flex items-center pt-10">
                              {" "}
                              {/* Adjusted top padding */}
                              <div className="w-4 h-0 outline outline-1 outline-offset-[-0.50px] outline-neutral-40"></div>
                            </div>
                            <div className="block sm:hidden w-full h-4"></div>{" "}
                            {/* Spacer for mobile */}
                            {/* Max Salary */}
                            {maxField && (
                              <div className="flex-1 w-full sm:w-auto">
                                <Input
                                  config={getConfigForInput(maxField)}
                                  value={formData[maxField.key]}
                                  onChange={(value) =>
                                    handleFormChange(maxField.key, value)
                                  }
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null; // Don't render salaryMax individually
                  } else {
                    // Render other fields directly
                    return (
                        <Input
                          key={field.key}
                          config={getConfigForInput(field)}
                          value={formData[field.key]}
                          onChange={(value) => handleFormChange(field.key, value)}
                        />
                    );
                  }
                })}

              {/* --- Render Application Config Editor --- */}
              {postingConfig.fields
                .filter((field) => field.type === "applicationConfigEditor")
                .map((field) => (
                  <ApplicationConfigEditor
                    key={field.key}
                    value={formData[field.key]}
                    onChange={(value) => handleFormChange(field.key, value)}
                  />
                ))}
            </form>
          ) : null}
          {/* Display submission error */}
          {!isSubmitting && error && postingConfig && (
            <p className="mt-4 text-center text-sm text-danger-main">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-shrink-0 items-center justify-end gap-3 border-t border-neutral-30 p-4 md:p-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="cursor-pointer rounded-lg border border-neutral-40 px-4 py-1.5 text-sm font-bold text-neutral-70 hover:bg-neutral-20 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="job-creation-form"
            disabled={
              isLoading ||
              isSubmitting ||
              !postingConfig ||
              Object.keys(validationErrors).length > 0
            } // <<< Also disable if validation errors exist
            className="cursor-pointer rounded-lg bg-primary-main px-4 py-1.5 text-sm font-bold text-neutral-10 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.12)] hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary-focus focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed" // Changed to primary button
          >
            {isSubmitting ? "Publishing..." : "Publish Job"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobCreationDialog;
