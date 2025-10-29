import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { User } from "@/types/dbTypes";
import {
  loginUser,
  registerUser,
  requestLoginLink as requestLoginLinkService,
  verifyLoginToken,
} from "@/services/dbServices";

/**
 * Defines the shape of the authentication state managed by Redux.
 */
interface AuthState {
  /** The currently authenticated user's data (excluding the hashed password), or null if not logged in. */
  user: Omit<User, "hashedPassword"> | null;
  /** The current status of asynchronous operations (login, register). */
  status: "idle" | "loading" | "succeeded" | "failed";
  /** The current status procees sending link to user */
  linkRequestStatus: "idle" | "loading" | "succeeded" | "failed";
  /** Stores potential error messages from failed async operations. */
  error: string | null | undefined;
  /** Link that sent for user that choose to login via email. */
  linkToken: string | null;
}

/**
 * The initial state for the authentication slice.
 */
const initialState: AuthState = {
  user: null,
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
     * Resets the authentication state to logged out.
     * @param {AuthState} state - The current auth state.
     */
    logout: (state) => {
      state.user = null;
      state.status = "idle";
      state.linkRequestStatus = "idle";
      state.error = null;
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
      // Handle login success state
      .addCase(
        login.fulfilled,
        (state, action: PayloadAction<Omit<User, "hashedPassword">>) => {
          state.status = "succeeded";
          state.user = action.payload;
          state.error = null;
        }
      )
      // Handle login failure state
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.user = null;
        state.error = action.payload;
      })
      // Handle register pending state
      .addCase(register.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.linkRequestStatus = "idle";
      })
      .addCase(
        register.fulfilled,
        (state, action: PayloadAction<Omit<User, "hashedPassword">>) => {
          state.status = "succeeded";
          state.user = action.payload;
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
        state.status = "loading"; // Use general status for token login attempt
        state.error = null;
        state.linkRequestStatus = "idle"; // Reset link request status
        state.linkToken = null; // Clear the token as it's being used/verified
      })
      .addCase(
        loginWithToken.fulfilled,
        (state, action: PayloadAction<Omit<User, "hashedPassword"> | null>) => {
          if (action.payload) {
            // Verification successful, user data returned
            state.status = "succeeded";
            state.user = action.payload;
            state.error = null;
          } else {
            // Verification failed (invalid/expired token), service returned null
            state.status = "failed";
            state.user = null;
            state.error = "Link sudah kadaluarsa, silahkan login kembali!"; // Set specific error
          }
          state.linkToken = null; // Ensure token is cleared
        }
      )
      .addCase(loginWithToken.rejected, (state, action) => {
        state.status = "failed";
        state.user = null;
        state.error = action.payload; // Error from rejectWithValue
        state.linkToken = null; // Ensure token is cleared
      });
  },
});

export const { logout, clearAuthError, resetLinkStatus } = authSlice.actions;

export default authSlice.reducer;
