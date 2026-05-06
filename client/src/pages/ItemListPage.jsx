import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { itemService } from '../services/masterDataService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatNumber } from '../utils/format';

export default function ItemListPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', category_id: '', status: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user } = useAuth();
  const { addToast } = useToast();

  useEffect(() => { fetchItems(); }, [page, filters.category_id, filters.status]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await itemService.getAll({
        search: filters.search.trim(),
        category_id: filters.category_id,
        status: filters.status,
        page
      });
      setItems(data.items || []);
      setCategories(data.categories || []);
      setTotalPages(data.totalPages || 1);
      setCount(data.count || 0);
    } catch (err) {
      addToast('Gagal memuat barang', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchItems();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Nonaktifkan barang ini?')) return;
    try {
      await itemService.delete(id);
      addToast('Barang berhasil dihapus');
      fetchItems();
    } catch (err) {
      addToast('Gagal menghapus barang', 'error');
    }
  };

  const canEdit = user?.role === 'admin' || user?.role === 'owner';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-dark-gray">Master Barang</h1>
          <p className="text-sm text-gray-500">Kelola data barang inventaris gudang</p>
        </div>
        {canEdit && (
          <Link to="/master/items/create" className="btn-primary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            Tambah Barang
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="form-label">Cari</label>
            <input type="text" value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} placeholder="Kode atau nama barang..." className="form-input" />
          </div>
          <div className="w-48">
            <label className="form-label">Kategori</label>
            <select value={filters.category_id} onChange={e => { setFilters(f => ({ ...f, category_id: e.target.value })); setPage(1); }} className="form-select">
              <option value="">Semua Kategori</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="w-40">
            <label className="form-label">Status</label>
            <select value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }} className="form-select">
              <option value="">Semua</option>
              <option value="safe">Aman</option>
              <option value="critical">Kritis</option>
            </select>
          </div>
          <button type="submit" className="btn-secondary">Filter</button>
          <button type="button" onClick={() => { setFilters({ search: '', category_id: '', status: '' }); setPage(1); }} className="btn-ghost">Reset</button>
        </form>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="text-left py-3 px-4">Kode Barang</th>
                <th className="text-left py-3 px-4">Nama</th>
                <th className="text-left py-3 px-4">Kategori</th>
                <th className="text-left py-3 px-4">Satuan</th>
                <th className="text-right py-3 px-4">Stok Saat Ini</th>
                <th className="text-right py-3 px-4">Min. Stok</th>
                <th className="text-center py-3 px-4">Status</th>
                <th className="text-center py-3 px-4">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="text-center py-8 text-gray-500">Memuat...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-8 text-gray-400">Tidak ada data barang</td></tr>
              ) : (
                items.map(item => {
                  const st = getItemStatus(item);
                  return (
                    <tr key={item.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${st === 'critical' ? 'bg-[#FFF5F5]' : st === 'empty' ? 'bg-[#FFFBF0]' : ''}`}>
                      <td className="py-3 px-4 font-mono text-xs font-medium">{item.code}</td>
                      <td className="py-3 px-4 font-medium text-dark-gray">{item.name}</td>
                      <td className="py-3 px-4 text-gray-500">{item.category ? item.category.name : '-'}</td>
                      <td className="py-3 px-4 text-gray-500">{item.unit ? item.unit.name : '-'}</td>
                      <td className={`py-3 px-4 text-right font-mono font-bold ${st === 'critical' ? 'text-danger' : st === 'empty' ? 'text-gray-700' : 'text-dark-gray'}`}>
                        {formatNumber(item.current_stock)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-500">{formatNumber(item.minimum_stock)}</td>
                      <td className="py-3 px-4 text-center">
                        {st === 'safe' ? <span className="badge-safe">AMAN</span>
                          : st === 'critical' ? <span className="badge-critical">KRITIS</span>
                          : st === 'empty' ? <span className="badge-empty">HABIS</span>
                          : <span className="badge bg-gray-50 text-gray-400 border border-gray-200">—</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Link to={`/stock/${item.id}/history`} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-primary" title="Riwayat">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </Link>
                          {canEdit && (
                            <>
                              <Link to={`/master/items/${item.id}/edit`} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-yellow-600" title="Edit">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </Link>
                              <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-danger" title="Hapus">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Menampilkan {(page - 1) * 20 + 1}–{Math.min(page * 20, count)} dari {count} barang</p>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 rounded text-xs font-medium ${p === page ? 'bg-blue-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{p}</button>
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
