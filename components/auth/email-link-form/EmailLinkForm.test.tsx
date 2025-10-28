import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import EmailLinkForm from "./EmailLinkForm";
import { InputValue } from "@/types/InputConfig";

/**
 * @file Test suite for the `EmailLinkForm` component.
 * @description This file contains unit tests for the `EmailLinkForm` component,
 * verifying its rendering, input validation logic, state updates, and
 * callback interactions (submit, switch to password, Google login).
 * It uses mocks for the unified `Input` component, `next/link`, `next/image`, and icons.
 */

// --- Mocks ---

/**
 * Variable to capture the `onChange` prop passed to the mock `Input` component.
 * Allows tests to simulate user typing in the mocked input.
 */
let mockInputOnChange: (value: InputValue) => void;
/**
 * Mock function for the `Input` component.
 * Used to assert that the component receives the correct props (value, error state).
 */
const mockInput = jest.fn();

/**
 * Mocks the unified `Input` component.
 * Renders a simple HTML `<input>` element for interaction in tests.
 * Captures the `onChange` prop to allow simulation of input changes.
 */
jest.mock("../../../components/input/Input", () => ({
  __esModule: true,
  default: (props: {
    onChange: (value: InputValue) => void;
    config: {
      label: string;
      placeholder: string;
      required: true;
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
}));

// --- Test Setup ---

/**
 * @describe Main test suite for the `EmailLinkForm` component.
 */
describe("EmailLinkForm", () => {
  let mockOnSubmit: jest.Mock;
  let mockOnSwitchToPassword: jest.Mock;
  let mockOnGoogleLogin: jest.Mock;

  /**
   * @beforeEach Resets all mock functions and variables before each test.
   */
  beforeEach(() => {
    mockOnSubmit = jest.fn();
    mockOnSwitchToPassword = jest.fn();
    mockOnGoogleLogin = jest.fn();
    mockInput.mockClear();
    mockInputOnChange = () => {};
  });

  /**
   * @describe Tests related to the initial rendering of the form and its props.
   */
  describe("Rendering and Props", () => {
    /**
     * @it Verifies that all main elements (title, input, buttons, links, logo) are rendered.
     */
    it("should render the form title, email input, and buttons", () => {
      render(
        <EmailLinkForm
          onSubmit={mockOnSubmit}
          onSwitchToPassword={mockOnSwitchToPassword}
          onGoogleLogin={mockOnGoogleLogin}
        />
      );

      expect(
        screen.getByRole("heading", { name: /Masuk ke Rakamin/i })
      ).toBeInTheDocument();
      expect(screen.getByTestId("mock-email-input")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Kirim link/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Masuk dengan kata sandi/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Masuk dengan Google/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /Daftar menggunakan email/i })
      ).toBeInTheDocument();
      expect(screen.getByAltText("Rakamin Logo")).toBeInTheDocument();
    });

    /**
     * @it Verifies that the global `errorMessage` prop is displayed in an alert box.
     */
    it("should display the global errorMessage", () => {
      render(
        <EmailLinkForm
          onSubmit={mockOnSubmit}
          onSwitchToPassword={mockOnSwitchToPassword}
          onGoogleLogin={mockOnGoogleLogin}
          errorMessage="belum terdaftar"
        />
      );
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent("belum terdaftar");
      expect(
        within(alert).getByRole("link", { name: /Daftar/i })
      ).toBeInTheDocument();
    });

    /**
     * @it Verifies that buttons are disabled and show loading state when `isLoading` is true.
     */
    it("should disable buttons and show loading text when isLoading is true", () => {
      render(
        <EmailLinkForm
          onSubmit={mockOnSubmit}
          onSwitchToPassword={mockOnSwitchToPassword}
          onGoogleLogin={mockOnGoogleLogin}
          isLoading={true}
        />
      );
      const submitButton = screen.getByRole("button", { name: /Mengirim.../i });
      const passwordButton = screen.getByRole("button", {
        name: /Masuk dengan kata sandi/i,
      });
      const googleButton = screen.getByRole("button", {
        name: /Masuk dengan Google/i,
      });

      expect(submitButton).toBeDisabled();
      expect(passwordButton).toBeDisabled();
      expect(googleButton).toBeDisabled();
    });
  });

  /**
   * @describe Tests for internal state management, input validation, and form submission.
   */
  describe("State, Validation, and Submission", () => {
    /**
     * @it Verifies that typing in the email input updates the component's state,
     * reflected in the props passed to the `Input` component.
     */
    it("should update email state on input change", () => {
      render(
        <EmailLinkForm
          onSubmit={mockOnSubmit}
          onSwitchToPassword={mockOnSwitchToPassword}
          onGoogleLogin={mockOnGoogleLogin}
        />
      );
      const emailInput = screen.getByTestId("mock-email-input");

      fireEvent.change(emailInput, { target: { value: "test@" } });

      expect(mockInput).toHaveBeenLastCalledWith(
        expect.objectContaining({ value: "test@" })
      );
    });

    /**
     * @it Verifies that submitting an invalid email format prevents `onSubmit` call
     * and passes an error message to the `Input` component.
     */
    it("should show invalid format error if submitted with bad format", () => {
      render(
        <EmailLinkForm
          onSubmit={mockOnSubmit}
          onSwitchToPassword={mockOnSwitchToPassword}
          onGoogleLogin={mockOnGoogleLogin}
        />
      );
      const submitButton = screen.getByRole("button", { name: /Kirim link/i });
      const emailInput = screen.getByTestId("mock-email-input");

      fireEvent.change(emailInput, { target: { value: "invalid-email" } });
      fireEvent.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
      expect(mockInput).toHaveBeenLastCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            error: "Format email tidak valid",
          }),
        })
      );
    });

    /**
     * @it Verifies that submitting a valid email calls `onSubmit` and clears any previous input errors.
     */
    it("should call onSubmit with valid email and clear error", () => {
      render(
        <EmailLinkForm
          onSubmit={mockOnSubmit}
          onSwitchToPassword={mockOnSwitchToPassword}
          onGoogleLogin={mockOnGoogleLogin}
        />
      );
      const submitButton = screen.getByRole("button", { name: /Kirim link/i });
      const emailInput = screen.getByTestId("mock-email-input");

      fireEvent.click(submitButton); // Trigger initial error

      fireEvent.change(emailInput, { target: { value: "valid@example.com" } });
      fireEvent.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith("valid@example.com");

      expect(mockInput).toHaveBeenLastCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({ error: undefined }),
        })
      );
    });

    /**
     * @it Verifies that typing after a validation error clears that error.
     */
    it("should clear input error when user types after an error", () => {
      render(
        <EmailLinkForm
          onSubmit={mockOnSubmit}
          onSwitchToPassword={mockOnSwitchToPassword}
          onGoogleLogin={mockOnGoogleLogin}
        />
      );
      const submitButton = screen.getByRole("button", { name: /Kirim link/i });
      const emailInput = screen.getByTestId("mock-email-input");

      fireEvent.click(submitButton); // Trigger required error

      fireEvent.change(emailInput, { target: { value: "a" } });

      expect(mockInput).toHaveBeenLastCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({ error: undefined }),
        })
      );
    });
  });

  /**
   * @describe Tests for interactions with the secondary action buttons.
   */
  describe("Callback Interactions", () => {
    /**
     * @it Verifies that clicking the "Login with password" button calls the `onSwitchToPassword` callback.
     */
    it("should call onSwitchToPassword when password button is clicked", () => {
      render(
        <EmailLinkForm
          onSubmit={mockOnSubmit}
          onSwitchToPassword={mockOnSwitchToPassword}
          onGoogleLogin={mockOnGoogleLogin}
        />
      );
      const passwordButton = screen.getByRole("button", {
        name: /Masuk dengan kata sandi/i,
      });
      fireEvent.click(passwordButton);
      expect(mockOnSwitchToPassword).toHaveBeenCalledTimes(1);
    });

    /**
     * @it Verifies that clicking the "Login with Google" button calls the `onGoogleLogin` callback.
     */
    it("should call onGoogleLogin when Google button is clicked", () => {
      render(
        <EmailLinkForm
          onSubmit={mockOnSubmit}
          onSwitchToPassword={mockOnSwitchToPassword}
          onGoogleLogin={mockOnGoogleLogin}
        />
      );
      const googleButton = screen.getByRole("button", {
        name: /Masuk dengan Google/i,
      });
      fireEvent.click(googleButton);
      expect(mockOnGoogleLogin).toHaveBeenCalledTimes(1);
    });
  });
});
