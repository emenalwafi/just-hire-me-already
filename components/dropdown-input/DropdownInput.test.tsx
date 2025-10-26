import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import DropdownInput from "./DropdownInput"; // Adjust import path
import { DropdownOption } from "@/hooks/dropdown-popover/useDropdownPopover"; // Adjust import path

// --- Mocks ---

// 1. Mock the custom hook `useDropdownPopover`
// We need to capture the callbacks to simulate hook interactions
let mockOnSelectOption: (option: DropdownOption) => void;
let mockOnClose: () => void;

jest.mock("../../hooks/dropdown-popover/useDropdownPopover", () => ({
  useDropdownPopover: jest.fn(
    ({
      onSelectOption,
      onClose,
    }: {
      onSelectOption: (option: DropdownOption) => void;
      onClose: () => void;
    }) => {
      // Capture the callbacks
      mockOnSelectOption = onSelectOption;
      mockOnClose = onClose;
      return {
        // Render a mock popover with the ID the component checks for
        popoverElement: (
          <div data-testid="mock-popover" id="dropdown-listbox-id" />
        ),
      };
    }
  ),
  // Also mock the type export, though it's often not needed for jest
  DropdownOption: jest.fn(),
}));

// 2. Mock the icon library
jest.mock("@iconscout/react-unicons", () => ({
  UilAngleDown: (props: { className: string }) => (
    <span data-testid="icon-angle-down" className={props.className} />
  ),
}));

// --- Test Setup ---
jest.useFakeTimers();

const mockOptions: DropdownOption[] = [
  { id: 1, label: "Apple" },
  { id: 2, label: "Banana" },
  { id: 3, label: "Mango" },
];

// Helper: Get the component's main elements
const getElements = () => {
  const input = screen.getByRole("combobox") as HTMLInputElement;
  const wrapper = input.parentElement as HTMLElement;
  const caretButton = screen.getByRole("button", {
    name: /Open dropdown|Close dropdown/,
  });
  return { input, wrapper, caretButton };
};

