"use client";

import { useEffect, useRef, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  RowSelectionState,
  ColumnPinningState,
  VisibilityState,
  Column,
} from "@tanstack/react-table";
import Image from "next/image";
import { UilColumns, UilAngleDown } from "@iconscout/react-unicons";

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Ensure window is defined (for SSR compatibility)
    if (typeof window === "undefined") {
      return;
    }

    const mediaQueryList = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Set initial state
    setMatches(mediaQueryList.matches);

    // Add listener
    // Use addEventListener for modern browsers, fall back to addListener
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener("change", listener);
    } else {
      // Deprecated but needed for some older browsers/environments
      mediaQueryList.addListener(listener);
    }

    // Cleanup listener on unmount
    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener("change", listener);
      } else {
        mediaQueryList.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
};

/**
 * Defines the props accepted by the generic `DataTable` component.
 * @template TData - The type of the data object for each row.
 * @template TValue - The type of the value expected by the cell/header renderers.
 */
interface DataTableProps<TData, TValue> {
  /** An array of column definitions for the table, following `@tanstack/react-table`'s `ColumnDef` structure. */
  columns: ColumnDef<TData, TValue>[];
  /** An array of data objects, where each object represents a row in the table. */
  data: TData[];
  /** Optional initial state for column pinning (which columns are sticky to the left/right). */
  initialPinning?: ColumnPinningState;
  /** Optional initial state for column visibility (which columns are displayed). */
  initialVisibility?: VisibilityState;
}

function getHeaderName<TData, TValue>(column: Column<TData, TValue>): string {
  const header = column.columnDef.header;
  if (typeof header === "string") {
    return header;
  }
  // Attempt to extract from accessorKey if header is complex/missing
  if (
    "accessorKey" in column.columnDef &&
    typeof column.columnDef.accessorKey === "string"
  ) {
    // Simple capitalization for display
    const key = column.columnDef.accessorKey;
    return (
      key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")
    );
  }
  return column.id; // Fallback to column ID
}

