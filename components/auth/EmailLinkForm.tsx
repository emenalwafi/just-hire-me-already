"use client"

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Input from "@/components/input/Input";
import {
  TextInputConfig,
  InputValue,
  UnifiedChangeValue,
} from "@/types/InputConfig";
import { UilExclamationTriangle } from "@iconscout/react-unicons";

/**
 * Props for the `EmailLinkForm` component.
 */
interface EmailLinkFormProps {
  /** Callback function invoked when the form is submitted with a valid email. */
  onSubmit: (email: string) => void;
  /** Callback function invoked when the user clicks the "Login with password" button. */
  onSwitchToPassword: () => void;
  /** Callback function invoked when the user clicks the "Login with Google" button. */
  onGoogleLogin: () => void;
  /** Optional global error message to display above the form (e.g., from API response). */
  errorMessage?: string | null;
  /** Indicates if the form is currently submitting (disables buttons). */
  isLoading?: boolean;
}

/**
 * A form component for initiating a passwordless email link login flow.
 * It includes an email input, submission button, and options to switch to
 * password login or use Google login. Handles basic email validation.
 * @param {EmailLinkFormProps} props - The component props.
 * @returns {React.ReactElement} The rendered email link login form.
 */
const EmailLinkForm: React.FC<EmailLinkFormProps> = ({
  onSubmit,
  onSwitchToPassword,
  onGoogleLogin,
  errorMessage = null,
  isLoading = false,
}) => {
  const [email, setEmail] = useState<InputValue>(null);
  const [inputError, setInputError] = useState<string | boolean | undefined>(
    undefined
  );

  const customErrorIcon = (
    <UilExclamationTriangle size="16" className="text-danger-main" />
  );

  const emailConfig: TextInputConfig = {
    type: "email",
    name: "email",
    label: "Alamat email",
    placeholder: "Masukkan alamat email",
    required: true,
    error: inputError,
    errorIcon: customErrorIcon,
  };

  /**
   * Handles changes to the email input field.
   * Updates the email state and clears any existing input-specific error.
   * @param {UnifiedChangeValue} value - The new value from the Input component.
   */
  const handleEmailChange = (value: UnifiedChangeValue) => {
    setEmail(value as string | null);
    if (inputError) {
      setInputError(undefined);
    }
  };

  /**
   * Handles form submission.
   * Performs validation (required, format) and calls the `onSubmit` prop if valid.
   * Sets input-specific errors if validation fails.
   * @param {React.FormEvent} event - The form submission event.
   */
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const emailValue = email as string | null;

    if (!emailValue || emailValue.trim() === "") {
      setInputError("Alamat email tidak boleh kosong");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      setInputError("Format email tidak valid");
      return;
    }
    setInputError(undefined);
    onSubmit(emailValue);
  };

  return (
    <div className="flex w-full max-w-md flex-col items-start gap-6">
      <Link href="/" aria-label="Go to homepage">
        <Image
          className="relative"
          src="/rakamin-logo.png"
          alt="Rakamin Logo"
          width={144}
          height={48}
          priority
        />
      </Link>
      <div className="w-full md:w-[500px] rounded-lg bg-neutral-10 p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.12)] sm:p-8 md:p-10 flex flex-col items-start gap-4 font-sans">
        {/* Header */}
        <div className="self-stretch flex flex-col items-start gap-2">
          <h1 className="text-neutral-100 text-heading-s font-bold">
            Masuk ke Rakamin
          </h1>
          <div className="self-stretch">
            <span className="text-neutral-100 text-base">
              Belum punya akun?{" "}
            </span>
            <Link
              href="/auth/register"
              className="text-primary-main text-base hover:underline focus:outline-none focus:ring-1 focus:ring-primary-focus rounded"
            >
              Daftar menggunakan email
            </Link>
          </div>
        </div>

        {/* Global Error Message */}
        {errorMessage && (
          <div
            className="self-stretch px-2 py-0.5 bg-danger-surface rounded outline outline-1 outline-offset-[-1px] outline-danger-border inline-flex justify-center items-center gap-1"
            role="alert"
          >
            <div className="text-center justify-center">
              <span className="text-danger-main text-sm">{errorMessage} </span>
              <Link
                href="/auth/register"
                className="text-danger-main text-sm font-bold hover:underline focus:outline-none focus:ring-1 focus:ring-danger-focus rounded"
              >
                Daftar
              </Link>
            </div>
          </div>
        )}

        {/* Email Input Form */}
        <form
          onSubmit={handleSubmit}
          className="self-stretch flex flex-col gap-4 [&>div>div>label>#asterisk]:hidden"
        >
          <Input
            config={{ ...emailConfig, error: inputError || emailConfig.error }}
            value={email}
            onChange={handleEmailChange}
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="self-stretch cursor-pointer px-4 py-1.5 bg-secondary-main rounded-lg shadow-[0px_1px_2px_0px_rgba(0,0,0,0.12)] inline-flex justify-center items-center gap-1 hover:bg-secondary-hover focus:outline-none focus:ring-2 focus:ring-secondary-focus focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="text-center justify-center text-neutral-90 text-lg font-bold">
              {isLoading ? "Mengirim..." : "Kirim link"}
            </span>
          </button>
        </form>

        {/* Separator */}
        <div className="self-stretch inline-flex justify-center items-center gap-3">
          <div className="flex-1 h-0 outline outline-1 outline-offset-[-0.50px] outline-neutral-60"></div>
          <span className="justify-end text-neutral-60 text-sm">or</span>{" "}
          <div className="flex-1 h-0 outline outline-1 outline-offset-[-0.50px] outline-neutral-60"></div>
        </div>

        <button
          type="button"
          onClick={onSwitchToPassword}
          disabled={isLoading}
          className="self-stretch cursor-pointer h-12 px-6 py-3 bg-neutral-10 rounded-lg shadow-[0px_1px_2px_0px_rgba(0,0,0,0.12)] outline outline-1 outline-offset-[-1px] outline-neutral-40 inline-flex justify-center items-center gap-2.5 hover:bg-neutral-20 focus:outline-none focus:ring-2 focus:ring-primary-focus focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Image
            src="/key-icon.svg"
            alt="key-icon"
            width={16}
            height={16}
            aria-hidden="true"
          />
          <span className="text-center justify-center text-neutral-100 text-base font-bold">
            Masuk dengan kata sandi
          </span>
        </button>

        {/* Google Login Button */}
        <button
          type="button"
          onClick={onGoogleLogin}
          disabled={isLoading}
          className="self-stretch cursor-pointer px-6 py-3 bg-neutral-10 rounded-lg outline outline-2 outline-offset-[-2px] outline-gray-200 inline-flex justify-center items-center gap-2.5 overflow-hidden hover:bg-neutral-20 focus:outline-none focus:ring-2 focus:ring-primary-focus focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Image
            src="/google-icon.svg"
            alt="google-icon"
            width={24}
            height={24}
            aria-hidden="true"
          />
          <span className="justify-center text-neutral-100 text-base font-bold">
            Masuk dengan Google
          </span>
        </button>
      </div>
    </div>
  );
};

export default EmailLinkForm;
