import React from "react";
import { renderHook, act } from "@testing-library/react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  useDatePickerPopover,
  UseDatePickerPopoverProps,
} from "./useDatePickerPopover"; // Adjust import path
import { format } from "date-fns";

// --- Mocks ---

// 1. Mock react-dom's createPortal
// This is a common pattern. We make createPortal render its children directly
// into the test's virtual DOM, instead of to document.body.
// This makes testing the popover's content *much* easier.
jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"), // Keep all other exports
  createPortal: (element: React.ReactNode) => element,
}));

// 2. Mock the icon library
// We don't need to test the icons, just that they're called.
jest.mock("@iconscout/react-unicons", () => ({
  UilAngleLeft: () => <span data-testid="icon-angle-left" />,
  UilAngleRight: () => <span data-testid="icon-angle-right" />,
  UilAngleDoubleLeft: () => <span data-testid="icon-angle-double-left" />,
  UilAngleDoubleRight: () => <span data-testid="icon-angle-double-right" />,
}));

// --- Test Setup ---

// Set a consistent "today" for all tests
// We use Sunday, Oct 26, 2025
const TODAY_ISO = "2025-10-26";
const TODAY_DATE = new Date(TODAY_ISO);

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(TODAY_DATE);
});

afterAll(() => {
  jest.useRealTimers();
});

// Helper setup function
const setupHook = (props: Partial<UseDatePickerPopoverProps> = {}) => {
  // 1. Create a mock trigger ref
  const triggerRef = { current: document.createElement("button") };
  // Mock its position so the popover can calculate where to render
  jest.spyOn(triggerRef.current, "getBoundingClientRect").mockReturnValue({
    width: 100,
    height: 40,
    top: 50,
    left: 50,
    bottom: 90,
    right: 150,
    x: 50,
    y: 50,
    toJSON: () => ({}),
  } as DOMRect);

  // 2. Create a mock onChange
  const mockOnChange = jest.fn();

  // 3. Render the hook
  const hookResult = renderHook(
    (p: UseDatePickerPopoverProps) => useDatePickerPopover(p),
    {
      initialProps: {
        value: null,
        onChange: mockOnChange,
        triggerRef: triggerRef as React.RefObject<HTMLButtonElement>,
        ...props,
      },
    }
  );

  // 4. Render the returned popoverElement (if it exists)
  // This is how we can interact with the UI the hook generates
  hookResult.result.current.popoverElement &&
    render(hookResult.result.current.popoverElement);

  return {
    ...hookResult,
    mockOnChange,
    triggerRef,
  };
};

