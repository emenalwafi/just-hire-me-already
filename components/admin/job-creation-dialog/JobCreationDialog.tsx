"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { UilTimes } from "@iconscout/react-unicons";
import { addJob, getJobPostingConfiguration } from "@/services/dbServices";
import {
  JobPostingConfiguration,
  JobSpecificApplicationConfiguration,
  Job,
  SalaryRange,
  JobPostingFieldConfig,
} from "@/types/dbTypes";
import { v4 as uuidv4 } from "uuid";
import Input from "@/components/input/Input";
import ApplicationConfigEditor from "@/components/input/application-config-editor/ApplicationConfigEditor";
import { InputConfig } from "@/types/InputConfig";

/**
 * Props for the `JobCreationDialog` component.
 */
interface JobCreationDialogProps {
  /** Whether the dialog is currently open and visible. */
  isOpen: boolean;
  /** Callback function invoked when the dialog should be closed (e.g., overlay click, close button). */
  onClose: () => void;
  /** Callback function invoked after a job has been successfully created and saved. */
  onJobCreated: () => void;
}

/**
 * Helper function to format a number or string into an Indonesian Rupiah (IDR) format.
 * Removes non-digit characters and uses Indonesian locale for formatting.
 * @param {number | string | null | undefined} value - The value to format.
 * @returns {string} The formatted Rupiah string (e.g., "1.000.000") or an empty string if invalid.
 */
const formatRupiah = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === "") return "";
  const numStr = String(value).replace(/[^0-9]/g, "");
  if (numStr === "") return "";
  try {
    const number = parseInt(numStr, 10);
    return number.toLocaleString("id-ID");
  } catch {
    return "";
  }
};

/**
 * Helper function to parse an Indonesian Rupiah (IDR) formatted string back into a number.
 * Removes non-digit characters before parsing.
 * @param {string | null | undefined} value - The formatted Rupiah string to parse.
 * @returns {number | null} The parsed number, or null if the input is invalid or empty.
 */
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

