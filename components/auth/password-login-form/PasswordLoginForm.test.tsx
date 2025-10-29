import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import PasswordLoginForm from "./PasswordLoginForm"; // Adjust import path
import { InputValue } from "@/types/InputConfig"; // Adjust path

/**
 * @file Test suite for the `PasswordLoginForm` component.
 * @description This file contains unit tests for the `PasswordLoginForm`,
 * verifying rendering, input validation, state management, error handling,
 * and callback interactions for password-based login. Mocks are used for
 * child components (`Input`), Next.js features (`Link`, `Image`), and icons.
 */

// --- Mocks ---

/** Variable to capture the `onChange` handler for the mock email input. */
let mockEmailOnChange: (value: InputValue) => void;
/** Variable to capture the `onChange` handler for the mock password input. */
let mockPasswordOnChange: (value: InputValue) => void;
/** Mock function for the unified `Input` component. */
const mockInput = jest.fn();

/**
 * Mocks the unified `Input` component.
 * Renders a basic HTML input, distinguishes between email and password types,
 * captures their respective `onChange` handlers, and reflects the `error` prop
 * in a `data-error` attribute for testing.
 */
jest.mock("../../../components/input/Input", () => ({
  __esModule: true,
  default: (props: {
    onChange: (value: InputValue) => void;
    config: {
      label: string;
      placeholder: string;
      required: true;
      name: string;
      error: boolean | string;
      type: string;
    };
    value: string;
  }) => {
    if (props.config.name === "email") {
      mockEmailOnChange = props.onChange;
    } else if (props.config.name === "password") {
      mockPasswordOnChange = props.onChange;
    }
    mockInput(props);
    const testId = `mock-${props.config.name}-input`;
    return (
      <input
        data-testid={testId}
        aria-label={props.config.label || props.config.name}
        value={props.value || ""}
        onChange={(e) => {
          if (props.config.name === "email") mockEmailOnChange(e.target.value);
          if (props.config.name === "password")
            mockPasswordOnChange(e.target.value);
        }}
        placeholder={props.config.placeholder}
        required={props.config.required}
        type={props.config.type}
        data-error={
          props.config.error ? props.config.error.toString() : "false"
        }
      />
    );
  },
}));

/**
 * Mocks `next/link` to render a standard `<a>` tag.
 */
jest.mock("next/link", () => {
  function MockLink({
    children,
    href,
    ...props
  }: React.PropsWithChildren<{ href: string }>) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }
  return MockLink;
});

/**
 * Mocks `next/image` to render a standard `<img>` tag.
 */
jest.mock("next/image", () => {
  function MockImage({
    src,
    alt,
    width,
    height,
  }: {
    src: string;
    alt: string;
    width: string;
    height: string;
  }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} width={width} height={height} />;
  }
  return MockImage;
});

/**
 * Mocks the `@iconscout/react-unicons` library.
 */
jest.mock("@iconscout/react-unicons", () => ({
  UilExclamationTriangle: () => <span data-testid="icon-exclamation" />,
  UilEnvelopeAlt: () => <span data-testid="icon-envelope" />,
}));

/**
 * @describe Main test suite for the `PasswordLoginForm` component.
 */
