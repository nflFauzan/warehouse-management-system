import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { stockOutService } from '../services/transactionService';
import { useToast } from '../contexts/ToastContext';
import { formatDate } from '../utils/dateUtils';

export default function StockOutListPage() {
  const [stockOuts, setStockOuts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { addToast } = useToast();

  useEffect(() => { fetchStockOuts(); }, [page]);

  const fetchStockOuts = async () => {
    setLoading(true);
    try {
      const data = await stockOutService.getAll({ page });
      setStockOuts(data.stockOuts || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      addToast('Gagal memuat data barang keluar', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-dark-gray">Barang Keluar</h1>
          <p className="text-sm text-gray-500">Daftar transaksi barang keluar</p>
        </div>
        <Link to="/transaksi/keluar/create" className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          Buat Baru
        </Link>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              <th className="text-left py-3 px-4">No. Referensi</th>
              <th className="text-left py-3 px-4">Tanggal</th>
              <th className="text-left py-3 px-4">Customer</th>
              <th className="text-left py-3 px-4">Dikeluarkan Oleh</th>
              <th className="text-center py-3 px-4">Status</th>
              <th className="text-center py-3 px-4">Detail</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center py-8 text-gray-400">Memuat...</td></tr>
            ) : stockOuts.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-8 text-gray-400">Belum ada transaksi</td></tr>
            ) : (
              stockOuts.map((so) => (
                <tr key={so.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-4 font-mono text-xs font-semibold text-blue-primary">{so.reference_no}</td>
                  <td className="py-3 px-4">{formatDate(so.issued_at)}</td>
                  <td className="py-3 px-4">{so.customer ? so.customer.name : '-'}</td>
                  <td className="py-3 px-4 text-gray-500">{so.issuedBy ? so.issuedBy.name : '-'}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={so.status === 'confirmed' ? 'badge-confirmed' : 'badge-draft'}>
                      {so.status === 'confirmed' ? 'CONFIRMED' : 'DRAFT'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Link to={`/transaksi/keluar/${so.id}`} className="text-blue-primary hover:underline text-xs font-medium">Lihat →</Link>
                  </td>
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
