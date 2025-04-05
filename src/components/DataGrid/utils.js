export function inferDataType(value) {
    if (value === null || value === undefined || value === '') return 'text';
    if (!isNaN(value) && String(value).trim() !== '') return 'number';
    if (/\d{4}-\d{2}-\d{2}/.test(value) || /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(value)) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) return 'date';
    }
    return 'text';
}

export function sortData(data, sortConfig) {
    if (!sortConfig || !sortConfig.key) {
        return data;
    }
    const { key, direction, type } = sortConfig;
    const sortedData = [...data];

    sortedData.sort((a, b) => {
        const valA = a[key];
        const valB = b[key];

        if (valA == null && valB == null) return 0;
        if (valA == null) return direction === 'ascending' ? -1 : 1;
        if (valB == null) return direction === 'ascending' ? 1 : -1;

        let comparison;
        switch (type) {
            case 'number':
                comparison = Number(valA) - Number(valB);
                break;
            case 'date':
                comparison = new Date(valA).getTime() - new Date(valB).getTime();
                break;
            case 'text':
            default:
                comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
                break;
        }
        return direction === 'ascending' ? comparison : comparison * -1;
    });
    return sortedData;
}

export function formatCellValue(value, type) {
    if (value === null || value === undefined) return '';
    try {
        switch (type) {
            case 'number':
                { const num = Number(value);
                return isNaN(num) ? value : num.toLocaleString(); }
            case 'date':
                { const date = new Date(value);
                return isNaN(date.getTime()) ? value : date.toLocaleDateString(); }
            case 'text':
            default:
                return String(value);
        }
    } catch (error) {
        console.error("Error formatting cell value:", value, type, error);
        return String(value);
    }
}

export function getCssVariable(varName, fallbackValue) {
    if (typeof window === 'undefined') return fallbackValue;
    const value = getComputedStyle(document.documentElement).getPropertyValue(varName);
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? fallbackValue : parsed;
}