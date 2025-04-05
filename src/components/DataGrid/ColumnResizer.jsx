import React, { useCallback, useRef, useEffect } from 'react';
import './DataGrid.css';
import { getCssVariable } from './utils';

const MIN_WIDTH = getCssVariable('--min-col-width', 50);
const MAX_WIDTH = getCssVariable('--max-col-width', 500);

function ColumnResizer({ columnKey, onResizeStart, onResize, onResizeEnd }) {
    const resizerRef = useRef(null);
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);
    const isResizingRef = useRef(false);

    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        const thElement = resizerRef.current?.closest('th');
        if (!thElement) return;

        startXRef.current = e.clientX;
        startWidthRef.current = thElement.offsetWidth;
        isResizingRef.current = true;
        resizerRef.current?.classList.add('resizing');
        onResizeStart(columnKey);

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [columnKey, onResizeStart]);

    const handleMouseMove = useCallback((e) => {
        if (!isResizingRef.current) return;
        const currentX = e.clientX;
        const deltaX = currentX - startXRef.current;
        let newWidth = startWidthRef.current + deltaX;
        newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
        onResize(columnKey, newWidth);
    }, [columnKey, onResize]);

    const handleMouseUp = useCallback(() => {
        if (!isResizingRef.current) return;
        isResizingRef.current = false;
        resizerRef.current?.classList.remove('resizing');
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        onResizeEnd(columnKey);
    }, [columnKey, onResizeEnd, handleMouseMove]);

    useEffect(() => {
        const mouseUpHandler = () => handleMouseUp();
        if (isResizingRef.current) {
            document.addEventListener('mouseup', mouseUpHandler);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', mouseUpHandler);
        };
    }, [handleMouseMove, handleMouseUp]);


    return (
        <div
            ref={resizerRef}
            className="column-resizer"
            onMouseDown={handleMouseDown}
            onClick={(e) => e.stopPropagation()}
        />
    );
}

export default React.memo(ColumnResizer);