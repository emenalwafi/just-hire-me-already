import React from "react";
import { renderHook, act, RenderHookResult } from "@testing-library/react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  useCountryPhonePopover,
  UseCountryPhonePopoverProps,
  Country,
} from "./useCountryPhonePopover";

/**
 * @file Test suite for the `useCountryPhonePopover` hook.
 * @description This file contains unit tests for the `useCountryPhonePopover` hook.
 * It mocks dependencies (`react-dom`, icons, flags) and uses a custom
 * `setupHook` helper to test the hook's state, interactions, filtering,
 * and element rendering simultaneously.
 */

// --- Mocks ---

/**
 * Mocks `react-dom.createPortal` to return the element directly.
 * This renders the "portal" inline within the test DOM,
 * making it queryable with `screen`.
 */
jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  createPortal: (element: React.ReactNode) => element,
}));

/**
 * Mocks the `@iconscout/react-unicons` library.
 * Replaces the `UilSearch` icon with a simple `<span>` for testing.
 */
jest.mock("@iconscout/react-unicons", () => ({
  UilSearch: () => <span data-testid="icon-search" />,
}));

/**
 * Mocks the `country-flag-icons/react/3x2` module.
 * The hook imports `* as Flags`, so we mock the module structure
 * and provide specific named exports for the flags used in our test data.
 */
