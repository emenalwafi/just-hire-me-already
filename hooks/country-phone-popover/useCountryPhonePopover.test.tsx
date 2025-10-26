import React from "react";
import { renderHook, act } from "@testing-library/react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  useCountryPhonePopover,
  UseCountryPhonePopoverProps,
  Country,
} from "./useCountryPhonePopover"; // Adjust import path as needed

// --- Mocks ---

// 1. Mock react-dom's createPortal
jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  createPortal: (element: React.ReactNode) => element,
}));

// 2. Mock the icon library
jest.mock("@iconscout/react-unicons", () => ({
  UilSearch: () => <span data-testid="icon-search" />,
}));

// 3. Mock the entire flag icon library
// The hook imports `* as Flags` and accesses `Flags[ISO]`.
// We need to mock this module structure.
jest.mock("country-flag-icons/react/3x2", () => ({
  __esModule: true, // This is important for module mocks with named exports
  // Mock the specific flags we'll use in our test data
  ID: (props: { title: string }) => (
    <span data-testid="flag-ID" title={props.title} />
  ),
  US: (props: { title: string }) => (
    <span data-testid="flag-US" title={props.title} />
  ),
  JP: (props: { title: string }) => (
    <span data-testid="flag-JP" title={props.title} />
  ),
}));

// --- Test Setup ---

// Mock country data. Using the `countries` prop is *much* easier
// than mocking `libphonenumber-js` and `Intl.DisplayNames`.
const mockCountries: Country[] = [
  { name: "Indonesia", code: "+62", iso: "ID" },
  { name: "United States", code: "+1", iso: "US" },
  { name: "Japan", code: "+81", iso: "JP" },
];

