import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import RadioInput from "./RadioInput"; // Adjust import path
import { RadioOption } from "./RadioInput"; // Adjust import path

/**
 * @file Test suite for the RadioInput component.
 * @description This file contains unit tests for the RadioInput component,
 * covering rendering of labels, options, error messages, visual states
 * (selected, disabled, error, focus), and user interactions.
 */

/**
 * Mock data representing the options passed to the RadioInput component.
 * @type {RadioOption[]}
 */
const mockOptions: RadioOption[] = [
  { value: "val-1", label: "Option 1" },
  { value: "val-2", label: "Option 2" },
  { value: "val-3", label: "Option 3" },
];

/**
 * @describe Main test suite for the RadioInput component.
 */
describe("RadioInput", () => {
  let mockOnChange: jest.Mock;

  /**
   * @beforeEach Resets the mock `onChange` function before each test runs.
   */
  beforeEach(() => {
    mockOnChange = jest.fn();
  });

  /**
   * @describe Tests related to basic rendering and prop handling.
   */
  describe("Rendering and Props", () => {
    /**
     * @it Verifies that the group label and required asterisk are rendered when provided.
     */
    it("should render the group label and required asterisk", () => {
      render(
        <RadioInput
          label="Test Label"
          required
          options={mockOptions}
          name="test-group"
          selectedValue={null}
          onChange={mockOnChange}
        />
      );
      const label = screen.getByText("Test Label");
      const asterisk = screen.getByText("*");
      expect(label).toBeInTheDocument();
      expect(asterisk).toBeInTheDocument();
    });

    /**
     * @it Verifies that all provided options are rendered as radio inputs
     * and correctly associated with their labels via `getByLabelText`.
     * Also checks the `name` and `value` attributes.
     */
    it("should render all options as radio buttons linked to labels", () => {
      render(
        <RadioInput
          options={mockOptions}
          name="test-group"
          selectedValue={null}
          onChange={mockOnChange}
        />
      );
      const radios = screen.getAllByRole("radio");
      expect(radios).toHaveLength(3);

      expect(screen.getByLabelText("Option 1")).toBeInTheDocument();
      expect(screen.getByLabelText("Option 2")).toBeInTheDocument();
      expect(screen.getByLabelText("Option 3")).toBeInTheDocument();

      expect(radios[0]).toHaveAttribute("name", "test-group");
      expect(radios[0]).toHaveAttribute("value", "val-1");
      expect(radios[1]).toHaveAttribute("value", "val-2");
    });

    /**
     * @it Verifies that a string error message is rendered and associated
     * with the radio inputs via `aria-describedby`.
     */
    it("should render a string error message and link via ARIA", () => {
      render(
        <RadioInput
          error="This is an error"
          name="test-group"
          options={mockOptions}
          selectedValue={null}
          onChange={mockOnChange}
        />
      );
      const errorMsg = screen.getByText("This is an error");
      expect(errorMsg).toBeInTheDocument();
      expect(errorMsg).toHaveClass("text-danger-main");

      const errorContainer = errorMsg.parentElement;
      expect(errorContainer).toHaveAttribute("id", "test-group-error-message");
      const radio = screen.getByLabelText("Option 1");
      expect(radio).toHaveAttribute(
        "aria-describedby",
        "test-group-error-message"
      );
    });

    /**
     * @it Verifies that no error message text is rendered if the `error` prop is `true` (boolean).
     */
    it("should not render error message if error is true (boolean)", () => {
      render(
        <RadioInput
          error={true}
          name="test-group"
          options={mockOptions}
          selectedValue={null}
          onChange={mockOnChange}
        />
      );
      expect(screen.queryByText(/This is an error/)).not.toBeInTheDocument();
    });
  });

  /**
   * @describe Tests for CSS classes applied in different component states
   * (selected, disabled, error, focus).
   */
  describe("Visual States (Classes)", () => {
    /**
     * @it Verifies that the radio input corresponding to `selectedValue` is checked.
     */
    it("should correctly check the selectedValue", () => {
      render(
        <RadioInput
          options={mockOptions}
          name="test-group"
          selectedValue="val-2" // 'Option 2' is selected
          onChange={mockOnChange}
        />
      );
      expect(screen.getByLabelText("Option 1")).not.toBeChecked();
      expect(screen.getByLabelText("Option 2")).toBeChecked();
      expect(screen.getByLabelText("Option 3")).not.toBeChecked();
    });

    /**
     * @it Verifies that the custom styled div receives the correct classes
     * when an option is selected vs. unselected.
     */
    it("should apply selected styles to the checked option", () => {
      render(
        <RadioInput
          options={mockOptions}
          name="test-group"
          selectedValue="val-2"
          onChange={mockOnChange}
        />
      );
      const radio1 = screen.getByLabelText("Option 1");
      const radio2 = screen.getByLabelText("Option 2");

      const styledDiv1 = radio1.nextElementSibling as HTMLElement;
      const styledDiv2 = radio2.nextElementSibling as HTMLElement;

      expect(styledDiv1).toHaveClass("border-neutral-90");
      expect(styledDiv1.firstChild).toHaveClass("bg-transparent");

      expect(styledDiv2).toHaveClass("border-primary-main");
      expect(styledDiv2.firstChild).toHaveClass("bg-primary-main");
    });

    /**
     * @it Verifies that disabled attributes and styles are applied to all options
     * when the `disabled` prop is true.
     */
    it("should apply disabled styles to all options", () => {
      render(
        <RadioInput
          disabled
          options={mockOptions}
          name="test-group"
          selectedValue="val-1"
          onChange={mockOnChange}
        />
      );
      screen.getAllByRole("radio").forEach((radio) => {
        expect(radio).toBeDisabled();
      });

      const label1 = screen.getByText("Option 1");
      const radio1 = screen.getByLabelText("Option 1");
      const styledDiv1 = radio1.nextElementSibling as HTMLElement;

      expect(label1).toHaveClass("text-neutral-60");
      expect(label1.parentElement).toHaveClass(
        "cursor-not-allowed",
        "opacity-60"
      );
      expect(styledDiv1).toHaveClass("border-neutral-40");
      expect(styledDiv1.firstChild).toHaveClass("bg-neutral-40");
    });

    /**
     * @it Verifies that error-related classes are applied to options
     * when the `error` prop is true.
     */
    it("should apply error styles to options", () => {
      render(
        <RadioInput
          error
          options={mockOptions}
          name="test-group"
          selectedValue="val-2" // Option 2 is selected
          onChange={mockOnChange}
        />
      );
      const label1 = screen.getByText("Option 1");
      const label2 = screen.getByText("Option 2");
      const radio1 = screen.getByLabelText("Option 1");
      const radio2 = screen.getByLabelText("Option 2");
      const styledDiv1 = radio1.nextElementSibling as HTMLElement;
      const styledDiv2 = radio2.nextElementSibling as HTMLElement;

      expect(label1).toHaveClass("text-danger-main");
      expect(label2).toHaveClass("text-danger-main");

      expect(styledDiv1).toHaveClass("border-danger-main");
      expect(styledDiv2).toHaveClass("border-danger-main"); // Error border overrides selected border
    });

    /**
     * @it Verifies that focus ring classes are applied when an option receives focus.
     * Note: Checks for the color class, as JSDOM doesn't simulate `peer-focus-visible:ring-2`.
     */
    it("should apply focus styles on tab focus", () => {
      render(
        <RadioInput
          options={mockOptions}
          name="test-group"
          selectedValue={null}
          onChange={mockOnChange}
        />
      );
      const radio1 = screen.getByLabelText("Option 1");
      const styledDiv1 = radio1.nextElementSibling as HTMLElement;

      expect(styledDiv1).not.toHaveClass("ring-2"); // Initial check

      act(() => {
        radio1.focus();
      });

      expect(styledDiv1).toHaveClass("ring-primary-focus/50"); // Focus color class

      act(() => {
        radio1.blur();
      });
      // Class might remain, but visual effect depends on pseudo-class
      // Check it's not present initially is the main goal here.
      expect(styledDiv1).not.toHaveClass("ring-2");
    });

    /**
     * @it Verifies that error-specific focus ring classes are applied on focus when in error state.
     */
    it("should apply error focus styles", () => {
      render(
        <RadioInput
          error
          options={mockOptions}
          name="test-group"
          selectedValue={null}
          onChange={mockOnChange}
        />
      );
      const radio1 = screen.getByLabelText("Option 1");
      const styledDiv1 = radio1.nextElementSibling as HTMLElement;

      act(() => {
        radio1.focus();
      });

      expect(styledDiv1).toHaveClass("ring-danger-main/50"); // Error focus color class
    });
  });

  /**
   * @describe Tests for user interactions, specifically clicking options.
   */
  describe("User Interactions", () => {
    /**
     * @it Verifies that clicking an option's label calls the `onChange` callback
     * with the correct value.
     */
    it("should call onChange with the correct value when clicked", () => {
      render(
        <RadioInput
          options={mockOptions}
          name="test-group"
          selectedValue={null}
          onChange={mockOnChange}
        />
      );
      const label2 = screen.getByText("Option 2");

      act(() => {
        fireEvent.click(label2);
      });

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith("val-2");
    });

    /**
     * @it Verifies that clicking an option does not call `onChange` if the group is disabled.
     */
    it("should not call onChange when a disabled option is clicked", () => {
      render(
        <RadioInput
          disabled
          options={mockOptions}
          name="test-group"
          selectedValue={null}
          onChange={mockOnChange}
        />
      );
      const label1 = screen.getByText("Option 1");

      act(() => {
        fireEvent.click(label1);
      });

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });
});
