import { useEffect, useRef, HTMLProps } from "react";
import { UilCheck, UilMinus } from "@iconscout/react-unicons";

/**
 * Props for the `CheckboxInput` component.
 * Extends standard HTML input attributes.
 */
interface CheckboxInputProps
  extends Omit<HTMLProps<HTMLInputElement>, "type" | "id"> {
  /**
   * If true, sets the checkbox to the indeterminate visual state.
   * This is commonly used for "select all" checkboxes in tables or lists.
   */
  indeterminate?: boolean;
  /**
   * Additional CSS classes to apply to the surrounding label element.
   */
  className?: string;
  /**
   * A unique identifier (number or string) used to generate the input's `id`
   * and link it to the `label`. Important for accessibility and functionality.
   */
  index: number | string;
}

/**
 * A custom-styled checkbox component using Tailwind CSS and peer selectors.
 *
 * This component renders a visually hidden native checkbox input (`<input type="checkbox">`)
 * and uses a styled `<label>` element to represent the checkbox visually.
 * It supports checked, unchecked, and indeterminate states.
 *
 * @param {CheckboxInputProps} props - The props for the component.
 * @param {boolean} [props.indeterminate] - Sets the visual indeterminate state.
 * @param {string} [props.className=""] - Additional classes for the label.
 * @param {number | string} props.index - Unique identifier for the input/label pair.
 * @param {React.HTMLProps<HTMLInputElement>} props.rest - Other standard HTML input props (like `checked`, `onChange`, `disabled`).
 * @returns {React.ReactElement} The rendered custom checkbox.
 */
export function CheckboxInput({
  indeterminate,
  className = "",
  index,
  ...rest
}: CheckboxInputProps) {
  /** Ref to the hidden native checkbox input element. */
  const ref = useRef<HTMLInputElement>(null!);

  /**
   * Effect to synchronize the native input's `indeterminate` property
   * with the `indeterminate` prop, ensuring accessibility tools recognize the state.
   * The native property is only set if the checkbox is *not* checked but should be indeterminate.
   */
  useEffect(() => {
    if (typeof indeterminate === "boolean") {
      ref.current.indeterminate = !rest.checked && indeterminate;
    }
  }, [ref, indeterminate, rest.checked]);

  const uniqueId = "checkbox-input-" + index;

  return (
    <>
      <input
        type="checkbox"
        id={uniqueId}
        ref={ref}
        className="hidden peer"
        {...rest}
        data-testid="checkbox-input"
      />
      <label
        htmlFor={uniqueId}
        className={
          className +
          " absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2 [&>.check]:hidden [&>.indeterminate]:hidden peer-checked:[&>.check]:inline-flex peer-indeterminate:[&>.indeterminate]:inline-flex inline-flex items-center justify-center size-6 rounded-lg cursor-pointer bg-white border-primary-main peer-checked:bg-primary-main peer-indeterminate:bg-primary-main border-2" // Base styles + peer styles for checked/indeterminate
        }
        data-testid="checkbox-label"
      >
        {/* Check icon, shown when peer is checked */}
        <UilCheck className="check text-neutral-10 scale-125" />
        {/* Minus icon, shown when peer is indeterminate */}
        <UilMinus className="indeterminate text-neutral-10" />
      </label>
    </>
  );
}