// Helper setup function
const setupHook = (props: Partial<UseCountryPhonePopoverProps> = {}) => {
  // 1. Create a mock anchor ref
  const anchorRef = { current: document.createElement("button") };
  jest.spyOn(anchorRef.current, "getBoundingClientRect").mockReturnValue({
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

  // 2. Create a mock onSelectCountry
  const mockOnSelectCountry = jest.fn();

  // 3. Render the hook
  const hookResult = renderHook(
    (p: UseCountryPhonePopoverProps) => useCountryPhonePopover(p),
    {
      initialProps: {
        anchorRef: anchorRef as React.RefObject<HTMLElement>,
        onSelectCountry: mockOnSelectCountry,
        countries: mockCountries, // Use our mock data by default
        ...props,
      },
    }
  );

  // 4. Render the returned popoverElement (if it exists)
  hookResult.result.current.popoverElement &&
    render(hookResult.result.current.popoverElement);

  return {
    ...hookResult,
    mockOnSelectCountry,
    anchorRef,
  };
};

describe("useCountryPhonePopover", () => {
  // --- Initialization and State ---
  describe("Initialization and Popover State", () => {
    it("should initialize closed with no search term", () => {
      const { result } = setupHook();
      expect(result.current.isOpen).toBe(false);
      expect(result.current.popoverElement).toBe(null);
      expect(result.current.searchTerm).toBe("");
    });

    it("should render open if initialIsOpen is true", () => {
      setupHook({ initialIsOpen: true });
      expect(
        screen.getByRole("dialog", { name: "Select Country Code" })
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Search country or code")
      ).toBeInTheDocument();
    });

    it("should open the popover when setIsOpen(true) is called", () => {
      const { result, rerender, anchorRef, mockOnSelectCountry } = setupHook();
      expect(result.current.popoverElement).toBe(null);

      act(() => {
        result.current.setIsOpen(true);
      });
      // Rerender to get the new popoverElement
      rerender({
        anchorRef: anchorRef as React.RefObject<HTMLElement>,
        onSelectCountry: mockOnSelectCountry,
        countries: mockCountries,
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.popoverElement).not.toBe(null);
      expect(
        screen.getByRole("dialog", { name: "Select Country Code" })
      ).toBeInTheDocument();
    });

    it("should close the popover when clicking outside", () => {
      const { result } = setupHook({ initialIsOpen: true });
      expect(
        screen.getByRole("dialog", { name: "Select Country Code" })
      ).toBeInTheDocument();

      act(() => {
        fireEvent.mouseDown(document.body);
      });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.searchTerm).toBe(""); // Should reset search
    });

    it("should not close when clicking inside the popover", () => {
      const { result } = setupHook({ initialIsOpen: true });
      const dialog = screen.getByRole("dialog", {
        name: "Select Country Code",
      });

      act(() => {
        fireEvent.mouseDown(dialog);
      });

      expect(result.current.isOpen).toBe(true);
    });

    it("should close and reset search when Escape key is pressed", () => {
      const { result } = setupHook({ initialIsOpen: true });
      const dialog = screen.getByRole("dialog", {
        name: "Select Country Code",
      });
      const searchInput = screen.getByPlaceholderText("Search country or code");

      act(() => {
        fireEvent.change(searchInput, { target: { value: "test" } });
      });
      expect(result.current.searchTerm).toBe("test");

      act(() => {
        fireEvent.keyDown(dialog, { key: "Escape" });
      });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.searchTerm).toBe("");
    });
  });

  // --- Filtering and Searching ---
  describe("Filtering and Searching", () => {
    beforeEach(() => {
      // Open the popover before each test in this block
      const { result, rerender, anchorRef, mockOnSelectCountry } = setupHook();
      act(() => {
        result.current.setIsOpen(true);
      });
      rerender({
        anchorRef: anchorRef as React.RefObject<HTMLElement>,
        onSelectCountry: mockOnSelectCountry,
        countries: mockCountries,
      });
    });

    it('should filter by country name (e.g., "Japan")', () => {
      const searchInput = screen.getByPlaceholderText("Search country or code");
      act(() => {
        fireEvent.change(searchInput, { target: { value: "Japan" } });
      });

      expect(screen.getByRole("button", { name: /Japan/ })).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Indonesia/ })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /United States/ })
      ).not.toBeInTheDocument();
    });

    it('should filter by country code with "+" (e.g., "+62")', () => {
      const searchInput = screen.getByPlaceholderText("Search country or code");
      act(() => {
        fireEvent.change(searchInput, { target: { value: "+62" } });
      });

      expect(
        screen.getByRole("button", { name: /Indonesia/ })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Japan/ })
      ).not.toBeInTheDocument();
    });

    it('should filter by country code without "+" (e.g., "81")', () => {
      const searchInput = screen.getByPlaceholderText("Search country or code");
      act(() => {
        fireEvent.change(searchInput, { target: { value: "81" } });
      });

      expect(screen.getByRole("button", { name: /Japan/ })).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Indonesia/ })
      ).not.toBeInTheDocument();
    });

    it('should filter by ISO code (e.g., "US")', () => {
      const searchInput = screen.getByPlaceholderText("Search country or code");
      act(() => {
        fireEvent.change(searchInput, { target: { value: "US" } });
      });

      expect(
        screen.getByRole("button", { name: /United States/ })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Indonesia/ })
      ).not.toBeInTheDocument();
    });

    it("should be case-insensitive", () => {
      const searchInput = screen.getByPlaceholderText("Search country or code");
      act(() => {
        fireEvent.change(searchInput, { target: { value: "indonesia" } });
      });

      expect(
        screen.getByRole("button", { name: /Indonesia/ })
      ).toBeInTheDocument();
    });

    it('should show a "not found" message for no results', () => {
      const searchInput = screen.getByPlaceholderText("Search country or code");
      act(() => {
        fireEvent.change(searchInput, { target: { value: "zzzz" } });
      });

      expect(
        screen.queryByRole("button", { name: /Indonesia/ })
      ).not.toBeInTheDocument();
      expect(screen.getByText("“zzzz”")).toBeInTheDocument();
      // This text is hardcoded in your component
      expect(screen.getByText("tidak ditemukan")).toBeInTheDocument();
    });
  });

  // --- Selection and Prop Handling ---
  describe("Selection and Props", () => {
    it("should select a country, call onSelectCountry, and close", () => {
      const { result, mockOnSelectCountry } = setupHook({
        initialIsOpen: true,
      });

      const indonesiaButton = screen.getByRole("button", {
        name: "Indonesia +62",
      });

      act(() => {
        fireEvent.click(indonesiaButton);
      });

      // 1. Should call the callback with the correct country object
      expect(mockOnSelectCountry).toHaveBeenCalledTimes(1);
      expect(mockOnSelectCountry).toHaveBeenCalledWith(mockCountries[0]);

      // 2. Should close the popover
      expect(result.current.isOpen).toBe(false);

      // 3. Should reset the search term (though it was empty)
      expect(result.current.searchTerm).toBe("");
    });

    it("should apply correct active and default classes based on selectedCountryIso", () => {
      setupHook({ initialIsOpen: true, selectedCountryIso: "US" });

      const usButton = screen.getByRole("button", { name: /United States/ });
      const idButton = screen.getByRole("button", { name: /Indonesia/ });
      const usName = screen.getByText("United States");
      const usCode = screen.getByText("+1");
      const idName = screen.getByText("Indonesia");
      const idCode = screen.getByText("+62");

      // Check active (selected) state for US
      expect(usButton).toHaveClass("bg-primary-surface");
      expect(usButton).toHaveAttribute("aria-pressed", "true");
      expect(usName).toHaveClass("text-primary-main");
      expect(usCode).toHaveClass("text-primary-main");

      // Check default (inactive) state for Indonesia
      expect(idButton).not.toHaveClass("bg-primary-surface");
      expect(idButton).not.toHaveAttribute("aria-pressed");
      expect(idButton).toHaveClass("bg-neutral-10 hover:bg-neutral-20");
      expect(idName).toHaveClass("text-neutral-100");
      expect(idCode).toHaveClass("text-neutral-100");
    });

    it("should apply correct disabled classes based on disabledCountryIsos", () => {
      setupHook({ initialIsOpen: true, disabledCountryIsos: ["JP"] });

      const japanButton = screen.getByRole("button", { name: /Japan/ });
      const japanName = screen.getByText("Japan");
      const japanCode = screen.getByText("+81");
      const usButton = screen.getByRole("button", { name: /United States/ });

      // Check disabled state for Japan
      expect(japanButton).toBeDisabled();
      expect(japanButton).toHaveAttribute("aria-disabled", "true");
      expect(japanButton).toHaveClass("bg-neutral-10 cursor-not-allowed");
      expect(japanName).toHaveClass("text-neutral-60");
      expect(japanCode).toHaveClass("text-neutral-60");

      // Check default (enabled) state for US
      expect(usButton).not.toBeDisabled();
      expect(usButton).toHaveClass("bg-neutral-10 hover:bg-neutral-20");
    });

    it("should not select a disabled country or close popover", () => {
      const { result, mockOnSelectCountry } = setupHook({
        initialIsOpen: true,
        disabledCountryIsos: ["JP"],
      });

      const japanButton = screen.getByRole("button", { name: /Japan/ });

      act(() => {
        fireEvent.click(japanButton);
      });

      // 1. Should NOT call the callback
      expect(mockOnSelectCountry).not.toHaveBeenCalled();

      // 2. Should remain open
      expect(result.current.isOpen).toBe(true);
    });

    it("should render flags correctly", () => {
      setupHook({ initialIsOpen: true });

      // Check if our mock flags are rendered with the correct titles
      expect(screen.getByTestId("flag-ID")).toHaveAttribute(
        "title",
        "Indonesia"
      );
      expect(screen.getByTestId("flag-US")).toHaveAttribute(
        "title",
        "United States"
      );
      expect(screen.getByTestId("flag-JP")).toHaveAttribute("title", "Japan");
    });
  });
});
