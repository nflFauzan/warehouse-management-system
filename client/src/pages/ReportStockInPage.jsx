import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import PageHeader from '../components/PageHeader';
import { formatDate } from '../utils/dateUtils';
import { formatNumber } from '../utils/format';

export default function ReportStockInPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stockIns, setStockIns] = useState([]);

  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [filters, setFilters] = useState({ date_from: firstOfMonth, date_to: today });

  useEffect(() => { fetchReport(); }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/stock-in', { params: filters });
      setStockIns(res.data.stockIns || []);
    } catch (err) {
      addToast('Gagal memuat laporan barang masuk', 'error');
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
      <PageHeader title="Laporan Barang Masuk" />

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
          <button type="submit" className="btn-secondary">Tampilkan</button>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">Memuat laporan...</div>
      ) : stockIns.length === 0 ? (
        <div className="card text-center text-gray-400 py-8">Tidak ada data pada periode ini</div>
      ) : (
        stockIns.map((si) => (
          <div key={si.id} className="card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <Link to={`/transaksi/masuk/${si.id}`} className="font-mono text-sm font-bold text-blue-primary hover:underline">{si.reference_no}</Link>
                <span className="text-sm text-gray-500 ml-2">{formatDate(si.received_at)}</span>
              </div>
              <span className="text-sm text-gray-500">{si.supplier ? si.supplier.name : ''}</span>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {si.items?.map((line) => (
                  <tr key={line.id} className="border-b border-gray-50">
                    <td className="py-2 font-mono text-xs text-gray-500">{line.item ? line.item.code : '-'}</td>
                    <td className="py-2">{line.item ? line.item.name : '-'}</td>
                    <td className="py-2 text-right font-mono font-bold text-success">
                      +{formatNumber(line.quantity)} {line.item?.unit?.abbr || ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}
