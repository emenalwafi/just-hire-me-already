import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import DropdownInput from "./DropdownInput"; // Adjust import path
import { DropdownOption } from "@/hooks/dropdown-popover/useDropdownPopover"; // Adjust import path

/**
 * @file Test suite for the DropdownInput (Combobox) component.
 * @description This file contains unit tests for the DropdownInput, verifying its
 * rendering, states, user interactions (typing, focusing, selecting),
 * and integration with the mocked `useDropdownPopover` hook.
 */

// --- Mocks ---

let mockOnSelectOption: (option: DropdownOption) => void;
let mockOnClose: () => void;

/**
 * Mocks the `useDropdownPopover` hook.
 * This mock captures the `onSelectOption` and `onClose` callbacks provided
 * by the DropdownInput component, allowing tests to simulate a user
 * selecting an option or the popover closing.
 * It also provides a mock `popoverElement` with the ID the component
 * uses for its blur-handling logic.
 */
jest.mock("../../hooks/dropdown-popover/useDropdownPopover", () => ({
  useDropdownPopover: jest.fn(
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
  ),
  DropdownOption: jest.fn(),
}));

/**
 * Mocks the `@iconscout/react-unicons` library.
 * Replaces the `UilAngleDown` icon with a simple `<span>` for testing.
 */
jest.mock("@iconscout/react-unicons", () => ({
  UilAngleDown: (props: { className: string }) => (
    <span data-testid="icon-angle-down" className={props.className} />
  ),
}));

// --- Test Setup ---
jest.useFakeTimers();

/**
 * A mock array of `DropdownOption` objects used as test data.
 */
const mockOptions: DropdownOption[] = [
  { id: 1, label: "Apple" },
  { id: 2, label: "Banana" },
  { id: 3, label: "Mango" },
];

/**
 * Helper function to get the primary elements of the DropdownInput component.
 * @returns {object} An object containing the `input`, `wrapper`, and `caretButton` elements.
 */
const getElements = () => {
  const input = screen.getByRole("combobox") as HTMLInputElement;
  const wrapper = input.parentElement as HTMLElement;
  const caretButton = screen.getByRole("button", {
    name: /Open dropdown|Close dropdown/,
  });
  return { input, wrapper, caretButton };
};

/**
 * @describe Main test suite for the DropdownInput component.
 */
describe("DropdownInput", () => {
  let mockOnChange: jest.Mock;

  /**
   * @beforeEach Resets the `mockOnChange` function and re-initializes
   * the `useDropdownPopover` mock implementation for each test.
   */
  beforeEach(() => {
    mockOnChange = jest.fn();
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

  /**
   * @afterEach Clears all Jest fake timers after each test.
   */
  afterEach(() => {
    act(() => {
      jest.clearAllTimers();
    });
  });

  // --- Rendering and Props ---
  /**
   * @describe Tests related to basic rendering and prop handling.
   */
  describe("Rendering and Props", () => {
    /**
     * @it Verifies that the label and required asterisk are rendered correctly.
     */
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

    /**
     * @it Verifies that the required asterisk is not rendered when the input is not required.
     */
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

    /**
     * @it Verifies that the placeholder text is displayed when the `value` prop is null.
     */
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

    /**
     * @it Verifies that the input displays the correct label from the `value` prop.
     */
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

    /**
     * @it Verifies that a string error message is rendered when provided.
     */
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

    /**
     * @it Verifies that a hidden input is rendered with the correct name and selected value.
     */
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

    /**
     * @it Verifies that the hidden input has an empty value when the `value` prop is null.
     */
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
  /**
   * @describe Tests for CSS classes applied in different component states.
   */
  describe("Visual States (Classes)", () => {
    /**
     * @it Verifies that disabled-related classes are applied when `disabled` prop is true.
     */
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

    /**
     * @it Verifies that error-related classes are applied when `error` prop is true.
     */
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

    /**
     * @it Verifies that focused/open classes are applied on input focus.
     */
    it("should apply focused/open styles and classes on input focus", () => {
      render(
        <DropdownInput
          value={null}
          onChange={mockOnChange}
          options={mockOptions}
        />
      );
      const { input, wrapper } = getElements();

      expect(wrapper).toHaveClass("bg-neutral-10 outline-neutral-40");
      expect(screen.getByTestId("icon-angle-down")).not.toHaveClass(
        "rotate-180"
      );

      act(() => {
        fireEvent.focus(input);
      });

      expect(wrapper).toHaveClass("bg-white outline-primary-main");
      expect(wrapper).toHaveClass("caret-primary-main");
      expect(screen.getByTestId("icon-angle-down")).toHaveClass("rotate-180");
    });

    /**
     * @it Verifies the correct text color for placeholder vs. selected value.
     */
    it("should apply correct text color for placeholder vs. value", () => {
      const { rerender } = render(
        <DropdownInput
          value={null}
          onChange={mockOnChange}
          options={mockOptions}
        />
      );
      expect(getElements().input).toHaveClass("text-neutral-60");

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
  /**
   * @describe Tests for user-driven events and component interactions.
   */
  describe("User Interactions", () => {
    /**
     * @it Verifies that clicking the component wrapper focuses the input and opens the popover.
     */
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
      expect(
        jest.requireMock("../../hooks/dropdown-popover/useDropdownPopover")
          .useDropdownPopover
      ).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isOpen: true,
        })
      );
    });

    /**
     * @it Verifies that typing in the input updates the hook's `searchTerm` prop.
     */
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

    /**
     * @it Verifies that clicking the caret button toggles the popover open and closed.
     */
    it("should toggle popover on caret click", () => {
      const { rerender } = render(
        <DropdownInput
          value={null}
          onChange={mockOnChange}
          options={mockOptions}
        />
      );
      const { caretButton, input } = getElements();

      act(() => {
        fireEvent.click(caretButton);
      });

      expect(
        jest.requireMock("../../hooks/dropdown-popover/useDropdownPopover")
          .useDropdownPopover
      ).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isOpen: true,
        })
      );
      expect(input).toHaveFocus();

      rerender(
        <DropdownInput
          value={null}
          onChange={mockOnChange}
          options={mockOptions}
        />
      );
      act(() => {
        fireEvent.focus(input);
      });
      act(() => {
        fireEvent.click(caretButton);
      });

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

    /**
     * @it Verifies the full selection flow: simulating a hook selection,
     * checking `onChange`, and verifying the input's final state.
     */
    it("should select option, update value, and close when simulating onSelectOption", () => {
      const { rerender } = render(
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
        mockOnSelectOption(mockOptions[1]); // Select 'Banana'
      });
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(mockOnChange).toHaveBeenCalledWith(mockOptions[1]);

      expect(
        jest.requireMock("../../hooks/dropdown-popover/useDropdownPopover")
          .useDropdownPopover
      ).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isOpen: false,
          selectedValue: undefined,
          searchTerm: "Banana",
        })
      );

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

    /**
     * @it Verifies that the input value is cleared on blur if the user typed
     * but did not make a valid selection.
     */
    it("should clear input on blur if user types but does not select", () => {
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
        fireEvent.change(input, { target: { value: "B" } });
      });
      expect(input.value).toBe("B");

      act(() => {
        mockOnClose();
      });

      act(() => {
        fireEvent.blur(input);
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(input.value).toBe("");
    });

    /**
     * @it Verifies that the input value reverts to the selected prop's label
     * on blur, rather than being cleared.
     */
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

      act(() => {
        fireEvent.focus(input);
      });
      act(() => {
        fireEvent.blur(input);
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(input.value).toBe("Apple");
    });
  });
});
