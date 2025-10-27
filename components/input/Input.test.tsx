import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import Input from "./Input"; // Adjust import path
import {
  DatePickerConfig,
  DropdownInputConfig,
  DropdownValue,
  InputConfig,
  PhoneNumberInputConfig,
  RadioInputConfig,
  TextInputConfig,
} from "@/types/InputConfig"; // Adjust path as needed
import { DropdownOption } from "@/hooks/dropdown-popover/useDropdownPopover";
import { RadioOption } from "@/components/input/radio-input/RadioInput";

/**
 * @file Test suite for the unified Input factory component.
 * @description This file contains unit tests for the Input component,
 * which acts as a factory rendering specific input components based on a configuration object.
 * It uses mocks for all child components to verify correct rendering and prop passing.
 */

// --- Mocks for all child components ---

/** Mock function for the TextInput component. */
const mockTextInput = jest.fn();
/** Mock function for the RadioInput component. */
const mockRadioInput = jest.fn();
/** Mock function for the DropdownInput component. */
const mockDropdownInput = jest.fn();
/** Mock function for the DatePicker component. */
const mockDatePicker = jest.fn();
/** Mock function for the PhoneNumberInput component. */
const mockPhoneNumberInput = jest.fn();

/**
 * Mocks the TextInput component.
 * Replaces the actual component with a mock function (`mockTextInput`)
 * and renders a simple input element for basic presence checking.
 */
jest.mock("../../components/input/text-input/TextInput", () => ({
  __esModule: true,
  default: (props: TextInputConfig) => {
    mockTextInput(props);
    const { type, ...rest } = props;
    return <input data-testid="mock-text-input" type={type} {...rest} />;
  },
}));

/**
 * Mocks the RadioInput component.
 * Replaces the actual component with a mock function (`mockRadioInput`)
 * and renders a simple div element.
 */
jest.mock("../../components/input/radio-input/RadioInput", () => ({
  __esModule: true,
  default: (props: RadioInputConfig) => {
    mockRadioInput(props);
    return <div data-testid="mock-radio-input" {...props} />;
  },
}));

/**
 * Mocks the DropdownInput component.
 * Replaces the actual component with a mock function (`mockDropdownInput`)
 * and renders a simple div element.
 */
jest.mock("../../components/input/dropdown-input/DropdownInput", () => ({
  __esModule: true,
  default: (props: DropdownInputConfig) => {
    mockDropdownInput(props);
    return <div data-testid="mock-dropdown-input" {...props} />;
  },
}));

/**
 * Mocks the DatePicker component.
 * Replaces the actual component with a mock function (`mockDatePicker`)
 * and renders a simple div element.
 */
jest.mock("../../components/input/date-picker/DatePicker", () => ({
  __esModule: true,
  default: (props: DatePickerConfig) => {
    mockDatePicker(props);
    return <div data-testid="mock-date-picker" {...props} />;
  },
}));

/**
 * Mocks the PhoneNumberInput component.
 * Replaces the actual component with a mock function (`mockPhoneNumberInput`)
 * and renders a simple div element.
 */
jest.mock("../../components/input/phone-number-input/PhoneNumberInput", () => ({
  __esModule: true,
  default: (props: PhoneNumberInputConfig) => {
    mockPhoneNumberInput(props);
    return <div data-testid="mock-phone-input" {...props} />;
  },
}));

/**
 * @describe Main test suite for the unified Input factory component.
 */
