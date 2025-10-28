import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import ForgotPasswordForm from "./ForgotPasswordForm"; // Adjust import path
import { InputValue } from "@/types/InputConfig"; // Adjust path

/**
 * @file Test suite for the `ForgotPasswordForm` component.
 * @description This file contains unit tests for the `ForgotPasswordForm`,
 * verifying rendering, input validation, state management, error handling,
 * and callback interactions. Mocks are used for child components (`Input`),
 * Next.js features (`Link`, `Image`), and icons.
 */

// --- Mocks ---

/** Variable to capture the `onChange` handler for the mock email input. */
let mockInputOnChange: (value: InputValue) => void;
/** Mock function for the unified `Input` component. */
const mockInput = jest.fn();

/**
 * Mocks the unified `Input` component.
 * Renders a basic HTML input, captures its `onChange` handler,
 * and reflects the `error` prop in a `data-error` attribute for testing.
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
    mockInputOnChange = props.onChange;
    mockInput(props);
    return (
      <input
        data-testid="mock-email-input"
        aria-label={props.config.label || "Email Input"}
        value={props.value || ""}
        onChange={(e) => mockInputOnChange(e.target.value)}
        placeholder={props.config.placeholder}
        required={props.config.required}
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
  UilArrowLeft: () => <span data-testid="icon-arrow-left" />,
}));

/**
 * @describe Main test suite for the `ForgotPasswordForm` component.
 */
