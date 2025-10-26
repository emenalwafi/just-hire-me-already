import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import DatePicker from "./DatePicker"; // Adjust this import path as needed
import { useDatePickerPopover } from "@/hooks/date-picker-popover/useDatePickerPopover"; // Adjust this import path as needed

/**
 * @file Test suite for the DatePicker component.
 * @description This file contains unit tests for the DatePicker, verifying its
 * rendering, states (disabled, error), interactions, and prop handling.
 * It uses a mock of the `useDatePickerPopover` hook to isolate the component's behavior.
 */

// --- Mocks ---

/**
 * Mocks the `useDatePickerPopover` hook.
 * This allows controlling the hook's return values (isOpen, popoverElement, etc.)
 * for testing the DatePicker's behavior in isolation.
 */
jest.mock("../../../hooks/date-picker-popover/useDatePickerPopover");
const mockedUseDatePickerPopover = useDatePickerPopover as jest.Mock;

/**
 * Mocks the `@iconscout/react-unicons` library.
 * Replaces icons with simple `<span>` elements for easy testing,
 * passing through props like `className` for style verification.
 */
jest.mock("@iconscout/react-unicons", () => ({
  UilCalendarAlt: (props: { className: string }) => (
    <span data-testid="icon-calendar" className={props.className} />
  ),
  UilAngleDown: (props: { className: string }) => (
    <span data-testid="icon-angle-down" className={props.className} />
  ),
}));

// --- Test Setup ---

const mockSetIsOpen = jest.fn();
const mockPopoverElement = <div data-testid="mock-popover" />;

/**
 * Default return value for the mocked `useDatePickerPopover` hook.
 * Used to reset the hook's state before each test.
 */
const defaultMockHookValue = {
  isOpen: false,
  setIsOpen: mockSetIsOpen,
  popoverElement: null,
  selectedDate: null,
  containerRef: { current: null },
};

/**
 * @describe Main test suite for the DatePicker component.
 */