describe("Input Factory Component", () => {
  let mockOnChange: jest.Mock;
  let mockOnCountryChange: jest.Mock;

  /**
   * @beforeEach Resets all mock functions and component call history before each test.
   */
  beforeEach(() => {
    mockOnChange = jest.fn();
    mockOnCountryChange = jest.fn();
    mockTextInput.mockClear();
    mockRadioInput.mockClear();
    mockDropdownInput.mockClear();
    mockDatePicker.mockClear();
    mockPhoneNumberInput.mockClear();
  });

  /**
   * @it Verifies that the `TextInput` component is rendered with the correct props when `config.type` is "text".
   */
  it('should render TextInput for type "text"', () => {
    const config: InputConfig = {
      type: "text",
      label: "Name",
      name: "name",
      placeholder: "Enter name",
      required: true,
      error: "Is required",
      successMessage: "Looks good",
      maxLength: 10,
    };
    render(<Input config={config} value="Test" onChange={mockOnChange} />);

    expect(screen.getByTestId("mock-text-input")).toBeInTheDocument();
    expect(mockTextInput).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "Name",
        name: "name",
        placeholder: "Enter name",
        required: true,
        error: "Is required",
        successMessage: "Looks good",
        maxLength: 10,
        value: "Test",
        type: "text",
      })
    );
  });

  /**
   * @it Verifies that the `TextInput` component is rendered with the correct props when `config.type` is "password".
   */
  it('should render TextInput for type "password"', () => {
    const config: InputConfig = { type: "password", label: "Pass" };
    render(<Input config={config} value="123" onChange={mockOnChange} />);

    expect(screen.getByTestId("mock-text-input")).toBeInTheDocument();
    expect(mockTextInput).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "password",
        label: "Pass",
        value: "123",
      })
    );
  });

  /**
   * @it Verifies that the `RadioInput` component is rendered with the correct props when `config.type` is "radio".
   */
  it('should render RadioInput for type "radio"', () => {
    const radioOptions: RadioOption[] = [{ value: "a", label: "A" }];
    const config: InputConfig = {
      type: "radio",
      label: "Choice",
      name: "choice",
      options: radioOptions,
      error: true,
    };
    render(<Input config={config} value="a" onChange={mockOnChange} />);

    expect(screen.getByTestId("mock-radio-input")).toBeInTheDocument();
    expect(mockRadioInput).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "Choice",
        name: "choice",
        options: radioOptions,
        selectedValue: "a",
        onChange: mockOnChange,
        error: true,
      })
    );
  });

  /**
   * @it Verifies that the `DropdownInput` component is rendered with the correct props when `config.type` is "dropdown".
   */
  it('should render DropdownInput for type "dropdown"', () => {
    const dropdownOptions: DropdownOption[] = [{ id: 1, label: "A" }];
    const config: InputConfig = {
      type: "dropdown",
      label: "Select",
      name: "select",
      options: dropdownOptions,
      placeholder: "Choose one",
    };
    const selectedValue: DropdownValue = { id: 1, label: "A" };
    render(
      <Input config={config} value={selectedValue} onChange={mockOnChange} />
    );

    expect(screen.getByTestId("mock-dropdown-input")).toBeInTheDocument();
    expect(mockDropdownInput).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "Select",
        name: "select",
        options: dropdownOptions,
        placeholder: "Choose one",
        value: selectedValue,
        onChange: mockOnChange,
      })
    );
  });

  /**
   * @it Verifies that the `DatePicker` component is rendered with the correct props when `config.type` is "date".
   */
  it('should render DatePicker for type "date"', () => {
    const config: InputConfig = {
      type: "date",
      label: "Start Date",
      minDate: "2025-01-01",
      maxDate: "2025-12-31",
    };
    render(
      <Input config={config} value="2025-10-26" onChange={mockOnChange} />
    );

    expect(screen.getByTestId("mock-date-picker")).toBeInTheDocument();
    expect(mockDatePicker).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "Start Date",
        value: "2025-10-26",
        minDate: "2025-01-01",
        maxDate: "2025-12-31",
      })
    );
    expect(mockDatePicker.mock.calls[0][0].onChange).toBeInstanceOf(Function);
  });

  /**
   * @it Verifies that the `PhoneNumberInput` component is rendered with the correct props when `config.type` is "phone".
   */
  it('should render PhoneNumberInput for type "phone"', () => {
    const config: InputConfig = {
      type: "phone",
      label: "Mobile",
      defaultCountryIso: "ID",
    };
    render(
      <Input
        config={config}
        value="+62812"
        onChange={mockOnChange}
        onCountryChange={mockOnCountryChange}
      />
    );

    expect(screen.getByTestId("mock-phone-input")).toBeInTheDocument();
    expect(mockPhoneNumberInput).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "Mobile",
        value: "+62812",
        onChange: mockOnChange,
        onCountryChange: mockOnCountryChange,
        defaultCountryIso: "ID",
      })
    );
  });

  /**
   * @it Verifies that the `onChange` handler passed to `TextInput` correctly extracts the value from the event.
   */
  it("should adapt onChange for TextInput", () => {
    const config: InputConfig = { type: "text", label: "Name" };
    render(<Input config={config} value="" onChange={mockOnChange} />);
    const input = screen.getByTestId("mock-text-input");

    fireEvent.change(input, { target: { value: "new value" } });

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith("new value");
  });

  /**
   * @it Verifies that the `onChange` handler passed to `DatePicker` correctly passes the date string through.
   */
  it("should adapt onChange for DatePicker", () => {
    const config: InputConfig = { type: "date", label: "Date" };
    render(<Input config={config} value={null} onChange={mockOnChange} />);

    const passedOnChange = mockDatePicker.mock.calls[0][0].onChange;

    act(() => {
      passedOnChange("2025-11-20");
    });

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith("2025-11-20");
  });

  /**
   * @it Verifies that the component renders null and logs an error if an unhandled `config.type` is provided.
   */
  it("should render null for an unhandled type", () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const config = { type: "unhandled" } as unknown as InputConfig;

    const { container } = render(
      <Input config={config} value={null} onChange={mockOnChange} />
    );

    expect(container.firstChild).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Unhandled input type:",
      expect.objectContaining({ type: "unhandled" })
    );
    consoleErrorSpy.mockRestore();
  });
});
