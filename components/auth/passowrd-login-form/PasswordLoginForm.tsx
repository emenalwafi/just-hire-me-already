// components/auth/PasswordLoginForm.tsx
import React, { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Input from "@/components/input/Input";
import {
  TextInputConfig,
  InputValue,
  UnifiedChangeValue,
} from "@/types/InputConfig";
import {
  UilExclamationTriangle,
  UilEnvelopeAlt,
} from "@iconscout/react-unicons";

/**
 * Props for the `PasswordLoginForm` component.
 */
interface PasswordLoginFormProps {
  /** Callback with email and password when the user submits. */
  onSubmit: (credentials: { email: string; plainPassword: string }) => void;
  /** Callback to switch to the email link form. */
  onSwitchToEmailLink: () => void;
  /** Callback to switch to the forgot password form. */
  onForgotPassword: () => void;
  /** Callback to initiate Google Sign-in. */
  onGoogleLogin: () => void;
  /** Callback to clear global authentication errors. */
  onClearError: () => void;
  /** Optional error message to display (e.g., "Invalid credentials"). */
  errorMessage?: string | null;
  /** Optional flag indicating if the form is currently submitting. */
  isLoading?: boolean;
}

/**
 * A form component for handling traditional email and password login.
 * Includes inputs for email and password, validation, submission handling,
 * and options to switch to email link login, forgot password, or Google login.
 * @param {PasswordLoginFormProps} props - The component props.
 * @returns {React.ReactElement} The rendered password login form.
 */
const PasswordLoginForm: React.FC<PasswordLoginFormProps> = ({
  onSubmit,
  onSwitchToEmailLink,
  onForgotPassword,
  onGoogleLogin,
  onClearError,
  errorMessage = null,
  isLoading = false,
}) => {
  const [email, setEmail] = useState<InputValue>(null);
  const [password, setPassword] = useState<InputValue>(null);
  const [emailError, setEmailError] = useState<string | boolean | undefined>(
    undefined
  );
  const [passwordError, setPasswordError] = useState<
    string | boolean | undefined
  >(undefined);

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

  const passwordConfig: TextInputConfig = {
    type: "password",
    name: "password",
    label: "Kata Sandi",
    placeholder: "Masukkan kata sandi",
    required: true,
    error: passwordError,
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
   * Memoized callback to handle changes in the password input.
   * Clears global and local errors when the user types.
   */
  const handlePasswordChange = useCallback(
    (value: UnifiedChangeValue) => {
      if (errorMessage) {
        onClearError();
      }
      setPassword(value as string | null);
      if (passwordError) setPasswordError(undefined);
    },
    [passwordError, errorMessage, onClearError]
  );

  /**
   * Handles form submission.
   * Performs validation on email and password fields.
   * Calls the `onSubmit` prop with credentials if validation passes.
   * @param {React.FormEvent} event - The form submission event.
   */
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const emailValue = email as string | null;
    const passwordValue = password as string | null;
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

    if (!passwordValue || passwordValue.trim() === "") {
      setPasswordError("Kata sandi tidak boleh kosong");
      hasError = true;
    } else {
      setPasswordError(undefined);
    }

    if (hasError) return;

    if (emailValue && passwordValue) {
      onSubmit({ email: emailValue, plainPassword: passwordValue });
    }
  };

  const showGlobalErrorStyle = !!errorMessage && !emailError && !passwordError;

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
          <h1 className="text-neutral-100 text-heading-sm font-bold">
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

        {/* Global Error Message (e.g., email not registered OR invalid credentials) */}
        {errorMessage && (
          <div
            className="self-stretch px-2 py-0.5 bg-danger-surface rounded outline outline-1 outline-offset-[-1px] outline-danger-border inline-flex justify-center items-center gap-1"
            role="alert"
          >
            <div className="text-center justify-center flex-1">
              {" "}
              <span className="text-danger-main text-sm">{errorMessage} </span>
              {errorMessage.includes("belum terdaftar") && (
                <Link
                  href="/auth/register"
                  className="text-danger-main text-sm font-bold hover:underline focus:outline-none focus:ring-1 focus:ring-danger-focus rounded"
                >
                  Daftar
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="self-stretch flex flex-col gap-4  [&>_div>div>label>#asterisk]:hidden"
        >
          <Input
            config={{
              ...emailConfig,
              error: emailError || (showGlobalErrorStyle && true),
            }}
            value={email}
            onChange={handleEmailChange}
          />
          <Input
            config={{
              ...passwordConfig,
              error: passwordError || (showGlobalErrorStyle && true),
            }}
            value={password}
            onChange={handlePasswordChange}
          />

          {/* Forgot Password Link */}
          <div className="self-stretch text-right">
            <button
              type="button"
              onClick={onForgotPassword}
              disabled={isLoading}
              className="cursor-pointer text-primary-main text-base hover:underline focus:outline-none focus:ring-1 focus:ring-primary-focus rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Lupa kata sandi?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="self-stretch cursor-pointer px-4 py-1.5 bg-secondary-main rounded-lg shadow-[0px_1px_2px_0px_rgba(0,0,0,0.12)] inline-flex justify-center items-center gap-1 hover:bg-secondary-hover focus:outline-none focus:ring-2 focus:ring-secondary-focus focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="text-center justify-center text-neutral-90 text-lg font-bold">
              {isLoading ? "Memproses..." : "Masuk"}
            </span>
          </button>
        </form>

        {/* Separator */}
        <div className="self-stretch inline-flex justify-center items-center gap-3">
          <div className="flex-1 h-0 outline outline-1 outline-offset-[-0.50px] outline-neutral-60"></div>
          <span className="justify-end text-neutral-60 text-sm">or</span>
          <div className="flex-1 h-0 outline outline-1 outline-offset-[-0.50px] outline-neutral-60"></div>
        </div>

        {/* Switch to Email Link Button */}
        <button
          type="button"
          onClick={onSwitchToEmailLink}
          disabled={isLoading}
          className="cursor-pointer self-stretch h-12 px-6 py-3 bg-neutral-10 rounded-lg shadow-[0px_1px_2px_0px_rgba(0,0,0,0.12)] outline outline-1 outline-offset-[-1px] outline-neutral-40 inline-flex justify-center items-center gap-2.5 hover:bg-neutral-20 focus:outline-none focus:ring-2 focus:ring-primary-focus focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <UilEnvelopeAlt
            size="16"
            className="text-neutral-100"
            aria-hidden="true"
          />
          <span className="text-center justify-center text-neutral-100 text-base font-bold">
            Kirim link login melalui email
          </span>
        </button>

        {/* Google Login Button */}
        <button
          type="button"
          onClick={onGoogleLogin}
          disabled={isLoading}
          className="cursor-pointer self-stretch px-6 py-3 bg-neutral-10 rounded-lg outline outline-2 outline-offset-[-2px] outline-gray-200 inline-flex justify-center items-center gap-2.5 overflow-hidden hover:bg-neutral-20 focus:outline-none focus:ring-2 focus:ring-primary-focus focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

export default PasswordLoginForm;
