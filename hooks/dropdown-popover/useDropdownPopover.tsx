import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { createPortal } from "react-dom";

// Define the structure for dropdown options
export interface DropdownOption {
  id: string | number;
  label: string;
  // Add other properties as needed (e.g., disabled, icon)
}

// Props for the hook
interface UseDropdownPopoverProps {
  /** Ref of the element the popover should anchor to. Accepts null. */
  anchorRef: React.RefObject<HTMLElement | null>;
  /** Array of options to display */
  options: DropdownOption[];
  /** Value (id) of the currently selected option, or null */
  selectedValue?: string | number | null;
  /** Current search term from the input (if applicable) */
  searchTerm?: string; // Made optional as not all dropdowns filter
  /** Callback function when an option is selected */
  onSelectOption: (option: DropdownOption) => void;
  /** Boolean indicating if the popover is open */
  isOpen: boolean;
  /** Function to close the popover */
  onClose: () => void;
  // Removed popoverWidth prop
}

// Return type of the hook
interface UseDropdownPopoverReturn {
  popoverElement: React.ReactPortal | null; // The popover JSX to render
}

export function useDropdownPopover({
  anchorRef,
  options,
  selectedValue,
  searchTerm = "", // Default search term to empty string
  onSelectOption,
  isOpen,
  onClose,
}: UseDropdownPopoverProps): UseDropdownPopoverReturn {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverPosition, setPopoverPosition] = useState<{
    top: number;
    left: number;
    // Changed minWidth to width as we'll now set the exact width
    width: number;
  } | null>(null);

  // Filter options based on the search term passed from the parent
  const filteredOptions = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    if (!lowerSearchTerm) {
      return options; // Show all if search is empty
    }
    // Filter based on label containing the search term
    return options.filter((option) =>
      option.label.toLowerCase().includes(lowerSearchTerm)
    );
  }, [options, searchTerm]);

  // --- Calculate Popover Position ---
  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + window.scrollY + 4, // Position below the anchor + 4px gap
        left: rect.left + window.scrollX, // Align left edges
        width: rect.width, // Store anchor width
      });
    } else {
      setPopoverPosition(null); // Reset position when closed
    }
  }, [isOpen, anchorRef]);

  // --- Close on Outside Click ---
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

  const handleSelect = useCallback(
    (option: DropdownOption) => {
      onSelectOption(option);
      // Let the parent component handle closing
    },
    [onSelectOption]
  );

  // --- Popover JSX ---
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
          width: `${popoverPosition.width}px`, // Apply exact width based on anchor
          zIndex: 50,
        }}
        // Removed max-w-[572px] class, width is now controlled by style
        className={`py-2 bg-neutral-10 rounded-lg shadow-[0px_4px_8px_0px_rgba(0,0,0,0.10)] outline outline-1 outline-offset-[-1px] outline-neutral-40 inline-flex flex-col justify-start items-start overflow-hidden font-sans`}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      >
        {/* Scrollable container for options */}
        <div className="self-stretch max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const isSelected = selectedValue === option.id;
              let itemClasses =
                "self-stretch w-full px-4 py-2 inline-flex justify-start items-center gap-2 text-left transition-colors cursor-pointer";
              // Apply hover/focus within the scrollable div
              itemClasses += isSelected
                ? " bg-primary-surface"
                : " bg-white hover:bg-neutral-20 focus:bg-neutral-20 focus:outline-none";

              let textClasses =
                "flex-1 justify-start text-sm font-bold truncate"; // Ensure truncate is here
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

  // Portal creation
  const popoverElement =
    typeof document !== "undefined" && popoverContent
      ? createPortal(popoverContent, document.body)
      : null;

  return {
    popoverElement,
  };
}
