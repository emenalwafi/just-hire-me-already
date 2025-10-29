import React, { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import Input from "@/components/input/Input";
import {
  TextInputConfig,
  InputValue,
  UnifiedChangeValue,
} from "@/types/InputConfig";
import { UilArrowLeft, UilExclamationTriangle } from "@iconscout/react-unicons";

/**
 * Props for the `ForgotPasswordForm` component.
 */
interface ForgotPasswordFormProps {
  /** Callback with email when the user submits. */
  onSubmit: (email: string) => void;
  /** Callback to switch back to the login form. */
  onBackToLogin: () => void;
  /** Callback to clear global authentication errors. */
  onClearError: () => void;
  /** Optional error message to display (e.g., "Email not found"). */
  errorMessage?: string | null;
  /** Optional flag indicating if the form is currently submitting. */
  isLoading?: boolean;
}

/**
 * A form component for handling the "forgot password" flow.
 * It takes an email address and submits it, presumably to trigger a password reset email.
 * Includes validation for the email input and provides a button to navigate back to the login form.
 * @param {ForgotPasswordFormProps} props - The component props.
 * @returns {React.ReactElement} The rendered forgot password form.
 */
const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSubmit,
  onBackToLogin,
  onClearError,
  errorMessage = null,
  isLoading = false,
}) => {
  const [email, setEmail] = useState<InputValue>(null);
  const [emailError, setEmailError] = useState<string | boolean | undefined>(
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
    error: emailError,
    errorIcon: customErrorIcon,
  };

  /**
   * Memoized callback to handle changes in the email input.
   * Clears global and local errors when the user types.
   */
  const handleEmailChange = useCallback(
    (value: UnifiedChangeValue) => {
      if (errorMessage) {
        onClearError();
      }
      setEmail(value as string | null);
      if (emailError) setEmailError(undefined);
    },
    [emailError, errorMessage, onClearError]
  );

  /**
   * Handles form submission.
   * Performs client-side validation on the email field.
   * Calls the `onSubmit` prop with the email if validation passes.
   * @param {React.FormEvent} event - The form submission event.
   */
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const emailValue = email as string | null;
    let hasError = false;

    if (!emailValue || emailValue.trim() === "") {
      setEmailError("Alamat email tidak boleh kosong");
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      setEmailError("Format email tidak valid");
      hasError = true;
    } else {
      setEmailError(undefined);
    }

    if (hasError) return;

    if (emailValue) {
      onSubmit(emailValue);
    }
  };

  const showGlobalErrorStyle = !!errorMessage && !emailError;

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
        {/* Header Section */}
        <div className="self-stretch flex flex-col items-start gap-2">
          {/* Back Button */}
          <button
            type="button"
            onClick={onBackToLogin}
            disabled={isLoading}
            className="cursor-pointer py-1 rounded-lg inline-flex justify-center items-center gap-1 group focus:outline-none focus:ring-2 focus:ring-primary-focus disabled:opacity-50"
          >
            <UilArrowLeft
              size="18"
              className="text-primary-main group-hover:text-primary-hover"
              aria-hidden="true"
            />
            <span className="text-center justify-center text-primary-main text-sm font-bold group-hover:underline">
              Kembali
            </span>
          </button>
          {/* Title */}
          <h1 className="text-neutral-100 text-heading-sm font-bold">
            Selamat datang di Rakamin
          </h1>
        </div>

        {/* Instructions */}
        <p className="self-stretch text-neutral-90 text-base">
          Masukan alamat email yang telah terdaftar menerima email reset kata
          sandi.
        </p>

        {/* Global Error Message */}
        {errorMessage && (
          <div
            className="self-stretch px-2 py-0.5 bg-danger-surface rounded outline outline-1 outline-offset-[-1px] outline-danger-border inline-flex justify-center items-center gap-1"
            role="alert"
          >
            <UilExclamationTriangle
              className="text-danger-main flex-shrink-0"
              size="16"
            />
            <div className="text-center justify-center flex-1">
              <span className="text-danger-main text-sm">{errorMessage} </span>
              {/* Conditional Register Link */}
              {errorMessage.includes("belum terdaftar") && (
                <Link
                  href="/auth/register"
                  className="cursor-pointer text-danger-main text-sm font-bold hover:underline focus:outline-none focus:ring-1 focus:ring-danger-focus rounded"
                >
                  Daftar
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="self-stretch flex flex-col gap-4 [&>div>div>label>#asterisk]:hidden"
        >
          <Input
            config={{
              ...emailConfig,
              error: emailError || (showGlobalErrorStyle && true),
            }}
            value={email}
            onChange={handleEmailChange}
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="cursor-pointer self-stretch mt-2 px-4 py-1.5 bg-secondary-main rounded-lg shadow-[0px_1px_2px_0px_rgba(0,0,0,0.12)] inline-flex justify-center items-center gap-1 hover:bg-secondary-hover focus:outline-none focus:ring-2 focus:ring-primary-focus focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="text-center justify-center text-neutral-90 text-lg font-bold">
              {isLoading ? "Mengirim..." : "Kirim email"}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
