import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { User } from "@/types/dbTypes";
import { loginUser, registerUser } from "@/services/dbServices";

/**
 * Defines the shape of the authentication state managed by Redux.
 */
interface AuthState {
  /** The currently authenticated user's data (excluding the hashed password), or null if not logged in. */
  user: Omit<User, "hashedPassword"> | null;
  /** The current status of asynchronous operations (login, register). */
  status: "idle" | "loading" | "succeeded" | "failed";
  /** Stores potential error messages from failed async operations. */
  error: string | null | undefined;
}

/**
 * The initial state for the authentication slice.
 */
const initialState: AuthState = {
  user: null,
  status: "idle",
  error: null,
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
      state.error = null;
      console.log("User logged out.");
    },
    /**
     * Clears any existing authentication error message.
     * @param {AuthState} state - The current auth state.
     */
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
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
      })
      .addCase(register.pending, (state) => {
        state.status = "loading";
        state.error = null;
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
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;

export default authSlice.reducer;
