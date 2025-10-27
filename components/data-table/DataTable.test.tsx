import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { DataTable } from "./DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { CheckboxInput } from "@/components/input/checkbox-input/CheckboxInput";

/**
 * @file Test suite for the DataTable component.
 * @description This file contains unit tests for the DataTable component,
 * covering basic rendering, row selection functionality, and column pinning styles.
 * It uses a mock CheckboxInput component for the selection column.
 */

// --- Mocks ---

/**
 * Mocks the CheckboxInput component used for row selection.
 * Replaces the actual component with a simple HTML input checkbox,
 * using data attributes for test IDs and indeterminate state simulation.
 */
jest.mock("../../components/input/checkbox-input/CheckboxInput", () => ({
  CheckboxInput: jest.fn(
    ({ checked, indeterminate, onChange, index, ...rest }) => (
      <input
        type="checkbox"
        data-testid={`checkbox-${index}`} // Use index for unique test ID
        checked={checked || false}
        // Simulate indeterminate state visually for easier assertion if needed
        data-indeterminate={indeterminate ? "true" : "false"}
        onChange={onChange}
        {...rest}
      />
    )
  ),
}));

// --- Test Setup ---

/**
 * Defines the structure for the sample data used in tests.
 */
interface Person {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
}

/**
 * Sample data array used to populate the table in tests.
 * @type {Person[]}
 */
const testData: Person[] = [
  { id: 1, firstName: "Tanner", lastName: "Linsley", age: 30 },
  { id: 2, firstName: "John", lastName: "Doe", age: 45 },
  { id: 3, firstName: "Jane", lastName: "Smith", age: 28 },
];

/**
 * Sample column definitions used for the table in tests.
 * Includes a selection column that utilizes the mocked CheckboxInput.
 * @type {ColumnDef<Person>[]}
 */
const testColumns: ColumnDef<Person>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <CheckboxInput
        index="header" // Unique index for header checkbox
        checked={table.getIsAllRowsSelected()}
        indeterminate={table.getIsSomeRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) => (
      <CheckboxInput
        index={row.index}
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        indeterminate={row.getIsSomeSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
    size: 50, // Example size
  },
  {
    accessorKey: "firstName",
    header: "First Name",
    cell: (info) => info.getValue(),
    size: 150,
  },
  {
    accessorKey: "lastName",
    header: "Last Name",
    cell: (info) => info.getValue(),
    size: 150,
  },
  {
    accessorKey: "age",
    header: "Age",
    cell: (info) => info.getValue(),
    size: 100,
  },
];

/**
 * @describe Main test suite for the DataTable component.
 */