/**
 * A generic data table component built using `@tanstack/react-table`.
 * It supports row selection, column pinning, and horizontal scrolling.
 * The component is styled with Tailwind CSS.
 *
 * @template TData - The type of the data object for each row.
 * @template TValue - The type of the value expected by the cell/header renderers.
 * @param {DataTableProps<TData, TValue>} props - The props for the DataTable component.
 * @param {ColumnDef<TData, TValue>[]} props.columns - Column definitions.
 * @param {TData[]} props.data - Row data.
 * @param {ColumnPinningState} [props.initialPinning={ left: [], right: [] }] - Optional initial column pinning state.
 * @returns {React.ReactElement} The rendered data table component.
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  initialPinning = { left: [], right: [] },
  initialVisibility = {},
}: DataTableProps<TData, TValue>) {
  /** State for managing which rows are selected. */
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  /** State for managing which columns are pinned (sticky). */
  const [columnPinning, setColumnPinning] =
    useState<ColumnPinningState>(initialPinning);
  /** State for managing which columns are dipsplayed. */
  const [columnVisibility, setColumnVisibility] =
    useState<VisibilityState>(initialVisibility);
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
  const columnToggleRef = useRef<HTMLDivElement>(null); // Ref for the dropdown + button
  const columnButtonRef = useRef<HTMLButtonElement>(null);

  const isSmallScreen = useMediaQuery("(max-width: 767px)");

  useEffect(() => {
    if (isSmallScreen) {
      // Force no pinning on small screens
      setColumnPinning({ left: [], right: [] });
    } else {
      // Restore initial pinning on larger screens
      setColumnPinning(initialPinning);
    }
  }, [isSmallScreen, initialPinning]);

  /**
   * React Table instance configured with data, columns, state, and handlers.
   * Enables row selection and column pinning.
   */
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
      columnPinning: isSmallScreen ? { left: [], right: [] } : columnPinning,
      columnVisibility,
    },
    onRowSelectionChange: setRowSelection,
    onColumnPinningChange: isSmallScreen ? undefined : setColumnPinning,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    enableColumnPinning: !isSmallScreen,
    enableHiding: true,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        columnToggleRef.current &&
        !columnToggleRef.current.contains(event.target as Node)
      ) {
        setIsColumnDropdownOpen(false);
      }
    };
    if (isColumnDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isColumnDropdownOpen]);

  return (
    <div className="p-6 h-full w-full bg-neutral-10 rounded-lg shadow-[0px_4px_8px_0px_rgba(0,0,0,0.10)] outline outline-1 outline-offset-[-1px] outline-neutral-200">
      {data?.length === 0 ? (
        <div className="flex flex-col justify-center items-center gap-4 h-full text-center px-4">
          <Image
            src="/candidate-empty.png"
            alt="No job openings illustration"
            width={180}
            height={180}
            className="opacity-70"
            onError={(e) =>
              (e.currentTarget.src =
                "https://placehold.co/180x180/E0E0E0/757575?text=Empty")
            }
          />
          <div className="flex flex-col justify-center items-center gap-1">
            <div className="text-neutral-100 text-heading-sm font-bold">
              No candidates found
            </div>
            <div className="text-neutral-70 text-base md:text-lg max-w-md">
              Share your job vacancies so that more candidates will apply.
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Column Toggle Button & Dropdown */}
          <div
            ref={columnToggleRef}
            className="relative inline-block text-left w-full sm:w-fit border-neutral-50 mb-4"
          >
            <button
              ref={columnButtonRef}
              type="button"
              onClick={() => setIsColumnDropdownOpen((prev) => !prev)}
              className="w-full sm:w-fit flex justify-between cursor-pointer items-center gap-2 rounded-md border border-neutral-300 bg-neutral-10 px-3 py-1.5 text-base font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-1"
              aria-haspopup="true"
              aria-expanded={isColumnDropdownOpen}
            >
              <UilColumns size="16" />
              Columns
              <UilAngleDown
                size="16"
                className={`-mr-1 ml-1 transition-transform ${
                  isColumnDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Panel */}
            {isColumnDropdownOpen && (
              <div
                className="absolute left-0 top-full w-full z-20 mt-2 min-w-56 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="columns-menu-button"
              >
                <div className="py-1 px-2" role="none">
                  <div className="px-2 py-1 text-xs font-semibold text-neutral-500 uppercase">
                    Toggle Columns
                  </div>
                  {table.getAllLeafColumns().map((column) => {
                    // Only show columns that can be hidden
                    if (!column.getCanHide()) {
                      return null;
                    }
                    const headerName = getHeaderName(column);
                    return (
                      <label
                        key={column.id}
                        className="flex items-center px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={column.getIsVisible()}
                          onChange={column.getToggleVisibilityHandler()}
                          className="h-4 w-4 rounded border-neutral-300 text-primary-main focus:ring-primary-main mr-2 cursor-pointer"
                          aria-label={`Toggle visibility of ${headerName} column`}
                        />
                        <span>{headerName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto custom-scrollbar shadow-[0px_4px_8px_0px_rgba(0,0,0,0.10)]">
            <table className="min-w-full border-collapse">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="h-16">
                    {headerGroup.headers.map((header) => {
                      const isPinned = header.column.getIsPinned();
                      return (
                        <th
                          key={header.id}
                          colSpan={header.colSpan}
                          className={`
                        p-4 border-b border-neutral-30
                        text-neutral-100 text-sm font-bold text-left relative
                        ${
                          isPinned === "left"
                            ? "sticky bg-neutral-20" // Pinned left styles
                            : "bg-neutral-20/50"
                        }
                      `}
                          style={{
                            width: header.getSize(),
                            minWidth: header.getSize(),
                            maxWidth: header.getSize(),
                            left:
                              isPinned === "left"
                                ? `${header.getStart()}px` // Calculate left offset for sticky column
                                : undefined,
                            zIndex: isPinned ? 10 : 0, // Ensure pinned headers are above others
                          }}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>

              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="h-14 hover:bg-neutral-20/50">
                    {row.getVisibleCells().map((cell) => {
                      const isPinned = cell.column.getIsPinned();
                      return (
                        <td
                          key={cell.id}
                          className={`
                        p-4 border-b border-neutral-30
                        text-neutral-90 relative
                        ${
                          isPinned === "left"
                            ? "sticky" // Pinned left cell styles
                            : ""
                        } ${
                            row.getIsSelected()
                              ? "bg-primary-surface text-primary-main" // Selected row styles
                              : "bg-neutral-10" // Default cell background
                          }
                      `}
                          style={{
                            width: cell.column.getSize(),
                            minWidth: cell.column.getSize(),
                            maxWidth: cell.column.getSize(),
                            left:
                              isPinned === "left"
                                ? `${cell.column.getStart()}px` // Calculate left offset for sticky cell
                                : undefined,
                            zIndex: isPinned ? 10 : 0, // Ensure pinned cells are above others
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
