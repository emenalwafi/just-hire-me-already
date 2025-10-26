import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import PhoneNumberInput, { PhoneNumberInputProps } from "./PhoneNumberInput";
import { Country } from "@/hooks/country-phone-popover/useCountryPhonePopover";

/**
 * @file Test suite for the PhoneNumberInput component.
 * @description This file contains unit tests for the PhoneNumberInput,
 * verifying its rendering, prop-driven state logic (useEffect),
 * visual states (disabled, error, focus), and user interactions.
 * It heavily mocks the `useCountryPhonePopover` hook, `libphonenumber-js`,
 * and icon/flag libraries to isolate the component's logic.
 */

// --- Mocks ---

/**
 * A variable to capture the `onSelectCountry` callback passed to the mock hook.
 */
let mockOnSelectCountry: (country: Country) => void;
/**
 * A mock Jest function to capture calls to `setIsOpen` from the mock hook.
 */
const mockSetCountryPopoverOpen = jest.fn();

/**
 * A mock Jest function to capture calls to the `AsYouType` constructor.
 */
const mockAsYouType = jest.fn();
/**
 * A mock Jest function to capture calls to `parsePhoneNumberFromString`
 * and allow per-test implementations.
 */
const mockParsePhoneNumberFromString = jest.fn();

/**
 * Mocks the `libphonenumber-js/max` library.
 * `AsYouType` is mocked to record the ISO it was called with and
 * to simply echo back the digits it receives for simple testing.
 * `parsePhoneNumberFromString` is mocked with a Jest function.
 */
jest.mock("libphonenumber-js/max", () => ({
  ...jest.requireActual("libphonenumber-js/max"),
  AsYouType: jest.fn().mockImplementation(function (iso) {
    mockAsYouType(iso);
    const digits = { current: "" };
    return {
      input: (val: string) => {
        digits.current = val;
      },
      getNumber: () => ({
        nationalNumber: digits.current,
      }),
    };
  }),
  parsePhoneNumberFromString: (value: string) => {
    return mockParsePhoneNumberFromString(value);
  },
}));

/**
 * Mocks the `@iconscout/react-unicons` library.
 */
jest.mock("@iconscout/react-unicons", () => ({
  UilAngleDown: (props: { className: string }) => (
    <span data-testid="icon-angle-down" className={props.className} />
  ),
}));

/**
 * Mocks the `country-flag-icons/react/3x2` library
 * to provide simple `<span>` elements for specific country codes.
 */
jest.mock("country-flag-icons/react/3x2", () => ({
  __esModule: true,
  ID: (props: { title: string }) => (
    <span data-testid="flag-ID" title={props.title} />
  ),
  US: (props: { title: string }) => (
    <span data-testid="flag-US" title={props.title} />
  ),
}));

// --- Test Setup ---

/** Mock `Country` data objects for testing. */
const mockIndonesia: Country = { name: "Indonesia", code: "+62", iso: "ID" };
/** Mock `Country` data objects for testing. */
const mockUS: Country = { name: "United States", code: "+1", iso: "US" };

/**
 * Mocks the `useCountryPhonePopover` hook and its related `getAllCountryData` utility.
 * - `useCountryPhonePopover`: Captures the `onSelectCountry` callback and provides
 * a mock `popoverElement`.
 * - `getAllCountryData`: Mocked to return a static array `[mockIndonesia, mockUS]`.
 */
jest.mock("../../../hooks/country-phone-popover/useCountryPhonePopover", () => {
  const originalModule = jest.requireActual(
    "../../../hooks/country-phone-popover/useCountryPhonePopover"
  );
  return {
    ...originalModule,
    useCountryPhonePopover: jest.fn(
      ({
        onSelectCountry,
      }: {
        onSelectCountry: (country: Country) => void;
      }) => {
        mockOnSelectCountry = onSelectCountry;
        return {
          isOpen: false,
          setIsOpen: mockSetCountryPopoverOpen,
          popoverElement: <div data-testid="mock-popover" />,
        };
      }
    ),
    getAllCountryData: () => [mockIndonesia, mockUS],
  };
});

/**
 * Helper function to get the primary elements of the component for testing.
 * @returns {object} An object containing the `wrapper`, `input`, and `countryButton`.
 */
const getElements = () => {
  const wrapper = screen.getByRole("button", {
    name: /Select country code/,
  }).parentElement as HTMLElement;
  const input = screen.getByRole("textbox", {
    name: /Phone number/,
  }) as HTMLInputElement;
  const countryButton = screen.getByRole("button", {
    name: /Select country code/,
  });
  return { wrapper, input, countryButton };
};

/**
 * @describe Main test suite for the PhoneNumberInput component.
 */