describe("DataTable", () => {
  /**
   * @describe Tests covering the basic rendering of headers, rows, and cell content.
   */
  describe("Basic Rendering", () => {
    /**
     * @it Verifies that table headers are rendered correctly based on the `testColumns` definition.
     */
    it("should render table headers based on columns", () => {
      render(<DataTable columns={testColumns} data={testData} />);

      // Check for header cells
      expect(
        screen.getByRole("columnheader", { name: "" }) // Selection column has no explicit name
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "First Name" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "Last Name" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "Age" })
      ).toBeInTheDocument();
      // Check that the header checkbox mock is rendered
      expect(screen.getByTestId("checkbox-header")).toBeInTheDocument();
    });

    /**
     * @it Verifies that table rows and their corresponding data cells are rendered correctly based on `testData`.
     */
    it("should render table rows based on data", () => {
      render(<DataTable columns={testColumns} data={testData} />);

      const rows = screen.getAllByRole("row");
      expect(rows).toHaveLength(4); // 1 header + 3 data

      const firstDataRow = rows[1]; // Get the first data row
      // Check content within the first data row
      expect(within(firstDataRow).getByText("Tanner")).toBeInTheDocument();
      expect(within(firstDataRow).getByText("Linsley")).toBeInTheDocument();
      expect(within(firstDataRow).getByText("30")).toBeInTheDocument();

      // Check that row checkboxes are rendered using correct index
      expect(screen.getByTestId("checkbox-0")).toBeInTheDocument(); // Row index 0
      expect(screen.getByTestId("checkbox-1")).toBeInTheDocument(); // Row index 1
      expect(screen.getByTestId("checkbox-2")).toBeInTheDocument(); // Row index 2
    });

    /**
     * @it Verifies that the width styles defined in the column definitions are applied correctly to both header and data cells.
     */
    it("should apply correct widths to header and cells", () => {
      render(<DataTable columns={testColumns} data={testData} />);
      const firstNameHeader = screen.getByRole("columnheader", {
        name: "First Name",
      });
      // Get cells specifically from the first data row (index 1)
      const firstDataRow = screen.getAllByRole("row")[1];
      const firstDataRowCells = within(firstDataRow).getAllByRole("cell");
      // Find the cell corresponding to 'firstName' in the first row
      // Assuming order: checkbox, firstName, lastName, age
      const firstNameCell = firstDataRowCells[1]; // Index 1 corresponds to firstName

      expect(firstNameHeader).toHaveStyle("width: 150px");
      expect(firstNameHeader).toHaveStyle("min-width: 150px");
      expect(firstNameHeader).toHaveStyle("max-width: 150px");

      expect(firstNameCell).toHaveStyle("width: 150px");
      expect(firstNameCell).toHaveStyle("min-width: 150px");
      expect(firstNameCell).toHaveStyle("max-width: 150px");
    });
  });

  /**
   * @describe Tests covering the row selection functionality, including individual row clicks and the "select all" header checkbox.
   */
  describe("Row Selection", () => {
    /**
     * @it Verifies that clicking a row's checkbox toggles its selected state and applies/removes the corresponding CSS classes.
     */
    it("should toggle row selection when checkbox is clicked", () => {
      render(<DataTable columns={testColumns} data={testData} />);
      const rowCheckbox0 = screen.getByTestId("checkbox-0"); // Tanner's checkbox (row index 0)
      const rowCheckbox1 = screen.getByTestId("checkbox-1"); // John's checkbox (row index 1)
      const dataRow0 = screen.getAllByRole("row")[1]; // Tanner's row element

      // Initially not selected
      expect(rowCheckbox0).not.toBeChecked();
      within(dataRow0)
        .getAllByRole("cell")
        .forEach((cell) => {
          // Query cells within the specific row
          expect(cell).toHaveClass("bg-neutral-10");
        });

      // Click to select
      fireEvent.click(rowCheckbox0);
      expect(rowCheckbox0).toBeChecked();
      within(dataRow0)
        .getAllByRole("cell")
        .forEach((cell) => {
          // Check both classes individually for robustness
          expect(cell).toHaveClass("bg-primary-surface");
          expect(cell).toHaveClass("text-primary-main");
        });

      // Other rows remain unselected
      expect(rowCheckbox1).not.toBeChecked();

      // Click again to deselect
      fireEvent.click(rowCheckbox0);
      expect(rowCheckbox0).not.toBeChecked();
      within(dataRow0)
        .getAllByRole("cell")
        .forEach((cell) => {
          expect(cell).toHaveClass("bg-neutral-10");
          expect(cell).not.toHaveClass("bg-primary-surface"); // Ensure selected class is removed
        });
    });

    /**
     * @it Verifies that clicking the header checkbox selects or deselects all rows and applies/removes corresponding styles.
     */
    it("should toggle all rows selection when header checkbox is clicked", () => {
      render(<DataTable columns={testColumns} data={testData} />);
      const headerCheckbox = screen.getByTestId("checkbox-header");
      const rowCheckbox0 = screen.getByTestId("checkbox-0");
      const rowCheckbox1 = screen.getByTestId("checkbox-1");
      const rowCheckbox2 = screen.getByTestId("checkbox-2");
      const dataRow0 = screen.getAllByRole("row")[1];
      const dataRow1 = screen.getAllByRole("row")[2];
      const dataRow2 = screen.getAllByRole("row")[3];

      // Initially none selected
      expect(headerCheckbox).not.toBeChecked();
      expect(rowCheckbox0).not.toBeChecked();

      // Click header to select all
      fireEvent.click(headerCheckbox);
      expect(headerCheckbox).toBeChecked();
      expect(rowCheckbox0).toBeChecked();
      expect(rowCheckbox1).toBeChecked();
      expect(rowCheckbox2).toBeChecked();
      within(dataRow0)
        .getAllByRole("cell")
        .forEach((cell) => expect(cell).toHaveClass("bg-primary-surface"));
      within(dataRow1)
        .getAllByRole("cell")
        .forEach((cell) => expect(cell).toHaveClass("bg-primary-surface"));
      within(dataRow2)
        .getAllByRole("cell")
        .forEach((cell) => expect(cell).toHaveClass("bg-primary-surface"));

      // Click header again to deselect all
      fireEvent.click(headerCheckbox);
      expect(headerCheckbox).not.toBeChecked();
      expect(rowCheckbox0).not.toBeChecked();
      expect(rowCheckbox1).not.toBeChecked();
      expect(rowCheckbox2).not.toBeChecked();
      within(dataRow0)
        .getAllByRole("cell")
        .forEach((cell) => expect(cell).toHaveClass("bg-neutral-10"));
      within(dataRow1)
        .getAllByRole("cell")
        .forEach((cell) => expect(cell).toHaveClass("bg-neutral-10"));
      within(dataRow2)
        .getAllByRole("cell")
        .forEach((cell) => expect(cell).toHaveClass("bg-neutral-10"));
    });

    /**
     * @it Verifies that the header checkbox shows the indeterminate state (`data-indeterminate="true"`) when only some rows are selected.
     */
    it("should show header checkbox as indeterminate when some rows are selected", () => {
      render(<DataTable columns={testColumns} data={testData} />);
      const headerCheckbox = screen.getByTestId("checkbox-header");
      const rowCheckbox0 = screen.getByTestId("checkbox-0");
      const rowCheckbox1 = screen.getByTestId("checkbox-1");
      const rowCheckbox2 = screen.getByTestId("checkbox-2");

      // Initially not indeterminate
      expect(headerCheckbox).toHaveAttribute("data-indeterminate", "false");

      // Select one row
      fireEvent.click(rowCheckbox0);
      expect(headerCheckbox).toHaveAttribute("data-indeterminate", "true");
      expect(headerCheckbox).not.toBeChecked();

      // Select all rows (select the remaining ones)
      fireEvent.click(rowCheckbox1);
      fireEvent.click(rowCheckbox2);
      expect(headerCheckbox).toHaveAttribute("data-indeterminate", "false");
      expect(headerCheckbox).toBeChecked();

      // Deselect one row
      fireEvent.click(rowCheckbox0);
      expect(headerCheckbox).toHaveAttribute("data-indeterminate", "true");
      expect(headerCheckbox).not.toBeChecked();
    });
  });

  /**
   * @describe Tests covering the column pinning functionality, specifically checking applied styles.
   */
  describe("Column Pinning", () => {
    /**
     * @it Verifies that the correct `sticky`, `left`, `z-index`, and background/shadow classes are applied
     * to header and data cells when a column is pinned via `initialPinning`.
     */
    it("should apply initial pinning styles", () => {
      render(
        <DataTable
          columns={testColumns}
          data={testData}
          initialPinning={{ left: ["select"], right: [] }}
        />
      );

      const headerRow = screen.getAllByRole("row")[0];
      const selectHeader = within(headerRow).getAllByRole("columnheader")[0];
      const firstNameHeader = within(headerRow).getAllByRole("columnheader")[1];

      // Check pinned header styles
      expect(selectHeader).toHaveClass("sticky", "bg-neutral-20");
      expect(selectHeader).toHaveStyle("left: 0px");
      expect(selectHeader).toHaveStyle("z-index: 10");

      // Check non-pinned header styles
      expect(firstNameHeader).not.toHaveClass("sticky");
      expect(firstNameHeader).toHaveClass("bg-neutral-20/50");
      expect(firstNameHeader).toHaveStyle("left: undefined");
      expect(firstNameHeader).toHaveStyle("z-index: 0");

      const dataRow1 = screen.getAllByRole("row")[1];
      const selectCell = within(dataRow1).getAllByRole("cell")[0];
      const firstNameCell = within(dataRow1).getAllByRole("cell")[1];

      // Check pinned cell styles
      expect(selectCell).toHaveClass("sticky");
      expect(selectCell).toHaveStyle("left: 0px");
      expect(selectCell).toHaveStyle("z-index: 10");

      // Check non-pinned cell styles
      expect(firstNameCell).not.toHaveClass("sticky");
      expect(firstNameCell).toHaveStyle("left: undefined");
      expect(firstNameCell).toHaveStyle("z-index: 0");
    });
  });
});
