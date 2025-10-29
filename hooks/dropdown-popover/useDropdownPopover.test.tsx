import { renderHook, act } from "@testing-library/react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  useDropdownPopover,
  UseDropdownPopoverProps,
  DropdownOption,
} from "./useDropdownPopover";

/**
 * @file Test suite for the `useDropdownPopover` hook.
 * @description This file contains unit tests for the `useDropdownPopover` hook,
 * covering rendering, positioning, filtering, selection, CSS class application,
 * and closing behavior. It mocks dependencies like `react-dom`.
 */

// --- Mocks ---

/**
 * Mocks `react-dom.createPortal` to render the element inline.
 * This allows querying the popover content directly within the test DOM using `screen`.
 */
jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  createPortal: (element: React.ReactNode) => element,
}));

// --- Test Setup ---

/**
 * A static array of mock `DropdownOption` objects used as test data.
 */
const mockOptions: DropdownOption[] = [
  { value: "1", label: "Apple" },
  { value: "2", label: "Banana" },
  { value: "3", label: "Mango" },
];

/**
 * Creates a mock React ref object pointing to a button element
 * with a mocked `getBoundingClientRect` method for positioning tests.
 * @returns {React.RefObject<HTMLElement>} A mock ref object.
 */
const createMockAnchorRef = () => {
  const anchorRef = { current: document.createElement("button") };
  jest.spyOn(anchorRef.current, "getBoundingClientRect").mockReturnValue({
    width: 200,
    height: 40,
    top: 50,
    left: 50,
    bottom: 90,
    right: 250,
    x: 50,
    y: 50,
    toJSON: () => ({}),
  } as DOMRect);
  return anchorRef as React.RefObject<HTMLElement>;
};

/**
 * @describe Main test suite for the `useDropdownPopover` hook.
 */
