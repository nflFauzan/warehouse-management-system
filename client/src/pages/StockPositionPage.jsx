import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { stockPositionService, warehouseService } from '../services/transactionService';
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
  const [slots, setSlots] = useState([]);
  const [allocModal, setAllocModal] = useState(null); // { item }
  const [moveModal, setMoveModal] = useState(null);   // { item, fromPos }
  const [submitting, setSubmitting] = useState(false);
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

  const fetchSlots = useCallback(async () => {
    try {
      const data = await warehouseService.getSlots();
      setSlots(data || []);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchData({ search: filters.search.trim(), category_id: filters.category_id, status: filters.status, page });
    fetchSlots();
  }, [page, filters.category_id, filters.status]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData({ search: filters.search.trim(), category_id: filters.category_id, status: filters.status, page: 1 });
  };

  const submitAlloc = async (itemId, slotId, qty, notes) => {
    if (!slotId || !qty || parseFloat(qty) <= 0) return addToast('Lengkapi data terlebih dahulu', 'error');
    setSubmitting(true);
    try {
      await warehouseService.moveStock({ item_id: itemId, to_slot_id: parseInt(slotId), quantity: parseFloat(qty), notes: notes || 'Alokasi dari halaman stok' });
      addToast('Barang berhasil dialokasikan!', 'success');
      setAllocModal(null);
      fetchData({ search: filters.search.trim(), category_id: filters.category_id, status: filters.status, page });
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal mengalokasikan', 'error');
    } finally { setSubmitting(false); }
  };

  const submitMove = async (itemId, fromSlotId, toSlotId, qty, notes) => {
    if (!toSlotId || !qty || parseFloat(qty) <= 0) return addToast('Lengkapi data terlebih dahulu', 'error');
    setSubmitting(true);
    try {
      await warehouseService.moveStock({ item_id: itemId, from_slot_id: parseInt(fromSlotId), to_slot_id: parseInt(toSlotId), quantity: parseFloat(qty), notes: notes || 'Pindah dari halaman stok' });
      addToast('Stok berhasil dipindahkan!', 'success');
      setMoveModal(null);
      fetchData({ search: filters.search.trim(), category_id: filters.category_id, status: filters.status, page });
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal memindahkan stok', 'error');
    } finally { setSubmitting(false); }
  };

  const safeCount = Math.max(0, summary.totalItems - summary.criticalItemsCount - summary.emptyItemsCount);
  const storageSlots = slots.filter(s => s.type === 'storage');

  return (
    <div>
      {/* Summary Cards */}
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
            <input type="text" value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} placeholder="Cari kode/nama..." className="form-input" />
          </div>
          <div className="w-44">
            <select value={filters.category_id} onChange={e => { setFilters(f => ({ ...f, category_id: e.target.value })); setPage(1); }} className="form-select">
              <option value="">Semua Kategori</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="w-36">
            <select value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }} className="form-select">
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
              <th className="text-left py-3 px-4">Lokasi Rak</th>
              <th className="text-right py-3 px-4">Stok</th>
              <th className="text-right py-3 px-4">Min.</th>
              <th className="text-left py-3 px-4 w-40">Level</th>
              <th className="text-center py-3 px-4">Status</th>
              <th className="text-center py-3 px-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" className="text-center py-8 text-gray-400">Memuat...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan="9" className="text-center py-8 text-gray-400">Tidak ada data</td></tr>
            ) : (
              items.map(item => {
                const st = getItemStatus(item);
                const min = parseFloat(item.minimum_stock) || 0;
                const cur = parseFloat(item.current_stock) || 0;
                const pct = min > 0 ? Math.min(100, (cur / min) * 50) : 100;
                const barColor = pct >= 50 ? 'bg-green-600' : (pct >= 25 ? 'bg-yellow-500' : 'bg-red-600');
                const locations = item.positions?.map(p => p.slot?.name).filter(Boolean) || [];
                const uniqueLocs = [...new Set(locations)];
                const hasPositions = item.positions?.length > 0;

                return (
                  <tr key={item.id} className={`border-b border-gray-50 hover:bg-gray-50/50 ${st === 'critical' ? 'bg-[#FFF5F5]' : st === 'empty' ? 'bg-[#FFFBF0]' : ''}`}>
                    <td className="py-3 px-4 font-mono text-xs font-medium">{item.code}</td>
                    <td className="py-3 px-4 font-medium">{item.name}</td>
                    <td className="py-3 px-4 text-gray-500">{item.category ? item.category.name : '-'}</td>
                    <td className="py-3 px-4">
                      {uniqueLocs.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {uniqueLocs.map((loc, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold border border-blue-100">{loc}</span>
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
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setAllocModal({ item })}
                          title="Alokasikan ke rak"
                          className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                        >
                          + Alokasi
                        </button>
                        {hasPositions && (
                          <button
                            onClick={() => setMoveModal({ item, fromPos: item.positions[0] })}
                            title="Pindah stok antar rak"
                            className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-lg hover:bg-amber-500 hover:text-white transition-all"
                          >
                            ⇄ Pindah
                          </button>
                        )}
                        <Link to={`/stock/${item.id}/history`} className="px-2 py-1 bg-gray-50 text-gray-500 text-[10px] font-bold rounded-lg hover:bg-gray-200 transition-all">
                          Riwayat
                        </Link>
                      </div>
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
                <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 rounded text-xs font-medium ${p === page ? 'bg-blue-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{p}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Alokasi Modal */}
      {allocModal && (
        <AllocModal
          item={allocModal.item}
          storageSlots={storageSlots}
          onSubmit={submitAlloc}
          onClose={() => setAllocModal(null)}
          submitting={submitting}
        />
      )}

      {/* Pindah Modal */}
      {moveModal && (
        <MoveModal
          item={moveModal.item}
          fromPos={moveModal.fromPos}
          storageSlots={storageSlots}
          onSubmit={submitMove}
          onClose={() => setMoveModal(null)}
          submitting={submitting}
        />
      )}
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

function AllocModal({ item, storageSlots, onSubmit, onClose, submitting }) {
  const [slotId, setSlotId] = useState('');
  const [qty, setQty] = useState('');
  const [notes, setNotes] = useState('');
  const maxQty = parseFloat(item.current_stock) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 rounded-t-3xl text-white">
          <h3 className="font-black text-base">Alokasi ke Rak</h3>
          <p className="text-blue-100 text-xs mt-1">Barang: <span className="font-bold text-white">{item.name}</span></p>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-blue-50 rounded-2xl p-3 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-blue-500 uppercase">{item.code}</p>
              <p className="font-bold text-gray-800 text-sm">{item.name}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500">Stok Total</p>
              <p className="font-black text-blue-700">{maxQty} {item.unit?.abbr}</p>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Rak Tujuan</label>
            <select value={slotId} onChange={e => setSlotId(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300">
              <option value="">-- Pilih rak --</option>
              {storageSlots.map(s => <option key={s.id} value={s.id}>{s.name}{s.zone ? ` (${s.zone})` : ''}</option>)}
            </select>
            {storageSlots.length === 0 && <p className="text-xs text-amber-600 mt-1">⚠ Belum ada rak tersedia. Buat rak di halaman Layout Gudang.</p>}
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Jumlah</label>
            <input type="number" min="0.01" max={maxQty} value={qty} onChange={e => setQty(e.target.value)} placeholder={`Maks. ${maxQty}`} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Catatan (opsional)</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="mis. Penerimaan batch A" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 text-sm">Batal</button>
            <button onClick={() => onSubmit(item.id, slotId, qty, notes)} disabled={submitting || !slotId || !qty || parseFloat(qty) <= 0} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 text-sm disabled:opacity-50">
              {submitting ? 'Menyimpan...' : 'Alokasikan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MoveModal({ item, fromPos, storageSlots, onSubmit, onClose, submitting }) {
  const [toSlotId, setToSlotId] = useState('');
  const [qty, setQty] = useState(parseFloat(fromPos.quantity) || '');
  const [notes, setNotes] = useState('');
  const maxQty = parseFloat(fromPos.quantity) || 0;
  const fromSlotName = fromPos.slot?.name || `Rak #${fromPos.slot_id}`;
  const availableSlots = storageSlots.filter(s => s.id !== fromPos.slot_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 rounded-t-3xl text-white">
          <h3 className="font-black text-base">Pindah Stok Antar Rak</h3>
          <p className="text-amber-100 text-xs mt-1">Dari rak: <span className="font-bold text-white">{fromSlotName}</span></p>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-amber-50 rounded-2xl p-3 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-amber-600 uppercase">{item.code}</p>
              <p className="font-bold text-gray-800 text-sm">{item.name}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500">Di rak ini</p>
              <p className="font-black text-amber-700">{maxQty} {item.unit?.abbr}</p>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Rak Tujuan</label>
            <select value={toSlotId} onChange={e => setToSlotId(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300">
              <option value="">-- Pilih rak tujuan --</option>
              {availableSlots.map(s => <option key={s.id} value={s.id}>{s.name}{s.zone ? ` (${s.zone})` : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Jumlah yang dipindah</label>
            <input type="number" min="0.01" max={maxQty} value={qty} onChange={e => setQty(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Catatan (opsional)</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="mis. Reorganisasi gudang" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300" />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 text-sm">Batal</button>
            <button onClick={() => onSubmit(item.id, fromPos.slot_id, toSlotId, qty, notes)} disabled={submitting || !toSlotId || !qty || parseFloat(qty) <= 0} className="flex-1 py-2.5 bg-amber-500 text-white font-bold rounded-2xl hover:bg-amber-600 text-sm disabled:opacity-50">
              {submitting ? 'Menyimpan...' : 'Pindahkan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
