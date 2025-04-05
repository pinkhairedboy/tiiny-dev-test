import React, { useCallback } from 'react';
import ColumnResizer from './ColumnResizer';
import './DataGrid.css';

function GridHeader({
                        columns, visibleColumns, sortConfig, onSort, onResizeColumnStart, onResizeColumn, onResizeColumnEnd, columnWidths, onColumnOrderChange
                    }) {

    const handleSort = useCallback((columnKey, type) => {
        onSort(columnKey, type);
    }, [onSort]);

    const handleDragStart = useCallback((e, columnKey) => {
        e.dataTransfer.setData('text/plain', columnKey);
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.classList.add('dragging');
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        e.currentTarget.classList.add('drag-over');
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.currentTarget.classList.remove('drag-over');
    }, []);

    const handleDrop = useCallback((e, targetColumnKey) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        const sourceColumnKey = e.dataTransfer.getData('text/plain');

        if (sourceColumnKey && sourceColumnKey !== targetColumnKey) {
            onColumnOrderChange(sourceColumnKey, targetColumnKey);
        }
        e.target.closest('thead')?.querySelectorAll('th.dragging').forEach(th => th.classList.remove('dragging'));

    }, [onColumnOrderChange]);

    const handleDragEnd = useCallback((e) => {
        e.currentTarget.classList.remove('dragging');
        e.target.closest('thead')?.querySelectorAll('th.drag-over').forEach(th => th.classList.remove('drag-over'));
    }, []);

    const getSortIcon = (columnKey) => {
        if (sortConfig?.key !== columnKey) return <span className="sort-icon">↕</span>;
        return <span className="sort-icon active">{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>;
    };

    return (
        <thead className="grid-header" role="rowgroup">
        <tr role="row">
            {visibleColumns.map((key) => {
                const column = columns.find(c => c.key === key);
                if (!column) return null;
                const width = columnWidths[column.key] || column.width;
                const isSortable = column.sortable !== false;

                return (
                    <th
                        key={column.key}
                        style={{ width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` }}
                        onClick={isSortable ? () => handleSort(column.key, column.type) : undefined}
                        className={isSortable ? 'sortable' : ''}
                        role="columnheader"
                        aria-sort={sortConfig?.key === column.key ? (sortConfig.direction === 'ascending' ? 'ascending' : 'descending') : 'none'}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, column.key)}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, column.key)}
                        onDragEnd={handleDragEnd}
                    >
                        {column.name}
                        {isSortable && getSortIcon(column.key)}
                        <ColumnResizer
                            columnKey={column.key}
                            onResizeStart={onResizeColumnStart}
                            onResize={onResizeColumn}
                            onResizeEnd={onResizeColumnEnd}
                        />
                    </th>
                );
            })}
        </tr>
        </thead>
    );
}

export default React.memo(GridHeader);