import React, { useState, useCallback } from 'react';
import FileUpload from './components/FileUpload/FileUpload';
import DataGrid from './components/DataGrid/DataGrid';
import './App.css';

function App() {
    const [gridData, setGridData] = useState({ headers: [], rows: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [gridKey, setGridKey] = useState(0); // Key to force remount

    const handleDataLoaded = useCallback((data) => {
        setIsLoading(true);
        setTimeout(() => {
            if (data) {
                setGridData({ headers: data.headers, rows: data.rows });
                setGridKey(prevKey => prevKey + 1); // Change key to force remount DataGrid
            } else {
                setGridData({ headers: [], rows: [] });
                setGridKey(prevKey => prevKey + 1); // Also remount when clearing data
            }
            setIsLoading(false);
        }, 50);
    }, []);

    return (
        <div className="App">
            <h1>React Performance Data Grid</h1>
            <p>Upload a CSV file (e.g., <a href="https://dev-test-csv.tiiny.co/SampleCSVFile_556kb.csv" target="_blank" rel="noopener noreferrer">Sample 10k Rows</a>) to render it in the grid below.</p>

            <FileUpload onDataLoaded={handleDataLoaded} />

            {isLoading ? (
                <div className="grid-loading">Loading Grid Data...</div>
            ) : (
                <DataGrid
                    key={gridKey} // Use state key for remounting
                    initialHeaders={gridData.headers}
                    initialRows={gridData.rows}
                />
            )}
            <div style={{marginTop: '20px', fontSize: '0.9em', color: '#aaa'}}>
                <p><strong>Features:</strong> Virtual Scrolling, Sticky Header, Sortable Columns, Resizable Columns, Cell Formatting, Inline Editing, Column Reordering, Filtering, Keyboard Navigation.</p>
            </div>
        </div>
    );
}

export default App;