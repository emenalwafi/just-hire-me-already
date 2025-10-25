import React from "react";

// Define the props for the Chip component
interface ChipProps {
  /**
   * The text or content to display inside the chip.
   */
  children: React.ReactNode;
  /**
   * If `true`, the chip will be in the 'Selected' state.
   * @default false
   */
  selected?: boolean;
  /**
   * If `true`, the chip will be in the 'Disabled' state.
   * @default false
   */
  disabled?: boolean;
  /**
   * Optional click handler.
   */
  onClick?: () => void;
}

/**
 * @component Chip
 * @description A reusable Chip component that visually represents selectable or dismissible information.
 * It supports various states including default (rest), hover, selected, and disabled.
 * The styling is driven by Tailwind utility classes based on the component's props.
 *
 * @param {ChipProps} props - The props for the Chip component.
 * @param {React.ReactNode} props.children - The text or content to display inside the chip.
 * @param {boolean} [props.selected=false] - If `true`, the chip will be in the 'Selected' state.
 * @param {boolean} [props.disabled=false] - If `true`, the chip will be in the 'Disabled' state.
 * @param {() => void} [props.onClick] - Optional click handler.
 *
 * @returns {React.ReactElement} A styled button element representing the chip.
 *
 * @example
 * // Default Chip
 * <Chip>Default</Chip>
 *
 * // Selected Chip
 * <Chip selected>Selected</Chip>
 *
 * // Disabled Chip
 * <Chip disabled>Disabled</Chip>
 *
 * // Clickable Chip
 * <Chip onClick={() => alert('Clicked!')}>Click Me</Chip>
 */
const Chip: React.FC<ChipProps> = ({
  children,
  selected = false,
  disabled = false,
  onClick,
}) => {
  // --- Base Classes ---
  const chipBaseClasses =
    "px-3 py-1 rounded-2xl outline outline-1 outline-offset-[-1px] flex justify-start items-center gap-2 overflow-hidden transition-all";
  const textBaseClasses =
    "justify-center text-base font-sans";

  // --- State-Specific Classes ---
  let chipStateClasses = "";
  let textStateClasses = "";

  if (disabled) {
    // 1. Disabled State
    chipStateClasses = "bg-neutral-30 outline-neutral-40 cursor-not-allowed";
    textStateClasses = "text-neutral-60";
  } else if (selected) {
    // 2. Selected State
    chipStateClasses = "bg-neutral-10 outline-primary-main";
    textStateClasses = "text-primary-main";
  } else {
    // 3. Rest / Not Selected State (and Hover)
    chipStateClasses =
      "bg-neutral-10 outline-neutral-40 hover:bg-neutral-30 cursor-pointer";
    textStateClasses = "text-neutral-90";
  }

  return (
    <div className="self-stretch inline-flex justify-start items-start">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`${chipBaseClasses} ${chipStateClasses}`}
      >
        <div className={`${textBaseClasses} ${textStateClasses}`}>
          {children}
        </div>
      </button>
    </div>
  );
};

export default Chip;
