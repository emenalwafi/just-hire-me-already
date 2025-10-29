"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation"; // If needed for navigation after submit
import Input from "@/components/input/Input";
import {
  TextInputConfig,
  InputValue,
  UnifiedChangeValue,
} from "@/types/InputConfig";
import {
  UilExclamationTriangle,
  UilCheck,
} from "@iconscout/react-unicons";
import { getUserByEmail } from "@/services/dbServices"; // Import the DB service

// Define states for email validation check
type EmailCheckStatus =
  | "idle"
  | "checking"
  | "exists"
  | "available"
  | "invalid_format";

const RegistrationPage: React.FC = () => {
  const [email, setEmail] = useState<InputValue>(null);
  const [emailCheckStatus, setEmailCheckStatus] =
    useState<EmailCheckStatus>("idle");
  const [isLoading, setIsLoading] = useState(false); // For form submission loading state
  const router = useRouter(); // If needed later
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Icons ---
  const errorIcon = (
    <UilExclamationTriangle size="16" className="text-danger-main" />
  );
  const successIcon = (
    <UilCheck size="16" className="text-success-main" />
  );

  // --- Email Check Logic ---
  const checkEmailExistence = useCallback(async (emailToCheck: string) => {
    if (!emailToCheck || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToCheck)) {
      setEmailCheckStatus("invalid_format"); // Invalid format, don't check DB
      return;
    }

    setEmailCheckStatus("checking");
    try {
      const user = await getUserByEmail(emailToCheck);
      setEmailCheckStatus(user ? "exists" : "available");
    } catch (error) {
      console.error("Error checking email:", error);
      setEmailCheckStatus("idle"); // Reset on error
    }
  }, []);

  // --- Debounced Effect for Email Check ---
  useEffect(() => {
    const currentEmail = email as string | null;

    // Clear previous timeout if user is still typing
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Reset status if email is empty or just whitespace
    if (!currentEmail || currentEmail.trim() === "") {
      setEmailCheckStatus("idle");
      return;
    }

    // Set a new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      checkEmailExistence(currentEmail.trim());
    }, 1000); // Check after 1 second of inactivity

    // Cleanup function to clear timeout if component unmounts or email changes again
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [email, checkEmailExistence]);

  // --- Input Change Handler ---
  const handleEmailChange = (value: UnifiedChangeValue) => {
    const newEmail = value as string | null;
    setEmail(newEmail);
    // Reset status immediately on typing, debounce will trigger check later
    if (emailCheckStatus !== "checking") {
      setEmailCheckStatus("idle");
    }
  };

  // --- Form Submission Handler ---
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    const emailValue = email as string | null;

    // Final check before submission
    if (!emailValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      setEmailCheckStatus("invalid_format");
      setIsLoading(false);
      return;
    }

    // Explicitly re-check existence right before submitting in case debounce didn't finish
    // or state is somehow stale.
    try {
      const user = await getUserByEmail(emailValue);
      if (user) {
        setEmailCheckStatus("exists");
        setIsLoading(false);
        return;
      }
      // Ensure status is available before proceeding
      if (emailCheckStatus !== "available" && !user) {
        // If check result wasn't 'available' but user doesn't exist now, update status
        setEmailCheckStatus("available");
        // It's safe to proceed below
      }
    } catch (error) {
      console.error("Error checking email on submit:", error);
      setEmailCheckStatus("idle"); // Reset on error
      setIsLoading(false);
      return; // Stop submission on error
    }

    // Proceed if email is valid and available
    console.log("Submitting registration for:", emailValue);
    // TODO: Implement actual registration logic (e.g., send magic link, navigate)
    alert("Registration logic (e.g., sending magic link) not implemented yet.");

    // Simulate API call delay
    setTimeout(() => {
      // Example: Navigate to a confirmation page or show success message
      // router.push('/register/check-email');
      setIsLoading(false);
    }, 1500);
  };

  // --- Google Registration Handler ---
  const handleGoogleRegister = useCallback(() => {
    console.log("Initiating Google Register...");
    // TODO: Implement Google Sign-up logic
    alert("Google Register functionality not yet implemented.");
    setEmailCheckStatus("idle"); // Clear any email checks
  }, []);

  // --- Input Config ---
  const emailConfig: TextInputConfig = {
    type: "email",
    name: "email",
    label: "Alamat email",
    placeholder: "Masukkan alamat email",
    required: true,
    // Show local format error preferentially, otherwise reflect global error state visually
    error:
      emailCheckStatus === "invalid_format"
        ? "Format email tidak valid"
        : emailCheckStatus === "exists",
    // Only show success message when status is 'available'
    successMessage:
      emailCheckStatus === "available"
        ? "Alamat email teridentifikasi"
        : undefined,
    successIcon: emailCheckStatus === "available" ? successIcon : undefined,
    errorIcon:
      emailCheckStatus === "invalid_format" || emailCheckStatus === "exists"
        ? errorIcon
        : undefined,
  };

  return (
    // Centering the content vertically and horizontally
    <div className="flex min-h-screen items-center justify-center bg-neutral-20 p-4 font-sans">
      {/* Form Container */}
      <div className="flex w-full max-w-md flex-col items-start gap-6">
        {/* Logo */}
        <Link href="/" aria-label="Go to homepage">
          <Image
            src="/rakamin-logo.png"
            alt="Rakamin Logo"
            width={144}
            height={48} // Adjusted height based on original img tag
            priority
          />
        </Link>
        {/* Card */}
        <div className="w-full md:w-[500px] rounded-lg bg-neutral-10 p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.12)] sm:p-8 md:p-10 flex flex-col items-start gap-4">
          {/* Header */}
          <div className="self-stretch flex flex-col justify-start items-start gap-2">
            <h1 className="text-neutral-100 text-heading-sm font-bold">
              {" "}
              {/* Using heading-sm as per design system */}
              Bergabung dengan Rakamin
            </h1>
            <div className="self-stretch">
              <span className="text-neutral-100 text-base">
                Sudah punya akun?{" "}
              </span>
              <Link
                href="/login"
                className="text-primary-main text-base hover:underline focus:outline-none focus:ring-1 focus:ring-primary-focus rounded"
              >
                Masuk
              </Link>
            </div>
          </div>

          {/* Global Error Message - Email Exists */}
          {emailCheckStatus === "exists" && (
            <div
              className="self-stretch px-2 py-0.5 bg-danger-surface rounded outline outline-1 outline-offset-[-1px] outline-danger-border inline-flex justify-center items-center gap-1"
              role="alert"
            >
              <div className="text-center justify-center flex-1">
                <span className="text-danger-main text-sm">
                  Email ini sudah terdaftar sebagai akun di Rakamin Academy.{" "}
                </span>
                <Link
                  href="/login"
                  className="text-danger-main text-sm font-bold hover:underline focus:outline-none focus:ring-1 focus:ring-danger-focus rounded"
                >
                  Masuk
                </Link>
              </div>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="self-stretch flex flex-col gap-4"
          >
            <Input
              config={emailConfig}
              value={email}
              onChange={handleEmailChange}
            />

            {/* Submit Button */}
            <button
              type="submit"
              className="self-stretch cursor-pointer px-4 py-1.5 bg-secondary-main rounded-lg shadow-[0px_1px_2px_0px_rgba(0,0,0,0.12)] inline-flex justify-center items-center gap-1 hover:bg-secondary-hover focus:outline-none focus:ring-2 focus:ring-secondary-focus focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="text-center justify-center text-neutral-90 text-lg font-bold">
                {isLoading ? "Memproses..." : "Daftar dengan email"}
              </span>
            </button>
          </form>

          {/* Separator */}
          <div className="self-stretch inline-flex justify-center items-center gap-3">
            <div className="flex-1 h-0 outline outline-1 outline-offset-[-0.50px] outline-neutral-60"></div>
            <span className="justify-end text-neutral-60 text-sm">or</span>
            <div className="flex-1 h-0 outline outline-1 outline-offset-[-0.50px] outline-neutral-60"></div>
          </div>

          {/* Google Register Button */}
          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={isLoading} // Disable during email submission
            className="cursor-pointer self-stretch px-6 py-3 bg-neutral-10 rounded-lg outline outline-2 outline-offset-[-2px] outline-neutral-40/50 inline-flex justify-center items-center gap-2.5 overflow-hidden hover:bg-neutral-20 focus:outline-none focus:ring-2 focus:ring-primary-focus focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {/* Using provided Google icon SVG */}
            <Image
              src="/google-icon.svg"
              alt="google-icon"
              width={24}
              height={24}
              aria-hidden="true"
            />

            <span className="justify-center text-neutral-100 text-base font-bold">
              {" "}
              {/* Adjusted text color */}
              Daftar dengan Google
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;
