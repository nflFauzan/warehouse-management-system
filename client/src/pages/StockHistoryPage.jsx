import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { stockPositionService } from '../services/transactionService';
import { useToast } from '../contexts/ToastContext';
import { formatDate } from '../utils/dateUtils';
import { formatNumber } from '../utils/format';

export default function StockHistoryPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [mutations, setMutations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { addToast } = useToast();

  useEffect(() => { fetchHistory(); }, [id, page]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await stockPositionService.getHistory(id, { page });
      setItem(data.item);
      setMutations(data.history || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      addToast(err.response?.data?.error || 'Gagal memuat riwayat stok', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !item) return <div className="p-4 text-center text-gray-500">Memuat riwayat...</div>;
  if (!item) return <div className="p-4 text-center text-red-500">Barang tidak ditemukan</div>;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header — matches EJS exactly */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/stock" className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-dark-gray">Riwayat Mutasi: {item.name}</h1>
          <p className="text-sm text-gray-500">
            <span className="font-mono">{item.code}</span>
            {item.category ? ` · ${item.category.name}` : ''}
            {' · Stok saat ini: '}
            <span className="font-mono font-bold">{formatNumber(item.current_stock)}</span>
            {item.unit ? ` ${item.unit.abbr}` : ''}
          </p>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              <th className="py-3 px-4 text-left">Tanggal</th>
              <th className="py-3 px-4 text-center">Tipe</th>
              <th className="py-3 px-4 text-right">Qty</th>
              <th className="py-3 px-4 text-right">Stok Sebelum</th>
              <th className="py-3 px-4 text-right">Stok Sesudah</th>
              <th className="py-3 px-4 text-left">Referensi</th>
              <th className="py-3 px-4 text-left">Oleh</th>
            </tr>
          </thead>
          <tbody>
            {loading && mutations.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-8 text-gray-400">Memuat...</td></tr>
            ) : mutations.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-8 text-gray-400">Belum ada riwayat mutasi</td></tr>
            ) : (
              mutations.map(m => (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-4 text-gray-500">{formatDate(m.created_at)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={m.type === 'in' ? 'badge-in' : 'badge-out'}>
                      {m.type === 'in' ? 'MASUK' : 'KELUAR'}
                    </span>
                  </td>
                  <td className={`py-3 px-4 text-right font-mono font-bold ${m.type === 'in' ? 'text-success' : 'text-danger'}`}>
                    {m.type === 'in' ? '+' : '-'}{formatNumber(m.quantity)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-gray-500">{formatNumber(m.stock_before)}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold">{formatNumber(m.stock_after)}</td>
                  <td className="py-3 px-4 font-mono text-xs">
                    <Link
                      to={`/transaksi/${m.reference_type === 'stock_in' ? 'masuk' : 'keluar'}/${m.reference_id}`}
                      className="text-blue-primary hover:underline"
                    >
                      {m.reference_no || `${m.reference_type === 'stock_in' ? 'BM' : 'BK'}-${m.reference_id}`}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{m.createdBy ? m.createdBy.name : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">Halaman {page} dari {totalPages}</span>
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