jest.mock("country-flag-icons/react/3x2", () => ({
  __esModule: true,
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

/**
 * A static array of mock `Country` data used to bypass
 * `libphonenumber-js` and `Intl.DisplayNames` calls within the hook.
 */
const mockCountries: Country[] = [
  { name: "Indonesia", code: "+62", iso: "ID" },
  { name: "United States", code: "+1", iso: "US" },
  { name: "Japan", code: "+81", iso: "JP" },
];

/**
 * A custom setup function to initialize the hook and its rendered element.
 *
 * This helper does two things:
 * 1. Renders the `useCountryPhonePopover` hook using `renderHook`.
 * 2. Renders the `popoverElement` returned by the hook using `render`.
 *
 * It wraps the hook's `rerender` function to *also* rerender the
 * `popoverElement`, keeping the hook's state and its UI in sync.
 *
 * @param {Partial<UseCountryPhonePopoverProps>} props - Optional props to override the defaults.
 * @returns {object} An object containing the hook's `result`, `rerender` function,
 * the `mockOnSelectCountry` function, the `anchorRef`, and the element's `rerenderElement` function.
 */
const setupHook = (props: Partial<UseCountryPhonePopoverProps> = {}) => {
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

  const mockOnSelectCountry = jest.fn();

  const hookResult = renderHook(
    (p: UseCountryPhonePopoverProps) => useCountryPhonePopover(p),
    {
      initialProps: {
        anchorRef: anchorRef as React.RefObject<HTMLElement>,
        onSelectCountry: mockOnSelectCountry,
        countries: mockCountries,
        ...props,
      },
    }
  );

  const { rerender: rerenderElement } = render(
    hookResult.result.current.popoverElement
  );

  const originalRerender = hookResult.rerender;
  hookResult.rerender = (newProps) => {
    originalRerender(newProps);
    rerenderElement(hookResult.result.current.popoverElement);
  };

  return {
    ...hookResult,
    mockOnSelectCountry,
    anchorRef,
    rerenderElement,
  };
};

/**
 * @describe Main test suite for the `useCountryPhonePopover` hook.
 */
describe("useCountryPhonePopover", () => {
  /**
   * @describe Tests for the hook's initial state and basic open/close logic.
   */
  describe("Initialization and Popover State", () => {
    /**
     * @it Verifies that the hook initializes with `isOpen` false,
     * no `popoverElement`, and an empty `searchTerm`.
     */
    it("should initialize closed with no search term", () => {
      const { result } = setupHook();
      expect(result.current.isOpen).toBe(false);
      expect(result.current.popoverElement).toBe(null);
      expect(result.current.searchTerm).toBe("");
    });

    /**
     * @it Verifies that the popover element renders immediately
     * if `initialIsOpen` prop is true.
     */
    it("should render open if initialIsOpen is true", () => {
      setupHook({ initialIsOpen: true });
      expect(
        screen.getByRole("dialog", { name: "Select Country Code" })
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Search country or code")
      ).toBeInTheDocument();
    });

    /**
     * @it Verifies that calling `setIsOpen(true)` updates the `isOpen` state
     * and renders the `popoverElement`.
     */
    it("should open the popover when setIsOpen(true) is called", () => {
      const { result, rerender, anchorRef, mockOnSelectCountry } = setupHook();
      expect(result.current.popoverElement).toBe(null);

      act(() => {
        result.current.setIsOpen(true);
      });
      rerender({
        anchorRef: anchorRef as React.RefObject<HTMLElement>,
        onSelectCountry: mockOnSelectCountry,
        countries: mockCountries,
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.popoverElement).not.toBe(null);
      expect(
        screen.getByRole("dialog", {
          name: "Select Country Code",
          hidden: false,
        })
      ).toBeInTheDocument();
    });

    /**
     * @it Verifies that the popover closes and resets the search term
     * when a mousedown event occurs outside the component.
     */
    it("should close the popover when clicking outside", () => {
      const { result } = setupHook({ initialIsOpen: true });
      expect(
        screen.getByRole("dialog", { name: "Select Country Code" })
      ).toBeInTheDocument();

      act(() => {
        fireEvent.mouseDown(document.body);
      });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.searchTerm).toBe("");
    });

    /**
     * @it Verifies that the popover remains open when clicking inside it.
     */
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

    /**
     * @it Verifies that pressing the Escape key closes the popover
     * and resets the search term.
     */
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

  /**
   * @describe Tests for the filtering logic based on the search term.
   */
  describe("Filtering and Searching", () => {
    let hookResult: RenderHookResult<
      ReturnType<typeof useCountryPhonePopover>,
      UseCountryPhonePopoverProps
    >["result"];
    let rerenderElement: (ui: React.ReactElement | null) => void;
    let mockOnSelectCountry: jest.Mock;

    /**
     * @beforeEach Sets up the hook and opens the popover before each
     * test in this suite.
     */
    beforeEach(() => {
      const {
        result,
        rerender,
        anchorRef,
        mockOnSelectCountry: selectMock,
        rerenderElement: elRerender,
      } = setupHook();

      hookResult = result;
      rerenderElement = elRerender;
      mockOnSelectCountry = selectMock;

      act(() => {
        result.current.setIsOpen(true);
      });
      rerender({
        anchorRef: anchorRef as React.RefObject<HTMLElement>,
        onSelectCountry: mockOnSelectCountry,
        countries: mockCountries,
      });
    });

    /**
     * @it Verifies that the list is correctly filtered by country name.
     */
    it('should filter by country name (e.g., "Japan")', () => {
      const searchInput = screen.getByPlaceholderText("Search country or code");
      act(() => {
        fireEvent.change(searchInput, { target: { value: "Japan" } });
      });

      rerenderElement(hookResult.current.popoverElement);

      expect(screen.getByRole("button", { name: /Japan/ })).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Indonesia/ })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /United States/ })
      ).not.toBeInTheDocument();
    });

    /**
     * @it Verifies that the list is correctly filtered by country code with a '+'.
     */
    it('should filter by country code with "+" (e.g., "+62")', () => {
      const searchInput = screen.getByPlaceholderText("Search country or code");
      act(() => {
        fireEvent.change(searchInput, { target: { value: "+62" } });
      });

      rerenderElement(hookResult.current.popoverElement);

      expect(
        screen.getByRole("button", { name: /Indonesia/ })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Japan/ })
      ).not.toBeInTheDocument();
    });

    /**
     * @it Verifies that the list is correctly filtered by country code without a '+'.
     */
    it('should filter by country code without "+" (e.g., "81")', () => {
      const searchInput = screen.getByPlaceholderText("Search country or code");
      act(() => {
        fireEvent.change(searchInput, { target: { value: "81" } });
      });

      rerenderElement(hookResult.current.popoverElement);

      expect(screen.getByRole("button", { name: /Japan/ })).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Indonesia/ })
      ).not.toBeInTheDocument();
    });

    /**
     * @it Verifies that the list is correctly filtered by country ISO code.
     */
    it('should filter by ISO code (e.g., "US")', () => {
      const searchInput = screen.getByPlaceholderText("Search country or code");
      act(() => {
        fireEvent.change(searchInput, { target: { value: "US" } });
      });

      rerenderElement(hookResult.current.popoverElement);

      expect(
        screen.getByRole("button", { name: /United States/ })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Indonesia/ })
      ).not.toBeInTheDocument();
    });

    /**
     * @it Verifies that the search filtering is case-insensitive.
     */
    it("should be case-insensitive", () => {
      const searchInput = screen.getByPlaceholderText("Search country or code");
      act(() => {
        fireEvent.change(searchInput, { target: { value: "indonesia" } });
      });

      rerenderElement(hookResult.current.popoverElement);

      expect(
        screen.getByRole("button", { name: /Indonesia/ })
      ).toBeInTheDocument();
    });

    /**
     * @it Verifies that a "not found" message is displayed when no results match the search.
     */
    it('should show a "not found" message for no results', () => {
      const searchInput = screen.getByPlaceholderText("Search country or code");
      act(() => {
        fireEvent.change(searchInput, { target: { value: "zzzz" } });
      });

      rerenderElement(hookResult.current.popoverElement);

      expect(
        screen.queryByRole("button", { name: /Indonesia/ })
      ).not.toBeInTheDocument();
      expect(screen.getByText("“zzzz”")).toBeInTheDocument();
      expect(screen.getByText("tidak ditemukan")).toBeInTheDocument();
    });
  });

  /**
   * @describe Tests for country selection logic and prop handling (`selectedCountryIso`, `disabledCountryIsos`).
   */
  describe("Selection and Props", () => {
    /**
     * @it Verifies that clicking a country button triggers `onSelectCountry`,
     * closes the popover, and resets the search term.
     */
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

      expect(mockOnSelectCountry).toHaveBeenCalledTimes(1);
      expect(mockOnSelectCountry).toHaveBeenCalledWith(mockCountries[0]);
      expect(result.current.isOpen).toBe(false);
      expect(result.current.searchTerm).toBe("");
    });

    /**
     * @it Verifies that the correct 'selected' classes and ARIA attributes
     * are applied based on the `selectedCountryIso` prop.
     */
    it("should apply correct active and default classes based on selectedCountryIso", () => {
      setupHook({ initialIsOpen: true, selectedCountryIso: "US" });

      const usButton = screen.getByRole("button", { name: /United States/ });
      const idButton = screen.getByRole("button", { name: /Indonesia/ });
      const usName = screen.getByText("United States");
      const usCode = screen.getByText("+1");
      const idName = screen.getByText("Indonesia");
      const idCode = screen.getByText("+62");

      expect(usButton).toHaveClass("bg-primary-surface");
      expect(usButton).toHaveAttribute("aria-pressed", "true");
      expect(usName).toHaveClass("text-primary-main");
      expect(usCode).toHaveClass("text-primary-main");

      expect(idButton).not.toHaveClass("bg-primary-surface");
      expect(idButton).toHaveAttribute("aria-pressed", "false");
      expect(idButton).toHaveClass("bg-neutral-10 hover:bg-neutral-20");
      expect(idName).toHaveClass("text-neutral-100");
      expect(idCode).toHaveClass("text-neutral-100");
    });

    /**
     * @it Verifies that disabled classes and attributes are applied
     * based on the `disabledCountryIsos` prop.
     */
    it("should apply correct disabled classes based on disabledCountryIsos", () => {
      setupHook({ initialIsOpen: true, disabledCountryIsos: ["JP"] });

      const japanButton = screen.getByRole("button", { name: /Japan/ });
      const japanName = screen.getByText("Japan");
      const japanCode = screen.getByText("+81");
      const usButton = screen.getByRole("button", { name: /United States/ });

      expect(japanButton).toBeDisabled();
      expect(japanButton).toHaveAttribute("aria-disabled", "true");
      expect(japanButton).toHaveClass("bg-neutral-10 cursor-not-allowed");
      expect(japanName).toHaveClass("text-neutral-60");
      expect(japanCode).toHaveClass("text-neutral-60");

      expect(usButton).not.toBeDisabled();
      expect(usButton).toHaveClass("bg-neutral-10 hover:bg-neutral-20");
    });

    /**
     * @it Verifies that clicking a disabled country does not trigger
     * `onSelectCountry` and does not close the popover.
     */
    it("should not select a disabled country or close popover", () => {
      const { result, mockOnSelectCountry } = setupHook({
        initialIsOpen: true,
        disabledCountryIsos: ["JP"],
      });

      const japanButton = screen.getByRole("button", { name: /Japan/ });

      act(() => {
        fireEvent.click(japanButton);
      });

      expect(mockOnSelectCountry).not.toHaveBeenCalled();
      expect(result.current.isOpen).toBe(true);
    });

    /**
     * @it Verifies that the mock flag components are rendered correctly
     * with the appropriate `title` prop.
     */
    it("should render flags correctly", () => {
      setupHook({ initialIsOpen: true });

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