describe("DropdownInput", () => {
  let mockOnChange: jest.Mock;

  beforeEach(() => {
    mockOnChange = jest.fn();
    // Reset the hook mock's implementation for each test
    (
      jest.requireMock("../../hooks/dropdown-popover/useDropdownPopover")
        .useDropdownPopover as jest.Mock
    ).mockImplementation(
      ({
        onSelectOption,
        onClose,
      }: {
        onSelectOption: (option: DropdownOption) => void;
        onClose: () => void;
      }) => {
        mockOnSelectOption = onSelectOption;
        mockOnClose = onClose;
        return {
          popoverElement: (
            <div data-testid="mock-popover" id="dropdown-listbox-id" />
          ),
        };
      }
    );
  });

  afterEach(() => {
    act(() => {
      jest.clearAllTimers();
    });
  });

  // --- Rendering and Props ---
  describe("Rendering and Props", () => {
    it("should render label and required asterisk", () => {
      render(
        <DropdownInput
          label="Fruit"
          required
          value={null}
          onChange={mockOnChange}
          options={mockOptions}
        />
      );
      expect(screen.getByText("Fruit")).toBeInTheDocument();
      expect(screen.getByText("*")).toBeInTheDocument();
      expect(screen.getByText("Fruit").nextSibling?.textContent).toBe("*");
    });

    it("should not render required asterisk if input not required", () => {
      render(
        <DropdownInput
          label="Fruit"
          value={null}
          onChange={mockOnChange}
          options={mockOptions}
        />
      );
      expect(screen.getByText("Fruit")).toBeInTheDocument();
      expect(screen.getByText("Fruit").nextSibling?.textContent).not.toBe("*");
    });

    it("should render placeholder when value is null", () => {
      render(
        <DropdownInput
          placeholder="Select a fruit"
          value={null}
          onChange={mockOnChange}
          options={mockOptions}
        />
      );
      expect(screen.getByPlaceholderText("Select a fruit")).toBeInTheDocument();
    });

    it("should display value label when value is provided", () => {
      render(
        <DropdownInput
          value={mockOptions[0]} // Apple
          onChange={mockOnChange}
          options={mockOptions}
        />
      );
      const { input } = getElements();
      expect(input.value).toBe("Apple");
    });

    it("should render an error message string", () => {
      render(
        <DropdownInput
          error="This is required"
          value={null}
          onChange={mockOnChange}
          options={mockOptions}
        />
      );
      expect(screen.getByText("This is required")).toBeInTheDocument();
    });

    it("should render hidden input with correct value when name prop is provided", () => {
      render(
        <DropdownInput
          name="fruit_id"
          value={mockOptions[1]} // Banana (id: 2)
          onChange={mockOnChange}
          options={mockOptions}
        />
      );
      const hiddenInput = document.querySelector(
        'input[type="hidden"]'
      ) as HTMLInputElement;
      expect(hiddenInput).toBeInTheDocument();
      expect(hiddenInput.name).toBe("fruit_id");
      expect(hiddenInput.value).toBe("2");
    });

    it("should render hidden input with empty value when value is null", () => {
      render(
        <DropdownInput
          name="fruit_id"
          value={null}
          onChange={mockOnChange}
          options={mockOptions}
        />
      );
      const hiddenInput = document.querySelector(
        'input[type="hidden"]'
      ) as HTMLInputElement;
      expect(hiddenInput).toBeInTheDocument();
      expect(hiddenInput.value).toBe("");
    });
  });

  // --- Visual States (Classes) ---
  describe("Visual States (Classes)", () => {
    it("should apply disabled styles and classes", () => {
      render(
        <DropdownInput
          disabled
          value={null}
          onChange={mockOnChange}
          options={mockOptions}
        />
      );
      const { input, wrapper, caretButton } = getElements();

      expect(wrapper).toHaveClass("bg-neutral-30 outline-neutral-40");
      expect(wrapper).toHaveClass("cursor-not-allowed");
      expect(input).toBeDisabled();
      expect(input).toHaveClass("text-neutral-60");
      expect(caretButton).toBeDisabled();
      expect(screen.getByTestId("icon-angle-down")).toHaveClass(
        "text-neutral-60"
      );
    });

    it("should apply error styles and classes", () => {
      render(
        <DropdownInput
          error
          value={null}
          onChange={mockOnChange}
          options={mockOptions}
        />
      );
      const { wrapper } = getElements();
      expect(wrapper).toHaveClass("bg-white outline-danger-main");
    });

    it("should apply focused/open styles and classes on input focus", () => {
      render(
        <DropdownInput
          value={null}
          onChange={mockOnChange}
          options={mockOptions}
        />
      );
      const { input, wrapper } = getElements();

      // Default state
      expect(wrapper).toHaveClass("bg-neutral-10 outline-neutral-40");
      expect(screen.getByTestId("icon-angle-down")).not.toHaveClass(
        "rotate-180"
      );

      // Focus
      act(() => {
        fireEvent.focus(input);
      });

      // Check classes
      expect(wrapper).toHaveClass("bg-white outline-primary-main");
      expect(wrapper).toHaveClass("caret-primary-main");
      // Check icon rotation for open state
      expect(screen.getByTestId("icon-angle-down")).toHaveClass("rotate-180");
    });

    it("should apply correct text color for placeholder vs. value", () => {
      const { rerender } = render(
        <DropdownInput
          value={null}
          onChange={mockOnChange}
          options={mockOptions}
        />
      );
      // Placeholder state
      expect(getElements().input).toHaveClass("text-neutral-60");

      // Value state
      rerender(
        <DropdownInput
          value={mockOptions[0]}
          onChange={mockOnChange}
          options={mockOptions}
        />
      );
      expect(getElements().input).toHaveClass("text-neutral-90");
    });
  });

  // --- User Interactions ---
  describe("User Interactions", () => {
    it("should open popover and focus input on wrapper click", () => {
      render(
        <DropdownInput
          value={null}
          onChange={mockOnChange}
          options={mockOptions}
        />
      );
      const { wrapper, input } = getElements();

      act(() => {
        fireEvent.click(wrapper);
      });

      expect(input).toHaveFocus();
      // Check that the hook was called with isOpen: true
      expect(
        jest.requireMock("../../hooks/dropdown-popover/useDropdownPopover")
          .useDropdownPopover
      ).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isOpen: true,
        })
      );
    });

    it("should filter list when typing in input", () => {
      render(
        <DropdownInput
          value={null}
          onChange={mockOnChange}
          options={mockOptions}
        />
      );
      const { input } = getElements();

      act(() => {
        fireEvent.focus(input);
      });
      act(() => {
        fireEvent.change(input, { target: { value: "Ap" } });
      });

      expect(input.value).toBe("Ap");
      // Check that the hook was called with the correct search term
      expect(
        jest.requireMock("../../hooks/dropdown-popover/useDropdownPopover")
          .useDropdownPopover
      ).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isOpen: true,
          searchTerm: "Ap",
        })
      );
    });

    it("should toggle popover on caret click", () => {
      const { rerender } = render(
        <DropdownInput
          value={null}
          onChange={mockOnChange}
          options={mockOptions}
        />
      );
      const { caretButton, input } = getElements();

      // --- 1. Open ---
      act(() => {
        fireEvent.click(caretButton);
      });

      // Check hook state
      expect(
        jest.requireMock("../../hooks/dropdown-popover/useDropdownPopover")
          .useDropdownPopover
      ).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isOpen: true,
        })
      );
      expect(input).toHaveFocus();

      // --- 2. Close ---
      // Simulate state update from parent
      rerender(
        <DropdownInput
          value={null}
          onChange={mockOnChange}
          options={mockOptions}
        />
      );
      act(() => {
        fireEvent.focus(input); // Need to focus first to get into open state
      });
      act(() => {
        fireEvent.click(caretButton);
      });

      // Check hook state
      expect(
        jest.requireMock("../../hooks/dropdown-popover/useDropdownPopover")
          .useDropdownPopover
      ).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isOpen: false,
        })
      );
      expect(input).not.toHaveFocus();
    });

    it("should select option, update value, and close when simulating onSelectOption", () => {
      const { rerender } = render(
        <DropdownInput
          value={null}
          onChange={mockOnChange}
          options={mockOptions}
        />
      );

      const { input } = getElements();

      // 1. Open the popover
      act(() => {
        fireEvent.focus(input);
      });

      // 2. Simulate the hook calling onSelectOption
      act(() => {
        mockOnSelectOption(mockOptions[1]); // Select 'Banana'
      });
      act(() => {
        jest.advanceTimersByTime(200); // Advance past 100ms timer
      });

      // 3. Check props
      expect(mockOnChange).toHaveBeenCalledWith(mockOptions[1]);

      // 4. Check state updates (via hook props)
      expect(
        jest.requireMock("../../hooks/dropdown-popover/useDropdownPopover")
          .useDropdownPopover
      ).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isOpen: false,
          selectedValue: undefined, // FIX: The `value` prop is still null at this point
          searchTerm: "Banana", // inputValue was updated
        })
      );

      // 5. Check input value and focus
      // The display value is now driven by the `value` prop, not state
      // We need to rerender with the new prop
      rerender(
        <DropdownInput
          value={mockOptions[1]} // 'Banana'
          onChange={mockOnChange}
          options={mockOptions}
        />
      );
      expect(input.value).toBe("Banana");
      expect(input).not.toHaveFocus();
    });

    it("should clear input on blur if user types but does not select", () => {
      render(
        <DropdownInput
          value={null}
          onChange={mockOnChange}
          options={mockOptions}
        />
      );
      const { input } = getElements();

      // 1. Focus and type
      act(() => {
        fireEvent.focus(input);
      });
      act(() => {
        fireEvent.change(input, { target: { value: "B" } });
      });
      expect(input.value).toBe("B");

      // 2. Simulate click outside (which calls onClose)
      act(() => {
        mockOnClose();
      });

      // 3. Blur the input
      act(() => {
        fireEvent.blur(input);
      });

      // 4. Advance past the blur timer
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // 5. Input value should be cleared
      expect(input.value).toBe("");
    });

    it("should NOT clear input on blur if a value is selected", () => {
      render(
        <DropdownInput
          value={mockOptions[0]} // 'Apple'
          onChange={mockOnChange}
          options={mockOptions}
        />
      );
      const { input } = getElements();
      expect(input.value).toBe("Apple");

      // 1. Focus and blur
      act(() => {
        fireEvent.focus(input);
      });
      act(() => {
        fireEvent.blur(input);
      });

      // 2. Advance past the blur timer
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // 3. Input value should revert to the prop's label, not be cleared
      expect(input.value).toBe("Apple");
    });
  });
});