/**
 * A modal dialog component for creating new job postings.
 * Fetches the job posting configuration, renders a dynamic form based on it,
 * handles validation, and submits the new job data.
 * @param {JobCreationDialogProps} props - The component props.
 * @returns {React.ReactElement | null} The rendered dialog or null if `isOpen` is false.
 */
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
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  /**
   * Effect hook to fetch the job posting configuration when the dialog opens.
   * Also resets the form state when the dialog closes.
   */
  useEffect(() => {
    if (isOpen && !postingConfig) {
      setIsLoading(true);
      setError(null);
      setValidationErrors({});
      getJobPostingConfiguration()
        .then((config) => {
          if (config) {
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
                initialData[field.key] = null;
              }
            });
            setFormData(initialData);
          } else {
            setError("Could not load job posting configuration.");
          }
        })
        .catch((err) => {
          setError("Failed to load configuration.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (!isOpen) {
      setPostingConfig(null);
      setFormData({});
      setError(null);
      setValidationErrors({});
      setIsLoading(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  /**
   * Memoized callback to handle changes in form inputs.
   * Clears validation errors for the specific field being changed.
   * Formats salary fields using `formatRupiah`.
   * @param {string} key - The key (name) of the input field being changed.
   * @param {any} value - The new value from the input component.
   */
  const handleFormChange = useCallback(
    (key: string, value: any) => {
      if (validationErrors[key]) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[key];
          return newErrors;
        });
      }

      if (key === "salaryMin" || key === "salaryMax") {
        const formattedValue = formatRupiah(value);
        setFormData((prev) => ({
          ...prev,
          [key]: formattedValue || null,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [key]: value,
        }));
      }
    },
    [validationErrors]
  );

  /**
   * Memoized callback to validate the entire form based on the `postingConfig`.
   * Checks for required fields and specific formats (like salary).
   * Sets the `validationErrors` state.
   * @returns {boolean} `true` if the form is valid, `false` otherwise.
   */
  const validateForm = useCallback(() => {
    if (!postingConfig) return false;
    const errors: Record<string, string> = {};
    let isValid = true;

    postingConfig.fields.forEach((field) => {
      if (field.required) {
        const value = formData[field.key];
        let isEmpty =
          value === null || value === undefined || String(value).trim() === "";

        if (
          field.type === "select" &&
          typeof value === "object" &&
          value !== null &&
          !value.value
        ) {
          isEmpty = true;
        }
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
      if (field.key === "salaryMin" || field.key === "salaryMax") {
        const numVal = parseRupiah(formData[field.key]);
        if (formData[field.key] && (numVal === null || numVal < 0)) {
          errors[field.key] = `${field.label} must be a valid positive number.`;
          isValid = false;
        }
      }
      const minSalary = parseRupiah(formData["salaryMin"]);
      const maxSalary = parseRupiah(formData["salaryMax"]);
      if (minSalary !== null && maxSalary !== null && maxSalary < minSalary) {
        if (!errors["salaryMax"]) {
          errors["salaryMax"] =
            "Maximum salary cannot be less than minimum salary.";
        }
        isValid = false;
      }
    });

    setValidationErrors(errors);
    return isValid;
  }, [postingConfig, formData]);

  /**
   * Memoized callback to handle the "Publish Job" action.
   * Validates the form, constructs the `Job` object, saves it using `addJob`,
   * calls `onJobCreated`, and closes the dialog on success.
   * Sets error state on failure.
   */
  const handlePublish = useCallback(async () => {
    setError(null);
    setValidationErrors({});
    if (!postingConfig || !validateForm()) {
      setError("Please fill in all required fields correctly.");
      return;
    }

    setIsSubmitting(true);

    const title = formData.title || "Untitled Job";
    const slug = title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const minSalaryNum = parseRupiah(formData.salaryMin);
    const maxSalaryNum = parseRupiah(formData.salaryMax);

    const newJob: Job = {
      id: uuidv4(),
      slug: `${slug}-${Date.now()}`,
      title: title,
      jobType: formData.jobType?.value || formData.jobType || "Not Specified",
      description: formData.description || "",
      candidatesNeeded: formData.candidatesNeeded
        ? parseInt(formData.candidatesNeeded, 10) || undefined
        : undefined,
      status: formData.status?.value || formData.status || "draft",
      salary_range: {
        min: minSalaryNum ?? 0,
        max: maxSalaryNum ?? 0,
        currency: "IDR",
        display_text:
          minSalaryNum === null && maxSalaryNum === null
            ? "Not specified"
            : `Rp${minSalaryNum?.toLocaleString("id-ID") ?? "?"} - Rp${
                maxSalaryNum?.toLocaleString("id-ID") ?? "?"
              }`,
      },
      applicationConfiguration:
        formData.applicationConfig as JobSpecificApplicationConfiguration,
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

    try {
      await addJob(newJob);
      onJobCreated();
      onClose();
    } catch (publishError: any) {
      setError(publishError.message || "Failed to create job.");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, postingConfig, onClose, onJobCreated, validateForm]);

  /**
   * Handles clicks on the dialog overlay to close the dialog,
   * unless the form is currently submitting.
   * @param {React.MouseEvent<HTMLDivElement>} e - The mouse event.
   */
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  const rupiahPrefix = (
    <span className="font-bold text-neutral-90 mr-1">Rp</span>
  );

  /**
   * Generates the appropriate `InputConfig` for a given field definition,
   * including merging validation errors and adding prefixes for salary fields.
   * @param {JobPostingFieldConfig} field - The field configuration from the posting config.
   * @returns {InputConfig} The configuration object ready to be passed to the `Input` component.
   */
  const getConfigForInput = (field: JobPostingFieldConfig): InputConfig => {
    const configWithError = {
      ...field,
      error: validationErrors[field.key] || field.error,
    };
    if (field.key === "salaryMin" || field.key === "salaryMax") {
      return {
        ...configWithError,
        type: "text",
        inputMode: "numeric",
        prefixCustom: rupiahPrefix,
      } as InputConfig;
    }
    if (field.key === "candidatesNeeded") {
      return {
        ...configWithError,
        type: "number",
      } as InputConfig;
    }

    if (field.type === "select" && field.options) {
      return { ...configWithError, options: field.options } as InputConfig;
    }

    return configWithError as InputConfig;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 fade-in"
      onClick={handleOverlayClick}
    >
      <div
        className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-neutral-10 shadow-xl scale-in max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
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
            <form
              id="job-creation-form"
              onSubmit={(e) => {
                e.preventDefault();
                handlePublish();
              }}
              className="space-y-6"
            >
              {postingConfig.fields
                .filter((field) => field.type !== "applicationConfigEditor")
                .map((field) => {
                  if (field.key === "salaryMin" || field.key === "salaryMax") {
                    if (field.key === "salaryMin") {
                      const maxField = postingConfig.fields.find(
                        (f) => f.key === "salaryMax"
                      );
                      return (
                        <div
                          key="salary-section"
                          className="self-stretch flex flex-col justify-start items-start gap-4 pt-6"
                        >
                          <div className="self-stretch h-0 outline outline-1 outline-offset-[-0.50px] outline-neutral-40" />
                          <div className="w-full justify-start text-neutral-90 text-sm font-semibold mb-2">
                            Job Salary
                          </div>
                          <div className="self-stretch flex flex-col sm:flex-row justify-start items-start gap-4">
                            <div className="flex-1 w-full sm:w-auto">
                              <Input
                                config={getConfigForInput(field)}
                                value={formData[field.key]}
                                onChange={(value) =>
                                  handleFormChange(field.key, value)
                                }
                              />
                            </div>
                            <div className="hidden sm:flex items-center pt-10">
                              <div className="w-4 h-0 outline outline-1 outline-offset-[-0.50px] outline-neutral-40"></div>
                            </div>
                            <div className="block sm:hidden w-full h-4"></div>
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
                    return null;
                  } else {
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
          {!isSubmitting && error && postingConfig && (
            <p className="mt-4 text-center text-sm text-danger-main">{error}</p>
          )}
        </div>

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
            }
            className="cursor-pointer rounded-lg bg-primary-main px-4 py-1.5 text-sm font-bold text-neutral-10 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.12)] hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary-focus focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Publishing..." : "Publish Job"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobCreationDialog;
