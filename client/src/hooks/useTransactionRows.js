import { useState } from 'react';

export function useTransactionRows(initialRowsCount = 1) {
  const [rows, setRows] = useState(
    Array.from({ length: initialRowsCount }, () => ({ 
      id: crypto.randomUUID(), 
      item_id: '', 
      quantity: '', 
      error: '' 
    }))
  );

  const handleRowChange = (id, field, value) => {
    setRows(prev => prev.map(row => {
      if (row.id === id) {
        // Clear error when user changes the value
        return { ...row, [field]: value, error: '' };
      }
      return row;
    }));
  };

  const addRow = () => {
    setRows(prev => [...prev, { id: crypto.randomUUID(), item_id: '', quantity: '', error: '' }]);
  };

  const removeRow = (id) => {
    setRows(prev => {
      if (prev.length === 1) return prev; // Keep at least one row
      return prev.filter(row => row.id !== id);
    });
  };

  // Check if an item is already selected in another row
  const getDisabledStatus = (itemId, currentRowItemId) => {
    const selectedIds = rows.map(r => String(r.item_id)).filter(id => id && id !== String(currentRowItemId));
    return selectedIds.includes(String(itemId));
  };

  // Validate all rows
  const validateRows = () => {
    let hasError = false;
    const validatedRows = rows.map(row => {
      let error = '';
      if (!row.item_id) {
        error = 'Pilih barang';
      } else if (!row.quantity || parseFloat(row.quantity) <= 0) {
        error = 'Kuantitas harus > 0';
      }
      
      if (error) hasError = true;
      return { ...row, error };
    });

    if (hasError) {
      setRows(validatedRows); // Update state to show errors
    }

    return {
      isValid: !hasError,
      validItems: hasError ? [] : validatedRows.map(r => ({ item_id: r.item_id, quantity: r.quantity }))
    };
  };

  return {
    rows,
    handleRowChange,
    addRow,
    removeRow,
    getDisabledStatus,
    validateRows
  };
}
