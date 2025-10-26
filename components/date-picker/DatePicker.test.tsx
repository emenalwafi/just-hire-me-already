import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import DatePicker from "./DatePicker"; // Adjust this import path as needed
import { useDatePickerPopover } from "@/hooks/date-picker-popover/useDatePickerPopover"; // Adjust this import path as needed

// --- Mocks ---

// 1. Mock the useDatePickerPopover hook
jest.mock("../../hooks/date-picker-popover/useDatePickerPopover");
const mockedUseDatePickerPopover = useDatePickerPopover as jest.Mock;

// 2. Mock the icon library
jest.mock("@iconscout/react-unicons", () => ({
  UilCalendarAlt: (props: { className: string }) => (
    <span data-testid="icon-calendar" className={props.className} />
  ),
  UilAngleDown: (props: { className: string }) => (
    <span data-testid="icon-angle-down" className={props.className} />
  ),
}));

// --- Test Setup ---

// Create mock functions and default values for the hook
const mockSetIsOpen = jest.fn();
const mockPopoverElement = <div data-testid="mock-popover" />;
const defaultMockHookValue = {
  isOpen: false,
  setIsOpen: mockSetIsOpen,
  popoverElement: null,
  selectedDate: null,
  containerRef: { current: null },
};

describe("DatePicker Component", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockSetIsOpen.mockClear();
    mockedUseDatePickerPopover.mockClear();
    // Set the default return value for the mocked hook
    mockedUseDatePickerPopover.mockReturnValue(defaultMockHookValue);
  });

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

  it("should render the required asterisk next to the label", () => {
    render(
      <DatePicker label="Due Date" value={null} onChange={jest.fn()} required />
    );

    // Check for the label and the asterisk separately
    expect(screen.getByText("Due Date")).toBeInTheDocument();
    const asterisk = screen.getByText("*");
    expect(asterisk).toBeInTheDocument();
    expect(asterisk).toHaveClass("text-danger-main");
  });

  it("should render the formatted date when a value is provided", () => {
    const testDate = new Date("2025-10-26T00:00:00.000Z");
    // Mock the hook to return the parsed date object
    mockedUseDatePickerPopover.mockReturnValue({
      ...defaultMockHookValue,
      selectedDate: testDate,
    });

    render(<DatePicker value="2025-10-26" onChange={jest.fn()} />);

    // The component formats this date using 'PPP'
    const formattedDate = screen.getByText("October 26th, 2025");
    expect(formattedDate).toBeInTheDocument();
    // Check for the "has value" text color
    expect(formattedDate).toHaveClass("text-neutral-90");
    // Placeholder should not be present
    expect(screen.queryByText("Select date")).not.toBeInTheDocument();
  });

  it("should render in a disabled state", () => {
    render(<DatePicker value={null} onChange={jest.fn()} disabled />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveClass("cursor-not-allowed bg-neutral-30");

    // Check icon color in disabled state
    expect(screen.getByTestId("icon-calendar")).toHaveClass("text-neutral-60");
  });

  it("should not open popover when disabled button is clicked", () => {
    render(<DatePicker value={null} onChange={jest.fn()} disabled />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    // The hook's setIsOpen function should not have been called
    expect(mockSetIsOpen).not.toHaveBeenCalled();
  });

  it("should show error state (boolean)", () => {
    render(<DatePicker value={null} onChange={jest.fn()} error />);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("outline-danger-main");

    // Should not display an error message if `error` is just `true`
    expect(
      screen.queryByText(/This field is required/)
    ).not.toBeInTheDocument();
  });

  it("should show error state with a helper message", () => {
    const errorMessage = "This field is required.";
    render(
      <DatePicker value={null} onChange={jest.fn()} error={errorMessage} />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("outline-danger-main");

    // The error message should be rendered
    const errorText = screen.getByText(errorMessage);
    expect(errorText).toBeInTheDocument();
    expect(errorText).toHaveClass("text-danger-main");
  });

  it("should not show error message when disabled", () => {
    // Business rule: Disabled state takes precedence over error state
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
    // Should have disabled styles, not error styles
    expect(button).toHaveClass("bg-neutral-30");
    expect(button).not.toHaveClass("outline-danger-main");

    // Error message should not be rendered
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
  });

  it("should call setIsOpen to toggle popover on click", () => {
    // 1. Test opening
    mockedUseDatePickerPopover.mockReturnValue({
      ...defaultMockHookValue,
      isOpen: false,
    });
    const { rerender } = render(
      <DatePicker value={null} onChange={jest.fn()} />
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    // It was false, so it should be called with true
    expect(mockSetIsOpen).toHaveBeenCalledWith(true);

    // 2. Test closing
    mockSetIsOpen.mockClear();
    mockedUseDatePickerPopover.mockReturnValue({
      ...defaultMockHookValue,
      isOpen: true, // Now mock that it's open
    });

    rerender(<DatePicker value={null} onChange={jest.fn()} />);

    fireEvent.click(button);

    // It was true, so it should be called with false
    expect(mockSetIsOpen).toHaveBeenCalledWith(false);
  });

  it("should render the popover element when open", () => {
    // Mock the hook to return an open state and a mock element
    mockedUseDatePickerPopover.mockReturnValue({
      ...defaultMockHookValue,
      isOpen: true,
      popoverElement: mockPopoverElement,
    });

    render(<DatePicker value={null} onChange={jest.fn()} />);

    // The mock popover (defined in setup) should be visible
    expect(screen.getByTestId("mock-popover")).toBeInTheDocument();
  });

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

    // Verify that the hook was called with the min/max props
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
