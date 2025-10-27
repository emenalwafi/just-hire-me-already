import React from "react";
import { renderHook, act } from "@testing-library/react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  useDatePickerPopover,
  UseDatePickerPopoverProps,
} from "./useDatePickerPopover";
import { format, parseISO, startOfDay } from "date-fns";

/**
 * @file Test suite for the `useDatePickerPopover` hook.
 * @description This file contains unit tests for the `useDatePickerPopover` hook,
 * covering initialization, state management, UI rendering via the returned
 * `popoverElement`, view navigation, date selection, min/max date constraints,
 * "Today" button functionality, and responsive mobile/desktop UI rendering.
 * It mocks dependencies like `react-dom`, icons, and system time.
 */

// --- Mocks ---

/**
 * Mocks `react-dom.createPortal` to render the element inline.
 * This makes the popover content directly queryable within the test DOM.
 */
jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  createPortal: (element: React.ReactNode) => element,
}));

/**
 * Mocks the `@iconscout/react-unicons` library.
 * Replaces icons with simple `<span>` elements containing `data-testid`
 * for easy selection during tests.
 */
jest.mock("@iconscout/react-unicons", () => ({
  UilAngleLeft: () => <span data-testid="icon-angle-left" />,
  UilAngleRight: () => <span data-testid="icon-angle-right" />,
  UilAngleDoubleLeft: () => <span data-testid="icon-angle-double-left" />,
  UilAngleDoubleRight: () => <span data-testid="icon-angle-double-right" />,
}));

// --- Test Setup ---

/** ISO string representing the fixed "today" date for tests. */
const TODAY_ISO = "2025-10-26";
/** Date object representing the start of the fixed "today" date. */
const TODAY_DATE = startOfDay(parseISO(TODAY_ISO));

/**
 * @beforeAll Sets up Jest fake timers and freezes the system time to `TODAY_DATE`
 * before any tests in this suite run, ensuring consistent date calculations.
 */
beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(TODAY_DATE);
});

/**
 * @afterAll Restores Jest real timers after all tests in this suite have run.
 */
afterAll(() => {
  jest.useRealTimers();
});

/**
 * Custom setup function to initialize the hook and its rendered UI element.
 *
 * This function handles:
 * 1. Creating a mock `triggerRef` with a mocked `getBoundingClientRect`.
 * 2. Creating a mock `onChange` callback.
 * 3. Rendering the hook using `renderHook`.
 * 4. Rendering the hook's `popoverElement` using `render`.
 * 5. Wrapping the hook's `rerender` function to automatically update the UI render
 * (wrapped in `act`) whenever the hook is rerendered, keeping them synchronized
 * and correctly handling `useLayoutEffect` state updates.
 *
 * @param {Partial<UseDatePickerPopoverProps>} props - Optional props to override the hook's defaults.
 * @returns {object} An object containing the hook's `result`, the `mockOnChange` function,
 * the `triggerRef`, the custom `rerender` function (for hook + UI), and the original
 * hook-only `hookRerender` function.
 */
const setupHook = (props: Partial<UseDatePickerPopoverProps> = {}) => {
  const triggerRef = { current: document.createElement("button") };
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

  const mockOnChange = jest.fn();

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

  const { rerender: renderRerender } = render(
    hookResult.result.current.popoverElement
  );

  /**
   * Custom rerender function that rerenders the hook AND the UI.
   * The UI rerender is wrapped in `act` to properly handle
   * state updates from `useLayoutEffect`.
   */
  const customRerender = (
    newProps: Partial<UseDatePickerPopoverProps> = {}
  ) => {
    hookResult.rerender({
      value: null,
      onChange: mockOnChange,
      triggerRef: triggerRef as React.RefObject<HTMLButtonElement>,
      ...props,
      ...newProps,
    });
    act(() => {
      renderRerender(hookResult.result.current.popoverElement);
    });
  };

  return {
    result: hookResult.result,
    mockOnChange,
    triggerRef,
    rerender: customRerender,
    hookRerender: hookResult.rerender,
  };
};

/**
 * @describe Main test suite for the `useDatePickerPopover` hook.
 */
