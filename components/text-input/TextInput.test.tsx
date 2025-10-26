import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import TextInput from "./TextInput"; // Adjust import path as needed

/**
 * @file Test suite for the TextInput component.
 * @description This file contains unit tests for the TextInput component,
 * covering rendering, props, visual states (disabled, error, focus),
 * user interactions, and specific password-type functionality.
 */

// --- Mocks ---

/**
 * Mocks the `@iconscout/react-unicons` library.
 * This replaces the actual icons with simple <span> elements
 * that include a `data-testid` for easy selection in tests
 * and pass through all props (like `className`) to allow style-checking.
 */
jest.mock("@iconscout/react-unicons", () => ({
  UilCheckCircle: (props: any) => <span data-testid="icon-check" {...props} />,
  UilEye: (props: any) => <span data-testid="icon-eye" {...props} />,
  UilEyeSlash: (props: any) => <span data-testid="icon-eye-slash" {...props} />,
}));

// --- Test Setup ---

/**
 * @describe Main test suite for the TextInput component.
 */
describe("TextInput", () => {
  let mockOnChange: jest.Mock;

  /**
   * @beforeEach Resets the mock `onChange` function before each test.
   */
  beforeEach(() => {
    mockOnChange = jest.fn();
  });

  // --- Rendering and Props ---
  /**
   * @describe Tests related to basic rendering and prop handling.
   */
  describe("Rendering and Props", () => {
    /**
     * @it Verifies that the label, required asterisk, and `for`/`id` association are correctly rendered.
     */
    it("should render the label, required asterisk, and link label to input", () => {
      render(
        <TextInput
          label="Email"
          required
          value=""
          onChange={mockOnChange}
          id="email-input"
        />
      );
      const label = screen.getByText("Email");
      const asterisk = screen.getByText("*");
      expect(label).toBeInTheDocument();
      expect(asterisk).toBeInTheDocument();

      // Label is correctly associated with the input
      expect(label).toHaveAttribute("for", "email-input");
      const input = screen.getByLabelText("Email*");
      expect(input).toBeInTheDocument();
      expect(input.id).toBe("email-input");
    });

    /**
     * @it Verifies that the input correctly displays the placeholder when value is null/empty and the value when provided.
     */
    it("should display the correct value and placeholder", () => {
      const { rerender } = render(
        <TextInput
          value={null}
          onChange={mockOnChange}
          placeholder="Enter email"
        />
      );
      const input = screen.getByPlaceholderText(
        "Enter email"
      ) as HTMLInputElement;
      expect(input.value).toBe("");

      // Re-render with a value
      rerender(
        <TextInput
          value="test@example.com"
          onChange={mockOnChange}
          placeholder="Enter email"
        />
      );
      expect(input.value).toBe("test@example.com");
    });

    /**
     * @it Verifies that a string error message is rendered and associated with the input via ARIA attributes.
     */
    it("should render a string error message and ARIA attributes", () => {
      render(
        <TextInput
          error="Invalid email"
          value="test"
          onChange={mockOnChange}
          id="email-field"
        />
      );
      const input = screen.getByDisplayValue("test");
      const errorMsg = screen.getByText("Invalid email");

      expect(errorMsg).toBeInTheDocument();
      expect(errorMsg).toHaveClass("text-danger-main");
      // Check ARIA attributes
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAttribute("aria-describedby", "email-field-message");
      expect(errorMsg.parentElement).toHaveAttribute(
        "id",
        "email-field-message"
      );
    });

    /**
     * @it Verifies that a success message and icon are rendered and associated with the input via ARIA attributes.
     */
    it("should render a success message and ARIA attributes", () => {
      render(
        <TextInput
          successMessage="Looks good!"
          value="test"
          onChange={mockOnChange}
          id="email-field"
        />
      );
      const input = screen.getByDisplayValue("test");
      const successMsg = screen.getByText("Looks good!");

      expect(successMsg).toBeInTheDocument();
      expect(successMsg).toHaveClass("text-primary-main");
      expect(screen.getByTestId("icon-check")).toBeInTheDocument();
      // Check ARIA attributes
      expect(input).toHaveAttribute("aria-invalid", "false");
      expect(input).toHaveAttribute("aria-describedby", "email-field-message");
      expect(successMsg.parentElement?.parentElement).toHaveAttribute(
        "id",
        "email-field-message"
      );
    });

    /**
     * @it Verifies that the error message takes precedence and is displayed if both error and success messages are provided.
     */
    it("should prioritize error message over success message", () => {
      render(
        <TextInput
          error="Is bad"
          successMessage="Looks good"
          value=""
          onChange={mockOnChange}
        />
      );
      expect(screen.getByText("Is bad")).toBeInTheDocument();
      expect(screen.queryByText("Looks good")).not.toBeInTheDocument();
      expect(screen.queryByTestId("icon-check")).not.toBeInTheDocument();
    });

    /**
     * @it Verifies that no error or success message container is rendered when the input is disabled.
     */
    it("should not render message container when disabled", () => {
      render(
        <TextInput
          error="Is bad"
          successMessage="Looks good"
          disabled
          value=""
          onChange={mockOnChange}
          id="test-id"
        />
      );
      expect(screen.queryByText("Is bad")).not.toBeInTheDocument();
      expect(screen.queryByText("Looks good")).not.toBeInTheDocument();
      expect(screen.queryByTestId("icon-check")).not.toBeInTheDocument();
      expect(screen.getByRole("textbox")).not.toHaveAttribute(
        "aria-describedby"
      );
    });
  });

  // --- Visual States (Classes) ---
  /**
   * @describe Tests for CSS classes applied in different component states (disabled, error, focus).
   */
  describe("Visual States (Classes)", () => {
    /**
     * @it Verifies that disabled-related classes are applied to the input, wrapper, and label when `disabled` prop is true.
     */
    it("should apply disabled styles and classes", () => {
      render(
        <TextInput disabled value="test" onChange={mockOnChange} label="Name" />
      );
      const input = screen.getByDisplayValue("test") as HTMLInputElement;
      const wrapper = input.parentElement as HTMLElement;
      const label = screen.getByText("Name");

      expect(input).toBeDisabled();
      expect(wrapper).toHaveClass(
        "bg-neutral-30 outline-neutral-40 cursor-not-allowed"
      );
      expect(input).toHaveClass("text-neutral-60 cursor-not-allowed");
      expect(label).toHaveClass("text-neutral-60");
    });

    /**
     * @it Verifies that error-related classes are applied to the input and wrapper when `error` prop is true.
     */
    it("should apply error styles and classes", () => {
      render(<TextInput error value="test" onChange={mockOnChange} />);
      const input = screen.getByDisplayValue("test");
      const wrapper = input.parentElement as HTMLElement;
      expect(wrapper).toHaveClass("bg-white outline-danger-main");
      expect(input).toHaveClass("caret-danger-main");
    });

    /**
     * @it Verifies that focus-related classes are applied on focus and removed on blur.
     */
    it("should apply focused styles and classes on focus", () => {
      render(<TextInput value="test" onChange={mockOnChange} />);
      const input = screen.getByDisplayValue("test");
      const wrapper = input.parentElement as HTMLElement;

      // Default idle state
      expect(wrapper).toHaveClass("bg-neutral-10 outline-neutral-40");

      // Focus
      act(() => {
        fireEvent.focus(input);
      });
      expect(wrapper).toHaveClass("bg-white outline-primary-main");
      expect(input).toHaveClass("caret-primary-main");

      // Blur
      act(() => {
        fireEvent.blur(input);
      });
      expect(wrapper).toHaveClass("bg-neutral-10 outline-neutral-40");
    });

    /**
     * @it Verifies that the input's text color is correct for both placeholder (empty value) and filled (non-empty value) states.
     */
    it("should apply correct text color for placeholder vs. value", () => {
      const { rerender } = render(
        <TextInput value={null} onChange={mockOnChange} placeholder="Test" />
      );
      const input = screen.getByPlaceholderText("Test") as HTMLInputElement;

      // Placeholder state (value is null)
      expect(input).toHaveClass("text-neutral-60");

      // Rerender with value
      rerender(
        <TextInput
          value="Has value"
          onChange={mockOnChange}
          placeholder="Test"
        />
      );
      // Value state
      expect(input).toHaveClass("text-neutral-90");
    });
  });

  // --- User Interactions ---
  /**
   * @describe Tests for user-driven events.
   */
  describe("User Interactions", () => {
    /**
     * @it Verifies that the `onChange` callback is fired when the user types in the input.
     */
    it("should call onChange when user types", () => {
      render(<TextInput value="" onChange={mockOnChange} />);
      const input = screen.getByRole("textbox");
      act(() => {
        fireEvent.change(input, { target: { value: "abc" } });
      });
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });
  });

  // --- Password Type ---
  /**
   * @describe Tests specific to the `type="password"` functionality.
   */
  describe("Password Type", () => {
    /**
     * @it Verifies that the password toggle button is not rendered for non-password input types.
     */
    it('should not render toggle button for type="text"', () => {
      render(<TextInput value="test" onChange={mockOnChange} type="text" />);
      expect(
        screen.queryByRole("button", { name: /Show password/i })
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("icon-eye")).not.toBeInTheDocument();
    });

    /**
     * @it Verifies that the toggle button renders for `type="password"` and switches the input type and icon on click.
     */
    it('should render toggle button and switch type for type="password"', () => {
      render(
        <TextInput value="pass123" onChange={mockOnChange} type="password" />
      );
      const input = screen.getByDisplayValue("pass123") as HTMLInputElement;
      const toggleButton = screen.getByRole("button", {
        name: "Show password",
      });

      // Initial state: password hidden
      expect(input.type).toBe("password");
      expect(screen.getByTestId("icon-eye")).toBeInTheDocument();
      expect(screen.queryByTestId("icon-eye-slash")).not.toBeInTheDocument();

      // Click to show password
      act(() => {
        fireEvent.click(toggleButton);
      });
      expect(input.type).toBe("text");
      expect(toggleButton).toHaveAttribute("aria-label", "Hide password");
      expect(screen.queryByTestId("icon-eye")).not.toBeInTheDocument();
      expect(screen.getByTestId("icon-eye-slash")).toBeInTheDocument();
      expect(screen.getByTestId("icon-eye-slash")).toHaveClass(
        "text-neutral-100"
      );

      // Click to hide password
      act(() => {
        fireEvent.click(toggleButton);
      });
      expect(input.type).toBe("password");
      expect(toggleButton).toHaveAttribute("aria-label", "Show password");
      expect(screen.getByTestId("icon-eye")).toBeInTheDocument();
    });

    /**
     * @it Verifies that the password toggle button is disabled and non-functional when the input is disabled.
     */
    it("should not toggle password visibility if disabled", () => {
      render(
        <TextInput
          value="pass123"
          onChange={mockOnChange}
          type="password"
          disabled
        />
      );
      const input = screen.getByDisplayValue("pass123") as HTMLInputElement;
      const toggleButton = screen.getByRole("button");

      expect(input.type).toBe("password");
      expect(toggleButton).toBeDisabled();
      // Check disabled icon color
      expect(screen.getByTestId("icon-eye")).toHaveClass("text-neutral-60");

      // Attempt to click
      act(() => {
        fireEvent.click(toggleButton);
      });

      // State should not change
      expect(input.type).toBe("password");
      expect(screen.getByTestId("icon-eye")).toBeInTheDocument();
    });
  });
});
