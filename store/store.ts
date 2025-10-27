import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

/**
 * Represents the root state shape of the Redux store.
 * Inferred automatically from the `store.getState` function.
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * Represents the dispatch function type for the Redux store.
 * Includes middleware types if applicable. Inferred from `store.dispatch`.
 */
export type AppDispatch = typeof store.dispatch;