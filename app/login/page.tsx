"use client";

import React, { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/store/store";
import {
  login,
  clearAuthError,
  requestEmailLink,
  loginWithToken,
  resetLinkStatus,
} from "@/store/authSlice";

import EmailLinkForm from "@/components/auth/email-link-form/EmailLinkForm";
import PasswordLoginForm from "@/components/auth/password-login-form/PasswordLoginForm";
import ForgotPasswordForm from "@/components/auth/forgot-password-form/ForgotPasswordForm";
import MagicLinkEmail from "@/components/auth/magic-link-email/MagicLinkEmail";

/**
 * Defines the possible authentication modes for the page.
 */
type AuthMode = "email-link" | "password" | "forgot-password";

/**
 * Authentication page component that handles different login flows
 * (email link, password, forgot password) and integrates with Redux for state management.
 * @returns {React.ReactElement} The rendered authentication page.
 */
const AuthenticationPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<AuthMode>("email-link");
  const [tokenToVerify, setTokenToVerify] = useState<string | null>(null);

  const dispatch: AppDispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    status: authStatus,
    error: authError,
    user,
  } = useSelector((state: RootState) => state.auth);
  const isLoading = authStatus === "loading";

  /** Memoized callback to dispatch the `clearAuthError` action. */
  const clearErrorCallback = useCallback(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  /** Memoized callback to dispatch the `resetLinkStatus` action. */
  const resetLinkStatusCallback = useCallback(() => {
    dispatch(resetLinkStatus());
  }, [dispatch]);

  /**
   * Handles the submission of the email link form.
   * Dispatches the `requestEmailLink` thunk and redirects on success.
   * @param {string} email - The email submitted by the user.
   */
  const handleEmailLinkSubmit = useCallback(
    async (email: string) => {
      clearErrorCallback();
      try {
        const token = await dispatch(requestEmailLink({ email })).unwrap();
        if (token) {
          router.push(`/login/check-email?token=${token}&email=${email}`);
        }
      } catch (rejectedValueOrSerializedError) {}
    },
    [dispatch, clearErrorCallback, router]
  );

  /**
   * Handles the submission of the password login form.
   * Dispatches the `login` thunk. Redirect on success is handled by useEffect.
   * @param {{ email: string; plainPassword: string }} credentials - User's email and password.
   */
  const handlePasswordLoginSubmit = useCallback(
    async (credentials: { email: string; plainPassword: string }) => {
      resetLinkStatusCallback();
      clearErrorCallback();
      try {
        await dispatch(login(credentials)).unwrap();
      } catch (rejectedValueOrSerializedError) {
        // Error is handled by Redux state
      }
    },
    [dispatch, clearErrorCallback, resetLinkStatusCallback]
  );

  /**
   * Handles the submission of the forgot password form.
   * (Placeholder implementation).
   * @param {string} email - The email submitted by the user.
   */
  const handleForgotPasswordSubmit = useCallback(async () => {
    resetLinkStatusCallback();
    clearErrorCallback();
    alert("Forgot password functionality not yet implemented.");
  }, [clearErrorCallback, resetLinkStatusCallback]);

  /**
   * Handles the click action for Google Sign-in.
   * (Placeholder implementation).
   */
  const handleGoogleLogin = useCallback(() => {
    resetLinkStatusCallback();
    clearErrorCallback();
    alert("Google Login functionality not yet implemented.");
  }, [clearErrorCallback, resetLinkStatusCallback]); // Added resetLinkStatusCallback dependency

  /**
   * Handles the click action on the "Verify Email" component shown
   * when a verification token is present in the URL.
   * Dispatches the `loginWithToken` thunk.
   */
  const handleVerifyTokenClick = useCallback(async () => {
    if (!tokenToVerify) return;

    clearErrorCallback();

    try {
      await dispatch(loginWithToken({ token: tokenToVerify })).unwrap();
      setTokenToVerify(null);
    } catch (err) {
      setTokenToVerify(null); // Clear token even on failure
    }
  }, [tokenToVerify, dispatch, clearErrorCallback]); // Removed resetLinkStatusCallback as it's not needed here

  /** Memoized callback to switch the auth mode to 'password'. */
  const switchToPassword = useCallback(() => {
    resetLinkStatusCallback();
    clearErrorCallback();
    setAuthMode("password");
  }, [clearErrorCallback, resetLinkStatusCallback]);

  /** Memoized callback to switch the auth mode to 'email-link'. */
  const switchToEmailLink = useCallback(() => {
    clearErrorCallback();
    setAuthMode("email-link");
  }, [clearErrorCallback]);

  /** Memoized callback to switch the auth mode to 'forgot-password'. */
  const switchToForgotPassword = useCallback(() => {
    resetLinkStatusCallback();
    clearErrorCallback();
    setAuthMode("forgot-password");
  }, [clearErrorCallback, resetLinkStatusCallback]);

  /**
   * Effect to handle redirection if a user is already authenticated,
   * and to check for an email verification token in the URL search parameters on mount.
   */
  useEffect(() => {
    const token = searchParams.get("verify");
    if (user) {
      if (user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
      return;
    }

    if (token) {
      setTokenToVerify(token);
    } else {
      // If there's no token, ensure tokenToVerify is null
      setTokenToVerify(null);
    }
  }, [searchParams, router, user]);

  /**
   * Renders the appropriate authentication form based on the current `authMode`
   * or the presence of a `tokenToVerify`.
   * @returns {React.ReactElement | null} The form component to render.
   */
  const renderForm = () => {
    if (tokenToVerify) {
      // Pass isLoading and authError to MagicLinkEmail if it needs them
      return <MagicLinkEmail onLoginClick={handleVerifyTokenClick} />;
    }
    switch (authMode) {
      case "email-link":
        return (
          <EmailLinkForm
            onSubmit={handleEmailLinkSubmit}
            onSwitchToPassword={switchToPassword}
            onGoogleLogin={handleGoogleLogin}
            errorMessage={authError}
            isLoading={isLoading}
          />
        );
      case "password":
        return (
          <PasswordLoginForm
            onSubmit={handlePasswordLoginSubmit}
            onSwitchToEmailLink={switchToEmailLink}
            onForgotPassword={switchToForgotPassword}
            onGoogleLogin={handleGoogleLogin}
            onClearError={clearErrorCallback}
            errorMessage={authError}
            isLoading={isLoading}
          />
        );
      case "forgot-password":
        return (
          <ForgotPasswordForm
            onSubmit={handleForgotPasswordSubmit}
            onBackToLogin={switchToPassword}
            onClearError={clearErrorCallback}
            errorMessage={authError}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-20 p-4 font-sans">
      {renderForm()}
    </div>
  );
};

const LoginPage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <AuthenticationPage />
  </Suspense>
);

export default LoginPage;
