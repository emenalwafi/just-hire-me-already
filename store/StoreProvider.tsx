"use client";

import React, { useEffect } from "react";
import { Provider, useDispatch } from "react-redux";
import { AppDispatch, store } from "./store";
import { seedInitialData } from "@/services/dbServices";
import { hydrateAuth } from "./authSlice";

interface StoreProviderProps {
  children: React.ReactNode;
}

/**
 * Internal component to handle client-side hydration after store is available.
 */
function HydrationHandler({ children }: { children: React.ReactNode }) {
  const dispatch: AppDispatch = useDispatch();

  useEffect(() => {
    dispatch(hydrateAuth());
  }, [dispatch]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      seedInitialData().catch((error) => {
        console.error("Failed to seed initial data:", error);
      });
    }
  }, []);

  return <>{children}</>;
}

/**
 * Wraps the application with Redux Provider and handles client-side hydration.
 */
export function StoreProvider({ children }: StoreProviderProps) {
  return (
    <Provider store={store}>
      <HydrationHandler>{children}</HydrationHandler>
    </Provider>
  );
}