import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import PageHeader from '../components/PageHeader';
import { formatNumber } from '../utils/format';

export default function ReportStockPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  // Default: first day of current month → today
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [filters, setFilters] = useState({ date_from: firstOfMonth, date_to: today, category_id: '' });

  useEffect(() => { fetchReport(); }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/stock', { params: filters });
      setData(res.data);
    } catch (err) {
      addToast('Gagal memuat laporan stok', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchReport();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Laporan Stok Periodik" />
      <p className="text-sm text-gray-500 -mt-4">Ringkasan mutasi stok per periode</p>

      {/* Filters */}
      <div className="card">
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="form-label">Dari</label>
            <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} className="form-input" />
          </div>
          <div>
            <label className="form-label">Sampai</label>
            <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} className="form-input" />
          </div>
          <div className="w-44">
            <label className="form-label">Kategori</label>
            <select value={filters.category_id} onChange={(e) => setFilters({ ...filters, category_id: e.target.value })} className="form-select">
              <option value="">Semua</option>
              {data?.categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-secondary">Tampilkan</button>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">Memuat laporan...</div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card text-center">
              <p className="text-xs text-gray-500 uppercase mb-1">Total Masuk</p>
              <p className="text-xl font-bold font-mono text-success">+{formatNumber(data.summary.total_in)}</p>
            </div>
            <div className="card text-center">
              <p className="text-xs text-gray-500 uppercase mb-1">Total Keluar</p>
              <p className="text-xl font-bold font-mono text-danger">-{formatNumber(data.summary.total_out)}</p>
            </div>
            <div className="card text-center">
              <p className="text-xs text-gray-500 uppercase mb-1">Selisih Bersih</p>
              <p className={`text-xl font-bold font-mono ${data.summary.net >= 0 ? 'text-success' : 'text-danger'}`}>
                {data.summary.net >= 0 ? '+' : ''}{formatNumber(data.summary.net)}
              </p>
            </div>
          </div>

          {/* Data Table */}
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="py-3 px-4 text-left">Kode</th>
                  <th className="py-3 px-4 text-left">Nama</th>
                  <th className="py-3 px-4 text-left">Kategori</th>
                  <th className="py-3 px-4 text-right">Stok Awal</th>
                  <th className="py-3 px-4 text-right">Masuk</th>
                  <th className="py-3 px-4 text-right">Keluar</th>
                  <th className="py-3 px-4 text-right">Stok Akhir</th>
                </tr>
              </thead>
              <tbody>
                {data.items.length === 0 ? (
                  <tr><td colSpan="7" className="text-center py-8 text-gray-400">Tidak ada data pada periode ini</td></tr>
                ) : (
                  data.items.map((row) => (
                    <tr key={row.item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-mono text-xs">{row.item.code}</td>
                      <td className="py-3 px-4 font-medium">{row.item.name}</td>
                      <td className="py-3 px-4 text-gray-500">{row.item.category ? row.item.category.name : '-'}</td>
                      <td className="py-3 px-4 text-right font-mono">{formatNumber(row.stok_awal)}</td>
                      <td className="py-3 px-4 text-right font-mono text-success">{row.total_in > 0 ? '+' + formatNumber(row.total_in) : '-'}</td>
                      <td className="py-3 px-4 text-right font-mono text-danger">{row.total_out > 0 ? '-' + formatNumber(row.total_out) : '-'}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {formatNumber(row.stok_akhir)} <span className="text-gray-400 text-xs">{row.item.unit ? row.item.unit.abbr : ''}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
