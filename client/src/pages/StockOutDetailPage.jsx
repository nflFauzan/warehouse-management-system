import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { stockOutService } from '../services/transactionService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatDate } from '../utils/dateUtils';
import { formatNumber } from '../utils/format';

export default function StockOutDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [stockOut, setStockOut] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => { fetchDetail(); }, [id]);

  const fetchDetail = async () => {
    try {
      const data = await stockOutService.getById(id);
      setStockOut(data);
    } catch (err) {
      addToast('Gagal memuat detail transaksi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!window.confirm('Konfirmasi? Stok akan langsung berkurang.')) return;
    setConfirming(true);
    console.log('Attempting to confirm stock out:', id);
    try {
      const res = await stockOutService.confirm(id);
      console.log('Confirmation success:', res);
      addToast('Transaksi berhasil dikonfirmasi');
      fetchDetail();
    } catch (err) {
      console.error('Confirmation error:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || 'Gagal mengkonfirmasi transaksi';
      addToast(msg, 'error');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) return <div className="p-4 text-center text-gray-500">Memuat detail...</div>;
  if (!stockOut) return <div className="p-4 text-center text-red-500">Transaksi tidak ditemukan</div>;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/transaksi/keluar" className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-dark-gray">
              Barang Keluar: <span className="font-mono">{stockOut.reference_no}</span>
            </h1>
            <span className={stockOut.status === 'confirmed' ? 'badge-confirmed' : 'badge-draft'}>
              {stockOut.status === 'confirmed' ? 'CONFIRMED' : 'DRAFT'}
            </span>
          </div>
        </div>
        {stockOut.status === 'draft' && (user?.role === 'admin' || user?.role === 'owner') && (
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="btn-primary disabled:opacity-50"
          >
            {confirming ? 'Memproses...' : 'Konfirmasi Transaksi'}
          </button>
        )}
      </div>

      {/* Info Card */}
      <div className="card mb-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-400 text-xs uppercase mb-1">Tanggal</p>
            <p className="font-medium">{formatDate(stockOut.issued_at)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase mb-1">Customer</p>
            <p className="font-medium">{stockOut.customer ? stockOut.customer.name : '-'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase mb-1">Dikeluarkan Oleh</p>
            <p className="font-medium">{stockOut.issuedBy ? stockOut.issuedBy.name : '-'}</p>
          </div>
        </div>
        {stockOut.notes && (
          <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600">{stockOut.notes}</div>
        )}
        {stockOut.confirmed_at && (
          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
            Dikonfirmasi oleh <strong>{stockOut.confirmedBy ? stockOut.confirmedBy.name : '-'}</strong> pada {formatDate(stockOut.confirmed_at)}
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              <th className="py-3 px-4 text-left">#</th>
              <th className="py-3 px-4 text-left">Kode</th>
              <th className="py-3 px-4 text-left">Nama Barang</th>
              <th className="py-3 px-4 text-right">Qty</th>
              <th className="py-3 px-4 text-left">Satuan</th>
              <th className="py-3 px-4 text-right">Stok Sebelum</th>
              <th className="py-3 px-4 text-right">Stok Sesudah</th>
            </tr>
          </thead>
          <tbody>
            {stockOut.items?.map((line, i) => (
              <tr key={line.id} className="border-b border-gray-50">
                <td className="py-3 px-4 text-gray-400">{i + 1}</td>
                <td className="py-3 px-4 font-mono text-xs">{line.item ? line.item.code : '-'}</td>
                <td className="py-3 px-4 font-medium">{line.item ? line.item.name : '-'}</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-danger">-{formatNumber(line.quantity)}</td>
                <td className="py-3 px-4 text-gray-500">{line.item?.unit ? line.item.unit.abbr : ''}</td>
                <td className="py-3 px-4 text-right font-mono text-gray-500">{formatNumber(line.stock_before)}</td>
                <td className="py-3 px-4 text-right font-mono font-bold">{formatNumber(line.stock_after)}</td>
              </tr>
            ))}
            {(!stockOut.items || stockOut.items.length === 0) && (
              <tr><td colSpan="7" className="text-center py-6 text-gray-400">Tidak ada barang</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
