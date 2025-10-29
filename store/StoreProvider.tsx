"use client";

import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "./store";
import { seedInitialData } from "@/services/dbServices";

interface StoreProviderProps {
  children: React.ReactNode;
}

/**
 * A client component that wraps the application with the Redux Provider,
 * making the store available to all descendant components.
 * It also triggers the IndexedDB initial data seeding on mount.
 * @param {StoreProviderProps} props - Component props including children.
 * @returns {React.ReactElement} The Provider component wrapping the children.
 */
export function StoreProvider({ children }: StoreProviderProps) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      seedInitialData().catch((error) => {
        console.error("Failed to seed initial data:", error);
      });
    }
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