describe("DatePicker Component", () => {
  /**
   * @beforeEach Resets all mock functions and restores the default
   * mock return value for `useDatePickerPopover` before each test.
   */
  beforeEach(() => {
    mockSetIsOpen.mockClear();
    mockedUseDatePickerPopover.mockClear();
    mockedUseDatePickerPopover.mockReturnValue(defaultMockHookValue);
  });

  /**
   * @it Verifies that the component renders the label, placeholder text, and icons
   * when in its default state with no value.
   */
  it("should render the label, placeholder, and icons", () => {
    render(
      <DatePicker
        label="Event Date"
        value={null}
        onChange={jest.fn()}
        placeholder="Select a date"
      />
    );

    expect(screen.getByText("Event Date")).toBeInTheDocument();
    expect(screen.getByText("Select a date")).toBeInTheDocument();
    expect(screen.getByTestId("icon-calendar")).toBeInTheDocument();
    expect(screen.getByTestId("icon-angle-down")).toBeInTheDocument();
  });

  /**
   * @it Verifies that the required asterisk (`*`) is rendered next to the label
   * when the `required` prop is true.
   */
  it("should render the required asterisk next to the label", () => {
    render(
      <DatePicker label="Due Date" value={null} onChange={jest.fn()} required />
    );

    expect(screen.getByText("Due Date")).toBeInTheDocument();
    const asterisk = screen.getByText("*");
    expect(asterisk).toBeInTheDocument();
    expect(asterisk).toHaveClass("text-danger-main");
  });

  /**
   * @it Verifies that the component displays the correctly formatted date string
   * (using 'PPP' format) when a `value` is provided.
   */
  it("should render the formatted date when a value is provided", () => {
    const testDate = new Date("2025-10-26T00:00:00.000Z");
    mockedUseDatePickerPopover.mockReturnValue({
      ...defaultMockHookValue,
      selectedDate: testDate,
    });

    render(<DatePicker value="2025-10-26" onChange={jest.fn()} />);

    const formattedDate = screen.getByText("October 26th, 2025");
    expect(formattedDate).toBeInTheDocument();
    expect(formattedDate).toHaveClass("text-neutral-90");
    expect(screen.queryByText("Select date")).not.toBeInTheDocument();
  });

  /**
   * @it Verifies that the component applies disabled attributes and styles
   * when the `disabled` prop is true.
   */
  it("should render in a disabled state", () => {
    render(<DatePicker value={null} onChange={jest.fn()} disabled />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveClass("cursor-not-allowed bg-neutral-30");
    expect(screen.getByTestId("icon-calendar")).toHaveClass("text-neutral-60");
  });

  /**
   * @it Verifies that clicking the component's button does not call `setIsOpen`
   * when the component is disabled.
   */
  it("should not open popover when disabled button is clicked", () => {
    render(<DatePicker value={null} onChange={jest.fn()} disabled />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockSetIsOpen).not.toHaveBeenCalled();
  });

  /**
   * @it Verifies that the component applies error styles (outline)
   * when `error` prop is `true`, but does not render a message.
   */
  it("should show error state (boolean)", () => {
    render(<DatePicker value={null} onChange={jest.fn()} error />);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("outline-danger-main");
    expect(
      screen.queryByText(/This field is required/)
    ).not.toBeInTheDocument();
  });

  /**
   * @it Verifies that the component applies error styles and renders the
   * error message when `error` prop is a string.
   */
  it("should show error state with a helper message", () => {
    const errorMessage = "This field is required.";
    render(
      <DatePicker value={null} onChange={jest.fn()} error={errorMessage} />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("outline-danger-main");

    const errorText = screen.getByText(errorMessage);
    expect(errorText).toBeInTheDocument();
    expect(errorText).toHaveClass("text-danger-main");
  });

  /**
   * @it Verifies that the disabled state takes precedence over the error state,
   * applying disabled styles and hiding any error messages.
   */
  it("should not show error message when disabled", () => {
    const errorMessage = "This field is required.";
    render(
      <DatePicker
        value={null}
        onChange={jest.fn()}
        error={errorMessage}
        disabled
      />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-neutral-30");
    expect(button).not.toHaveClass("outline-danger-main");
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
  });

  /**
   * @it Verifies that clicking the component's button toggles the popover's
   * open state by calling `setIsOpen` with the opposite value.
   */
  it("should call setIsOpen to toggle popover on click", () => {
    mockedUseDatePickerPopover.mockReturnValue({
      ...defaultMockHookValue,
      isOpen: false,
    });
    const { rerender } = render(
      <DatePicker value={null} onChange={jest.fn()} />
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockSetIsOpen).toHaveBeenCalledWith(true);

    mockSetIsOpen.mockClear();
    mockedUseDatePickerPopover.mockReturnValue({
      ...defaultMockHookValue,
      isOpen: true,
    });

    rerender(<DatePicker value={null} onChange={jest.fn()} />);

    fireEvent.click(button);

    expect(mockSetIsOpen).toHaveBeenCalledWith(false);
  });

  /**
   * @it Verifies that the `popoverElement` returned from the mock hook
   * is rendered in the document when `isOpen` is true.
   */
  it("should render the popover element when open", () => {
    mockedUseDatePickerPopover.mockReturnValue({
      ...defaultMockHookValue,
      isOpen: true,
      popoverElement: mockPopoverElement,
    });

    render(<DatePicker value={null} onChange={jest.fn()} />);

    expect(screen.getByTestId("mock-popover")).toBeInTheDocument();
  });

  /**
   * @it VerVifies that the `minDate` and `maxDate` props are correctly
   * passed through to the `useDatePickerPopover` hook as `minDateProp` and `maxDateProp`.
   */
  it("should pass minDate and maxDate props to the hook", () => {
    const mockOnChange = jest.fn();
    const minDate = "2025-01-01";
    const maxDate = "2025-12-31";

    render(
      <DatePicker
        value={null}
        onChange={mockOnChange}
        minDate={minDate}
        maxDate={maxDate}
      />
    );

    expect(mockedUseDatePickerPopover).toHaveBeenCalledWith(
      expect.objectContaining({
        minDateProp: minDate,
        maxDateProp: maxDate,
        value: null,
        onChange: mockOnChange,
      })
    );
  });
});
