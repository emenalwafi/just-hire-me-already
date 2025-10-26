import React from "react";
import { renderHook, act } from "@testing-library/react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  useDropdownPopover,
  UseDropdownPopoverProps,
  DropdownOption,
} from "./useDropdownPopover"; // Adjust import path as needed

// --- Mocks ---

// 1. Mock react-dom's createPortal
jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  createPortal: (element: React.ReactNode) => element,
}));

// --- Test Setup ---

// Mock options for our tests
const mockOptions: DropdownOption[] = [
  { id: 1, label: "Apple" },
  { id: 2, label: "Banana" },
  { id: 3, label: "Mango" },
];

// Helper to create a mock anchor ref
const createMockAnchorRef = () => {
  const anchorRef = { current: document.createElement("button") };
  jest.spyOn(anchorRef.current, "getBoundingClientRect").mockReturnValue({
    width: 200, // Mock width
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

describe("useDropdownPopover", () => {
  let mockOnSelectOption: jest.Mock;
  let mockOnClose: jest.Mock;
  let mockAnchorRef: React.RefObject<HTMLElement>;
  let baseProps: UseDropdownPopoverProps;

  beforeEach(() => {
    // Reset all mocks and create base props for each test
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

  // --- Initialization and State ---
  describe("Rendering and Positioning", () => {
    it("should render null when isOpen is false", () => {
      const { result } = renderHook((props) => useDropdownPopover(props), {
        initialProps: baseProps,
      });
      expect(result.current.popoverElement).toBe(null);
    });

    it("should render the popover when isOpen is true", () => {
      const { result, rerender } = renderHook(
        (props) => useDropdownPopover(props),
        {
          initialProps: baseProps,
        }
      );

      // Open the popover by re-rendering with isOpen: true
      rerender({ ...baseProps, isOpen: true });
      render(result.current.popoverElement);

      expect(screen.getByRole("listbox")).toBeInTheDocument();
      // Should render all options
      expect(screen.getByRole("option", { name: "Apple" })).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "Banana" })
      ).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Mango" })).toBeInTheDocument();
    });

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
      // From mock getBoundingClientRect:
      // top = rect.bottom (90) + 4 = 94px
      // left = rect.left (50) = 50px
      // width = rect.width (200) = 200px
      expect(popover.style.top).toBe("94px");
      expect(popover.style.left).toBe("50px");
      expect(popover.style.width).toBe("200px");
    });
  });

  // --- Filtering and Searching ---
  describe("Filtering and Searching", () => {
    it("should filter options based on searchTerm (case-insensitive)", () => {
      const { result } = renderHook(
        (props) => useDropdownPopover(props),
        {
          initialProps: { ...baseProps, isOpen: true, searchTerm: "apple" },
        }
      );
      render(result.current.popoverElement);

      expect(screen.getByRole("option", { name: "Apple" })).toBeInTheDocument();
      expect(
        screen.queryByRole("option", { name: "Banana" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("option", { name: "Mango" })
      ).not.toBeInTheDocument();
    });

    it('should show "no results" message when filter finds nothing', () => {
      const { result } = renderHook(
        (props) => useDropdownPopover(props),
        {
          initialProps: { ...baseProps, isOpen: true, searchTerm: "zzzz" },
        }
      );
      render(result.current.popoverElement);

      expect(
        screen.getByText('No results found for "zzzz"')
      ).toBeInTheDocument();
    });

    it('should show "no options" message when options array is empty', () => {
      const { result } = renderHook(
        (props) => useDropdownPopover(props),
        {
          initialProps: { ...baseProps, isOpen: true, options: [] },
        }
      );
      render(result.current.popoverElement);

      expect(screen.getByText("No options available.")).toBeInTheDocument();
    });
  });

  // --- Selection and CSS Classes ---
  describe("Selection and CSS Classes", () => {
    it("should call onSelectOption with correct option on click", () => {
      const { result } = renderHook(
        (props) => useDropdownPopover(props),
        {
          initialProps: { ...baseProps, isOpen: true },
        }
      );
      render(result.current.popoverElement);

      const bananaOption = screen.getByRole("option", { name: "Banana" });
      act(() => {
        fireEvent.click(bananaOption);
      });

      expect(mockOnSelectOption).toHaveBeenCalledTimes(1);
      expect(mockOnSelectOption).toHaveBeenCalledWith(mockOptions[1]); // { id: 2, label: 'Banana' }
    });

    it('should call onSelectOption on "Enter" key press', () => {
      const { result } = renderHook(
        (props) => useDropdownPopover(props),
        {
          initialProps: { ...baseProps, isOpen: true },
        }
      );
      render(result.current.popoverElement);

      const mangoOption = screen.getByRole("option", { name: "Mango" });
      act(() => {
        fireEvent.keyDown(mangoOption, { key: "Enter" });
      });

      expect(mockOnSelectOption).toHaveBeenCalledTimes(1);
      expect(mockOnSelectOption).toHaveBeenCalledWith(mockOptions[2]); // { id: 3, label: 'Mango' }
    });

    it('should call onSelectOption on "Space" key press', () => {
      const { result } = renderHook(
        (props) => useDropdownPopover(props),
        {
          initialProps: { ...baseProps, isOpen: true },
        }
      );
      render(result.current.popoverElement);

      const appleOption = screen.getByRole("option", { name: "Apple" });
      act(() => {
        fireEvent.keyDown(appleOption, { key: " " });
      });

      expect(mockOnSelectOption).toHaveBeenCalledTimes(1);
      expect(mockOnSelectOption).toHaveBeenCalledWith(mockOptions[0]); // { id: 1, label: 'Apple' }
    });

    it("should apply correct selected classes based on selectedValue", () => {
      const { result } = renderHook(
        (props) => useDropdownPopover(props),
        {
          initialProps: { ...baseProps, isOpen: true, selectedValue: 2 }, // Select 'Banana'
        }
      );
      render(result.current.popoverElement);

      const appleOption = screen.getByRole("option", { name: "Apple" });
      const bananaOption = screen.getByRole("option", { name: "Banana" });

      // Check selected item (Banana)
      expect(bananaOption).toHaveClass("bg-primary-surface");
      expect(bananaOption.firstChild).toHaveClass("text-primary-main");
      expect(bananaOption).toHaveAttribute("aria-selected", "true");

      // Check non-selected item (Apple)
      expect(appleOption).toHaveClass("bg-white hover:bg-neutral-20");
      expect(appleOption.firstChild).toHaveClass("text-neutral-100");
      expect(appleOption).toHaveAttribute("aria-selected", "false");
    });
  });

  // --- Closing Behavior ---
  describe("Closing Behavior", () => {
    it("should call onClose when clicking outside", () => {
      const { result } = renderHook(
        (props) => useDropdownPopover(props),
        {
          initialProps: { ...baseProps, isOpen: true },
        }
      );
      render(result.current.popoverElement);

      act(() => {
        fireEvent.mouseDown(document.body); // Click outside
      });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose on "Escape" key press', () => {
      const { result } = renderHook(
        (props) => useDropdownPopover(props),
        {
          initialProps: { ...baseProps, isOpen: true },
        }
      );
      render(result.current.popoverElement);

      const popover = screen.getByRole("listbox");
      act(() => {
        fireEvent.keyDown(popover, { key: "Escape" });
      });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should not call onClose when clicking inside the popover", () => {
      const { result } = renderHook(
        (props) => useDropdownPopover(props),
        {
          initialProps: { ...baseProps, isOpen: true },
        }
      );
      render(result.current.popoverElement);

      const popover = screen.getByRole("listbox");
      act(() => {
        fireEvent.mouseDown(popover); // Click inside
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("should not call onClose when clicking the anchor element", () => {
      const { result } = renderHook(
        (props) => useDropdownPopover(props),
        {
          initialProps: { ...baseProps, isOpen: true },
        }
      );
      render(result.current.popoverElement);

      act(() => {
        fireEvent.mouseDown(mockAnchorRef.current as HTMLElement); // Click on anchor
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
});
