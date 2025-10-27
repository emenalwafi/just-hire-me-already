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

// Define the props for our generic table
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Optional initial pinning state */
  initialPinning?: ColumnPinningState;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  initialPinning = { left: [], right: [] }, // Default to no pinning
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnPinning, setColumnPinning] =
    useState<ColumnPinningState>(initialPinning);

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
    // Outermost container matching your original styles
    <div className="p-6 bg-neutral-10 rounded-lg shadow-[0px_4px_8px_0px_rgba(0,0,0,0.10)] outline outline-1 outline-offset-[-1px] outline-neutral-200">
      {/* Container for horizontal scrolling */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full border-collapse">
          {/* Table Header */}
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
                            ? "sticky bg-neutral-20 shadow-[4px_0_8px_0px_rgba(0,0,0,0.10)]"
                            : "bg-neutral-20/50"
                        }
                      `}
                      style={{
                        width: header.getSize(),
                        minWidth: header.getSize(),
                        maxWidth: header.getSize(),
                        left:
                          isPinned === "left"
                            ? `${header.getStart()}px`
                            : undefined,
                        zIndex: isPinned ? 10 : 0,
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

          {/* Table Body */}
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
                            ? "sticky shadow-[4px_0_8px_0px_rgba(0,0,0,0.05)]"
                            : ""
                        } ${
                          row.getIsSelected() ? 'bg-primary-surface text-primary-main' : 'bg-neutral-10'
                        }
                      `}
                      style={{
                        width: cell.column.getSize(),
                        minWidth: cell.column.getSize(),
                        maxWidth: cell.column.getSize(),
                        left:
                          isPinned === "left"
                            ? `${cell.column.getStart()}px`
                            : undefined,
                        zIndex: isPinned ? 10 : 0,
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