describe("useDropdownPopover", () => {
  let mockOnSelectOption: jest.Mock;
  let mockOnClose: jest.Mock;
  let mockAnchorRef: React.RefObject<HTMLElement>;
  let baseProps: UseDropdownPopoverProps;

  /**
   * @beforeEach Resets mocks and sets up base props before each test.
   */
  beforeEach(() => {
    mockOnSelectOption = jest.fn();
    mockOnClose = jest.fn();
    mockAnchorRef = createMockAnchorRef();

    baseProps = {
      anchorRef: mockAnchorRef,
      options: mockOptions,
      selectedValue: null,
      searchTerm: "",
      onSelectOption: mockOnSelectOption,
      isOpen: false,
      onClose: mockOnClose,
    };
  });

  /**
   * @describe Tests related to the popover's rendering and positioning.
   */
  describe("Rendering and Positioning", () => {
    /**
     * @it Verifies that the hook returns a null `popoverElement` when `isOpen` is false.
     */
    it("should render null when isOpen is false", () => {
      const { result } = renderHook((props) => useDropdownPopover(props), {
        initialProps: baseProps,
      });
      expect(result.current.popoverElement).toBe(null);
    });

    /**
     * @it Verifies that the hook returns a non-null `popoverElement` which renders
     * the listbox and options when `isOpen` is true.
     */
    it("should render the popover when isOpen is true", () => {
      const { result, rerender } = renderHook(
        (props) => useDropdownPopover(props),
        {
          initialProps: baseProps,
        }
      );

      rerender({ ...baseProps, isOpen: true });
      render(result.current.popoverElement);

      expect(screen.getByRole("listbox")).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Apple" })).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "Banana" })
      ).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Mango" })).toBeInTheDocument();
    });

    /**
     * @it Verifies that the rendered popover element has the correct inline styles
     * for `top`, `left`, and `width` based on the mock `anchorRef`.
     */
    it("should position the popover based on anchorRef", () => {
      const { result, rerender } = renderHook(
        (props) => useDropdownPopover(props),
        {
          initialProps: baseProps,
        }
      );
      rerender({ ...baseProps, isOpen: true });
      render(result.current.popoverElement);

      const popover = screen.getByRole("listbox");
      expect(popover.style.top).toBe("94px");
      expect(popover.style.left).toBe("50px");
      expect(popover.style.width).toBe("200px");
    });
  });

  /**
   * @describe Tests for the filtering logic based on the `searchTerm` prop.
   */
  describe("Filtering and Searching", () => {
    /**
     * @it Verifies that the options list is correctly filtered based on `searchTerm`,
     * ignoring case.
     */
    it("should filter options based on searchTerm (case-insensitive)", () => {
      const { result } = renderHook((props) => useDropdownPopover(props), {
        initialProps: { ...baseProps, isOpen: true, searchTerm: "apple" },
      });
      render(result.current.popoverElement);

      expect(screen.getByRole("option", { name: "Apple" })).toBeInTheDocument();
      expect(
        screen.queryByRole("option", { name: "Banana" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("option", { name: "Mango" })
      ).not.toBeInTheDocument();
    });

    /**
     * @it Verifies that a "no results" message is shown when the `searchTerm`
     * does not match any options.
     */
    it('should show "no results" message when filter finds nothing', () => {
      const { result } = renderHook((props) => useDropdownPopover(props), {
        initialProps: { ...baseProps, isOpen: true, searchTerm: "zzzz" },
      });
      render(result.current.popoverElement);

      expect(
        screen.getByText('No results found for "zzzz"')
      ).toBeInTheDocument();
    });

    /**
     * @it Verifies that a "no options" message is shown when the `options` array is empty.
     */
    it('should show "no options" message when options array is empty', () => {
      const { result } = renderHook((props) => useDropdownPopover(props), {
        initialProps: { ...baseProps, isOpen: true, options: [] },
      });
      render(result.current.popoverElement);

      expect(screen.getByText("No options available.")).toBeInTheDocument();
    });
  });

  /**
   * @describe Tests related to option selection via click/keyboard and
   * the application of CSS classes for selected state.
   */
  describe("Selection and CSS Classes", () => {
    /**
     * @it Verifies that clicking an option calls the `onSelectOption` callback
     * with the correct `DropdownOption` object.
     */
    it("should call onSelectOption with correct option on click", () => {
      const { result } = renderHook((props) => useDropdownPopover(props), {
        initialProps: { ...baseProps, isOpen: true },
      });
      render(result.current.popoverElement);

      const bananaOption = screen.getByRole("option", { name: "Banana" });
      act(() => {
        fireEvent.click(bananaOption);
      });

      expect(mockOnSelectOption).toHaveBeenCalledTimes(1);
      expect(mockOnSelectOption).toHaveBeenCalledWith(mockOptions[1]);
    });

    /**
     * @it Verifies that pressing the "Enter" key on an option calls `onSelectOption`.
     */
    it('should call onSelectOption on "Enter" key press', () => {
      const { result } = renderHook((props) => useDropdownPopover(props), {
        initialProps: { ...baseProps, isOpen: true },
      });
      render(result.current.popoverElement);

      const mangoOption = screen.getByRole("option", { name: "Mango" });
      act(() => {
        fireEvent.keyDown(mangoOption, { key: "Enter" });
      });

      expect(mockOnSelectOption).toHaveBeenCalledTimes(1);
      expect(mockOnSelectOption).toHaveBeenCalledWith(mockOptions[2]);
    });

    /**
     * @it Verifies that pressing the "Space" key on an option calls `onSelectOption`.
     */
    it('should call onSelectOption on "Space" key press', () => {
      const { result } = renderHook((props) => useDropdownPopover(props), {
        initialProps: { ...baseProps, isOpen: true },
      });
      render(result.current.popoverElement);

      const appleOption = screen.getByRole("option", { name: "Apple" });
      act(() => {
        fireEvent.keyDown(appleOption, { key: " " });
      });

      expect(mockOnSelectOption).toHaveBeenCalledTimes(1);
      expect(mockOnSelectOption).toHaveBeenCalledWith(mockOptions[0]);
    });

    /**
     * @it Verifies that the correct CSS classes and `aria-selected` attribute
     * are applied to options based on the `selectedValue` prop.
     */
    it("should apply correct selected classes based on selectedValue", () => {
      const { result } = renderHook((props) => useDropdownPopover(props), {
        initialProps: { ...baseProps, isOpen: true, selectedValue: 2 },
      });
      render(result.current.popoverElement);

      const appleOption = screen.getByRole("option", { name: "Apple" });
      const bananaOption = screen.getByRole("option", { name: "Banana" });

      expect(bananaOption).toHaveClass("bg-primary-surface");
      expect(bananaOption.firstChild).toHaveClass("text-primary-main");
      expect(bananaOption).toHaveAttribute("aria-selected", "true");

      expect(appleOption).toHaveClass("bg-white hover:bg-neutral-20");
      expect(appleOption.firstChild).toHaveClass("text-neutral-100");
      expect(appleOption).toHaveAttribute("aria-selected", "false");
    });
  });

  /**
   * @describe Tests for the different ways the popover can be closed.
   */
  describe("Closing Behavior", () => {
    /**
     * @it Verifies that clicking outside the popover (and outside the anchor)
     * calls the `onClose` callback.
     */
    it("should call onClose when clicking outside", () => {
      const { result } = renderHook((props) => useDropdownPopover(props), {
        initialProps: { ...baseProps, isOpen: true },
      });
      render(result.current.popoverElement);

      act(() => {
        fireEvent.mouseDown(document.body);
      });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    /**
     * @it Verifies that pressing the "Escape" key while the popover is focused
     * calls the `onClose` callback.
     */
    it('should call onClose on "Escape" key press', () => {
      const { result } = renderHook((props) => useDropdownPopover(props), {
        initialProps: { ...baseProps, isOpen: true },
      });
      render(result.current.popoverElement);

      const popover = screen.getByRole("listbox");
      act(() => {
        fireEvent.keyDown(popover, { key: "Escape" });
      });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    /**
     * @it Verifies that clicking *inside* the popover element does not call `onClose`.
     */
    it("should not call onClose when clicking inside the popover", () => {
      const { result } = renderHook((props) => useDropdownPopover(props), {
        initialProps: { ...baseProps, isOpen: true },
      });
      render(result.current.popoverElement);

      const popover = screen.getByRole("listbox");
      act(() => {
        fireEvent.mouseDown(popover);
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    /**
     * @it Verifies that clicking the original anchor element does not call `onClose`.
     */
    it("should not call onClose when clicking the anchor element", () => {
      const { result } = renderHook((props) => useDropdownPopover(props), {
        initialProps: { ...baseProps, isOpen: true },
      });
      render(result.current.popoverElement);

      act(() => {
        fireEvent.mouseDown(mockAnchorRef.current as HTMLElement);
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
});