describe("PasswordLoginForm", () => {
  let mockOnSubmit: jest.Mock;
  let mockOnSwitchToEmailLink: jest.Mock;
  let mockOnForgotPassword: jest.Mock;
  let mockOnGoogleLogin: jest.Mock;
  let mockOnClearError: jest.Mock;

  /**
   * @beforeEach Resets all mock functions and captured handlers before each test.
   */
  beforeEach(() => {
    mockOnSubmit = jest.fn();
    mockOnSwitchToEmailLink = jest.fn();
    mockOnForgotPassword = jest.fn();
    mockOnGoogleLogin = jest.fn();
    mockOnClearError = jest.fn();
    mockInput.mockClear();
    mockEmailOnChange = () => {};
    mockPasswordOnChange = () => {};
  });

  /**
   * @describe Tests related to the initial rendering of the form and its elements based on props.
   */
  describe("Rendering and Props", () => {
    /**
     * @it Verifies that all expected elements (title, logo, inputs, buttons, links) are rendered correctly.
     */
    it("should render form title, inputs, and all buttons/links", () => {
      render(
        <PasswordLoginForm
          onSubmit={mockOnSubmit}
          onSwitchToEmailLink={mockOnSwitchToEmailLink}
          onForgotPassword={mockOnForgotPassword}
          onGoogleLogin={mockOnGoogleLogin}
          onClearError={mockOnClearError}
        />
      );

      expect(
        screen.getByRole("heading", { name: /Masuk ke Rakamin/i })
      ).toBeInTheDocument();
      expect(screen.getByAltText("Rakamin Logo")).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /Daftar menggunakan email/i })
      ).toBeInTheDocument();

      expect(screen.getByTestId("mock-email-input")).toBeInTheDocument();
      expect(screen.getByTestId("mock-password-input")).toBeInTheDocument();

      expect(
        screen.getByRole("button", { name: /Lupa kata sandi/i })
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Masuk" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Kirim link login melalui email/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Masuk dengan Google/i })
      ).toBeInTheDocument();
    });

    /**
     * @it Verifies that a global error message is displayed when provided,
     * and that the conditional "Register" link is *not* shown within it.
     */
    it('should display the global errorMessage and no register link if message doesnt contain "belum terdaftar"', () => {
      render(
        <PasswordLoginForm
          onSubmit={mockOnSubmit}
          onSwitchToEmailLink={mockOnSwitchToEmailLink}
          onForgotPassword={mockOnForgotPassword}
          onGoogleLogin={mockOnGoogleLogin}
          onClearError={mockOnClearError}
          errorMessage="Invalid credentials"
        />
      );
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent("Invalid credentials");
      expect(
        within(alert).queryByRole("link", { name: /Daftar/i })
      ).not.toBeInTheDocument();
    });

    /**
     * @it Verifies that a global error message is displayed when provided,
     * and that the conditional "Register" link *is* shown within it if the message includes specific text.
     */
    it('should display the global errorMessage AND register link if message contains "belum terdaftar"', () => {
      render(
        <PasswordLoginForm
          onSubmit={mockOnSubmit}
          onSwitchToEmailLink={mockOnSwitchToEmailLink}
          onForgotPassword={mockOnForgotPassword}
          onGoogleLogin={mockOnGoogleLogin}
          onClearError={mockOnClearError}
          errorMessage="Email belum terdaftar"
        />
      );
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent("Email belum terdaftar");
      expect(
        within(alert).getByRole("link", { name: /Daftar/i })
      ).toBeInTheDocument();
    });

    /**
     * @it Verifies that buttons are disabled and the submit button shows loading text when `isLoading` is true.
     */
    it("should disable buttons and show loading text when isLoading is true", () => {
      render(
        <PasswordLoginForm
          onSubmit={mockOnSubmit}
          onSwitchToEmailLink={mockOnSwitchToEmailLink}
          onForgotPassword={mockOnForgotPassword}
          onGoogleLogin={mockOnGoogleLogin}
          onClearError={mockOnClearError}
          isLoading={true}
        />
      );
      const submitButton = screen.getByRole("button", {
        name: /Memproses.../i,
      });
      const forgotPasswordButton = screen.getByRole("button", {
        name: /Lupa kata sandi/i,
      });
      const emailLinkButton = screen.getByRole("button", {
        name: /Kirim link login melalui email/i,
      });
      const googleButton = screen.getByRole("button", {
        name: /Masuk dengan Google/i,
      });

      expect(submitButton).toBeDisabled();
      expect(forgotPasswordButton).toBeDisabled();
      expect(emailLinkButton).toBeDisabled();
      expect(googleButton).toBeDisabled();
    });

    /**
     * @it Verifies that the mock inputs receive an error state (`data-error="true"`)
     * when a global `errorMessage` is present and there are no local validation errors.
     */
    it("should pass error=true to inputs when global error exists and no local errors", () => {
      render(
        <PasswordLoginForm
          onSubmit={mockOnSubmit}
          onSwitchToEmailLink={mockOnSwitchToEmailLink}
          onForgotPassword={mockOnForgotPassword}
          onGoogleLogin={mockOnGoogleLogin}
          onClearError={mockOnClearError}
          errorMessage="Invalid credentials"
        />
      );
      const emailInput = screen.getByTestId("mock-email-input");
      const passwordInput = screen.getByTestId("mock-password-input");

      expect(emailInput).toHaveAttribute("data-error", "true");
      expect(passwordInput).toHaveAttribute("data-error", "true");
    });
  });

  /**
   * @describe Tests for internal state management, input validation logic, and form submission behavior.
   */
  describe("State, Validation, and Submission", () => {
    /**
     * @it Verifies that typing in the email input updates the state, clears local errors,
     * and calls `onClearError` if a global error message was present.
     */
    it("should update email state and clear errors on input change", () => {
      const { rerender } = render(
        <PasswordLoginForm
          onSubmit={mockOnSubmit}
          onSwitchToEmailLink={mockOnSwitchToEmailLink}
          onForgotPassword={mockOnForgotPassword}
          onGoogleLogin={mockOnGoogleLogin}
          onClearError={mockOnClearError}
          errorMessage="Global Error"
        />
      );
      const emailInput = screen.getByTestId("mock-email-input");

      fireEvent.click(screen.getByRole("button", { name: "Masuk" })); // Trigger local error

      fireEvent.change(emailInput, { target: { value: "a" } });

      // Simulate parent clearing global error
      rerender(
        <PasswordLoginForm
          onSubmit={mockOnSubmit}
          onSwitchToEmailLink={mockOnSwitchToEmailLink}
          onForgotPassword={mockOnForgotPassword}
          onGoogleLogin={mockOnGoogleLogin}
          onClearError={mockOnClearError}
          errorMessage={undefined}
        />
      );

      expect(emailInput).toHaveAttribute("data-error", "false"); // Local error cleared
      expect(mockOnClearError).toHaveBeenCalledTimes(1); // Global error clear called
    });

    /**
     * @it Verifies that typing in the password input updates the state, clears local errors,
     * and calls `onClearError` if a global error message was present.
     */
    it("should update password state and clear errors on input change", () => {
      const { rerender } = render(
        <PasswordLoginForm
          onSubmit={mockOnSubmit}
          onSwitchToEmailLink={mockOnSwitchToEmailLink}
          onForgotPassword={mockOnForgotPassword}
          onGoogleLogin={mockOnGoogleLogin}
          onClearError={mockOnClearError}
          errorMessage="Global Error"
        />
      );
      const passwordInput = screen.getByTestId("mock-password-input");

      fireEvent.click(screen.getByRole("button", { name: "Masuk" })); // Trigger local error

      fireEvent.change(passwordInput, { target: { value: "p" } });

      // Simulate parent clearing global error
      rerender(
        <PasswordLoginForm
          onSubmit={mockOnSubmit}
          onSwitchToEmailLink={mockOnSwitchToEmailLink}
          onForgotPassword={mockOnForgotPassword}
          onGoogleLogin={mockOnGoogleLogin}
          onClearError={mockOnClearError}
          errorMessage={undefined}
        />
      );

      expect(passwordInput).toHaveAttribute("data-error", "false"); // Local error cleared
      expect(mockOnClearError).toHaveBeenCalledTimes(1); // Global error clear called
    });

    /**
     * @it Verifies that submitting with an invalid email format shows the email error
     * and does not submit the form.
     */
    it("should show invalid email format error", () => {
      render(
        <PasswordLoginForm
          onSubmit={mockOnSubmit}
          onSwitchToEmailLink={mockOnSwitchToEmailLink}
          onForgotPassword={mockOnForgotPassword}
          onGoogleLogin={mockOnGoogleLogin}
          onClearError={mockOnClearError}
        />
      );
      const submitButton = screen.getByRole("button", { name: "Masuk" });
      const emailInput = screen.getByTestId("mock-email-input");
      const passwordInput = screen.getByTestId("mock-password-input");

      fireEvent.change(emailInput, { target: { value: "invalid-email" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
      expect(passwordInput).toHaveAttribute("data-error", "false");
    });

    /**
     * @it Verifies that submitting with a valid email but empty password shows only the password required error.
     */
    it("should show only password required error if email is valid", () => {
      render(
        <PasswordLoginForm
          onSubmit={mockOnSubmit}
          onSwitchToEmailLink={mockOnSwitchToEmailLink}
          onForgotPassword={mockOnForgotPassword}
          onGoogleLogin={mockOnGoogleLogin}
          onClearError={mockOnClearError}
        />
      );
      const submitButton = screen.getByRole("button", { name: "Masuk" });
      const emailInput = screen.getByTestId("mock-email-input");

      fireEvent.change(emailInput, { target: { value: "valid@example.com" } });
      fireEvent.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
      expect(emailInput).toHaveAttribute("data-error", "false");
    });

    /**
     * @it Verifies that submitting with valid email and password calls `onSubmit` with the credentials
     * and clears any local validation errors.
     */
    it("should call onSubmit with credentials and clear errors when valid", () => {
      render(
        <PasswordLoginForm
          onSubmit={mockOnSubmit}
          onSwitchToEmailLink={mockOnSwitchToEmailLink}
          onForgotPassword={mockOnForgotPassword}
          onGoogleLogin={mockOnGoogleLogin}
          onClearError={mockOnClearError}
        />
      );
      const submitButton = screen.getByRole("button", { name: "Masuk" });
      const emailInput = screen.getByTestId("mock-email-input");
      const passwordInput = screen.getByTestId("mock-password-input");

      fireEvent.click(submitButton); // Set initial errors

      fireEvent.change(emailInput, { target: { value: "valid@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith({
        email: "valid@example.com",
        plainPassword: "password123",
      });

      expect(emailInput).toHaveAttribute("data-error", "false");
      expect(passwordInput).toHaveAttribute("data-error", "false");
    });
  });

  /**
   * @describe Tests interactions with the secondary action buttons (switch auth method, forgot password, Google login).
   */
  describe("Callback Interactions", () => {
    /**
     * @it Verifies that clicking the "Switch to Email Link" button calls the `onSwitchToEmailLink` callback.
     */
    it("should call onSwitchToEmailLink", () => {
      render(
        <PasswordLoginForm
          onSubmit={mockOnSubmit}
          onSwitchToEmailLink={mockOnSwitchToEmailLink}
          onForgotPassword={mockOnForgotPassword}
          onGoogleLogin={mockOnGoogleLogin}
          onClearError={mockOnClearError}
        />
      );
      const button = screen.getByRole("button", {
        name: /Kirim link login melalui email/i,
      });
      fireEvent.click(button);
      expect(mockOnSwitchToEmailLink).toHaveBeenCalledTimes(1);
    });

    /**
     * @it Verifies that clicking the "Forgot Password" button calls the `onForgotPassword` callback.
     */
    it("should call onForgotPassword", () => {
      render(
        <PasswordLoginForm
          onSubmit={mockOnSubmit}
          onSwitchToEmailLink={mockOnSwitchToEmailLink}
          onForgotPassword={mockOnForgotPassword}
          onGoogleLogin={mockOnGoogleLogin}
          onClearError={mockOnClearError}
        />
      );
      const button = screen.getByRole("button", { name: /Lupa kata sandi/i });
      fireEvent.click(button);
      expect(mockOnForgotPassword).toHaveBeenCalledTimes(1);
    });

    /**
     * @it Verifies that clicking the "Login with Google" button calls the `onGoogleLogin` callback.
     */
    it("should call onGoogleLogin", () => {
      render(
        <PasswordLoginForm
          onSubmit={mockOnSubmit}
          onSwitchToEmailLink={mockOnSwitchToEmailLink}
          onForgotPassword={mockOnForgotPassword}
          onGoogleLogin={mockOnGoogleLogin}
          onClearError={mockOnClearError}
        />
      );
      const button = screen.getByRole("button", {
        name: /Masuk dengan Google/i,
      });
      fireEvent.click(button);
      expect(mockOnGoogleLogin).toHaveBeenCalledTimes(1);
    });
  });
});
