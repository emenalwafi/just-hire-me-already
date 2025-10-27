'use client';

import { Provider } from 'react-redux';
import { store } from './store';

interface StoreProviderProps {
  children: React.ReactNode;
}

/**
 * A client component that wraps the application with the Redux Provider,
 * making the store available to all descendant components.
 * @param {StoreProviderProps} props - Component props including children.
 * @returns {React.ReactElement} The Provider component wrapping the children.
 */
export function StoreProvider({ children }: StoreProviderProps) {
  return <Provider store={store}>{children}</Provider>;
}