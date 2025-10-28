"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '@/store/store';
import { login, clearAuthError } from '@/store/authSlice';

import EmailLinkForm from "@/components/auth/EmailLinkForm";
// import PasswordLoginForm from "@/components/auth/PasswordLoginForm";
// import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

type AuthMode = 'email-link' | 'password' | 'forgot-password';

const AuthenticationPage: React.FC = () => {
    const [authMode, setAuthMode] = useState<AuthMode>('email-link');
    const dispatch: AppDispatch = useDispatch();
    const router = useRouter();

    const { status: authStatus, error: authError, user } = useSelector((state: RootState) => state.auth);
    const isLoading = authStatus === 'loading';

    // --- Handlers (Keep existing handlers - unchanged) ---
    const handleEmailLinkSubmit = useCallback(async (email: string) => {
        console.log("Submitting email link request for:", email);
        

        dispatch(clearAuthError());
        alert("Email link functionality not yet implemented.");
    }, [dispatch]);

    const handlePasswordLoginSubmit = useCallback(async (credentials: { email: string; plainPassword: string }) => {
        console.log("Submitting password login for:", credentials.email);
        dispatch(clearAuthError());
        try {
            await dispatch(login(credentials)).unwrap();
            console.log("Password login successful, redirecting...");
            router.push('/');
        } catch (rejectedValueOrSerializedError) {
             console.error('Password login failed:', rejectedValueOrSerializedError);
        }
    }, [dispatch, router]);

    const handleForgotPasswordSubmit = useCallback(async (email: string) => {
        console.log("Submitting forgot password request for:", email);
        dispatch(clearAuthError());
        alert("Forgot password functionality not yet implemented.");
    }, [dispatch]);

    const handleGoogleLogin = useCallback(() => {
        console.log("Initiating Google Login...");
        dispatch(clearAuthError());
        alert("Google Login functionality not yet implemented.");
    }, [dispatch]);

    // --- Switching Modes (Keep existing handlers - unchanged) ---
    const switchToPassword = useCallback(() => {
        dispatch(clearAuthError());
        setAuthMode('password');
    }, [dispatch]);

    const switchToEmailLink = useCallback(() => {
        dispatch(clearAuthError());
        setAuthMode('email-link');
    }, [dispatch]);

     const switchToForgotPassword = useCallback(() => {
        dispatch(clearAuthError());
        setAuthMode('forgot-password');
    }, [dispatch]);

    // --- Redirection Effect (Keep existing effect - unchanged) ---
     React.useEffect(() => {
        if (user) {
            console.log("User already logged in, redirecting...");
            router.push('/');
        }
    }, [user, router]);

    // --- Render Logic ---
    const renderForm = () => {
        switch (authMode) {
            case 'email-link':
                return (
                    <EmailLinkForm
                        onSubmit={handleEmailLinkSubmit}
                        onSwitchToPassword={switchToPassword}
                        onGoogleLogin={handleGoogleLogin}
                        errorMessage={authError}
                        isLoading={isLoading}
                    />
                );
            case 'password':
                 return (
                     <div className="text-center p-8 bg-white rounded-lg shadow-md">
                         Password Login Form Placeholder
                         <button onClick={switchToEmailLink} className="text-primary-main hover:underline mt-4 block mx-auto">Switch to Email Link</button>
                         <button onClick={switchToForgotPassword} className="text-primary-main hover:underline mt-2 block mx-auto">Forgot Password?</button>
                    </div>
                 );
            case 'forgot-password':
                 return (
                      <div className="text-center p-8 bg-white rounded-lg shadow-md">
                         Forgot Password Form Placeholder
                         <button onClick={switchToPassword} className="text-primary-main hover:underline mt-4 block mx-auto">Back to Login</button>
                      </div>
                 );
            default:
                return null;
        }
    };

    return (
        // Use min-h-screen for full height, flex items-center justify-center for centering
        // Add padding (p-4) which works well on mobile and desktop
        <div className="flex min-h-screen items-center justify-center bg-neutral-20 p-4 font-sans">
            {/* The form itself will now control its max-width */}
            {renderForm()}
        </div>
    );
};

export default AuthenticationPage;

