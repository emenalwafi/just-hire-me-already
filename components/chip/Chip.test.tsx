import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom"; // Imports custom matchers like .toHaveClass()
import Chip from "./Chip"; // Adjust the import path as needed

describe("Chip Component", () => {
  // Test 1: Default "rest" state
  it("should render in the default (rest) state", () => {
    render(<Chip>Default Chip</Chip>);

    // Find the button element
    const button = screen.getByRole("button", { name: /Default Chip/i });

    // Find the text element's container
    const textContainer = screen.getByText("Default Chip");

    // Check for correct classes
    expect(button).toHaveClass(
      "bg-neutral-10",
      "outline-neutral-40",
      "hover:bg-neutral-30",
      "cursor-pointer"
    );
    expect(textContainer).toHaveClass("text-neutral-90");

    // Check it's not disabled
    expect(button).not.toBeDisabled();
  });

  // Test 2: Selected state
  it("should render in the selected state", () => {
    render(<Chip selected>Selected Chip</Chip>);

    const button = screen.getByRole("button", { name: /Selected Chip/i });
    const textContainer = screen.getByText("Selected Chip");

    // Check for correct "selected" classes
    expect(button).toHaveClass("bg-neutral-10", "outline-primary-main");
    expect(textContainer).toHaveClass("text-primary-main");

    // It should NOT have the hover or default outline classes
    expect(button).not.toHaveClass("outline-neutral-40");
    expect(button).not.toHaveClass("hover:bg-neutral-30");

    // Check it's not disabled
    expect(button).not.toBeDisabled();
  });

  // Test 3: Disabled state
  it("should render in the disabled state", () => {
    render(<Chip disabled>Disabled Chip</Chip>);

    const button = screen.getByRole("button", { name: /Disabled Chip/i });
    const textContainer = screen.getByText("Disabled Chip");

    // Check for correct "disabled" classes
    expect(button).toHaveClass(
      "bg-neutral-30",
      "outline-neutral-40",
      "cursor-not-allowed"
    );
    expect(textContainer).toHaveClass("text-neutral-60");

    // Check that the button is actually disabled
    expect(button).toBeDisabled();
  });

  // Test 4: Click event
  it("should call onClick handler when clicked", () => {
    // Create a mock function
    const handleClick = jest.fn();

    render(<Chip onClick={handleClick}>Clickable</Chip>);

    const button = screen.getByRole("button", { name: /Clickable/i });

    // Simulate a user click
    fireEvent.click(button);

    // Assert that the mock function was called
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // Test 5: No click event when disabled
  it("should NOT call onClick handler when disabled", () => {
    const handleClick = jest.fn();

    render(
      <Chip onClick={handleClick} disabled>
        Disabled Click
      </Chip>
    );

    const button = screen.getByRole("button", { name: /Disabled Click/i });

    // Simulate a user click
    fireEvent.click(button);

    // Assert that the mock function was NOT called
    expect(handleClick).not.toHaveBeenCalled();
    expect(button).toBeDisabled(); // Double-check it's disabled
  });

  // Test 6: Rendering children
  it("should render complex children, like other elements", () => {
    render(
      <Chip>
        <span>Icon</span>
        <strong>Text</strong>
      </Chip>
    );

    // Check that the children are rendered
    expect(screen.getByText("Icon")).toBeInTheDocument();
    expect(screen.getByText("Text")).toBeInTheDocument();
  });
});
