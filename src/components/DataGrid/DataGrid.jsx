import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import GridHeader from './GridHeader';
import GridRow from './GridRow';
// Import performance-related hooks
import { useThrottle, useDebounce } from './hooks';
import { sortData, getCssVariable } from './utils';
import './DataGrid.css';

// Constants derived from CSS - used in calculations, parsing once is efficient
const ROW_HEIGHT = getCssVariable('--row-height', 35);
const HEADER_HEIGHT = getCssVariable('--header-height', 40);
const FILTER_ROW_HEIGHT = getCssVariable('--filter-row-height', 35);
const OVERSCAN_ROWS = 5; // Render slightly more rows than visible for smoother scrolling

function DataGrid({ initialHeaders = [], initialRows = [] }) {
    const [columns, setColumns] = useState(initialHeaders);
    const [allRows, setAllRows] = useState(initialRows);
    const [columnWidths, setColumnWidths] = useState(() =>
        initialHeaders.reduce((acc, col) => { acc[col.key] = col.width || 150; return acc; }, {})
    );
    const [visibleColumns, setVisibleColumns] = useState(() => initialHeaders.map(c => c.key));
    const [sortConfig, setSortConfig] = useState(null);
    const [filters, setFilters] = useState({});
    // Performance: Debounce filter input state to avoid rapid filtering/re-rendering on every keystroke.
    const debouncedFilters = useDebounce(filters, 300);
    const [scrollTop, setScrollTop] = useState(0);
    const [gridHeight, setGridHeight] = useState(500);
    const [editingCell, setEditingCell] = useState(null);
    const [focusedCell, setFocusedCell] = useState(null);

    const gridContainerRef = useRef(null);
    const isResizingRef = useRef(false);

    useEffect(() => {
        setColumns(initialHeaders);
        setColumnWidths(initialHeaders.reduce((acc, col) => { acc[col.key] = col.width || 150; return acc; }, {}));
        setVisibleColumns(initialHeaders.map(c => c.key));
        setSortConfig(null);
        setFilters({});
        setAllRows(initialRows);
        setScrollTop(0);
        setEditingCell(null);
        setFocusedCell(null);
        handleResize();
    }, [initialHeaders, initialRows]);

    const handleResize = useCallback(() => {
        if (gridContainerRef.current) {
            setGridHeight(gridContainerRef.current.clientHeight);
        }
    }, []);

    // Performance: Debounce resize handler to avoid excessive recalculations during rapid resizing.
    const debouncedResizeHandler = useDebounce(handleResize, 150);

    useEffect(() => {
        handleResize();
        window.addEventListener('resize', debouncedResizeHandler);
        return () => window.removeEventListener('resize', debouncedResizeHandler);
    }, [debouncedResizeHandler]); // Dependency ensures stable debounced function is used

    // Performance: Memoize processed rows (filtering + sorting).
    // This avoids re-calculating on every render unless dependencies (data, filters, sort) change.
    // Filtering and sorting large arrays can be computationally expensive.
    const processedRows = useMemo(() => {
        let filtered = [...allRows];
        // Use debounced filters here for performance.
        const activeFilters = Object.entries(debouncedFilters).filter(([, value]) => value);
        if (activeFilters.length > 0) {
            filtered = filtered.filter(row =>
                activeFilters.every(([key, filterValue]) => {
                    const rowValue = row[key];
                    return rowValue != null && String(rowValue).toLowerCase().includes(String(filterValue).toLowerCase());
                })
            );
        }
        // Sorting is done after filtering on the potentially smaller dataset.
        return sortData(filtered, sortConfig);
        // Dependencies: original data, sort config, *debounced* filters
    }, [allRows, sortConfig, debouncedFilters]);

    // Performance: Core virtualization logic. Memoized calculation of which rows are visible.
    // Determines the subset of `processedRows` to render based on scroll position (`scrollTop`)
    // and container height (`gridHeight`). Avoids rendering thousands of off-screen rows.
    const { virtualRows, totalHeight } = useMemo(() => {
        const rowCount = processedRows.length;
        // Calculate the total height the full list *would* take up. Used for the scrollbar sizing.
        const totalHeightCalc = rowCount * ROW_HEIGHT;
        const currentScrollTop = Math.max(0, scrollTop);

        // Calculate the indices of the rows that should be visible in the viewport.
        const visibleStartIndex = Math.floor(currentScrollTop / ROW_HEIGHT);
        const visibleRowCount = Math.ceil(gridHeight / ROW_HEIGHT);

        // Calculate the start/end indices for the *rendered* rows, including overscan buffer.
        const endIndex = Math.min(rowCount - 1, visibleStartIndex + visibleRowCount + OVERSCAN_ROWS);
        const startIndexCalc = Math.max(0, visibleStartIndex - OVERSCAN_ROWS);

        // Slice the processed data to get only the rows needed for rendering.
        const virtualRowsData = processedRows.slice(startIndexCalc, endIndex + 1).map((row, index) => ({
            data: row,
            originalIndex: startIndexCalc + index, // Keep track of index in the full processed list
            // Style for absolute positioning within the sizer element.
            style: {
                top: `${(startIndexCalc + index) * ROW_HEIGHT}px`,
                height: `${ROW_HEIGHT}px`,
            }
        }));

        return { virtualRows: virtualRowsData, totalHeight: totalHeightCalc };
        // Dependencies: Recalculate only if data changes, scroll position changes, or grid height changes.
    }, [processedRows, scrollTop, gridHeight]);

    // Performance: Throttle scroll handler. Limits the frequency of `setScrollTop` state updates
    // during scrolling, preventing excessive re-renders of the virtualization calculation.
    const handleScroll = useThrottle((event) => {
        // Optimization: Don't update scroll state during column resize drag to prevent jitter.
        if (!isResizingRef.current) {
            setScrollTop(event.target.scrollTop);
        }
    }, 16); // Throttle roughly aiming for 60fps updates

    // Performance: useCallback ensures stable function references are passed to memoized children (GridHeader), preventing unnecessary re-renders.
    const handleSort = useCallback((columnKey, type) => {
        setSortConfig(current => {
            let direction = 'ascending';
            if (current?.key === columnKey && current.direction === 'ascending') {
                direction = 'descending';
            }
            return { key: columnKey, direction, type };
        });
        setScrollTop(0);
        setFocusedCell(null);
    }, []);

    // Performance: useCallback for stable references.
    const handleResizeColumnStart = useCallback(() => { isResizingRef.current = true; }, []);
    // Performance: Throttle column resize updates for smoother visual feedback during drag.
    const handleResizeColumn = useThrottle((columnKey, newWidth) => {
        setColumnWidths(current => ({ ...current, [columnKey]: Math.round(newWidth) }));
    }, 16);
    // Performance: useCallback for stable references.
    const handleResizeColumnEnd = useCallback(() => { isResizingRef.current = false; }, []);

    // Performance: useCallback for stable references passed to filter inputs (though inputs aren't memoized here).
    const handleFilterChange = useCallback((columnKey, value) => {
        setFilters(current => ({ ...current, [columnKey]: value }));
        setScrollTop(0);
        setFocusedCell(null);
    }, []);

    // Performance: useCallback ensures stable function references passed down to GridRow/GridCell.
    const handleStartEdit = useCallback((rowIndex, columnKey) => {
        const targetRow = processedRows[rowIndex];
        if (!targetRow) return;
        const originalRowIndex = allRows.findIndex(r => r.__id === targetRow.__id);
        if (originalRowIndex !== -1) {
            setEditingCell({ rowIndex: originalRowIndex, columnKey });
        }
    }, [processedRows, allRows]); // Depends on processedRows to find the correct item

    // Performance: useCallback ensures stable function references passed down to GridRow/GridCell.
    const handleEndEdit = useCallback((originalRowIndex, columnKey, newValue) => {
        setAllRows(currentRows =>
            currentRows.map((row, index) => {
                if (index === originalRowIndex) {
                    const columnType = columns.find(c => c.key === columnKey)?.type;
                    let processedValue = newValue;
                    if (columnType === 'number') {
                        const num = Number(newValue);
                        processedValue = isNaN(num) ? newValue : num;
                    }
                    return { ...row, [columnKey]: processedValue };
                }
                return row;
            })
        );
        setEditingCell(null);
    }, [columns]); // Depends on columns for type info

    // Performance: useCallback ensures stable function references passed down to GridHeader.
    const handleColumnOrderChange = useCallback((sourceKey, targetKey) => {
        setVisibleColumns(currentOrder => {
            const sourceIndex = currentOrder.indexOf(sourceKey);
            const targetIndex = currentOrder.indexOf(targetKey);
            if (sourceIndex === -1 || targetIndex === -1) return currentOrder;
            const newOrder = [...currentOrder];
            const [movedItem] = newOrder.splice(sourceIndex, 1);
            newOrder.splice(targetIndex, 0, movedItem);
            return newOrder;
        });
    }, []);

    // Performance: useCallback ensures stable function references if passed down (though only used internally here).
    const handleKeyDown = useCallback((e) => {
        if (!focusedCell || editingCell) return;

        const currentColIndex = focusedCell.colIndex;

        let nextOriginalRowIndex = focusedCell.rowIndex;
        let nextColIndex = currentColIndex;
        let shouldPreventDefault = true;

        switch (e.key) {
            case 'ArrowUp':
                nextOriginalRowIndex = Math.max(0, focusedCell.rowIndex - 1);
                break;
            case 'ArrowDown':
                nextOriginalRowIndex = Math.min(processedRows.length - 1, focusedCell.rowIndex + 1);
                break;
            case 'ArrowLeft':
                nextColIndex = Math.max(0, currentColIndex - 1);
                break;
            case 'ArrowRight':
                nextColIndex = Math.min(visibleColumns.length - 1, currentColIndex + 1);
                break;
            case 'PageUp':
                const rowsPerPage = Math.floor((gridHeight - HEADER_HEIGHT - FILTER_ROW_HEIGHT) / ROW_HEIGHT);
                nextOriginalRowIndex = Math.max(0, focusedCell.rowIndex - rowsPerPage);
                break;
            case 'PageDown':
                const rowsPerPageDown = Math.floor((gridHeight - HEADER_HEIGHT - FILTER_ROW_HEIGHT) / ROW_HEIGHT);
                nextOriginalRowIndex = Math.min(processedRows.length - 1, focusedCell.rowIndex + rowsPerPageDown);
                break;
            case 'Home':
                nextColIndex = 0;
                if (e.ctrlKey) nextOriginalRowIndex = 0;
                break;
            case 'End':
                nextColIndex = visibleColumns.length - 1;
                if (e.ctrlKey) nextOriginalRowIndex = processedRows.length - 1;
                break;
            case 'Tab':
                shouldPreventDefault = false;
                break;
            case 'Enter':
            case 'F2':
                const focusedColumnKey = visibleColumns[currentColIndex];
                if (focusedColumnKey) {
                    handleStartEdit(focusedCell.rowIndex, focusedColumnKey); // Uses useCallback version
                    shouldPreventDefault = true;
                }
                break;
            case 'Escape':
                gridContainerRef.current?.blur();
                setFocusedCell(null);
                shouldPreventDefault = true;
                break;
            default:
                shouldPreventDefault = false;
                break;
        }

        if (shouldPreventDefault) e.preventDefault();

        if (nextOriginalRowIndex !== focusedCell.rowIndex || nextColIndex !== focusedCell.colIndex) {
            const newFocusedCell = { rowIndex: nextOriginalRowIndex, colIndex: nextColIndex };
            setFocusedCell(newFocusedCell);

            const cellTop = nextOriginalRowIndex * ROW_HEIGHT;
            const cellBottom = cellTop + ROW_HEIGHT;
            const containerScrollTop = gridContainerRef.current.scrollTop;
            const containerHeight = gridContainerRef.current.clientHeight;
            const headerTotalHeight = HEADER_HEIGHT + FILTER_ROW_HEIGHT;

            let newScrollTop = containerScrollTop;

            if (cellTop < containerScrollTop) {
                newScrollTop = cellTop;
            } else if (cellBottom > containerScrollTop + containerHeight - headerTotalHeight) {
                newScrollTop = cellBottom - (containerHeight - headerTotalHeight);
            }

            if (newScrollTop !== containerScrollTop) {
                gridContainerRef.current.scrollTop = Math.max(0, newScrollTop);
            }
        }

        // Dependencies include state and handlers that might change.
    }, [focusedCell, editingCell, virtualRows, visibleColumns.length, handleStartEdit, processedRows.length, gridHeight]);


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (gridContainerRef.current && !gridContainerRef.current.contains(event.target)) {
                setEditingCell(null);
                setFocusedCell(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Performance: useCallback ensures stable function references passed down to GridRow/GridCell wrappers.
    const handleCellClick = useCallback((originalRowIndex, colIndex) => {
        setFocusedCell({ rowIndex: originalRowIndex, colIndex });
        if (document.activeElement !== gridContainerRef.current) {
            gridContainerRef.current?.focus({ preventScroll: true });
        }
    }, []);


    // Performance: Memoize total grid width calculation. Avoids recalculating on every render
    // unless the visible columns or their specific widths change.
    const totalGridWidth = useMemo(() => {
        return visibleColumns.reduce((sum, key) => sum + (columnWidths[key] || 150), 0);
    }, [visibleColumns, columnWidths]);

    if (!columns || columns.length === 0) {
        return <div className="grid-empty">No data loaded or empty file.</div>;
    }

    return (
        <div
            ref={gridContainerRef}
            className="grid-container"
            onScroll={handleScroll} // Attach throttled scroll handler
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="grid"
            aria-rowcount={processedRows.length}
            aria-colcount={visibleColumns.length}
        >
            <div
                className="grid-header-sticky-wrapper"
                style={{ width: `${totalGridWidth}px` }} // Use memoized width
            >
                <table className="grid-table">
                    {/* GridHeader is memoized, benefits from stable props via useCallback */}
                    <GridHeader
                        columns={columns}
                        visibleColumns={visibleColumns}
                        sortConfig={sortConfig}
                        onSort={handleSort} // useCallback used for stability
                        onResizeColumnStart={handleResizeColumnStart} // useCallback used for stability
                        onResizeColumn={handleResizeColumn} // Throttled version
                        onResizeColumnEnd={handleResizeColumnEnd} // useCallback used for stability
                        columnWidths={columnWidths}
                        onColumnOrderChange={handleColumnOrderChange} // useCallback used for stability
                    />
                </table>
                <div className="filter-row">
                    {visibleColumns.map((key) => {
                        const column = columns.find(c => c.key === key);
                        if (!column) return null;
                        const width = columnWidths[column.key] || column.width;
                        return (
                            <div
                                key={`filter-${key}`}
                                className="filter-cell"
                                style={{ width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` }}
                            >
                                <input
                                    type="text"
                                    className="filter-input"
                                    placeholder={`Filter...`}
                                    value={filters[key] || ''}
                                    onChange={(e) => handleFilterChange(key, e.target.value)} // useCallback used for stability
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Sizer element establishes the full scrollable height/width based on ALL rows/columns */}
            {/* Performance: Its height (`totalHeight`) makes the scrollbar represent the full dataset size. */}
            {/* Performance: Its width (`totalGridWidth`) ensures horizontal scrolling works correctly. */}
            <div
                className="grid-sizer"
                style={{ height: `${totalHeight}px`, width: `${totalGridWidth}px` }}
            >
                {/* Performance: Render ONLY the calculated `virtualRows` */}
                {/* This map is the core of displaying the virtualized data. */}
                {/* It iterates over a small subset (e.g., ~20-50 rows) instead of thousands. */}
                {virtualRows.map(({ data: row, originalIndex, style }) => {
                    const actualRowIndexInAllRows = editingCell ? allRows.findIndex(r => r.__id === row.__id) : -1;
                    const isEditingThisRow = editingCell?.rowIndex === actualRowIndexInAllRows;
                    const isFocusedRow = focusedCell?.rowIndex === originalIndex;

                    return (
                        <div
                            key={row.__id} // Crucial for React reconciliation performance
                            className="grid-row-wrapper"
                            style={style} // Apply calculated absolute positioning
                            onClick={(e) => {
                                const rowRect = e.currentTarget.getBoundingClientRect();
                                const clickX = e.clientX - rowRect.left;
                                let currentX = 0;
                                let clickedColIndex = -1;
                                for(let i = 0; i < visibleColumns.length; i++) {
                                    const colKey = visibleColumns[i];
                                    const colWidth = columnWidths[colKey] || 150;
                                    if (clickX >= currentX && clickX < currentX + colWidth) {
                                        clickedColIndex = i;
                                        break;
                                    }
                                    currentX += colWidth;
                                }
                                if (clickedColIndex !== -1) {
                                    handleCellClick(originalIndex, clickedColIndex); // useCallback used for stability
                                } else {
                                    handleCellClick(originalIndex, 0); // useCallback used for stability
                                }
                            }}
                        >
                            {/* GridRow component is memoized (React.memo) */}
                            {/* Performance relies on passing stable props (row data might change, but handlers/config often don't) */}
                            <GridRow
                                row={row}
                                rowIndex={originalIndex}
                                columns={columns}
                                visibleColumns={visibleColumns}
                                style={{}}
                                editingCell={isEditingThisRow ? editingCell : null}
                                onStartEdit={handleStartEdit} // useCallback used for stability
                                onEndEdit={handleEndEdit}     // useCallback used for stability
                                focusedCell={isFocusedRow ? focusedCell : null}
                                columnWidths={columnWidths}
                            />
                        </div>
                    );
                })}
            </div>
            {processedRows.length === 0 && Object.values(filters).some(v => v) && (
                <div className="grid-empty" style={{ position: 'absolute', top: `${HEADER_HEIGHT + FILTER_ROW_HEIGHT}px`, left: 0, right: 0, width: `${totalGridWidth}px` }}>No rows match filters.</div>
            )}
        </div>
    );
}

export default DataGrid;