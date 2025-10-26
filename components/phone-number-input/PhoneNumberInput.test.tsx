import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import PhoneNumberInput, { PhoneNumberInputProps } from "./PhoneNumberInput";
import { Country } from "@/hooks/country-phone-popover/useCountryPhonePopover";

// --- Mocks ---

// 1. Mock the custom hook `useCountryPhonePopover`
// We need to capture the `onSelectCountry` callback
let mockOnSelectCountry: (country: Country) => void;
const mockSetCountryPopoverOpen = jest.fn();

jest.mock("../../hooks/country-phone-popover/useCountryPhonePopover", () => ({
  ...jest.requireActual(
    "../../hooks/country-phone-popover/useCountryPhonePopover"
  ),
  useCountryPhonePopover: jest.fn(
    ({ onSelectCountry }: { onSelectCountry: (country: Country) => void }) => {
      // Capture the callback to simulate selection
      mockOnSelectCountry = onSelectCountry;
      return {
        isOpen: false,
        setIsOpen: mockSetCountryPopoverOpen,
        // Render a simple div so we can check if it's "rendered"
        popoverElement: <div data-testid="mock-popover" />,
      };
    }
  ),
}));

// 2. Mock `libphonenumber-js/max`
const mockAsYouType = jest.fn();
const mockParsePhoneNumberFromString = jest.fn();

jest.mock("libphonenumber-js/max", () => ({
  ...jest.requireActual("libphonenumber-js/max"),
  AsYouType: jest.fn().mockImplementation(function (iso) {
    mockAsYouType(iso); // Record which country it was constructed with
    const digits = { current: "" };
    return {
      input: (val: string) => {
        digits.current = val;
      },
      getNumber: () => ({
        nationalNumber: digits.current, // Just return the digits for simple testing
      }),
    };
  }),
  parsePhoneNumberFromString: (value: string) => {
    // We'll set up specific mocks in the tests
    return mockParsePhoneNumberFromString(value);
  },
}));

// 3. Mock the icon library
jest.mock("@iconscout/react-unicons", () => ({
  UilAngleDown: (props: { className: string }) => (
    <span data-testid="icon-angle-down" className={props.className} />
  ),
}));

// 4. Mock the entire flag icon library
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

// Mock country data that `getAllCountryData` (used inside the component) will return
const mockIndonesia: Country = { name: "Indonesia", code: "+62", iso: "ID" };
const mockUS: Country = { name: "United States", code: "+1", iso: "US" };

// We need to mock the `getAllCountryData` *used by the component*
jest.mock("../../hooks/country-phone-popover/useCountryPhonePopover", () => {
  const originalModule = jest.requireActual(
    "../../hooks/country-phone-popover/useCountryPhonePopover"
  );
  return {
    ...originalModule,
    // Mock the hook
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
    // Mock the data utility
    getAllCountryData: () => [mockIndonesia, mockUS],
  };
});

// Helper: Get the component's main elements
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