describe("PhoneNumberInput", () => {
  let mockOnChange: jest.Mock;

  /**
   * @beforeEach Resets all mock functions and clears mock history
   * before each test to ensure isolation.
   */
  beforeEach(() => {
    mockOnChange = jest.fn();
    mockSetCountryPopoverOpen.mockClear();
    mockAsYouType.mockClear();
    mockParsePhoneNumberFromString.mockClear();
    mockParsePhoneNumberFromString.mockReturnValue(undefined);
  });

  /**
   * @describe Tests for the component's initial rendering based on props.
   */
  describe("Rendering and Initial State", () => {
    /**
     * @it Verifies that the label and required asterisk (`*`) are rendered correctly.
     */
    it("should render with label and required asterisk", () => {
      render(
        <PhoneNumberInput
          label="Phone"
          required
          value={null}
          onChange={mockOnChange}
          selectedCountryIso="ID"
        />
      );
      expect(screen.getByText("Phone")).toBeInTheDocument();
      expect(screen.getByText("*")).toBeInTheDocument();
      expect(screen.getByText("Phone").nextSibling?.textContent).toBe("*");
    });

    /**
     * @it Verifies that a string error message is rendered when provided.
     */
    it("should render an error message string", () => {
      render(
        <PhoneNumberInput
          error="This field is required"
          value={null}
          onChange={mockOnChange}
          selectedCountryIso="ID"
        />
      );
      expect(screen.getByText("This field is required")).toBeInTheDocument();
    });

    /**
     * @it Verifies that the input placeholder is displayed correctly.
     */
    it("should show placeholder", () => {
      render(
        <PhoneNumberInput
          placeholder="Test placeholder"
          value={null}
          onChange={mockOnChange}
          selectedCountryIso="ID"
        />
      );
      expect(
        screen.getByPlaceholderText("Test placeholder")
      ).toBeInTheDocument();
    });
  });

  /**
   * @describe Tests the internal `useEffect` logic that derives the
   * displayed country and national number from props (`value`, `selectedCountryIso`).
   */
  describe("Prop-driven State Logic (useEffect)", () => {
    /**
     * @it Verifies that the `selectedCountryIso` prop takes precedence over
     * `value` or `defaultCountryIso` for determining the country.
     */
    it("should prioritize selectedCountryIso prop and render correct flag", () => {
      render(
        <PhoneNumberInput
          value={null}
          onChange={mockOnChange}
          selectedCountryIso="US"
          defaultCountryIso="ID"
        />
      );
      expect(screen.getByText("+1")).toBeInTheDocument();
      expect(screen.getByTestId("flag-US")).toBeInTheDocument();
      expect(screen.queryByTestId("flag-ID")).not.toBeInTheDocument();
    });

    /**
     * @it Verifies that the component correctly parses the `value` prop
     * to determine the country if `selectedCountryIso` is not provided.
     */
    it("should derive country from value if prop is missing and render correct flag", () => {
      mockParsePhoneNumberFromString.mockImplementation((val: string) =>
        val === "+18005551234"
          ? { country: "US", nationalNumber: "8005551234" }
          : undefined
      );

      render(
        <PhoneNumberInput
          value="+18005551234"
          onChange={mockOnChange}
          selectedCountryIso={null}
          defaultCountryIso="ID"
        />
      );

      expect(screen.getByText("+1")).toBeInTheDocument();
      expect(screen.getByTestId("flag-US")).toBeInTheDocument();
      expect(screen.queryByTestId("flag-ID")).not.toBeInTheDocument();
      const { input } = getElements();
      expect(input.value).toBe("8005551234");
    });

    /**
     * @it Verifies that `defaultCountryIso` is used when both `value`
     * and `selectedCountryIso` are null or invalid.
     */
    it("should use defaultCountryIso as a fallback and render correct flag", () => {
      render(
        <PhoneNumberInput
          value={null}
          onChange={mockOnChange}
          selectedCountryIso={null}
          defaultCountryIso="ID"
        />
      );
      expect(screen.getByText("+62")).toBeInTheDocument();
      expect(screen.getByTestId("flag-ID")).toBeInTheDocument();
      expect(screen.queryByTestId("flag-US")).not.toBeInTheDocument();
    });

    /**
     * @it Verifies that the national number input is cleared if the `value` prop
     * (e.g., a US number) conflicts with the `selectedCountryIso` prop (e.g., ID).
     */
    it("should reset national number if value does not match derived country", () => {
      mockParsePhoneNumberFromString.mockImplementation((val: string) =>
        val === "+18005551234"
          ? { country: "US", nationalNumber: "8005551234" }
          : undefined
      );

      render(
        <PhoneNumberInput
          value="+18005551234"
          onChange={mockOnChange}
          selectedCountryIso="ID"
        />
      );

      expect(screen.getByText("+62")).toBeInTheDocument();
      expect(screen.getByTestId("flag-ID")).toBeInTheDocument();
      const { input } = getElements();
      expect(input.value).toBe("");
    });
  });

  /**
   * @describe Tests for CSS classes applied in different component states
   * (disabled, error, focus).
   */
  describe("Visual States (Classes)", () => {
    /**
     * @it Verifies that disabled-related classes and attributes are applied
     * when the `disabled` prop is true.
     */
    it("should apply disabled styles and classes", () => {
      render(
        <PhoneNumberInput
          disabled
          value={null}
          onChange={mockOnChange}
          selectedCountryIso="ID"
        />
      );
      const { wrapper, input, countryButton } = getElements();
      const flagContainer = screen.getByTestId("flag-ID").parentElement;

      expect(wrapper).toHaveClass("bg-neutral-30 outline-neutral-40");
      expect(wrapper).toHaveClass("cursor-not-allowed");
      expect(input).toBeDisabled();
      expect(countryButton).toBeDisabled();
      expect(screen.getByText("+62")).toHaveClass("text-neutral-60");
      expect(screen.getByTestId("icon-angle-down")).toHaveClass(
        "text-neutral-60"
      );
      expect(flagContainer).toHaveClass("border-neutral-60 opacity-60");
    });

    /**
     * @it Verifies that error-related classes are applied when the `error` prop is true.
     */
    it("should apply error styles and classes", () => {
      render(
        <PhoneNumberInput
          error
          value={null}
          onChange={mockOnChange}
          selectedCountryIso="ID"
        />
      );
      const { wrapper } = getElements();
      expect(wrapper).toHaveClass("bg-white outline-danger-main");
      expect(wrapper).not.toHaveClass("bg-neutral-10");
      expect(wrapper).not.toHaveClass("outline-primary-main");
      expect(wrapper).not.toHaveClass("bg-neutral-30");
    });

    /**
     * @it Verifies that focus-related classes are applied on input focus
     * and removed on blur.
     */
    it("should apply focus/blur styles and classes", () => {
      render(
        <PhoneNumberInput
          value={null}
          onChange={mockOnChange}
          selectedCountryIso="ID"
        />
      );
      const { wrapper, input } = getElements();

      expect(wrapper).toHaveClass(
        "bg-neutral-10 outline-neutral-40 hover:outline-neutral-70"
      );
      expect(wrapper).not.toHaveClass("outline-primary-main");

      act(() => {
        fireEvent.focus(input);
      });
      expect(wrapper).toHaveClass("bg-white outline-primary-main");
      expect(wrapper).not.toHaveClass("bg-neutral-10");

      act(() => {
        fireEvent.blur(input);
      });
      expect(wrapper).toHaveClass(
        "bg-neutral-10 outline-neutral-40 hover:outline-neutral-70"
      );
      expect(wrapper).not.toHaveClass("outline-primary-main");
    });
  });

  /**
   * @describe Tests how the component responds to user events like
   * clicks and typing.
   */
  describe("User Interactions", () => {
    /**
     * @it Verifies that clicking the country selector button calls `setIsOpen(true)`.
     */
    it("should open popover when country button is clicked", () => {
      render(
        <PhoneNumberInput
          value={null}
          onChange={mockOnChange}
          selectedCountryIso="ID"
        />
      );
      const { countryButton } = getElements();
      act(() => {
        fireEvent.click(countryButton);
      });
      expect(mockSetCountryPopoverOpen).toHaveBeenCalledWith(true);
    });

    /**
     * @it Verifies that typing in the input triggers the `AsYouType` formatter
     * and calls `onChange` with the full international number.
     */
    it("should format input as user types", () => {
      const { rerender } = render(
        <PhoneNumberInput
          value={null}
          onChange={mockOnChange}
          selectedCountryIso="ID"
        />
      );
      const { input } = getElements();

      mockOnChange.mockImplementation((newValue) => {
        rerender(
          <PhoneNumberInput
            value={newValue}
            onChange={mockOnChange}
            selectedCountryIso="ID"
          />
        );
      });

      act(() => {
        fireEvent.change(input, { target: { value: "8123456" } });
      });

      expect(mockAsYouType).toHaveBeenCalledWith("ID");
      expect(mockOnChange).toHaveBeenCalledWith("+628123456");
      expect(input.value).toBe("8123456");
    });

    /**
     * @it Verifies the full flow of selecting a new country from the popover,
     * checking that `onCountryChange` and `onChange` are called correctly
     * and the UI (flag, code, number) updates.
     */
    it("should update country, flag, and number when selected from popover", () => {
      const mockOnCountryChange = jest.fn();

      let props: PhoneNumberInputProps = {
        value: "+628123",
        onChange: mockOnChange,
        onCountryChange: mockOnCountryChange,
        selectedCountryIso: "ID",
      };

      const { rerender } = render(<PhoneNumberInput {...props} />);

      const { input } = getElements();
      expect(input.value).toBe("8123");
      expect(screen.getByTestId("flag-ID")).toBeInTheDocument();

      mockOnChange.mockImplementation((newValue) => {
        props = { ...props, value: newValue };
        rerender(<PhoneNumberInput {...props} />);
      });
      mockOnCountryChange.mockImplementation((newCountry: Country) => {
        props = { ...props, selectedCountryIso: newCountry?.iso || null };
        rerender(<PhoneNumberInput {...props} />);
      });
      act(() => {
        mockOnSelectCountry(mockUS);
      });

      expect(screen.getByText("+1")).toBeInTheDocument();
      expect(screen.getByTestId("flag-US")).toBeInTheDocument();
      expect(screen.queryByTestId("flag-ID")).not.toBeInTheDocument();
      expect(mockOnCountryChange).toHaveBeenCalledWith(mockUS);
      expect(mockOnChange).toHaveBeenCalledWith("+18123");
      expect(input.value).toBe("8123");
    });
  });
});
