"use client";

import { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  RowSelectionState,
  ColumnPinningState,
} from "@tanstack/react-table";

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
}: DataTableProps<TData, TValue>) {
  /** State for managing which rows are selected. */
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  /** State for managing which columns are pinned (sticky). */
  const [columnPinning, setColumnPinning] =
    useState<ColumnPinningState>(initialPinning);

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
      columnPinning,
    },
    onRowSelectionChange: setRowSelection,
    onColumnPinningChange: setColumnPinning,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    enableColumnPinning: true,
  });

  return (
    <div className="p-6 bg-neutral-10 rounded-lg shadow-[0px_4px_8px_0px_rgba(0,0,0,0.10)] outline outline-1 outline-offset-[-1px] outline-neutral-200">
      <div className="overflow-x-auto custom-scrollbar">
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
                      } ${
                        isPinned === "left" &&
                        cell.column.getIsLastColumn("left")
                          ? "border-r-2 border-black/10 block"
                          : ""
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
    </div>
  );
}