describe("PhoneNumberInput", () => {
  let mockOnChange: jest.Mock;

  beforeEach(() => {
    // Reset mocks before each test
    mockOnChange = jest.fn();
    mockSetCountryPopoverOpen.mockClear();
    mockAsYouType.mockClear();
    mockParsePhoneNumberFromString.mockClear();
    // Set a default mock for parsing
    mockParsePhoneNumberFromString.mockReturnValue(undefined);
  });

  // --- Rendering and Initial State ---
  describe("Rendering and Initial State", () => {
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
      // The label is in a span, and the asterisk in another.
      expect(screen.getByText("Phone")).toBeInTheDocument();
      expect(screen.getByText("*")).toBeInTheDocument();
      expect(screen.getByText("Phone").nextSibling?.textContent).toBe("*");
    });

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

  // --- Prop-driven State Logic (useEffect) ---
  describe("Prop-driven State Logic (useEffect)", () => {
    it("should prioritize selectedCountryIso prop and render correct flag", () => {
      render(
        <PhoneNumberInput
          value={null}
          onChange={mockOnChange}
          selectedCountryIso="US" // Prioritize US
          defaultCountryIso="ID" // Fallback ID
        />
      );
      expect(screen.getByText("+1")).toBeInTheDocument();
      // Check that the correct flag ISO is rendered
      expect(screen.getByTestId("flag-US")).toBeInTheDocument();
      expect(screen.queryByTestId("flag-ID")).not.toBeInTheDocument();
    });

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

      expect(screen.getByText("+1")).toBeInTheDocument(); // Derived from value
      // Check that the correct flag ISO is rendered
      expect(screen.getByTestId("flag-US")).toBeInTheDocument();
      expect(screen.queryByTestId("flag-ID")).not.toBeInTheDocument();
      const { input } = getElements();
      expect(input.value).toBe("8005551234"); // National number is extracted
    });

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
      // Check that the correct flag ISO is rendered
      expect(screen.getByTestId("flag-ID")).toBeInTheDocument();
      expect(screen.queryByTestId("flag-US")).not.toBeInTheDocument();
    });

    it("should reset national number if value does not match derived country", () => {
      // Value is US, but prop forces ID. They conflict.
      mockParsePhoneNumberFromString.mockImplementation((val: string) =>
        val === "+18005551234"
          ? { country: "US", nationalNumber: "8005551234" }
          : undefined
      );

      render(
        <PhoneNumberInput
          value="+18005551234"
          onChange={mockOnChange}
          selectedCountryIso="ID" // Force ID
        />
      );

      expect(screen.getByText("+62")).toBeInTheDocument(); // Prop wins
      // Check that the correct flag ISO is rendered
      expect(screen.getByTestId("flag-ID")).toBeInTheDocument();
      const { input } = getElements();
      // Since value "+1..." doesn't match country "+62", national num is reset
      expect(input.value).toBe("");
    });
  });

  // --- Visual States (Classes) ---
  describe("Visual States (Classes)", () => {
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

      // Check wrapper classes
      expect(wrapper).toHaveClass("bg-neutral-30 outline-neutral-40");
      expect(wrapper).toHaveClass("cursor-not-allowed");
      // Check elements
      expect(input).toBeDisabled();
      expect(countryButton).toBeDisabled();
      // Check text and icon classes
      expect(screen.getByText("+62")).toHaveClass("text-neutral-60");
      expect(screen.getByTestId("icon-angle-down")).toHaveClass(
        "text-neutral-60"
      );
      // Check flag container classes
      expect(flagContainer).toHaveClass("border-neutral-60 opacity-60");
    });

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
      // Check wrapper classes
      expect(wrapper).toHaveClass("bg-white outline-danger-main");
      // Check that it does NOT have default/focus/disabled classes
      expect(wrapper).not.toHaveClass("bg-neutral-10");
      expect(wrapper).not.toHaveClass("outline-primary-main");
      expect(wrapper).not.toHaveClass("bg-neutral-30");
    });

    it("should apply focus/blur styles and classes", () => {
      render(
        <PhoneNumberInput
          value={null}
          onChange={mockOnChange}
          selectedCountryIso="ID"
        />
      );
      const { wrapper, input } = getElements();

      // Default (blurred) state
      expect(wrapper).toHaveClass(
        "bg-neutral-10 outline-neutral-40 hover:outline-neutral-70"
      );
      expect(wrapper).not.toHaveClass("outline-primary-main");

      // Focus
      act(() => {
        fireEvent.focus(input);
      });
      expect(wrapper).toHaveClass("bg-white outline-primary-main");
      expect(wrapper).not.toHaveClass("bg-neutral-10");

      // Blur
      act(() => {
        fireEvent.blur(input);
      });
      expect(wrapper).toHaveClass(
        "bg-neutral-10 outline-neutral-40 hover:outline-neutral-70"
      );
      expect(wrapper).not.toHaveClass("outline-primary-main");
    });
  });

  // --- User Interactions ---
  describe("User Interactions", () => {
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

      // 1. `AsYouType` was constructed with the correct ISO (on render and rerender)
      expect(mockAsYouType).toHaveBeenCalledWith("ID");
      // 2. `onChange` is called with the full international number
      expect(mockOnChange).toHaveBeenCalledWith("+628123456");
      // 3. The input value is set to the formatted number *after* rerender
      expect(input.value).toBe("8123456"); // Our mock just returns the digits
    });

    it("should update country, flag, and number when selected from popover", () => {
      const mockOnCountryChange = jest.fn();

      let props: PhoneNumberInputProps = {
        value: "+628123", // Start with ID
        onChange: mockOnChange,
        onCountryChange: mockOnCountryChange,
        selectedCountryIso: "ID",
      };

      const { rerender } = render(<PhoneNumberInput {...props} />);

      const { input } = getElements();
      expect(input.value).toBe("8123"); // Initial national number
      expect(screen.getByTestId("flag-ID")).toBeInTheDocument(); // Initial flag

      mockOnChange.mockImplementation((newValue) => {
        props = { ...props, value: newValue };
        rerender(<PhoneNumberInput {...props} />);
      });
      mockOnCountryChange.mockImplementation((newCountry: Country) => {
        props = { ...props, selectedCountryIso: newCountry?.iso || null };
        rerender(<PhoneNumberInput {...props} />);
      });
      // Simulate user selecting 'US' from the popover
      act(() => {
        // This function was captured by our hook mock
        mockOnSelectCountry(mockUS);
      });

      // 1. Country display updates
      expect(screen.getByText("+1")).toBeInTheDocument();
      // Check that the flag ISO has changed
      expect(screen.getByTestId("flag-US")).toBeInTheDocument();
      expect(screen.queryByTestId("flag-ID")).not.toBeInTheDocument();

      // 2. `onCountryChange` prop is called
      expect(mockOnCountryChange).toHaveBeenCalledWith(mockUS);

      // 3. `onChange` prop is called with the *new* country code + *old* digits
      expect(mockOnChange).toHaveBeenCalledWith("+18123");

      // 4. The input value reflects the national number of the new value
      expect(input.value).toBe("8123");
    });
  });
});
