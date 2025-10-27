import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CheckboxInput } from "./CheckboxInput";

/**
 * Mocks the @iconscout/react-unicons library to provide stable
 * data-testid attributes for the Check and Minus icons,
 * preventing snapshots from breaking on icon implementation changes.
 */
jest.mock("@iconscout/react-unicons", () => ({
  UilCheck: () => <span data-testid="icon-check" />,
  UilMinus: () => <span data-testid="icon-minus" />,
}));

/**
 * Test suite for the CheckboxInput component.
 */
describe("CheckboxInput", () => {
  /** @type {jest.Mock} */
  let mockOnChange: jest.Mock;

  /**
   * Resets the mock function before each test.
   */
  beforeEach(() => {
    mockOnChange = jest.fn();
  });

  /**
   * Helper function to query and return the core checkbox elements.
   * It finds the hidden input and its associated label based on the unique ID.
   * @param {number | string} index - The index used to construct the unique ID.
   * @returns {{input: HTMLInputElement, label: HTMLLabelElement, uniqueId: string}}
   * @throws {Error} If the elements cannot be found.
   */
  const getElements = (index: number | string) => {
    const uniqueId = `checkbox-input-${index}`;
    const input = screen.getByRole("checkbox", {
      hidden: true,
    }) as HTMLInputElement; // Find the hidden input
    const label = document.querySelector(
      `label[for="${uniqueId}"]`
    ) as HTMLLabelElement; // Find the label linked to it

    if (!input || input.id !== uniqueId || !label) {
      throw new Error(`Could not find checkbox elements for index ${index}`);
    }

    return { input, label, uniqueId };
  };

  /**
   * Renders the CheckboxInput component with the given props inside a positioned container.
   * The container helps stabilize layout for JSDOM testing.
   * @param {React.ComponentProps<typeof CheckboxInput>} props - Props to pass to the CheckboxInput.
   * @returns {import("@testing-library/react").RenderResult} The render result from RTL.
   */
  const renderCheckbox = (
    props: React.ComponentProps<typeof CheckboxInput>
  ) => {
    return render(
      // Container helps with absolute positioning in JSDOM
      <div style={{ position: "relative", width: "30px", height: "30px" }}>
        <CheckboxInput {...props} />
      </div>
    );
  };

  /**
   * Tests related to component rendering and prop handling.
   */
  describe("Rendering and Props", () => {
    /**
     * It should render a hidden input[type="checkbox"] and a label
     * correctly linked by the 'id' and 'htmlFor' attributes.
     */
    it("should render a hidden checkbox and a label linked by id/htmlFor", () => {
      renderCheckbox({ index: "test-1", onChange: mockOnChange });
      const { input, label, uniqueId } = getElements("test-1");

      expect(input).toBeInTheDocument();
      expect(input).toHaveClass("hidden", "peer");
      expect(input).toHaveAttribute("id", uniqueId);
      expect(input).toHaveAttribute("type", "checkbox");

      expect(label).toBeInTheDocument();
      expect(label).toHaveAttribute("for", uniqueId);
    });

    /**
     * It should correctly merge a provided className with its internal classes.
     */
    it("should apply additional className to the label", () => {
      renderCheckbox({
        index: "test-2",
        onChange: mockOnChange,
        className: "extra-class-test",
      });
      const { label } = getElements("test-2");
      expect(label.className).toContain("extra-class-test");
      expect(label.className).toContain("cursor-pointer");
    });

    /**
     * It should pass standard HTML input attributes (like 'name')
     * down to the underlying hidden input element.
     */
    it("should pass down standard input props like name", () => {
      renderCheckbox({
        index: "test-3",
        onChange: mockOnChange,
        name: "my-checkbox",
      });
      const { input } = getElements("test-3");
      expect(input).toHaveAttribute("name", "my-checkbox");
    });
  });

  /**
   * Tests related to visual states (checked, unchecked, indeterminate, disabled)
   * and their corresponding CSS classes.
   */
  describe("States and Classes", () => {
    /**
     * It should correctly reflect the 'checked' state on the input
     * and apply the corresponding 'peer-checked:*' classes to the label.
     */
    it("should reflect the checked state and apply checked classes", () => {
      renderCheckbox({ index: 1, onChange: mockOnChange, checked: true });
      const { input, label } = getElements(1);

      expect(input).toBeChecked();
      expect(label.className).toContain("peer-checked:bg-primary-main");
      expect(label.className).toContain("peer-checked:[&>.check]:inline-flex");
      expect(label.className).toContain("[&>.indeterminate]:hidden");
    });

    /**
     * It should correctly reflect the 'unchecked' state on the input
     * and apply the default classes to the label.
     */
    it("should reflect the unchecked state", () => {
      renderCheckbox({ index: 2, onChange: mockOnChange, checked: false });
      const { input, label } = getElements(2);

      expect(input).not.toBeChecked();
      expect(label.className).toContain("bg-white");
      expect(screen.getByTestId("checkbox-label").className).toContain(
        "[&>.check]:hidden"
      );
      expect(screen.getByTestId("checkbox-label").className).toContain(
        "[&>.indeterminate]:hidden"
      );
    });

    /**
     * It should set the input's 'indeterminate' property and apply
     * 'peer-indeterminate:*' classes when 'indeterminate' is true
     * and 'checked' is false.
     */
    it("should set indeterminate property and apply indeterminate classes/icon", () => {
      renderCheckbox({
        index: 3,
        onChange: mockOnChange,
        checked: false, // Must be unchecked for native indeterminate
        indeterminate: true,
      });
      const { input, label } = getElements(3);

      expect(input.indeterminate).toBe(true);
      expect(input).not.toBeChecked();

      expect(label.className).toContain("peer-indeterminate:bg-primary-main");
      expect(label.className).toContain(
        "peer-indeterminate:[&>.indeterminate]:inline-flex"
      );
    });

    /**
     * It should prioritize the 'checked' state over the 'indeterminate' state,
     * as native HTML checkboxes do.
     */
    it("should NOT set indeterminate property if checked=true", () => {
      renderCheckbox({
        index: 4,
        onChange: mockOnChange,
        checked: true,
        indeterminate: true,
      });
      const { input, label } = getElements(4);

      expect(input.indeterminate).toBe(false);
      expect(input).toBeChecked();

      expect(label.className).toContain("peer-checked:bg-primary-main");
      expect(label.className).toContain("peer-checked:[&>.check]:inline-flex");
    });

    /**
     * It should apply the 'disabled' attribute to the hidden input.
     */
    it("should apply disabled attribute", () => {
      renderCheckbox({ index: 5, onChange: mockOnChange, disabled: true });
      const { input } = getElements(5);

      expect(input).toBeDisabled();
    });
  });

  /**
   * Tests related to user interactions, like clicking the component.
   */
  describe("User Interactions", () => {
    /**
     * It should trigger the 'onChange' event handler when the label is clicked.
     */
    it("should call onChange when the label is clicked", () => {
      renderCheckbox({
        index: "click-test",
        onChange: mockOnChange,
        checked: false,
      });
      const { label } = getElements("click-test");

      act(() => {
        fireEvent.click(label);
      });

      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    /**
     * It should not trigger the 'onChange' event handler if the
     * component is disabled.
     */
    it("should not call onChange when disabled and clicked", () => {
      renderCheckbox({
        index: "disabled-click",
        onChange: mockOnChange,
        disabled: true,
      });
      const { label } = getElements("disabled-click");

      act(() => {
        fireEvent.click(label);
      });

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });
});
