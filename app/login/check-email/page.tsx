"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { logout } from "@/store/authSlice";
import { AppDispatch, RootState } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import CheckEmailDisplay from "@/components/auth/check-email-display/CheckEmailDisplay";

/**
 * Page component displayed after a user registers.
 * It shows a "check your email" message and handles redirection logic
 * based on the presence of a verification token in the URL.
 * If a user is already logged in, it logs them out first.
 * @returns {React.ReactElement} The CheckEmailPage component.
 */
const CheckEmailPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email") || "your-email@example.com";

  const dispatch: AppDispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  /**
   * Dispatches the logout action.
   */
  const handleLogout = () => {
    dispatch(logout());
  };

  useEffect(() => {
    if (!token) {
      console.error("No token found for verification redirect.");
      return;
    }

    if (user) {
      handleLogout();
    }

    const redirectTimeoutId = setTimeout(() => {
      router.push(`/login?verify=${token}`);
    }, 3000);

    return () => {
      clearTimeout(redirectTimeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, router, user, dispatch]); // Added user and dispatch

  return <CheckEmailDisplay email={email} context="login" />;
};

const CheckEmailMainPage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <CheckEmailPage />
  </Suspense>
);

export default CheckEmailMainPage;
