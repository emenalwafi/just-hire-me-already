import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { User } from "@/types/dbTypes";
import {
  loginUser,
  registerUser,
  requestLoginLink as requestLoginLinkService,
  verifyLoginToken,
} from "@/services/dbServices";

// Define a key for localStorage
const USER_STORAGE_KEY = "authUser";

/**
 * Defines the shape of the authentication state managed by Redux.
 */
interface AuthState {
  /** The currently authenticated user's data (excluding the hashed password), or null if not logged in. */
  user: Omit<User, "hashedPassword"> | null;
  /** The current status of asynchronous operations (login, register). */
  status: "idle" | "loading" | "succeeded" | "failed";
  linkRequestStatus: "idle" | "loading" | "succeeded" | "failed";
  /** Stores potential error messages from failed async operations. */
  error: string | null | undefined;
  /** Link that sent for user that choose to login via email. */
  linkToken: string | null;
}

/**
 * Helper function to safely get user from localStorage.
 */
const getUserFromLocalStorage = (): Omit<User, "hashedPassword"> | null => {
  if (typeof window !== "undefined" && window.localStorage) {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem(USER_STORAGE_KEY); // Clear invalid data
        return null;
      }
    }
  }
  return null;
};

/**
 * The initial state for the authentication slice.
 * Tries to load the user from localStorage on initialization.
 */
const initialState: AuthState = {
  user: getUserFromLocalStorage(), // <-- Load user initially
  status: "idle",
  linkRequestStatus: "idle",
  error: null,
  linkToken: null,
};

/**
 * Async thunk action for handling user login.
 * Calls the `loginUser` service function.
 * @param {{ email: string; plainPassword: string }} credentials - User's email and password.
 * @returns {Promise<Omit<User, "hashedPassword">>} A promise resolving to the user object (without hash) on success.
 * @rejects {string} Rejects with an error message string on failure.
 */
export const login = createAsyncThunk<
  Omit<User, "hashedPassword">,
  { email: string; plainPassword: string },
  { rejectValue: string }
>("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const user = await loginUser(credentials.email, credentials.plainPassword);
    // Save user to localStorage on successful login
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
    return user;
  } catch (error: unknown) {
    if (error instanceof Error && error.message) {
      return rejectWithValue(error.message);
    } else {
      return rejectWithValue("Login failed");
    }
  }
});

/**
 * Async thunk action for handling user registration.
 * Calls the `registerUser` service function.
 * @param {Omit<User, "id" | "hashedPassword"> & { plainPassword: string }} userData - User registration data including plain password.
 * @returns {Promise<Omit<User, "hashedPassword">>} A promise resolving to the newly registered user object (without hash) on success.
 * @rejects {string} Rejects with an error message string on failure.
 */
export const register = createAsyncThunk<
  Omit<User, "hashedPassword">,
  Omit<User, "id" | "hashedPassword"> & { plainPassword: string },
  { rejectValue: string }
>("auth/register", async (userData, { rejectWithValue }) => {
  try {
    const newUser = await registerUser(userData);
    return newUser;
  } catch (error: unknown) {
    if (error instanceof Error && error.message) {
      return rejectWithValue(error.message);
    } else {
      return rejectWithValue("Registration failed");
    }
  }
});

export const requestEmailLink = createAsyncThunk<
  string,
  { email: string },
  { rejectValue: string }
>("auth/requestEmailLink", async ({ email }, { rejectWithValue }) => {
  try {
    const token = await requestLoginLinkService(email);
    console.log("Login link request successful (simulation). Token generated.");
    return token;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to request login link");
  }
});

export const loginWithToken = createAsyncThunk<
  Omit<User, "hashedPassword"> | null,
  { token: string },
  { rejectValue: string }
>("auth/loginWithToken", async ({ token }, { rejectWithValue }) => {
  try {
    const user = await verifyLoginToken(token);
    // Save user to localStorage on successful token login
    if (user && typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
    return user;
  } catch (error: any) {
    console.error("Unexpected error during token login:", error);
    return rejectWithValue(error.message || "Token login failed");
  }
});

/**
 * Redux slice definition for managing authentication state.
 * Includes reducers for logout, clearing errors, and handling async thunk states (pending, fulfilled, rejected).
 */
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /**
     * Resets the authentication state to logged out and clears localStorage.
     * @param {AuthState} state - The current auth state.
     */
    logout: (state) => {
      state.user = null;
      state.status = "idle";
      state.linkRequestStatus = "idle";
      state.error = null;
      // Clear user from localStorage on logout
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
      console.log("User logged out.");
    },
    /**
     * Clears any existing authentication error message.
     * @param {AuthState} state - The current auth state.
     */
    clearAuthError: (state) => {
      state.error = null;
      state.linkRequestStatus = "idle";
    },
    /**
     * Clears link status.
     * @param {AuthState} state - The current auth state.
     */
    resetLinkStatus: (state) => {
      state.linkRequestStatus = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.linkRequestStatus = "idle";
      })
      .addCase(
        login.fulfilled,
        (state, action: PayloadAction<Omit<User, "hashedPassword">>) => {
          state.status = "succeeded";
          state.user = action.payload;
          state.error = null;
        }
      )
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.user = null;
        state.error = action.payload;
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.removeItem(USER_STORAGE_KEY);
        }
      })
      .addCase(register.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.linkRequestStatus = "idle";
      })
      .addCase(
        register.fulfilled,
        (
          state
        ) => {
          state.status = "succeeded";
          state.error = null;
        }
      )
      .addCase(register.rejected, (state, action) => {
        state.status = "failed";
        state.user = null;
        state.error = action.payload;
      })
      .addCase(requestEmailLink.pending, (state) => {
        state.linkRequestStatus = "loading";
        state.error = null;
      })
      .addCase(
        requestEmailLink.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.linkRequestStatus = "succeeded";
          state.error = null;
          state.linkToken = action.payload;
        }
      )
      .addCase(requestEmailLink.rejected, (state, action) => {
        state.linkRequestStatus = "failed";
        state.error = action.payload;
      })
      .addCase(loginWithToken.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.linkRequestStatus = "idle";
        state.linkToken = null;
      })
      .addCase(
        loginWithToken.fulfilled,
        (state, action: PayloadAction<Omit<User, "hashedPassword"> | null>) => {
          state.linkToken = null; // Ensure token is cleared
          if (action.payload) {
            state.status = "succeeded";
            state.user = action.payload; // User is already saved to localStorage in the thunk
            state.error = null;
          } else {
            state.status = "failed";
            state.user = null;
            state.error = "Link sudah kadaluarsa, silahkan login kembali!";
            if (typeof window !== "undefined" && window.localStorage) {
              localStorage.removeItem(USER_STORAGE_KEY);
            }
          }
        }
      )
      .addCase(loginWithToken.rejected, (state, action) => {
        state.status = "failed";
        state.user = null;
        state.error = action.payload;
        state.linkToken = null;
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.removeItem(USER_STORAGE_KEY);
        }
      });
  },
});

export const { logout, clearAuthError, resetLinkStatus } = authSlice.actions;

export default authSlice.reducer;
