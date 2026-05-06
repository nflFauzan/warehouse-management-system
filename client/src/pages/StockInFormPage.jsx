import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { stockInService } from '../services/transactionService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';

// Debounce helper
function useDebounce(fn, delay) {
  const timer = useRef({});
  return useCallback((key, ...args) => {
    clearTimeout(timer.current[key]);
    timer.current[key] = setTimeout(() => fn(key, ...args), delay);
  }, [fn, delay]);
}

const emptyRow = () => ({
  id: Math.random(),
  item_id: '', search: '', quantity: '', unit: '',
  stock_before: 0, stock_after: 0,
  results: [], showDropdown: false, loading: false, searched: false, highlightIndex: -1
});

export default function StockInFormPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState([]);

  const [formData, setFormData] = useState({
    reference_no: '', received_at: '', supplier_id: '', supplier_ref: '', notes: ''
  });

  const [rows, setRows] = useState([emptyRow()]);

  useEffect(() => {
    stockInService.getFormData().then(data => {
      setFormData(prev => ({ ...prev, reference_no: data.refNo, received_at: data.today }));
      setSuppliers(data.suppliers || []);
    }).catch(() => {
      addToast('Gagal memuat form', 'error');
      navigate('/transaksi/masuk');
    }).finally(() => setPageLoading(false));
  }, []);

  // Search items from API
  const searchItems = async (rowId, q) => {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, loading: true, showDropdown: true, highlightIndex: -1 } : r));
    try {
      const res = await api.get(`/items/search?q=${encodeURIComponent(q || '')}`);
      const results = Array.isArray(res.data) ? res.data : [];
      setRows(prev => prev.map(r => r.id === rowId ? { ...r, results, searched: true, loading: false } : r));
    } catch {
      setRows(prev => prev.map(r => r.id === rowId ? { ...r, results: [], loading: false } : r));
    }
  };

  const debouncedSearch = useDebounce(searchItems, 250);

  const handleSearchChange = (rowId, val) => {
    setRows(prev => prev.map(r => r.id === rowId
      ? { ...r, search: val, item_id: '', unit: '', stock_before: 0, stock_after: 0 }
      : r));
    debouncedSearch(rowId, val);
  };

  const handleFocus = async (rowId) => {
    const row = rows.find(r => r.id === rowId);
    if (row && row.results.length === 0 && !row.item_id) {
      await searchItems(rowId, row.search);
    }
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, showDropdown: true } : r));
  };

  const selectItem = (rowId, item) => {
    setRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      const qty = parseFloat(r.quantity) || 0;
      const before = parseFloat(item.current_stock) || 0;
      return {
        ...r,
        item_id: item.id,
        search: `${item.code} — ${item.name}`,
        unit: item.unit,
        stock_before: before,
        stock_after: before + qty,
        showDropdown: false, results: [], searched: false, highlightIndex: -1
      };
    }));
  };

  const handleQtyChange = (rowId, qty) => {
    setRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      const q = parseFloat(qty) || 0;
      return { ...r, quantity: qty, stock_after: r.stock_before + q };
    }));
  };

  const removeRow = (rowId) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter(r => r.id !== rowId));
  };

  const addRow = () => setRows(prev => [...prev, emptyRow()]);

  const highlightNext = (rowId) => {
    setRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      return { ...r, highlightIndex: (r.highlightIndex + 1) % Math.max(r.results.length, 1) };
    }));
  };

  const highlightPrev = (rowId) => {
    setRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      const len = r.results.length;
      return { ...r, highlightIndex: r.highlightIndex <= 0 ? len - 1 : r.highlightIndex - 1 };
    }));
  };

  const selectHighlighted = (rowId) => {
    const row = rows.find(r => r.id === rowId);
    if (row && row.highlightIndex >= 0 && row.highlightIndex < row.results.length) {
      selectItem(rowId, row.results[row.highlightIndex]);
    }
  };

  const formatNum = (n) => (parseFloat(n) || 0).toLocaleString('id-ID');

  const handleSubmit = async (e, action) => {
    e.preventDefault();
    const hasValidItem = rows.some(r => r.item_id && parseFloat(r.quantity) > 0);
    if (!hasValidItem) {
      addToast('Tambahkan minimal satu barang dengan qty lebih dari 0.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const items = rows.filter(r => r.item_id && parseFloat(r.quantity) > 0).map(r => ({
        item_id: r.item_id, quantity: parseFloat(r.quantity)
      }));
      const res = await stockInService.create({ ...formData, items });
      if (action === 'confirm' && res.stockIn?.id) {
        await stockInService.confirm(res.stockIn.id);
        addToast('Transaksi berhasil dikonfirmasi & stok diperbarui');
      } else {
        addToast('Draft transaksi berhasil disimpan');
      }
      navigate(`/transaksi/masuk/${res.stockIn.id}`);
    } catch (err) {
      addToast(err.response?.data?.error || 'Gagal menyimpan transaksi', 'error');
      setSubmitting(false);
    }
  };

  if (pageLoading) return <div className="p-4 text-center text-gray-500">Memuat form...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/transaksi/masuk" className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-dark-gray">Tambah Barang Masuk</h1>
          <p className="text-sm text-gray-500">Catat penerimaan barang dari supplier</p>
        </div>
      </div>

      <form onSubmit={(e) => e.preventDefault()}>
        {/* Header */}
        <div className="card mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">No. Referensi</label>
              <input type="text" value={formData.reference_no} readOnly className="form-input font-mono bg-gray-50" />
            </div>
            <div>
              <label className="form-label">Tanggal Diterima *</label>
              <input type="date" value={formData.received_at} onChange={e => setFormData(f => ({ ...f, received_at: e.target.value }))} required className="form-input" />
            </div>
            <div>
              <label className="form-label">Supplier *</label>
              <select value={formData.supplier_id} onChange={e => setFormData(f => ({ ...f, supplier_id: e.target.value }))} required className="form-select">
                <option value="">Pilih Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="form-label">No. SJ Supplier</label>
              <input type="text" value={formData.supplier_ref} onChange={e => setFormData(f => ({ ...f, supplier_ref: e.target.value }))} className="form-input" placeholder="Opsional" />
            </div>
            <div>
              <label className="form-label">Diterima Oleh</label>
              <input type="text" value={user?.name || ''} readOnly className="form-input bg-gray-50" />
            </div>
          </div>
          <div className="mt-4">
            <label className="form-label">Catatan</label>
            <textarea value={formData.notes} onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))} rows="2" className="form-input" placeholder="Catatan tambahan (opsional)"></textarea>
          </div>
        </div>

        {/* Item Rows */}
        <div className="card mb-4">
          <h3 className="text-sm font-bold text-dark-gray uppercase tracking-wider mb-4">Detail Barang</h3>
          <div className="w-full">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="py-2 px-3 text-left w-8">#</th>
                  <th className="py-2 px-3 text-left">Barang</th>
                  <th className="py-2 px-3 text-right w-28">Qty</th>
                  <th className="py-2 px-3 text-left w-20">Satuan</th>
                  <th className="py-2 px-3 text-right w-28">Stok Sebelum</th>
                  <th className="py-2 px-3 text-right w-28">Stok Sesudah</th>
                  <th className="py-2 px-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id} className="border-b border-gray-50">
                    <td className="py-2 px-3 text-gray-400">{index + 1}</td>
                    <td className="py-2 px-3 relative" style={row.showDropdown ? { zIndex: 50 } : {}}>
                      <input
                        type="text"
                        value={row.search}
                        onChange={e => handleSearchChange(row.id, e.target.value)}
                        onFocus={() => handleFocus(row.id)}
                        onBlur={() => setTimeout(() => setRows(prev => prev.map(r => r.id === row.id ? { ...r, showDropdown: false } : r)), 150)}
                        onKeyDown={e => {
                          if (e.key === 'Escape') setRows(prev => prev.map(r => r.id === row.id ? { ...r, showDropdown: false } : r));
                          if (e.key === 'ArrowDown') { e.preventDefault(); highlightNext(row.id); }
                          if (e.key === 'ArrowUp') { e.preventDefault(); highlightPrev(row.id); }
                          if (e.key === 'Enter') { e.preventDefault(); selectHighlighted(row.id); }
                        }}
                        className="form-input text-sm"
                        placeholder="Ketik kode/nama barang..."
                        autoComplete="off"
                      />
                      {row.showDropdown && (
                        <div
                          className="absolute z-10 left-3 right-3 top-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                          onMouseLeave={() => setRows(prev => prev.map(r => r.id === row.id ? { ...r, highlightIndex: -1 } : r))}
                        >
                          {row.loading ? (
                            <div className="px-3 py-3 text-sm text-gray-400 flex items-center gap-2">
                              <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                              Mencari...
                            </div>
                          ) : row.results.length > 0 ? (
                            row.results.map((item, idx) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => selectItem(row.id, item)}
                                onMouseEnter={() => setRows(prev => prev.map(r => r.id === row.id ? { ...r, highlightIndex: idx } : r))}
                                className={`w-full text-left px-3 py-2 hover:bg-blue-50 text-sm flex justify-between items-center transition-colors ${row.highlightIndex === idx ? 'bg-blue-50' : ''}`}
                              >
                                <span>
                                  <span className="font-mono text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{item.code}</span>
                                  <span className="ml-2">{item.name}</span>
                                </span>
                                <span className="font-mono text-xs text-gray-400 flex-shrink-0 ml-2">{item.current_stock} {item.unit}</span>
                              </button>
                            ))
                          ) : row.searched ? (
                            <div className="px-3 py-3 text-sm text-gray-400 text-center">
                              <svg className="w-5 h-5 mx-auto mb-1 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                              Barang tidak ditemukan
                            </div>
                          ) : null}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={row.quantity}
                        onChange={e => handleQtyChange(row.id, e.target.value)}
                        min="0.01" step="0.01"
                        className="form-input text-right font-mono w-28"
                      />
                    </td>
                    <td className="py-2 px-3 font-mono text-xs text-gray-500">{row.unit}</td>
                    <td className="py-2 px-3 text-right font-mono text-gray-500">{formatNum(row.stock_before)}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-success">{formatNum(row.stock_after)}</td>
                    <td className="py-2 px-3">
                      {rows.length > 1 && (
                        <button type="button" onClick={() => removeRow(row.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-danger">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={addRow} className="mt-3 text-sm text-blue-primary hover:underline font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            Tambah Baris
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button type="button" onClick={(e) => handleSubmit(e, 'draft')} disabled={submitting} className="btn-ghost">
            Simpan Draft
          </button>
          {(user?.role === 'admin' || user?.role === 'owner') && (
            <button
              type="button"
              onClick={(e) => { if (window.confirm('Konfirmasi transaksi ini? Stok akan langsung diperbarui.')) handleSubmit(e, 'confirm'); }}
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? 'Memproses...' : 'Konfirmasi & Simpan'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