describe("useDatePickerPopover", () => {
  /**
   * @describe Tests related to the hook's initial state upon mounting.
   */
  describe("Initialization", () => {
    /**
     * @it Verifies that the hook initializes with default values: closed, null popover/selectedDate,
     * and currentDate set to the mocked 'today'.
     */
    it("should initialize with no selected date and current date as today", () => {
      const { result } = setupHook();
      expect(result.current.isOpen).toBe(false);
      expect(result.current.popoverElement).toBe(null);
      expect(result.current.selectedDate).toBe(null);
      expect(result.current.currentDate).toEqual(TODAY_DATE);
    });

    /**
     * @it Verifies that `selectedDate` and `currentDate` initialize correctly based on the `value` prop.
     */
    it("should initialize with the provided value", () => {
      const { result } = setupHook({ value: "2024-05-15" });
      const expectedDate = startOfDay(parseISO("2024-05-15"));
      expect(result.current.selectedDate).toEqual(expectedDate);
      expect(result.current.currentDate).toEqual(expectedDate);
    });

    /**
     * @it Verifies that the initial `selectedDate` and `currentDate` are correctly bounded
     * if the `value` prop is before the `minDateProp`.
     */
    it("should bound the initial value by minDate", () => {
      const { result } = setupHook({
        value: "2024-01-01",
        minDateProp: "2024-02-01",
      });
      const expectedDate = startOfDay(parseISO("2024-02-01"));
      expect(result.current.selectedDate).toEqual(expectedDate);
      expect(result.current.currentDate).toEqual(expectedDate);
    });

    /**
     * @it Verifies that the initial `selectedDate` and `currentDate` are correctly bounded
     * if the `value` prop is after the `maxDateProp`.
     */
    it("should bound the initial value by maxDate", () => {
      const { result } = setupHook({
        value: "2024-12-01",
        maxDateProp: "2024-11-01",
      });
      const expectedDate = startOfDay(parseISO("2024-11-01"));
      expect(result.current.selectedDate).toEqual(expectedDate);
      expect(result.current.currentDate).toEqual(expectedDate);
    });
  });

  /**
   * @describe Tests for opening/closing the popover, click-outside behavior, and basic UI rendering.
   */
  describe("Popover State and UI", () => {
    /**
     * @it Verifies that calling `setIsOpen(true)` updates the state and renders the popover UI.
     */
    it("should open the popover and render it", () => {
      const { result, rerender } = setupHook();
      expect(result.current.popoverElement).toBe(null);

      act(() => {
        result.current.setIsOpen(true);
      });
      rerender();

      expect(result.current.isOpen).toBe(true);
      expect(result.current.popoverElement).not.toBe(null);
      expect(
        screen.getByRole("dialog", { name: "Date Picker" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Select month for year 2025" })
      ).toHaveTextContent("Oct");
      expect(
        screen.getByRole("button", {
          name: "Current year 2025, select year",
        })
      ).toHaveTextContent("2025");
    });

    /**
     * @it Verifies that a mousedown event on the document body closes the popover.
     */
    it("should close the popover when clicking outside", () => {
      const { result, rerender } = setupHook();

      act(() => {
        result.current.setIsOpen(true);
      });
      rerender();
      expect(result.current.isOpen).toBe(true);
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      act(() => {
        fireEvent.mouseDown(document.body);
      });
      rerender();

      expect(result.current.isOpen).toBe(false);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    /**
     * @it Verifies that a mousedown event inside the popover dialog does not close it.
     */
    it("should NOT close when clicking inside the popover", () => {
      const { result, rerender } = setupHook();
      act(() => {
        result.current.setIsOpen(true);
      });
      rerender();
      const dialog = screen.getByRole("dialog");

      act(() => {
        fireEvent.mouseDown(dialog);
      });

      expect(result.current.isOpen).toBe(true);
    });

    /**
     * @it Verifies that the button representing the mocked 'today' date
     * has the correct styling when it is not the selected date.
     */
    it('should correctly style "today" when not selected', () => {
      const { result, rerender } = setupHook();
      act(() => {
        result.current.setIsOpen(true);
      });
      rerender();

      const todayButton = screen.getByRole("button", {
        name: "Select October 26th, 2025",
      });

      expect(todayButton).toHaveClass(
        "bg-neutral-20 hover:bg-neutral-30 outline outline-1 outline-neutral-40"
      );
      expect(todayButton).not.toHaveClass("bg-primary-main");
    });
  });

  /**
   * @describe Tests for responsive mobile/desktop UI changes.
   */
  describe("Responsive UI (Mobile/Desktop)", () => {
    let originalInnerWidth: number;

    beforeEach(() => {
      originalInnerWidth = window.innerWidth;
    });

    afterEach(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: originalInnerWidth,
      });
    });

    /**
     * @it Verifies desktop rendering with absolute positioning.
     */
    it("should render as a desktop popover with absolute positioning", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result, rerender } = setupHook();

      act(() => {
        result.current.setIsOpen(true);
      });
      rerender();
      rerender();

      const dialog = screen.getByRole("dialog", { name: "Date Picker" });

      expect(dialog).toHaveStyle("position: absolute");
      expect(dialog).toHaveStyle("visibility: visible"); // Add visibility check
      expect(dialog).toHaveStyle("top: 0px");
      expect(dialog).toHaveStyle("left: 0px");
      expect(dialog.parentElement).not.toHaveClass("fixed");
    });

    /**
     * @it Verifies mobile rendering with a fixed modal backdrop.
     */
    it("should render as a mobile modal with a fixed backdrop", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 400,
      });

      const { result, rerender } = setupHook();
      expect(result.current.popoverElement).toBe(null);

      act(() => {
        result.current.setIsOpen(true);
      });
      rerender();

      const dialog = screen.getByRole("dialog", { name: "Date Picker" });
      const backdrop = dialog.parentElement;

      expect(backdrop).toHaveClass("fixed", "inset-0", "bg-black/50");
      expect(dialog).not.toHaveStyle("position: absolute");
    });

    /**
     * @it Verifies resizing from desktop to mobile.
     */
    it("should switch from desktop to mobile view on resize", () => {
      Object.defineProperty(window, "innerWidth", { value: 1024 });
      const { result, rerender } = setupHook();
      act(() => {
        result.current.setIsOpen(true);
      });
      rerender();
      rerender();

      const dialog = screen.getByRole("dialog", { name: "Date Picker" });
      expect(dialog).toHaveStyle("position: absolute");
      expect(dialog.parentElement).not.toHaveClass("fixed");

      act(() => {
        Object.defineProperty(window, "innerWidth", { value: 400 });
        fireEvent(window, new Event("resize"));
      });
      rerender();

      const mobileDialog = screen.getByRole("dialog", { name: "Date Picker" });
      const backdrop = mobileDialog.parentElement;

      expect(backdrop).toHaveClass("fixed", "inset-0", "bg-black/50");
      expect(mobileDialog).not.toHaveStyle("position: absolute");
    });

    /**
     * @it Verifies resizing from mobile to desktop.
     */
    it("should switch from mobile to desktop view on resize", () => {
      Object.defineProperty(window, "innerWidth", { value: 400 });
      const { result, rerender } = setupHook();
      act(() => {
        result.current.setIsOpen(true);
      });
      rerender();

      const mobileDialog = screen.getByRole("dialog", { name: "Date Picker" });
      expect(mobileDialog.parentElement).toHaveClass("fixed");
      expect(mobileDialog).not.toHaveStyle("position: absolute");

      act(() => {
        Object.defineProperty(window, "innerWidth", { value: 1024 });
        fireEvent(window, new Event("resize"));
      });
      rerender();
      rerender();

      const desktopDialog = screen.getByRole("dialog", {
        name: "Date Picker",
      });
      expect(desktopDialog).toHaveStyle("position: absolute");
      expect(desktopDialog).toHaveStyle("visibility: visible");
      expect(desktopDialog).toHaveStyle("top: 98px");
      expect(desktopDialog).toHaveStyle("left: 50px");
      expect(desktopDialog.parentElement).not.toHaveClass("fixed");
    });
  });

  /**
   * @describe Tests for navigating between day, month, year, and decade views,
   * and selecting values within each view.
   */
  describe("View Navigation and Selection", () => {
    let hookResult: ReturnType<typeof setupHook>;

    /**
     * @beforeEach Initializes the hook and opens the popover before each test in this suite.
     */
    beforeEach(() => {
      hookResult = setupHook();
      act(() => {
        hookResult.result.current.setIsOpen(true);
      });
      hookResult.rerender({
        onChange: hookResult.mockOnChange,
      });
    });

    /**
     * @it Verifies that clicking a day button calls `onChange` with the correct date string
     * and closes the popover.
     */
    it("should select a day and close the popover", () => {
      const dayButton = screen.getByRole("button", {
        name: "Select October 28th, 2025",
      });

      act(() => {
        fireEvent.click(dayButton);
      });

      expect(hookResult.mockOnChange).toHaveBeenCalledTimes(1);
      expect(hookResult.mockOnChange).toHaveBeenCalledWith("2025-10-28");
      expect(hookResult.result.current.isOpen).toBe(false);
    });

    /**
     * @it Verifies the click sequence to navigate through all views: Day -> Month -> Year -> Decade.
     */
    it("should navigate from day -> month -> year -> decade views", () => {
      const monthTitleButton = screen.getByRole("button", {
        name: "Select month for year 2025",
      });
      act(() => {
        fireEvent.click(monthTitleButton);
      });
      hookResult.rerender({ onChange: hookResult.mockOnChange });

      expect(
        screen.getByRole("button", { name: "Select Jan 2025" })
      ).toBeInTheDocument();
      const yearTitleButton = screen.getByRole("button", {
        name: "Current year 2025, select year",
      });
      act(() => {
        fireEvent.click(yearTitleButton);
      });
      hookResult.rerender({ onChange: hookResult.mockOnChange });

      expect(
        screen.getByRole("button", { name: "Select year 2024" })
      ).toBeInTheDocument();
      const decadeTitleButton = screen.getByRole("button", {
        name: "Current decade 2020-2029, select decade range",
      });
      act(() => {
        fireEvent.click(decadeTitleButton);
      });
      hookResult.rerender({ onChange: hookResult.mockOnChange });

      expect(
        screen.getByRole("button", { name: "Select decade 2010 - 2019" })
      ).toBeInTheDocument();
    });

    /**
     * @it Verifies that selecting a month changes the view back to the day view
     * for the selected month and year.
     */
    it("should select a month and change to day view", () => {
      act(() => {
        fireEvent.click(
          screen.getByRole("button", { name: "Select month for year 2025" })
        );
      });
      hookResult.rerender({ onChange: hookResult.mockOnChange });

      act(() => {
        fireEvent.click(
          screen.getByRole("button", { name: "Select Jan 2025" })
        );
      });
      hookResult.rerender({ onChange: hookResult.mockOnChange });

      expect(hookResult.mockOnChange).not.toHaveBeenCalled();
      expect(
        screen.getByRole("button", { name: "Select month for year 2025" })
      ).toHaveTextContent("Jan");
      expect(
        screen.getByRole("button", { name: "Select January 1st, 2025" })
      ).toBeInTheDocument();
      expect(hookResult.result.current.currentDate.getMonth()).toBe(0);
    });

    /**
     * @it Verifies that selecting a year changes the view to the month view
     * for the selected year.
     */
    it("should select a year and change to month view", () => {
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
      hookResult.rerender({ onChange: hookResult.mockOnChange });

      act(() => {
        fireEvent.click(
          screen.getByRole("button", { name: "Select year 2023" })
        );
      });
      hookResult.rerender({ onChange: hookResult.mockOnChange });

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

    /**
     * @it Verifies that selecting a decade range changes the view to the year view
     * for the selected decade.
     */
    it("should select a decade and change to year view", () => {
      act(() => {
        fireEvent.click(
          screen.getByRole("button", { name: "Select month for year 2025" })
        );
      });
      hookResult.rerender({ onChange: hookResult.mockOnChange });
      act(() => {
        fireEvent.click(
          screen.getByRole("button", {
            name: "Current year 2025, select year",
          })
        );
      });
      hookResult.rerender({ onChange: hookResult.mockOnChange });
      act(() => {
        fireEvent.click(
          screen.getByRole("button", {
            name: "Current decade 2020-2029, select decade range",
          })
        );
      });
      hookResult.rerender({ onChange: hookResult.mockOnChange });

      act(() => {
        fireEvent.click(
          screen.getByRole("button", { name: "Select decade 2010 - 2019" })
        );
      });
      hookResult.rerender({ onChange: hookResult.mockOnChange });

      expect(hookResult.mockOnChange).not.toHaveBeenCalled();
      expect(
        screen.getByRole("button", {
          name: "Current decade 2010-2019, select decade range",
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Select year 2011" })
      ).toBeInTheDocument();
      expect(hookResult.result.current.currentDate.getFullYear()).toBe(2010);
    });
  });

  /**
   * @describe Tests for how `minDateProp` and `maxDateProp` affect navigation
   * buttons and individual date/month/year selections.
   */
  describe("Min/Max Date Constraints", () => {
    /**
     * @it Verifies that previous month/year navigation buttons are disabled
     * when the current view is limited by `minDateProp`.
     */
    it("should disable navigation buttons based on minDate", () => {
      const { rerender, result } = setupHook({
        minDateProp: "2025-10-15",
      });
      act(() => {
        result.current.setIsOpen(true);
      });
      rerender({
        minDateProp: "2025-10-15",
      });

      expect(
        screen.getByRole("button", { name: "Previous month" })
      ).toBeDisabled();
      expect(
        screen.getByRole("button", { name: "Previous year" })
      ).toBeDisabled();
      expect(
        screen.getByRole("button", { name: "Next month" })
      ).not.toBeDisabled();
      expect(
        screen.getByRole("button", { name: "Next year" })
      ).not.toBeDisabled();
    });

    /**
     * @it Verifies that next month/year navigation buttons are disabled
     * when the current view is limited by `maxDateProp`.
     */
    it("should disable navigation buttons based on maxDate", () => {
      const { rerender, result } = setupHook({
        maxDateProp: "2025-10-15",
      });
      act(() => {
        result.current.setIsOpen(true);
      });
      rerender({
        maxDateProp: "2025-10-15",
      });

      expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Next year" })).toBeDisabled();
      expect(
        screen.getByRole("button", { name: "Previous month" })
      ).not.toBeDisabled();
      expect(
        screen.getByRole("button", { name: "Previous year" })
      ).not.toBeDisabled();
    });

    /**
     * @it Verifies that individual day buttons are disabled if they fall before `minDateProp`.
     */
    it("should disable individual days before minDate", () => {
      const { rerender, result } = setupHook({
        minDateProp: "2025-10-15",
      });
      act(() => {
        result.current.setIsOpen(true);
      });
      rerender({
        minDateProp: "2025-10-15",
      });

      const day14 = screen.getByRole("button", {
        name: "Date October 14th, 2025 (not selectable)",
      });
      expect(day14).toBeDisabled();

      const day15 = screen.getByRole("button", {
        name: "Select October 15th, 2025",
      });
      expect(day15).not.toBeDisabled();
    });

    /**
     * @it Verifies that individual day buttons are disabled if they fall after `maxDateProp`.
     */
    it("should disable individual days after maxDate", () => {
      const { rerender, result } = setupHook({
        maxDateProp: "2025-10-30",
      });
      act(() => {
        result.current.setIsOpen(true);
      });
      rerender({
        maxDateProp: "2025-10-30",
      });

      const day30 = screen.getByRole("button", {
        name: "Select October 30th, 2025",
      });
      expect(day30).not.toBeDisabled();

      const day31 = screen.getByRole("button", {
        name: "Date October 31st, 2025 (not selectable)",
      });
      expect(day31).toBeDisabled();
    });

    /**
     * @it Verifies that clicking a disabled day button does not call `onChange` and does not close the popover.
     */
    it("should not call onChange when clicking a disabled day", () => {
      const { rerender, result, mockOnChange } = setupHook({
        minDateProp: "2025-10-15",
      });
      act(() => {
        result.current.setIsOpen(true);
      });
      rerender({
        minDateProp: "2025-10-15",
        onChange: mockOnChange,
      });

      const day14 = screen.getByRole("button", {
        name: "Date October 14th, 2025 (not selectable)",
      });

      act(() => {
        fireEvent.click(day14);
      });

      expect(mockOnChange).not.toHaveBeenCalled();
      expect(result.current.isOpen).toBe(true);
    });

    /**
     * @it Verifies that individual month buttons are disabled if they fall entirely before `minDateProp`.
     */
    it("should disable individual months before minDate", () => {
      const { rerender, result } = setupHook({
        minDateProp: "2025-10-15",
      });
      act(() => {
        result.current.setIsOpen(true);
      });
      rerender({
        minDateProp: "2025-10-15",
      });

      act(() => {
        fireEvent.click(
          screen.getByRole("button", { name: "Select month for year 2025" })
        );
      });
      rerender({
        minDateProp: "2025-10-15",
      });

      expect(
        screen.getByRole("button", { name: "Sep 2025 (not selectable)" })
      ).toBeDisabled();
      expect(
        screen.getByRole("button", { name: "Select Oct 2025" })
      ).not.toBeDisabled();
    });

    /**
     * @it Verifies that individual year buttons are disabled if they fall entirely after `maxDateProp`.
     */
    it("should disable individual years after maxDate", () => {
      const { rerender, result } = setupHook({
        maxDateProp: "2025-10-15",
      });
      act(() => {
        result.current.setIsOpen(true);
      });
      rerender({
        maxDateProp: "2025-10-15",
      });

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
        maxDateProp: "2025-10-15",
      });

      expect(
        screen.getByRole("button", { name: "Year 2026 (not selectable)" })
      ).toBeDisabled();
      expect(
        screen.getByRole("button", { name: "Select year 2025" })
      ).not.toBeDisabled();
    });

    /**
     * @it Verifies that the internal `currentDate` state is automatically adjusted
     * if a change in `minDateProp` makes the current `currentDate` invalid.
     */
    it("should update currentDate if minDate prop changes", () => {
      const triggerRef = { current: document.createElement("button") };
      const { rerender, result } = renderHook(
        (p: UseDatePickerPopoverProps) => useDatePickerPopover(p),
        {
          initialProps: {
            value: "2025-10-15",
            onChange: jest.fn(),
            triggerRef: triggerRef,
          } as UseDatePickerPopoverProps,
        }
      );

      expect(result.current.currentDate.getDate()).toBe(15);

      rerender({
        value: "2025-10-15",
        onChange: jest.fn(),
        triggerRef: triggerRef,
        minDateProp: "2025-10-20",
      });

      expect(result.current.currentDate.getDate()).toBe(20);
    });
  });

  /**
   * @describe Tests specific to the "Today" button functionality.
   */
  describe("Today Button", () => {
    /**
     * @it Verifies that the "Today" button renders and is enabled by default.
     */
    it('should render the "Today" button and be enabled', () => {
      const { result, rerender } = setupHook();
      act(() => {
        result.current.setIsOpen(true);
      });
      rerender();

      const todayButton = screen.getByRole("button", {
        name: `Select Today, ${format(TODAY_DATE, "PPP")}`,
      });
      expect(todayButton).toBeInTheDocument();
      expect(todayButton).not.toBeDisabled();
    });

    /**
     * @it Verifies that clicking the "Today" button calls `onChange` with today's date,
     * closes the popover, and resets the view to today.
     */
    it("should select today and close the popover when clicked", () => {
      const { result, rerender, mockOnChange } = setupHook({
        value: "2025-01-01",
      });
      act(() => {
        result.current.setIsOpen(true);
      });
      rerender({
        value: "2025-01-01",
        onChange: mockOnChange,
      });

      expect(
        screen.getByRole("button", { name: "Select month for year 2025" })
      ).toHaveTextContent("Jan");

      const todayButton = screen.getByRole("button", {
        name: `Select Today, ${format(TODAY_DATE, "PPP")}`,
      });

      act(() => {
        fireEvent.click(todayButton);
      });

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith(TODAY_ISO);
      expect(result.current.isOpen).toBe(false);
      expect(result.current.currentDate).toEqual(TODAY_DATE);
    });

    /**
     * @it Verifies that the "Today" button is disabled if today's date is before `minDateProp`.
     */
    it('should disable the "Today" button if today is before minDate', () => {
      const minDate = "2025-10-27";
      const { result, rerender } = setupHook({
        minDateProp: minDate,
      });
      act(() => {
        result.current.setIsOpen(true);
      });
      rerender({
        minDateProp: minDate,
      });

      const todayButton = screen.getByRole("button", {
        name: `Today, ${format(TODAY_DATE, "PPP")} (not selectable)`,
      });
      expect(todayButton).toBeDisabled();
    });

    /**
     * @it Verifies that the "Today" button is disabled if today's date is after `maxDateProp`.
     */
    it('should disable the "Today" button if today is after maxDate', () => {
      const maxDate = "2025-10-25";
      const { result, rerender } = setupHook({
        maxDateProp: maxDate,
      });
      act(() => {
        result.current.setIsOpen(true);
      });
      rerender({
        maxDateProp: maxDate,
      });

      const todayButton = screen.getByRole("button", {
        name: `Today, ${format(TODAY_DATE, "PPP")} (not selectable)`,
      });
      expect(todayButton).toBeDisabled();
    });

    /**
     * @it Verifies that clicking a disabled "Today" button does not call `onChange` and does not close the popover.
     */
    it('should not select today or close when clicking disabled "Today" button', () => {
      const maxDate = "2025-10-25";
      const { result, rerender, mockOnChange } = setupHook({
        maxDateProp: maxDate,
      });
      act(() => {
        result.current.setIsOpen(true);
      });
      rerender({
        maxDateProp: maxDate,
        onChange: mockOnChange,
      });

      const todayButton = screen.getByRole("button", {
        name: `Today, ${format(TODAY_DATE, "PPP")} (not selectable)`,
      });
      expect(todayButton).toBeDisabled();

      act(() => {
        fireEvent.click(todayButton);
      });

      expect(mockOnChange).not.toHaveBeenCalled();
      expect(result.current.isOpen).toBe(true);
    });
  });
});
