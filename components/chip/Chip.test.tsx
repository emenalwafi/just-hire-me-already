import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom"; // Imports custom matchers like .toHaveClass()
import Chip from "./Chip"; // Adjust the import path as needed

/**
 * @file Test suite for the Chip component.
 * @description This file contains unit tests for the Chip component,
 * covering its various states (default, selected, disabled),
 * click event handling, and child rendering.
 */

/**
 * @describe Main test suite for the Chip component.
 */
describe("Chip Component", () => {
  /**
   * @it Verifies that the chip renders in its default (rest) state.
   * @description Checks for the correct default background, outline, hover classes,
   * text color, and ensures the button is not disabled.
   */
  it("should render in the default (rest) state", () => {
    render(<Chip>Default Chip</Chip>);

    const button = screen.getByRole("button", { name: /Default Chip/i });
    const textContainer = screen.getByText("Default Chip");

    expect(button).toHaveClass(
      "bg-neutral-10",
      "outline-neutral-40",
      "hover:bg-neutral-30",
      "cursor-pointer"
    );
    expect(textContainer).toHaveClass("text-neutral-90");
    expect(button).not.toBeDisabled();
  });

  /**
   * @it Verifies that the chip renders correctly when in the 'selected' state.
   * @description Checks for 'selected' state classes (primary outline, primary text)
   * and ensures default/hover classes are not present.
   */
  it("should render in the selected state", () => {
    render(<Chip selected>Selected Chip</Chip>);

    const button = screen.getByRole("button", { name: /Selected Chip/i });
    const textContainer = screen.getByText("Selected Chip");

    expect(button).toHaveClass("bg-neutral-10", "outline-primary-main");
    expect(textContainer).toHaveClass("text-primary-main");
    expect(button).not.toHaveClass("outline-neutral-40");
    expect(button).not.toHaveClass("hover:bg-neutral-30");
    expect(button).not.toBeDisabled();
  });

  /**
   * @it Verifies that the chip renders correctly when in the 'disabled' state.
   * @description Checks for 'disabled' state classes (background, outline, cursor)
   * and text color, and asserts that the button is actually disabled.
   */
  it("should render in the disabled state", () => {
    render(<Chip disabled>Disabled Chip</Chip>);

    const button = screen.getByRole("button", { name: /Disabled Chip/i });
    const textContainer = screen.getByText("Disabled Chip");

    expect(button).toHaveClass(
      "bg-neutral-30",
      "outline-neutral-40",
      "cursor-not-allowed"
    );
    expect(textContainer).toHaveClass("text-neutral-60");
    expect(button).toBeDisabled();
  });

  /**
   * @it VerVifies that the onClick handler is called when the chip is clicked.
   * @description Renders a chip with a mock onClick function, simulates a click,
   * and asserts that the mock was called once.
   */
  it("should call onClick handler when clicked", () => {
    const handleClick = jest.fn();

    render(<Chip onClick={handleClick}>Clickable</Chip>);

    const button = screen.getByRole("button", { name: /Clickable/i });
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  /**
   * @it Verifies that the onClick handler is NOT called when the chip is disabled.
   * @description Renders a disabled chip with a mock onClick function, simulates a click,
   * and asserts that the mock was never called.
   */
  it("should NOT call onClick handler when disabled", () => {
    const handleClick = jest.fn();

    render(
      <Chip onClick={handleClick} disabled>
        Disabled Click
      </Chip>
    );

    const button = screen.getByRole("button", { name: /Disabled Click/i });
    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });

  /**
   * @it Verifies that the chip can render complex React nodes as children.
   * @description Renders a chip with nested <span> and <strong> elements
   * and asserts that their text content is present in the document.
   */
  it("should render complex children, like other elements", () => {
    render(
      <Chip>
        <span>Icon</span>
        <strong>Text</strong>
      </Chip>
    );

    expect(screen.getByText("Icon")).toBeInTheDocument();
    expect(screen.getByText("Text")).toBeInTheDocument();
  });
});
