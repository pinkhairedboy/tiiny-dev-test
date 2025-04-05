# React Performance Data Grid

This project implements a performance-focused data grid component in ReactJS from scratch, designed to efficiently render large CSV files using virtualization.

**Live Demo:** [Link to your tiiny.host demo]

## Features

*   **CSV Upload:** Load data directly from a local CSV file.
*   **Virtual Scrolling:** Efficiently renders only the visible rows for smooth performance with large datasets (10,000+ rows).
*   **Sticky Header & Filter Row:** Header and filter inputs remain visible during vertical scrolling.
*   **Sortable Columns:** Click column headers to sort data (ascending/descending). Supports text, number, and basic date types (inferred).
*   **Resizable Columns:** Drag column dividers in the header to resize.
*   **Custom Cell Rendering:** Numbers and dates are formatted.
*   **Responsive:** Handles window resize.
*   **Inline Editing:** Double-click a cell to edit. Enter saves, Escape cancels.
*   **Column Reordering:** Drag and drop column headers to reorder.
*   **Filtering:** Type in the inputs below headers to filter data per column (debounced).
*   **Keyboard Navigation:** Use Arrow keys, Enter/F2 to edit, Escape.

## Technical Implementation

*   **ReactJS (JavaScript)**
*   **Manual Virtualization:** Custom logic for rendering only visible rows.
*   **CSS:** Styling with CSS Variables.
*   **PapaParse:** Client-side CSV parsing.
*   **React Hooks:** `useMemo`, `useCallback`, `useState`, `useEffect`, `useRef`.
*   **Performance:** Virtualization, `React.memo`, `useMemo`, `useCallback`, event throttling/debouncing, `table-layout: fixed`.

## Project Structure

The core logic is contained within the `src/components/DataGrid` directory, promoting reusability.