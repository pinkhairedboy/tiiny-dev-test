import React from 'react';
import GridCell from './GridCell';
import './DataGrid.css';

function GridRow({
                     row, rowIndex, columns, visibleColumns, editingCell, onStartEdit, onEndEdit, focusedCell, columnWidths
                 }) {
    const isEditingRow = editingCell?.rowIndex === rowIndex;
    const isFocusedRow = focusedCell?.rowIndex === rowIndex;

    return (
        <div className="grid-row" role="row">
            {visibleColumns.map((colKey, colIndex) => {
                const column = columns.find(c => c.key === colKey);
                if (!column) return null;

                const isEditing = isEditingRow && editingCell.columnKey === column.key;
                const isFocused = isFocusedRow && focusedCell.colIndex === colIndex;
                const cellWidth = columnWidths[column.key] || column.width;

                return (
                    <GridCell
                        key={`${row.__id}-${column.key}`}
                        value={row[column.key]}
                        column={column}
                        rowIndex={rowIndex}
                        colIndex={colIndex}
                        isEditing={isEditing}
                        onStartEdit={onStartEdit}
                        onEndEdit={onEndEdit}
                        isFocused={isFocused}
                        style={{ width: `${cellWidth}px`, minWidth: `${cellWidth}px`, maxWidth: `${cellWidth}px` }}
                    />
                );
            })}
        </div>
    );
}

export default React.memo(GridRow, (prevProps, nextProps) => {
    const rowDataChanged = Object.keys(prevProps.row).some(key => prevProps.row[key] !== nextProps.row[key]);
    if (rowDataChanged) return false;
    if (prevProps.visibleColumns.join(',') !== nextProps.visibleColumns.join(',')) return false;
    const widthsChanged = prevProps.visibleColumns.some(key => prevProps.columnWidths[key] !== nextProps.columnWidths[key]);
    if (widthsChanged) return false;

    const wasEditing = prevProps.editingCell?.rowIndex === prevProps.rowIndex;
    const isEditing = nextProps.editingCell?.rowIndex === nextProps.rowIndex;
    if (wasEditing !== isEditing) return false;
    if (isEditing && prevProps.editingCell?.columnKey !== nextProps.editingCell?.columnKey) return false;

    const wasFocusedRow = prevProps.focusedCell?.rowIndex === prevProps.rowIndex;
    const isFocusedRow = nextProps.focusedCell?.rowIndex === nextProps.rowIndex;
    if (wasFocusedRow !== isFocusedRow) return false;

    return !(isFocusedRow && prevProps.focusedCell?.colIndex !== nextProps.focusedCell?.colIndex);
});