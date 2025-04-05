import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import './FileUpload.css';
import { inferDataType } from '../DataGrid/utils';

function FileUpload({ onDataLoaded }) {
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFileChange = useCallback((event) => {
        const file = event.target.files[0];
        if (!file) {
            setError('');
            setFileName('');
            onDataLoaded(null);
            return;
        }

        if (file.type !== 'text/csv') {
            setError('Invalid file type. Please upload a CSV file.');
            setFileName('');
            onDataLoaded(null);
            event.target.value = null;
            return;
        }

        setError('');
        setFileName(file.name);
        setLoading(true);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: false,
            complete: (results) => {
                if (results.errors.length > 0) {
                    console.error("CSV Parsing Errors:", results.errors);
                    setError(`Error parsing CSV: ${results.errors[0].message}. Please check file format.`);
                    setLoading(false);
                    onDataLoaded(null);
                    return;
                }

                const headers = (results.meta.fields || []).map(field => {
                    let type = 'text';
                    if (results.data.length > 0) {
                        const sampleSize = Math.min(100, results.data.length);
                        let potentialType = 'text';
                        for(let i = 0; i < sampleSize; i++) {
                            const value = results.data[i]?.[field];
                            const inferred = inferDataType(value);
                            if (i === 0) {
                                potentialType = inferred;
                            } else if (potentialType !== inferred && inferred !== 'text') {
                                if (potentialType === 'text') potentialType = inferred;
                                else if (inferred !== 'text') potentialType = 'text';
                            } else if (potentialType === 'text' && inferred !== 'text') {
                                potentialType = inferred;
                            }
                            if (potentialType !== 'text' && inferred === 'text' && value !== null && value !== undefined && value !== '') {
                                potentialType = 'text';
                                break;
                            }
                        }
                        type = potentialType;
                    }
                    return {
                        key: field,
                        name: field,
                        type: type,
                        sortable: true,
                        width: 150
                    };
                });

                const rowsWithIds = results.data.map((row, index) => ({
                    ...row,
                    __id: `row-${index}`
                }));

                onDataLoaded({ headers, rows: rowsWithIds });
                setLoading(false);
            },
            error: (err) => {
                console.error("PapaParse Error:", err);
                setError(`Failed to parse CSV: ${err.message}`);
                setLoading(false);
                onDataLoaded(null);
            }
        });
    }, [onDataLoaded]);

    return (
        <div className="file-upload-container">
            <label htmlFor="csv-upload">
                {loading ? 'Loading...' : 'Upload CSV File'}
            </label>
            <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={loading}
            />
            {fileName && !error && <p className="file-info">Loaded: {fileName}</p>}
            {error && <p className="error-message">{error}</p>}
        </div>
    );
}

export default React.memo(FileUpload);