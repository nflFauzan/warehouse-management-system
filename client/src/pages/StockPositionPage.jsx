import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { stockPositionService } from '../services/transactionService';
import { useToast } from '../contexts/ToastContext';
import { formatNumber } from '../utils/format';

export default function StockPositionPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState({ totalItems: 0, criticalItemsCount: 0, emptyItemsCount: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', category_id: '', status: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const { addToast } = useToast();

  const fetchData = useCallback(async (params) => {
    setLoading(true);
    try {
      const data = await stockPositionService.get(params);
      setItems(data.items || []);
      setCategories(data.categories || []);
      setSummary(data.summary || { totalItems: 0, criticalItemsCount: 0, emptyItemsCount: 0 });
      setTotalPages(data.totalPages || 1);
      setCount(data.count || 0);
    } catch (err) {
      addToast('Gagal memuat posisi stok', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData({ search: filters.search.trim(), category_id: filters.category_id, status: filters.status, page });
  }, [page, filters.category_id, filters.status]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData({ search: filters.search.trim(), category_id: filters.category_id, status: filters.status, page: 1 });
  };

  // safe count = totalItems - critical - empty
  const safeCount = Math.max(0, summary.totalItems - summary.criticalItemsCount - summary.emptyItemsCount);

  return (
    <div>
      {/* Summary Cards — matches EJS exactly: 4 cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="card text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Item</p>
          <p className="text-2xl font-bold font-mono text-dark-gray">{summary.totalItems}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Stok Aman</p>
          <p className="text-2xl font-bold font-mono text-success">{safeCount}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Stok Kritis</p>
          <p className="text-2xl font-bold font-mono text-danger">{summary.criticalItemsCount}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Stok Habis</p>
          <p className="text-2xl font-bold font-mono text-gray-700">{summary.emptyItemsCount}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-dark-gray">Posisi Stok</h1>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              placeholder="Cari kode/nama..."
              className="form-input"
            />
          </div>
          <div className="w-44">
            <select
              value={filters.category_id}
              onChange={e => { setFilters(f => ({ ...f, category_id: e.target.value })); setPage(1); }}
              className="form-select"
            >
              <option value="">Semua Kategori</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="w-36">
            <select
              value={filters.status}
              onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}
              className="form-select"
            >
              <option value="">Semua Status</option>
              <option value="safe">Aman</option>
              <option value="critical">Kritis</option>
              <option value="empty">Habis</option>
            </select>
          </div>
          <button type="submit" className="btn-secondary">Filter</button>
          <button type="button" onClick={() => { setFilters({ search: '', category_id: '', status: '' }); setPage(1); fetchData({ page: 1 }); }} className="btn-ghost">Reset</button>
        </form>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              <th className="text-left py-3 px-4">Kode</th>
              <th className="text-left py-3 px-4">Nama Barang</th>
              <th className="text-left py-3 px-4">Kategori</th>
              <th className="text-left py-3 px-4">Lokasi</th>
              <th className="text-right py-3 px-4">Stok</th>
              <th className="text-right py-3 px-4">Min.</th>
              <th className="text-left py-3 px-4 w-40">Level</th>
              <th className="text-center py-3 px-4">Status</th>
              <th className="text-center py-3 px-4">Riwayat</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" className="text-center py-8 text-gray-400">Memuat...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan="10" className="text-center py-8 text-gray-400">Tidak ada data</td></tr>
            ) : (
              items.map(item => {
                const st = getItemStatus(item);
                const min = parseFloat(item.minimum_stock) || 0;
                const cur = parseFloat(item.current_stock) || 0;
                const pct = min > 0 ? Math.min(100, (cur / min) * 50) : 100;
                const barColor = pct >= 50 ? 'bg-green-600' : (pct >= 25 ? 'bg-yellow-500' : 'bg-red-600');
                
                // Get unique locations
                const locations = item.positions?.map(p => p.slot?.name).filter(Boolean) || [];
                const uniqueLocs = [...new Set(locations)];

                return (
                  <tr key={item.id} className={`border-b border-gray-50 hover:bg-gray-50/50 ${st === 'critical' ? 'bg-[#FFF5F5]' : st === 'empty' ? 'bg-[#FFFBF0]' : ''}`}>
                    <td className="py-3 px-4 font-mono text-xs font-medium">{item.code}</td>
                    <td className="py-3 px-4 font-medium">{item.name}</td>
                    <td className="py-3 px-4 text-gray-500">{item.category ? item.category.name : '-'}</td>
                    <td className="py-3 px-4">
                      {uniqueLocs.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {uniqueLocs.map((loc, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold border border-blue-100">
                              {loc}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-300 italic text-[10px]">Belum dialokasi</span>
                      )}
                    </td>
                    <td className={`py-3 px-4 text-right font-mono font-bold ${st === 'critical' ? 'text-danger' : ''}`}>
                      {formatNumber(item.current_stock)} <span className="text-gray-400 font-normal text-xs">{item.unit ? item.unit.abbr : ''}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-gray-500">{formatNumber(item.minimum_stock)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`${barColor} h-full rounded-full`} style={{ width: `${pct}%` }}></div>
                        </div>
                        <span className="text-xs text-gray-500 w-8 text-right font-mono">{Math.round(pct)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {st === 'safe' ? <span className="badge-safe">AMAN</span>
                        : st === 'critical' ? <span className="badge-critical">KRITIS</span>
                        : st === 'empty' ? <span className="badge-empty">HABIS</span>
                        : <span className="badge bg-gray-50 text-gray-400 border border-gray-200">—</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link to={`/stock/${item.id}/history`} className="text-blue-primary hover:underline text-xs font-medium">Riwayat →</Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">{count} item</p>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 rounded text-xs font-medium ${p === page ? 'bg-blue-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getItemStatus(item) {
  const cur = parseFloat(item.current_stock) || 0;
  const min = parseFloat(item.minimum_stock) || 0;
  if (min <= 0) return cur <= 0 ? 'empty' : 'no_min';
  if (cur <= 0) return 'empty';
  if (cur <= min) return 'critical';
  return 'safe';
}