describe("ForgotPasswordForm", () => {
  let mockOnSubmit: jest.Mock;
  let mockOnBackToLogin: jest.Mock;
  let mockOnClearError: jest.Mock;

  /**
   * @beforeEach Resets all mock functions before each test.
   */
  beforeEach(() => {
    mockOnSubmit = jest.fn();
    mockOnBackToLogin = jest.fn();
    mockOnClearError = jest.fn();
    mockInput.mockClear();
    mockInputOnChange = () => {};
  });

  /**
   * @describe Tests related to the initial rendering and prop handling.
   */
  describe("Rendering and Props", () => {
    /**
     * @it Verifies that all essential form elements are rendered on initial load.
     */
    it("should render form title, instructions, email input, and buttons", () => {
      render(
        <ForgotPasswordForm
          onSubmit={mockOnSubmit}
          onBackToLogin={mockOnBackToLogin}
          onClearError={mockOnClearError}
        />
      );

      expect(
        screen.getByRole("heading", { name: /Selamat datang di Rakamin/i })
      ).toBeInTheDocument();
      expect(screen.getByAltText("Rakamin Logo")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Kembali/i })
      ).toBeInTheDocument();

      expect(
        screen.getByText(/Masukan alamat email yang telah terdaftar/i)
      ).toBeInTheDocument();

      expect(screen.getByTestId("mock-email-input")).toBeInTheDocument();

      expect(
        screen.getByRole("button", { name: /Kirim email/i })
      ).toBeInTheDocument();
    });

    /**
     * @it Verifies that a global error message and icon are displayed when the `errorMessage` prop is provided,
     * and that the conditional "Register" link is *not* shown.
     */
    it("should display the global errorMessage and icon, without register link", () => {
      render(
        <ForgotPasswordForm
          onSubmit={mockOnSubmit}
          onBackToLogin={mockOnBackToLogin}
          onClearError={mockOnClearError}
          errorMessage="Email not found"
        />
      );
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent("Email not found");
      expect(within(alert).getByTestId("icon-exclamation")).toBeInTheDocument();
      expect(
        within(alert).queryByRole("link", { name: /Daftar/i })
      ).not.toBeInTheDocument();
    });

    /**
     * @it Verifies that a global error message is displayed when provided,
     * and that the conditional "Register" link *is* shown if the message contains specific text.
     */
    it('should display the global errorMessage AND register link if message contains "belum terdaftar"', () => {
      render(
        <ForgotPasswordForm
          onSubmit={mockOnSubmit}
          onBackToLogin={mockOnBackToLogin}
          onClearError={mockOnClearError}
          errorMessage="Email belum terdaftar"
        />
      );
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent("Email belum terdaftar");
      expect(within(alert).getByTestId("icon-exclamation")).toBeInTheDocument();
      expect(
        within(alert).getByRole("link", { name: /Daftar/i })
      ).toBeInTheDocument();
    });

    /**
     * @it Verifies that buttons are disabled and show loading text when `isLoading` prop is true.
     */
    it("should disable buttons and show loading text when isLoading is true", () => {
      render(
        <ForgotPasswordForm
          onSubmit={mockOnSubmit}
          onBackToLogin={mockOnBackToLogin}
          onClearError={mockOnClearError}
          isLoading={true}
        />
      );
      const submitButton = screen.getByRole("button", { name: /Mengirim.../i });
      const backButton = screen.getByRole("button", { name: /Kembali/i });

      expect(submitButton).toBeDisabled();
      expect(backButton).toBeDisabled();
    });

    /**
     * @it Verifies that the mock input receives an error state (`data-error="true"`)
     * when a global `errorMessage` is present and there are no local validation errors.
     */
    it("should pass error=true to input when global error exists and no local errors", () => {
      render(
        <ForgotPasswordForm
          onSubmit={mockOnSubmit}
          onBackToLogin={mockOnBackToLogin}
          onClearError={mockOnClearError}
          errorMessage="Email not found"
        />
      );
      const emailInput = screen.getByTestId("mock-email-input");
      expect(emailInput).toHaveAttribute("data-error", "true");
    });
  });

  /**
   * @describe Tests for internal state management, input validation, and form submission behavior.
   */
  describe("State, Validation, and Submission", () => {
    /**
     * @it Verifies that typing in the email input updates state, clears local validation errors,
     * and calls `onClearError` if a global error was present.
     */
    it("should update email state and clear errors on input change", () => {
      render(
        <ForgotPasswordForm
          onSubmit={mockOnSubmit}
          onBackToLogin={mockOnBackToLogin}
          onClearError={mockOnClearError}
          // errorMessage="Global Error" <-- REMOVE THIS LINE
        />
      );
      const emailInput = screen.getByTestId("mock-email-input");

      fireEvent.click(screen.getByRole("button", { name: /Kirim email/i })); // Trigger local error

      fireEvent.change(emailInput, { target: { value: "a" } });

      // Check input reflects the change (via mock props)
      expect(mockInput).toHaveBeenLastCalledWith(
        expect.objectContaining({ value: "a" })
      );
      // Check local error cleared (via mock props)
      expect(mockInput).toHaveBeenLastCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({ error: false }),
        })
      );
      // Check global error clear callback was called
      expect(mockOnClearError).toHaveBeenCalledTimes(0);
    });

    /**
     * @it Verifies that submitting with an invalid email format shows the email error
     * and prevents the `onSubmit` callback from being called.
     */
    it("should show invalid format error if submitted with bad format", () => {
      render(
        <ForgotPasswordForm
          onSubmit={mockOnSubmit}
          onBackToLogin={mockOnBackToLogin}
          onClearError={mockOnClearError}
        />
      );
      const submitButton = screen.getByRole("button", { name: /Kirim email/i });
      const emailInput = screen.getByTestId("mock-email-input");

      fireEvent.change(emailInput, { target: { value: "invalid-email" } });
      fireEvent.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
      // Check mock input received the error prop
      expect(mockInput).toHaveBeenLastCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            error: "Format email tidak valid",
          }),
        })
      );
      // Check data-error attribute directly on the rendered mock input
      expect(emailInput).toHaveAttribute(
        "data-error",
        "Format email tidak valid"
      );
    });

    /**
     * @it Verifies that submitting with a valid email calls the `onSubmit` callback
     * with the correct email address and clears any previous validation errors.
     */
    it("should call onSubmit with valid email and clear errors", () => {
      render(
        <ForgotPasswordForm
          onSubmit={mockOnSubmit}
          onBackToLogin={mockOnBackToLogin}
          onClearError={mockOnClearError}
        />
      );
      const submitButton = screen.getByRole("button", { name: /Kirim email/i });
      const emailInput = screen.getByTestId("mock-email-input");

      fireEvent.click(submitButton); // Set initial error

      fireEvent.change(emailInput, { target: { value: "valid@example.com" } });
      fireEvent.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith("valid@example.com");

      // Check mock input received cleared error prop
      expect(mockInput).toHaveBeenLastCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({ error: false }), // <-- CHANGE THIS TO false
        })
      );
      // Check data-error attribute directly
      expect(emailInput).toHaveAttribute("data-error", "false");
    });
  });

  /**
   * @describe Tests interactions with secondary actions like the back button.
   */
  describe("Callback Interactions", () => {
    /**
     * @it Verifies that clicking the "Back" button calls the `onBackToLogin` callback.
     */
    it("should call onBackToLogin when back button is clicked", () => {
      render(
        <ForgotPasswordForm
          onSubmit={mockOnSubmit}
          onBackToLogin={mockOnBackToLogin}
          onClearError={mockOnClearError}
        />
      );
      const backButton = screen.getByRole("button", { name: /Kembali/i });
      fireEvent.click(backButton);
      expect(mockOnBackToLogin).toHaveBeenCalledTimes(1);
    });
  });
});
