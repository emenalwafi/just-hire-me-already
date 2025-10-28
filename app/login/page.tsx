"use client";

import React, { useState, useCallback, useEffect } from "react"; // Added useEffect
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/store/store";
import { login, clearAuthError } from "@/store/authSlice";

import EmailLinkForm from "@/components/auth/email-link-form/EmailLinkForm";
import PasswordLoginForm from "@/components/auth/passowrd-login-form/PasswordLoginForm"; // <-- Import PasswordLoginForm
import ForgotPasswordForm from "@/components/auth/forgot-password-form/ForgotPasswordForm";

type AuthMode = "email-link" | "password" | "forgot-password";

const AuthenticationPage: React.FC = () => {
  // Default to 'password' mode now, or keep 'email-link' if preferred
  const [authMode, setAuthMode] = useState<AuthMode>("email-link");
  const dispatch: AppDispatch = useDispatch();
  const router = useRouter();

  const {
    status: authStatus,
    error: authError,
    user,
  } = useSelector((state: RootState) => state.auth);
  // one of the authError Message -> Email ini belum terdaftar sebagai akun di Rakamin Academy
  const isLoading = authStatus === "loading";

  const clearErrorCallback = useCallback(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  // --- Handlers ---
  const handleEmailLinkSubmit = useCallback(
    async (email: string) => {
      console.log("Submitting email link request for:", email);
      clearErrorCallback(); // Clear error before submitting
      // TODO: Implement email link sending logic (e.g., dispatch a new thunk)
      alert("Email link functionality not yet implemented.");
    },
    [clearErrorCallback]
  ); // Use the callback

  const handlePasswordLoginSubmit = useCallback(
    async (credentials: { email: string; plainPassword: string }) => {
      console.log("Submitting password login for:", credentials.email);
      clearErrorCallback(); // Clear previous errors before attempting login
      try {
        await dispatch(login(credentials)).unwrap();
        console.log("Password login successful, redirecting...");
        // Redirect is handled by useEffect
      } catch (rejectedValueOrSerializedError) {
        console.error("Password login failed:", rejectedValueOrSerializedError);
      }
    },
    [dispatch, clearErrorCallback]
  ); // Use the callback

  const handleForgotPasswordSubmit = useCallback(
    async (email: string) => {
      console.log("Submitting forgot password request for:", email);
      clearErrorCallback(); // Clear error before submitting
      // TODO: Implement forgot password logic
      alert("Forgot password functionality not yet implemented.");
    },
    [clearErrorCallback]
  ); // Use the callback

  const handleGoogleLogin = useCallback(() => {
    console.log("Initiating Google Login...");
    clearErrorCallback(); // Clear error before submitting
    // TODO: Implement Google Sign-in logic
    alert("Google Login functionality not yet implemented.");
  }, [clearErrorCallback]); // Use the callback

  // --- Switching Modes ---
  const switchToPassword = useCallback(() => {
    clearErrorCallback(); // Use the callback
    setAuthMode("password");
  }, [clearErrorCallback]); // Use the callback

  const switchToEmailLink = useCallback(() => {
    clearErrorCallback(); // Use the callback
    setAuthMode("email-link");
  }, [clearErrorCallback]); // Use the callback

  const switchToForgotPassword = useCallback(() => {
    clearErrorCallback(); // Use the callback
    setAuthMode("forgot-password");
  }, [clearErrorCallback]); // Use the callback

  // --- Redirection Effect (Unchanged) ---
  useEffect(() => {
    // Redirect if user is already logged in (e.g., after successful login)
    if (user) {
      console.log("User detected, redirecting...");
      router.push("/");
    }
  }, [user, router]);

  // --- Render Logic ---
  const renderForm = () => {
    switch (authMode) {
      case "email-link":
        return (
          <EmailLinkForm
            onSubmit={handleEmailLinkSubmit}
            onSwitchToPassword={switchToPassword}
            onGoogleLogin={handleGoogleLogin}
            // Pass the error from Redux state
            errorMessage={authError}
            isLoading={isLoading}
          />
        );
      case "password":
        // Render the actual PasswordLoginForm
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
        // Placeholder for ForgotPasswordForm
        return (
          <ForgotPasswordForm
            onSubmit={handleForgotPasswordSubmit}
            onBackToLogin={switchToPassword} // Use switchToPassword to go back
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

export default AuthenticationPage;
