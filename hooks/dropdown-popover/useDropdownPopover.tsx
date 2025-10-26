import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { createPortal } from "react-dom";

/**
 * Defines the basic structure for an option in the dropdown.
 */
export interface DropdownOption {
  /** A unique identifier for the option. */
  id: string | number;
  /** The text to be displayed for the option. */
  label: string;
}

/**
 * Props for the `useDropdownPopover` hook.
 */
export interface UseDropdownPopoverProps {
  /** A React ref to the element the popover should be anchored to. */
  anchorRef: React.RefObject<HTMLElement | null>;
  /** The complete list of options to be displayed or filtered. */
  options: DropdownOption[];
  /** The `id` of the currently selected option, for highlighting. */
  selectedValue?: string | number | null;
  /** The current search term to filter the `options` by. */
  searchTerm?: string;
  /** Callback function fired when a user selects an option. */
  onSelectOption: (option: DropdownOption) => void;
  /** Boolean state indicating if the popover should be open. */
  isOpen: boolean;
  /** Callback function to signal that the popover should close. */
  onClose: () => void;
}

/**
 * The return value of the `useDropdownPopover` hook.
 */
interface UseDropdownPopoverReturn {
  /** The React Portal element containing the popover. Render this in your component. */
  popoverElement: React.ReactPortal | null;
}

/**
 * A React hook that provides the logic and UI for a generic dropdown popover.
 * It handles positioning relative to an anchor, filtering based on a search term,
 * and click-outside detection. The open/close state is controlled by the parent.
 *
 * @param {UseDropdownPopoverProps} props - The configuration props for the hook.
 * @returns {UseDropdownPopoverReturn} - An object containing the popover element.
 */
export function useDropdownPopover({
  anchorRef,
  options,
  selectedValue,
  searchTerm = "",
  onSelectOption,
  isOpen,
  onClose,
}: UseDropdownPopoverProps): UseDropdownPopoverReturn {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverPosition, setPopoverPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  /** Memoized list of options filtered by the provided search term. */
  const filteredOptions = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    if (!lowerSearchTerm) {
      return options;
    }
    return options.filter((option) =>
      option.label.toLowerCase().includes(lowerSearchTerm)
    );
  }, [options, searchTerm]);

  /** Effect to calculate and set the popover's position and width. */
  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    } else {
      setPopoverPosition(null);
    }
  }, [isOpen, anchorRef]);

  /** Effect to add a "click outside" listener to close the popover. */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, popoverRef, anchorRef]);

  /** Stable callback for when an option is selected. */
  const handleSelect = useCallback(
    (option: DropdownOption) => {
      onSelectOption(option);
    },
    [onSelectOption]
  );

  /** Memoized JSX for the popover's content. */
  const popoverContent = useMemo(() => {
    if (!isOpen || !popoverPosition) return null;

    return (
      <div
        ref={popoverRef}
        role="listbox"
        id="dropdown-listbox-id"
        style={{
          position: "absolute",
          top: `${popoverPosition.top}px`,
          left: `${popoverPosition.left}px`,
          width: `${popoverPosition.width}px`,
          zIndex: 50,
        }}
        className={`py-2 bg-neutral-10 rounded-lg shadow-[0px_4px_8px_0px_rgba(0,0,0,0.10)] outline outline-1 outline-offset-[-1px] outline-neutral-40 inline-flex flex-col justify-start items-start overflow-hidden font-sans`}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      >
        <div className="self-stretch max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const isSelected = selectedValue === option.id;
              let itemClasses =
                "self-stretch w-full px-4 py-2 inline-flex justify-start items-center gap-2 text-left transition-colors cursor-pointer";
              itemClasses += isSelected
                ? " bg-primary-surface"
                : " bg-white hover:bg-neutral-20 focus:bg-neutral-20 focus:outline-none";

              let textClasses =
                "flex-1 justify-start text-sm font-bold truncate";
              textClasses += isSelected
                ? " text-primary-main"
                : " text-neutral-100";

              return (
                <div
                  key={option.id}
                  role="option"
                  aria-selected={isSelected}
                  className={itemClasses}
                  onClick={() => handleSelect(option)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelect(option);
                    }
                  }}
                >
                  <div className={textClasses}>{option.label}</div>
                </div>
              );
            })
          ) : (
            <div className="self-stretch px-4 py-2 text-neutral-60 text-sm italic text-center">
              {searchTerm
                ? `No results found for "${searchTerm}"`
                : "No options available."}
            </div>
          )}
        </div>
      </div>
    );
  }, [
    isOpen,
    popoverPosition,
    filteredOptions,
    selectedValue,
    handleSelect,
    onClose,
    searchTerm,
  ]);

  /** Creates the React Portal for the popover, ensuring it only runs client-side. */
  const popoverElement =
    typeof document !== "undefined" && popoverContent
      ? createPortal(popoverContent, document.body)
      : null;

  return {
    popoverElement,
  };
}