describe("useDatePickerPopover", () => {
  // --- Initialization Tests ---
  describe("Initialization", () => {
    it("should initialize with no selected date and current date as today", () => {
      const { result } = setupHook();
      expect(result.current.isOpen).toBe(false);
      expect(result.current.popoverElement).toBe(null);
      expect(result.current.selectedDate).toBe(null);
      // Check that currentDate is the start of "today"
      expect(result.current.currentDate).toEqual(TODAY_DATE);
    });

    it("should initialize with the provided value", () => {
      const { result } = setupHook({ value: "2024-05-15" });
      const expectedDate = new Date("2024-05-15T00:00:00.000Z");
      expect(result.current.selectedDate).toEqual(expectedDate);
      expect(result.current.currentDate).toEqual(expectedDate);
    });

    it("should bound the initial value by minDate", () => {
      const { result } = setupHook({
        value: "2024-01-01",
        minDateProp: "2024-02-01",
      });
      const expectedDate = new Date("2024-02-01T00:00:00.000Z");
      // selectedDate and currentDate are bounded to minDate
      expect(result.current.selectedDate).toEqual(expectedDate);
      expect(result.current.currentDate).toEqual(expectedDate);
    });

    it("should bound the initial value by maxDate", () => {
      const { result } = setupHook({
        value: "2024-12-01",
        maxDateProp: "2024-11-01",
      });
      const expectedDate = new Date("2024-11-01T00:00:00.000Z");
      expect(result.current.selectedDate).toEqual(expectedDate);
      expect(result.current.currentDate).toEqual(expectedDate);
    });
  });

  // --- Popover and State Tests ---
  describe("Popover State and UI", () => {
    it("should open the popover and render it", () => {
      const { result, rerender, triggerRef } = setupHook();
      expect(result.current.popoverElement).toBe(null);

      // Open the popover
      act(() => {
        result.current.setIsOpen(true);
      });
      rerender({
        value: null,
        onChange: jest.fn(),
        triggerRef: triggerRef as React.RefObject<HTMLButtonElement>,
      }); // Re-render the hook to get the new popoverElement

      expect(result.current.isOpen).toBe(true);
      expect(result.current.popoverElement).not.toBe(null);

      // Verify the popover content is rendered (thanks to our portal mock)
      expect(
        screen.getByRole("dialog", { name: "Date Picker" })
      ).toBeInTheDocument();
      // It should default to "today's" month and year (Oct 2025)
      expect(
        screen.getByRole("button", { name: "Select month for year 2025" })
      ).toHaveTextContent("Oct");
      expect(
        screen.getByRole("button", {
          name: "Current year 2025, select year",
        })
      ).toHaveTextContent("2025");
    });

    it("should close the popover when clicking outside", () => {
      const { result, rerender, triggerRef } = setupHook();

      // Open it
      act(() => {
        result.current.setIsOpen(true);
      });
      rerender({
        value: null,
        onChange: jest.fn(),
        triggerRef: triggerRef as React.RefObject<HTMLButtonElement>,
      });
      expect(result.current.isOpen).toBe(true);
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      // Simulate a click on the document body
      act(() => {
        fireEvent.mouseDown(document.body);
      });

      expect(result.current.isOpen).toBe(false);
    });

    it("should NOT close when clicking inside the popover", () => {
      const { result, rerender, triggerRef } = setupHook();
      act(() => {
        result.current.setIsOpen(true);
      });
      rerender({
        value: null,
        onChange: jest.fn(),
        triggerRef: triggerRef as React.RefObject<HTMLButtonElement>,
      });
      const dialog = screen.getByRole("dialog");

      // Click inside the dialog
      act(() => {
        fireEvent.mouseDown(dialog);
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should correctly style "today" when not selected', () => {
      const { result, rerender, triggerRef } = setupHook(); // value is null
      act(() => {
        result.current.setIsOpen(true);
      });
      rerender({
        value: null,
        onChange: jest.fn(),
        triggerRef: triggerRef as React.RefObject<HTMLButtonElement>,
      });

      // Today is Oct 26, 2025
      const todayButton = screen.getByRole("button", {
        name: "Select October 26, 2025",
      });

      // Should have "today" classes
      expect(todayButton).toHaveClass(
        "bg-neutral-20 hover:bg-neutral-30 outline outline-1 outline-neutral-40"
      );
      // Should NOT have "selected" classes
      expect(todayButton).not.toHaveClass("bg-primary-main");
    });
  });

  // --- Core Logic: Selection and View Change ---
  describe("View Navigation and Selection", () => {
    let hookResult: ReturnType<typeof setupHook>;

    beforeEach(() => {
      // Open the popover before each test in this block
      hookResult = setupHook();
      act(() => {
        hookResult.result.current.setIsOpen(true);
      });
      hookResult.rerender({
        value: null,
        onChange: hookResult.mockOnChange,
        triggerRef: hookResult.triggerRef as React.RefObject<HTMLButtonElement>,
      });
    });

    it("should select a day and close the popover", () => {
      // We are in Oct 2025. Let's click "28".
      const dayButton = screen.getByRole("button", {
        name: "Select October 28, 2025",
      });

      act(() => {
        fireEvent.click(dayButton);
      });

      expect(hookResult.mockOnChange).toHaveBeenCalledTimes(1);
      expect(hookResult.mockOnChange).toHaveBeenCalledWith("2025-10-28");
      expect(hookResult.result.current.isOpen).toBe(false);
    });

    it("should navigate from day -> month -> year -> decade views", () => {
      // 1. Start in Day view (Oct 2025)
      const monthTitleButton = screen.getByRole("button", {
        name: "Select month for year 2025",
      });
      act(() => {
        fireEvent.click(monthTitleButton);
      });
      hookResult.rerender({
        value: null,
        onChange: hookResult.mockOnChange,
        triggerRef: hookResult.triggerRef as React.RefObject<HTMLButtonElement>,
      });

      // 2. Now in Month view
      expect(
        screen.getByRole("button", { name: "Select Jan 2025" })
      ).toBeInTheDocument();
      const yearTitleButton = screen.getByRole("button", {
        name: "Current year 2025, select year",
      });
      act(() => {
        fireEvent.click(yearTitleButton);
      });
      hookResult.rerender({
        value: null,
        onChange: hookResult.mockOnChange,
        triggerRef: hookResult.triggerRef as React.RefObject<HTMLButtonElement>,
      });

      // 3. Now in Year view (Decade 2020-2029)
      expect(
        screen.getByRole("button", { name: "Select year 2024" })
      ).toBeInTheDocument();
      const decadeTitleButton = screen.getByRole("button", {
        name: "Current decade 2020-2029, select decade range",
      });
      act(() => {
        fireEvent.click(decadeTitleButton);
      });
      hookResult.rerender({
        value: null,
        onChange: hookResult.mockOnChange,
        triggerRef: hookResult.triggerRef as React.RefObject<HTMLButtonElement>,
      });

      // 4. Now in Decade view
      expect(
        screen.getByRole("button", { name: "Select decade 2010-2019" })
      ).toBeInTheDocument();
    });

    it("should select a month and change to day view", () => {
      // Go to month view
      act(() => {
        fireEvent.click(
          screen.getByRole("button", { name: "Select month for year 2025" })
        );
      });
      hookResult.rerender({
        value: null,
        onChange: hookResult.mockOnChange,
        triggerRef: hookResult.triggerRef as React.RefObject<HTMLButtonElement>,
      });

      // Click "Jan"
      act(() => {
        fireEvent.click(
          screen.getByRole("button", { name: "Select Jan 2025" })
        );
      });
      hookResult.rerender({
        value: null,
        onChange: hookResult.mockOnChange,
        triggerRef: hookResult.triggerRef as React.RefObject<HTMLButtonElement>,
      });

      // Should be back in day view, but for Jan 2025
      expect(hookResult.mockOnChange).not.toHaveBeenCalled();
      expect(
        screen.getByRole("button", { name: "Select month for year 2025" })
      ).toHaveTextContent("Jan");
      expect(
        screen.getByRole("button", { name: "Select January 1, 2025" })
      ).toBeInTheDocument();
      expect(hookResult.result.current.currentDate.getMonth()).toBe(0); // 0 = Jan
    });

    it("should select a year and change to month view", () => {
      // Go to year view
      act(() => {
        fireEvent.click(
          screen.getByRole("button", { name: "Select month for year 2025" })
        );
      });
      act(() => {
        fireEvent.click(
          screen.getByRole("button", {
            name: "Current year 2025, select year",
          })
        );
      });
      hookResult.rerender({
        value: null,
        onChange: hookResult.mockOnChange,
        triggerRef: hookResult.triggerRef as React.RefObject<HTMLButtonElement>,
      });

      // Click "2023"
      act(() => {
        fireEvent.click(
          screen.getByRole("button", { name: "Select year 2023" })
        );
      });
      hookResult.rerender({
        value: null,
        onChange: hookResult.mockOnChange,
        triggerRef: hookResult.triggerRef as React.RefObject<HTMLButtonElement>,
      });

      // Should be in month view for 2023
      expect(hookResult.mockOnChange).not.toHaveBeenCalled();
      expect(
        screen.getByRole("button", {
          name: "Current year 2023, select year",
        })
      ).toHaveTextContent("2023");
      expect(
        screen.getByRole("button", { name: "Select Jan 2023" })
      ).toBeInTheDocument();
      expect(hookResult.result.current.currentDate.getFullYear()).toBe(2023);
    });

    it("should select a decade and change to year view", () => {
      // Go to decade view
      act(() => {
        fireEvent.click(
          screen.getByRole("button", { name: "Select month for year 2025" })
        );
      });
      act(() => {
        fireEvent.click(
          screen.getByRole("button", {
            name: "Current year 2025, select year",
          })
        );
      });
      act(() => {
        fireEvent.click(
          screen.getByRole("button", {
            name: "Current decade 2020-2029, select decade range",
          })
        );
      });
      hookResult.rerender({
        value: null,
        onChange: hookResult.mockOnChange,
        triggerRef: hookResult.triggerRef as React.RefObject<HTMLButtonElement>,
      });

      // Click "2010-2019"
      act(() => {
        fireEvent.click(
          screen.getByRole("button", { name: "Select decade 2010-2019" })
        );
      });
      hookResult.rerender({
        value: null,
        onChange: hookResult.mockOnChange,
        triggerRef: hookResult.triggerRef as React.RefObject<HTMLButtonElement>,
      });

      // Should be in year view for 2010-2019
      expect(hookResult.mockOnChange).not.toHaveBeenCalled();
      expect(
        screen.getByRole("button", {
          name: "Current decade 2010-2019, select decade range",
        })
      ).toBeInTheDocument();
      // Check that a year from that decade is visible
      expect(
        screen.getByRole("button", { name: "Select year 2011" })
      ).toBeInTheDocument();
      expect(hookResult.result.current.currentDate.getFullYear()).toBe(2010);
    });
  });

  // --- Constraint Tests ---
  describe("Min/Max Date Constraints", () => {
    it("should disable navigation buttons based on minDate", () => {
      // View is Oct 2025. Set minDate to Oct 15, 2025
      const { rerender, result, triggerRef } = setupHook({
        minDateProp: "2025-10-15",
      });
      act(() => {
        result.current.setIsOpen(true);
      });
      rerender({
        value: null,
        minDateProp: "2025-10-15",
        onChange: jest.fn(),
        triggerRef: triggerRef as React.RefObject<HTMLButtonElement>,
      });

      // "Previous month" should be disabled
      expect(
        screen.getByRole("button", { name: "Previous month" })
      ).toBeDisabled();
      // "Previous year" should be disabled
      expect(
        screen.getByRole("button", { name: "Previous year" })
      ).toBeDisabled();

      // Next buttons should be enabled
      expect(
        screen.getByRole("button", { name: "Next month" })
      ).not.toBeDisabled();
      expect(
        screen.getByRole("button", { name: "Next year" })
      ).not.toBeDisabled();
    });

    it("should disable navigation buttons based on maxDate", () => {
      // View is Oct 2025. Set maxDate to Oct 15, 2025
      const { rerender, result, triggerRef } = setupHook({
        maxDateProp: "2025-10-15",
      });
      act(() => {
        result.current.setIsOpen(true);
      });
      rerender({
        value: null,
        maxDateProp: "2025-10-15",
        onChange: jest.fn(),
        triggerRef: triggerRef as React.RefObject<HTMLButtonElement>,
      });

      // "Next month" should be disabled
      expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
      // "Next year" should be disabled
      expect(screen.getByRole("button", { name: "Next year" })).toBeDisabled();

      // Prev buttons should be enabled
      expect(
        screen.getByRole("button", { name: "Previous month" })
      ).not.toBeDisabled();
      expect(
        screen.getByRole("button", { name: "Previous year" })
      ).not.toBeDisabled();
    });

    it("should disable individual days before minDate", () => {
      const { rerender, result, triggerRef } = setupHook({
        minDateProp: "2025-10-15",
      });
      act(() => {
        result.current.setIsOpen(true);
      });
      rerender({
        value: null,
        minDateProp: "2025-10-15",
        onChange: jest.fn(),
        triggerRef: triggerRef as React.RefObject<HTMLButtonElement>,
      });

      // Day 14 should be disabled
      const day14 = screen.getByRole("button", {
        name: "Date October 14, 2025 (not selectable)",
      });
      expect(day14).toBeDisabled();

      // Day 15 should be enabled
      const day15 = screen.getByRole("button", {
        name: "Select October 15, 2025",
      });
      expect(day15).not.toBeDisabled();
    });

    it("should disable individual days after maxDate", () => {
      const { rerender, result, triggerRef } = setupHook({
        maxDateProp: "2025-10-30",
      });
      act(() => {
        result.current.setIsOpen(true);
      });
      rerender({
        value: null,
        maxDateProp: "2025-10-30",
        onChange: jest.fn(),
        triggerRef: triggerRef as React.RefObject<HTMLButtonElement>,
      });

      // Day 30 should be enabled
      const day30 = screen.getByRole("button", {
        name: "Select October 30, 2025",
      });
      expect(day30).not.toBeDisabled();

      // Day 31 should be disabled
      const day31 = screen.getByRole("button", {
        name: "Date October 31, 2025 (not selectable)",
      });
      expect(day31).toBeDisabled();
    });

    it("should not call onChange when clicking a disabled day", () => {
      const { rerender, result, mockOnChange, triggerRef } = setupHook({
        minDateProp: "2025-10-15",
      });
      act(() => {
        result.current.setIsOpen(true);
      });
      rerender({
        value: null,
        minDateProp: "2025-10-15",
        onChange: mockOnChange,
        triggerRef: triggerRef as React.RefObject<HTMLButtonElement>,
      });

      const day14 = screen.getByRole("button", {
        name: "Date October 14, 2025 (not selectable)",
      });

      act(() => {
        fireEvent.click(day14);
      });

      expect(mockOnChange).not.toHaveBeenCalled();
      expect(result.current.isOpen).toBe(true); // Should not close
    });

    it("should disable individual months before minDate", () => {
      const { rerender, result, triggerRef } = setupHook({
        minDateProp: "2025-10-15",
      });
      act(() => {
        result.current.setIsOpen(true);
      });
      rerender({
        value: null,
        minDateProp: "2025-10-15",
        onChange: jest.fn(),
        triggerRef: triggerRef as React.RefObject<HTMLButtonElement>,
      });

      // Go to month view
      act(() => {
        fireEvent.click(
          screen.getByRole("button", { name: "Select month for year 2025" })
        );
      });
      rerender({
        value: null,
        minDateProp: "2025-10-15",
        onChange: jest.fn(),
        triggerRef: triggerRef as React.RefObject<HTMLButtonElement>,
      });

      // "Sep 2025" should be disabled
      expect(
        screen.getByRole("button", { name: "Sep 2025 (not selectable)" })
      ).toBeDisabled();
      // "Oct 2025" should be enabled
      expect(
        screen.getByRole("button", { name: "Select Oct 2025" })
      ).not.toBeDisabled();
    });

    it("should disable individual years after maxDate", () => {
      const { rerender, result, triggerRef } = setupHook({
        maxDateProp: "2025-10-15",
      });
      act(() => {
        result.current.setIsOpen(true);
      });
      rerender({
        value: null,
        maxDateProp: "2025-10-15",
        onChange: jest.fn(),
        triggerRef: triggerRef as React.RefObject<HTMLButtonElement>,
      });

      // Go to year view
      act(() => {
        fireEvent.click(
          screen.getByRole("button", { name: "Select month for year 2025" })
        );
      });
      act(() => {
        fireEvent.click(
          screen.getByRole("button", {
            name: "Current year 2025, select year",
          })
        );
      });
      rerender({
        value: null,
        maxDateProp: "2025-10-15",
        onChange: jest.fn(),
        triggerRef: triggerRef as React.RefObject<HTMLButtonElement>,
      });

      // "2026" should be disabled
      expect(
        screen.getByRole("button", { name: "Year 2026 (not selectable)" })
      ).toBeDisabled();
      // "2025" should be enabled
      expect(
        screen.getByRole("button", { name: "Select year 2025" })
      ).not.toBeDisabled();
    });

    it("should update currentDate if minDate prop changes", () => {
      const triggerRef = { current: document.createElement("button") } as any;
      const { rerender, result } = renderHook(
        (p: UseDatePickerPopoverProps) => useDatePickerPopover(p),
        {
          initialProps: {
            value: "2025-10-15",
            onChange: jest.fn(),
            triggerRef: triggerRef,
          } as UseDatePickerPopoverProps, // Cast to UseDatePickerPopoverProps
        }
      );

      // Initial date is Oct 15
      expect(result.current.currentDate.getDate()).toBe(15);

      // Rerender with a new minDate that is *after* the currentDate
      rerender({
        value: "2025-10-15",
        onChange: jest.fn(),
        triggerRef: triggerRef,
        minDateProp: "2025-10-20",
      });

      // The hook's effect should see currentDate is before the new minDate
      // and jump it forward to the new minDate.
      expect(result.current.currentDate.getDate()).toBe(20);
    });
  });

  // --- NEW: Today Button Tests ---
  describe("Today Button", () => {
    it('should render the "Today" button and be enabled', () => {
      const { result, rerender, triggerRef } = setupHook();
      act(() => {
        result.current.setIsOpen(true);
      });
      rerender({
        value: null,
        onChange: jest.fn(),
        triggerRef: triggerRef as React.RefObject<HTMLButtonElement>,
      });

      const todayButton = screen.getByRole("button", {
        name: `Select Today, ${format(TODAY_DATE, "PPP")}`,
      });
      expect(todayButton).toBeInTheDocument();
      expect(todayButton).not.toBeDisabled();
    });

    it("should select today and close the popover when clicked", () => {
      const { result, rerender, mockOnChange, triggerRef } = setupHook({
        value: "2025-01-01",
      });
      act(() => {
        result.current.setIsOpen(true);
      });
      rerender({
        value: "2025-01-01",
        onChange: mockOnChange,
        triggerRef: triggerRef as React.RefObject<HTMLButtonElement>,
      });

      // Check that we are viewing Jan 2025
      expect(
        screen.getByRole("button", { name: "Select month for year 2025" })
      ).toHaveTextContent("Jan");

      const todayButton = screen.getByRole("button", {
        name: `Select Today, ${format(TODAY_DATE, "PPP")}`,
      });

      act(() => {
        fireEvent.click(todayButton);
      });

      // Should call onChange with today's ISO string
      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith(TODAY_ISO);

      // Should close the popover
      expect(result.current.isOpen).toBe(false);

      // Should also reset the currentDate view to today
      expect(result.current.currentDate).toEqual(TODAY_DATE);
    });

    it('should disable the "Today" button if today is before minDate', () => {
      const minDate = "2025-10-27"; // One day after today
      const { result, rerender, triggerRef } = setupHook({
        minDateProp: minDate,
      });
      act(() => {
        result.current.setIsOpen(true);
      });
      rerender({
        value: null,
        minDateProp: minDate,
        onChange: jest.fn(),
        triggerRef: triggerRef as React.RefObject<HTMLButtonElement>,
      });

      const todayButton = screen.getByRole("button", {
        name: `Today, ${format(TODAY_DATE, "PPP")} (not selectable)`,
      });
      expect(todayButton).toBeDisabled();
    });

    it('should disable the "Today" button if today is after maxDate', () => {
      const maxDate = "2025-10-25"; // One day before today
      const { result, rerender, triggerRef } = setupHook({
        maxDateProp: maxDate,
      });
      act(() => {
        result.current.setIsOpen(true);
      });
      rerender({
        value: null,
        maxDateProp: maxDate,
        onChange: jest.fn(),
        triggerRef: triggerRef as React.RefObject<HTMLButtonElement>,
      });

      const todayButton = screen.getByRole("button", {
        name: `Today, ${format(TODAY_DATE, "PPP")} (not selectable)`,
      });
      expect(todayButton).toBeDisabled();
    });

    it('should not select today or close when clicking disabled "Today" button', () => {
      const maxDate = "2025-10-25"; // One day before today
      const { result, rerender, mockOnChange, triggerRef } = setupHook({
        maxDateProp: maxDate,
      });
      act(() => {
        result.current.setIsOpen(true);
      });
      rerender({
        value: null,
        maxDateProp: maxDate,
        onChange: mockOnChange,
        triggerRef: triggerRef as React.RefObject<HTMLButtonElement>,
      });

      const todayButton = screen.getByRole("button", {
        name: `Today, ${format(TODAY_DATE, "PPP")} (not selectable)`,
      });
      expect(todayButton).toBeDisabled();

      act(() => {
        fireEvent.click(todayButton);
      });

      // Should not call onChange
      expect(mockOnChange).not.toHaveBeenCalled();
      // Should remain open
      expect(result.current.isOpen).toBe(true);
    });
  });
});
