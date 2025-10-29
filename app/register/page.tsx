// app/register/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Keep this
import { useDispatch } from "react-redux"; // Import useDispatch
import type { AppDispatch } from "@/store/store"; // Import AppDispatch type
import { register, requestEmailLink } from "@/store/authSlice"; // Import register and requestEmailLink
import Input from "@/components/input/Input";
import {
  TextInputConfig,
  InputValue,
  UnifiedChangeValue,
} from "@/types/InputConfig";
import { UilExclamationTriangle, UilCheck } from "@iconscout/react-unicons";
import { getUserByEmail } from "@/services/dbServices";

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
  const [isLoading, setIsLoading] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null); // State for registration/link errors
  const router = useRouter();
  const dispatch: AppDispatch = useDispatch(); // Initialize useDispatch
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Icons ---
  const errorIcon = (
    <UilExclamationTriangle size="16" className="text-danger-main" />
  );
  const successIcon = <UilCheck size="16" className="text-success-main" />;

  // --- Email Check Logic (Keep as is) ---
  const checkEmailExistence = useCallback(async (emailToCheck: string) => {
    if (!emailToCheck || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToCheck)) {
      setEmailCheckStatus("invalid_format");
      return;
    }
    setEmailCheckStatus("checking");
    try {
      const user = await getUserByEmail(emailToCheck);
      setEmailCheckStatus(user ? "exists" : "available");
    } catch (error) {
      console.error("Error checking email:", error);
      setEmailCheckStatus("idle");
    }
  }, []);

  // --- Debounced Effect for Email Check (Keep as is) ---
  useEffect(() => {
    const currentEmail = email as string | null;
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (!currentEmail || currentEmail.trim() === "") {
      setEmailCheckStatus("idle");
      return;
    }
    debounceTimeoutRef.current = setTimeout(() => {
      checkEmailExistence(currentEmail.trim());
    }, 1000);
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [email, checkEmailExistence]);

  // --- Input Change Handler (Keep as is) ---
  const handleEmailChange = (value: UnifiedChangeValue) => {
    const newEmail = value as string | null;
    setEmail(newEmail);
    setSubmissionError(null); // Clear submission error on type
    if (emailCheckStatus !== "checking") {
      setEmailCheckStatus("idle");
    }
  };

  // --- *** UPDATED Form Submission Handler *** ---
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setSubmissionError(null); // Clear previous errors
    const emailValue = (email as string | null)?.trim();

    // 1. Final Validation Check
    if (!emailValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      setEmailCheckStatus("invalid_format");
      setIsLoading(false);
      return;
    }

    // 2. Re-check email existence just before submission
    try {
      const existingUser = await getUserByEmail(emailValue);
      if (existingUser) {
        setEmailCheckStatus("exists");
        setIsLoading(false);
        return;
      }
      // Explicitly set to available if it wasn't already and no user found
      if (emailCheckStatus !== "available") {
        setEmailCheckStatus("available");
      }
    } catch (error) {
      console.error("Error re-checking email on submit:", error);
      setSubmissionError("Could not verify email status. Please try again.");
      setEmailCheckStatus("idle");
      setIsLoading(false);
      return;
    }

    // 3. Register User with Default Password
    try {
      // Use email as default name for simplicity, assume 'candidate' role
      await dispatch(
        register({
          email: emailValue,
          name: emailValue.split("@")[0] || "New User", // Basic default name
          plainPassword: "password", // Your specified default password
          role: "candidate",
        })
      ).unwrap(); // unwrap() throws if rejected

      console.log("User registered successfully with default password.");

      // 4. Request Login Link for the newly registered user
      try {
        const token = await dispatch(
          requestEmailLink({ email: emailValue })
        ).unwrap(); // unwrap() throws if rejected

        console.log("Login link requested successfully. Token:", token);

        // 5. Redirect to an intermediary page (create this next)
        router.push(`/register/check-email?token=${token}&email=${emailValue}`);
        // No need to setIsLoading(false) here as we are navigating away
      } catch (linkError: any) {
        console.error(
          "Error requesting login link after registration:",
          linkError
        );
        // Show error, maybe let user retry requesting link?
        setSubmissionError(
          linkError || "Failed to generate login link after registration."
        );
        setIsLoading(false);
      }
    } catch (registerError: any) {
      console.error("Error during registration:", registerError);
      // If registration failed (e.g., email somehow became taken between check and register),
      // update the status and show error.
      if (registerError?.includes("already exists")) {
        setEmailCheckStatus("exists");
      } else {
        setSubmissionError(
          registerError || "Registration failed. Please try again."
        );
      }
      setIsLoading(false);
    }
  };
  // --- END UPDATED Form Submission Handler ---

  // --- Google Registration Handler (Keep as is) ---
  const handleGoogleRegister = useCallback(() => {
    console.log("Initiating Google Register...");
    alert("Google Register functionality not yet implemented.");
    setEmailCheckStatus("idle");
  }, []);

  // --- Input Config (Keep as is, error handling updated) ---
  const emailConfig: TextInputConfig = {
    type: "email",
    name: "email",
    label: "Alamat email",
    placeholder: "Masukkan alamat email",
    required: true,
    error:
      emailCheckStatus === "invalid_format"
        ? "Format email tidak valid"
        : emailCheckStatus === "exists" || !!submissionError, // Show red border for submission errors too
    successMessage:
      emailCheckStatus === "available" && !submissionError
        ? "Alamat email tersedia" // Updated success message
        : undefined,
    successIcon:
      emailCheckStatus === "available" && !submissionError
        ? successIcon
        : undefined,
    errorIcon:
      emailCheckStatus === "invalid_format" ||
      emailCheckStatus === "exists" ||
      !!submissionError
        ? errorIcon
        : undefined,
  };

  // --- JSX (Add display for submissionError) ---
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-20 p-4 font-sans">
      <div className="flex w-full max-w-md flex-col items-start gap-6">
        <Link href="/" aria-label="Go to homepage">
          <Image
            src="/rakamin-logo.png"
            alt="Rakamin Logo"
            width={144}
            height={48}
            priority
          />
        </Link>
        <div className="w-full md:w-[500px] rounded-lg bg-neutral-10 p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.12)] sm:p-8 md:p-10 flex flex-col items-start gap-4">
          <div className="self-stretch flex flex-col justify-start items-start gap-2">
            <h1 className="text-neutral-100 text-heading-sm font-bold">
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

          {/* Combined Error Display Area */}
          {(emailCheckStatus === "exists" || submissionError) && (
            <div
              className="self-stretch px-2 py-0.5 bg-danger-surface rounded outline outline-1 outline-offset-[-1px] outline-danger-border inline-flex justify-center items-center gap-1"
              role="alert"
            >
              <div className="text-center justify-center flex-1">
                {emailCheckStatus === "exists" ? (
                  <>
                    <span className="text-danger-main text-sm">
                      Email ini sudah terdaftar.{" "}
                    </span>
                    <Link
                      href="/login"
                      className="text-danger-main text-sm font-bold hover:underline focus:outline-none focus:ring-1 focus:ring-danger-focus rounded"
                    >
                      Masuk
                    </Link>
                  </>
                ) : (
                  submissionError && (
                    <span className="text-danger-main text-sm">
                      {submissionError}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="self-stretch flex flex-col gap-4"
          >
            <Input
              config={emailConfig}
              value={email}
              onChange={handleEmailChange}
            />

            <button
              type="submit"
              // Disable button based on email status or loading state
              disabled={
                isLoading
              }
              className="self-stretch cursor-pointer px-4 py-1.5 bg-secondary-main rounded-lg shadow-[0px_1px_2px_0px_rgba(0,0,0,0.12)] inline-flex justify-center items-center gap-1 hover:bg-secondary-hover focus:outline-none focus:ring-2 focus:ring-secondary-focus focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="text-center justify-center text-neutral-90 text-lg font-bold">
                {isLoading ? "Memproses..." : "Daftar dengan email"}
              </span>
            </button>
          </form>

          {/* Separator and Google Button (Keep as is) */}
          <div className="self-stretch inline-flex justify-center items-center gap-3">
            <div className="flex-1 h-0 outline outline-1 outline-offset-[-0.50px] outline-neutral-60"></div>
            <span className="justify-end text-neutral-60 text-sm">or</span>
            <div className="flex-1 h-0 outline outline-1 outline-offset-[-0.50px] outline-neutral-60"></div>
          </div>
          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={isLoading}
            className="cursor-pointer self-stretch px-6 py-3 bg-neutral-10 rounded-lg outline outline-2 outline-offset-[-2px] outline-neutral-40/50 inline-flex justify-center items-center gap-2.5 overflow-hidden hover:bg-neutral-20 focus:outline-none focus:ring-2 focus:ring-primary-focus focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Image
              src="/google-icon.svg"
              alt="google-icon"
              width={24}
              height={24}
              aria-hidden="true"
            />
            <span className="justify-center text-neutral-100 text-base font-bold">
              Daftar dengan Google
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;
