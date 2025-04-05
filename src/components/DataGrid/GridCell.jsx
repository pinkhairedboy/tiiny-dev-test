import React, { useState, useEffect, useRef } from 'react';
import './DataGrid.css';
import { formatCellValue } from './utils';

function GridCell({
                      value, column, rowIndex, colIndex, isEditing, onStartEdit, onEndEdit, isFocused, style
                  }) {
    const [editValue, setEditValue] = useState(value);
    const inputRef = useRef(null);
    const cellRef = useRef(null);

    const dataType = column.type || 'text';
    const formattedValue = formatCellValue(value, dataType);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleDoubleClick = () => {
        if (onStartEdit) {
            setEditValue(value);
            onStartEdit(rowIndex, column.key);
        }
    };

    const handleInputChange = (e) => setEditValue(e.target.value);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (onEndEdit) onEndEdit(rowIndex, column.key, editValue);
        } else if (e.key === 'Escape') {
            if (onEndEdit) onEndEdit(rowIndex, column.key, value);
        }
    };

    const handleBlur = () => {
        if (isEditing && onEndEdit) {
            onEndEdit(rowIndex, column.key, editValue);
        }
    };

    const cellContent = isEditing ? (
        <input
            ref={inputRef}
            type={dataType === 'number' ? 'number' : 'text'}
            value={editValue ?? ''}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onClick={(e) => e.stopPropagation()}
        />
    ) : (
        formattedValue
    );

    const cellClasses = `grid-cell ${isFocused ? 'focused' : ''}`;

    return (
        <div
            ref={cellRef}
            className={cellClasses}
            style={style}
            data-type={dataType}
            onDoubleClick={handleDoubleClick}
            role="gridcell"
            aria-colindex={colIndex + 1}
        >
            {cellContent}
        </div>
    );
}

export default React.memo(GridCell, (prevProps, nextProps) => {
    return (
        prevProps.value === nextProps.value &&
        prevProps.column.key === nextProps.column.key &&
        prevProps.column.type === nextProps.column.type &&
        prevProps.isEditing === nextProps.isEditing &&
        prevProps.isFocused === nextProps.isFocused &&
        prevProps.style?.width === nextProps.style?.width
    );
});