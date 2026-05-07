import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { 
  Save, Plus, Trash2, Box, Info, Move, 
  Map as MapIcon, Layers, Activity, Search,
  ChevronRight, ArrowRightLeft, Clock, LayoutGrid
} from 'lucide-react';
import dayjs from 'dayjs';

const WarehouseLayoutPage = () => {
  const { addToast } = useToast();
  const [layout, setLayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotHistory, setSlotHistory] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [movingStock, setMovingStock] = useState(null);
  const [allocatingStock, setAllocatingStock] = useState(false); // For adding items from unallocated
  const [searchQuery, setSearchQuery] = useState('');
  const [allSlots, setAllSlots] = useState([]); // For move destination

  useEffect(() => {
    fetchLayout();
    fetchAllSlots();
  }, []);

  const fetchLayout = async () => {
    try {
      const res = await axios.get('/api/v1/warehouse/layout');
      if (res.data) {
        setLayout(res.data);
      }
      setLoading(false);
    } catch (err) {
      addToast('Gagal memuat layout gudang', 'error');
      setLoading(false);
    }
  };

  const fetchAllSlots = async () => {
    try {
      const res = await axios.get('/api/v1/warehouse/slots');
      setAllSlots(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSlotHistory = async (slotId) => {
    try {
      const res = await axios.get(`/api/v1/warehouse/slots/${slotId}/history`);
      setSlotHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  const handleSelectSlot = (slot) => {
    if (isEditing) {
      // In edit mode, selection just sets the slot to edit its metadata
      setSelectedSlot(slot);
      return;
    }
    setSelectedSlot(slot);
    if (slot && slot.id) {
      fetchSlotHistory(slot.id);
    } else {
      setSlotHistory([]);
    }
  };

  const handleUpdateSlot = async (e) => {
    e.preventDefault();
    try {
      // If it's a new slot (id is temp), we just add it to layout and save the whole layout
      let updatedSlots;
      if (String(selectedSlot.id).startsWith('temp-')) {
        updatedSlots = [...layout.slots, { ...selectedSlot, id: null }]; // Remove temp ID for backend
      } else {
        updatedSlots = layout.slots.map(s => s.id === selectedSlot.id ? selectedSlot : s);
      }
      
      const newLayout = { ...layout, slots: updatedSlots };
      await axios.post('/api/v1/warehouse/layout', newLayout);
      addToast('Informasi slot berhasil disimpan');
      fetchLayout(); // Refresh from server to get real IDs
    } catch (err) {
      addToast('Gagal menyimpan slot', 'error');
    }
  };

  const handleAddSlot = () => {
    const newSlot = {
      id: `temp-${Date.now()}`,
      name: 'NEW-SLOT',
      zone: 'ZONA BARU',
      capacity: 1000,
      x: 0,
      y: 0,
      current_quantity: 0,
      utilization: 0,
      positions: []
    };
    setSelectedSlot(newSlot);
    // Don't add to layout yet, let user edit and click save
  };

  const handleMoveStock = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.target);
      const data = {
        item_id: movingStock.item_id,
        from_slot_id: movingStock.from_slot_id || null, // null means unallocated
        to_slot_id: formData.get('to_slot_id') || movingStock.to_slot_id,
        quantity: formData.get('quantity'),
        notes: formData.get('notes')
      };
      await axios.post('/api/v1/warehouse/move', data);
      addToast('Barang berhasil dialokasikan');
      setMovingStock(null);
      setAllocatingStock(false);
      fetchLayout();
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal mengalokasikan barang', 'error');
    }
  };

  const stats = useMemo(() => {
    if (!layout || !layout.slots) return { total: 0, occupied: 0, utilization: 0 };
    const total = layout.slots.length;
    const occupied = layout.slots.filter(s => s.current_quantity > 0).length;
    const totalCapacity = layout.slots.reduce((sum, s) => sum + parseFloat(s.capacity || 0), 0);
    const totalCurrent = layout.slots.reduce((sum, s) => sum + parseFloat(s.current_quantity || 0), 0);
    const utilization = totalCapacity > 0 ? (totalCurrent / totalCapacity) * 100 : 0;
    
    return { total, occupied, utilization };
  }, [layout]);

  const zones = useMemo(() => {
    if (!layout || !layout.slots) return {};
    const grouped = {};
    layout.slots.forEach(slot => {
      const z = slot.zone || 'Default';
      if (!grouped[z]) grouped[z] = [];
      grouped[z].push(slot);
    });
    // Sort slots within zones by x, then y
    Object.keys(grouped).forEach(z => {
      grouped[z].sort((a, b) => a.x - b.x || a.y - b.y);
    });
    return grouped;
  }, [layout]);

  const getSlotColor = (slot) => {
    if (selectedSlot?.id === slot.id) return 'bg-blue-600 text-white ring-4 ring-blue-100 border-blue-700 z-10';
    if (slot.current_quantity === 0) return 'bg-white text-gray-400 border-gray-200 hover:border-blue-400';
    
    const util = slot.utilization;
    if (util >= 90) return 'bg-red-500 text-white border-red-600 hover:brightness-110';
    if (util >= 50) return 'bg-yellow-400 text-gray-900 border-yellow-500 hover:brightness-110';
    return 'bg-emerald-400 text-white border-emerald-500 hover:brightness-110';
  };

  if (loading) return (
    <div className="h-[400px] flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-gray-400 font-medium">Memuat Visualisasi Gudang...</p>
    </div>
  );

  if (!layout) return (
    <div className="card text-center py-12">
      <LayoutGrid size={48} className="mx-auto text-gray-200 mb-4" />
      <h2 className="text-xl font-bold text-gray-700">Layout Belum Dibuat</h2>
      <p className="text-gray-400 mt-1 max-w-sm mx-auto">Silakan hubungi administrator untuk melakukan konfigurasi denah gudang pertama kali.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-gray">Peta Gudang</h1>
          <p className="text-sm text-gray-400 mt-1">Visualisasi lokasi penyimpanan barang untuk memudahkan pencarian dan pengelolaan stok.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsEditing(!isEditing)} 
            className={`btn-sm flex items-center gap-2 px-4 py-2 rounded-lg border font-bold transition-all ${isEditing ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-gray-200 text-gray-500 hover:text-dark-gray'}`}
          >
            {isEditing ? <Save size={14} /> : <LayoutGrid size={14} />}
            {isEditing ? 'Keluar Mode Edit' : 'Edit Denah'}
          </button>
          <button onClick={fetchLayout} className="btn-ghost btn-sm">
            <Activity size={14} /> Refresh Data
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatItem 
          label="Total Lokasi" 
          value={stats.total} 
          sub="Titik Slot" 
          icon={<LayoutGrid className="text-blue-600" />} 
          color="bg-blue-50"
        />
        <StatItem 
          label="Lokasi Terisi" 
          value={stats.occupied} 
          sub="Titik Aktif" 
          icon={<Box className="text-amber-500" />} 
          color="bg-amber-50"
        />
        <StatItem 
          label="Utilisasi Gudang" 
          value={`${stats.utilization.toFixed(1)}%`} 
          sub="Kapasitas Total" 
          icon={<Activity className="text-emerald-500" />} 
          color="bg-emerald-50"
        />
        <StatItem 
          label="Lokasi Terpilih" 
          value={selectedSlot ? selectedSlot.name : '-'} 
          sub={selectedSlot ? selectedSlot.zone : 'Klik pada peta'} 
          icon={<MapIcon className="text-purple-500" />} 
          color="bg-purple-50"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Warehouse Map */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="card min-h-[500px] relative overflow-hidden bg-gray-50/50">
            {/* Legend inside map */}
            <div className="absolute top-4 right-4 flex gap-4 bg-white/80 backdrop-blur px-3 py-2 rounded-lg border border-gray-100 text-[10px] font-bold z-10 shadow-sm">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-white border border-gray-200 rounded-sm"></div> Kosong</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-400 rounded-sm"></div> Aman</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-yellow-400 rounded-sm"></div> Hampir Penuh</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> Penuh</div>
            </div>

            {/* Entrance labels */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 px-4 py-1 bg-gray-200 text-[9px] font-bold text-gray-500 rounded-b uppercase tracking-tighter">
              PINTU MASUK / KELUAR
            </div>
            
            {/* Zones rendering */}
            <div className="p-8 mt-4 space-y-10">
              {Object.keys(zones).map(zoneName => (
                <div key={zoneName} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">{zoneName}</span>
                    <div className="h-px flex-1 bg-gray-200"></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {zones[zoneName].map(slot => (
                      <div
                        key={slot.id}
                        onClick={() => handleSelectSlot(slot)}
                        className={`
                          group relative w-[72px] h-[40px] rounded border transition-all duration-200 cursor-pointer
                          flex flex-col items-center justify-center shadow-sm
                          ${getSlotColor(slot)}
                        `}
                      >
                        <span className="text-[10px] font-bold">{slot.name}</span>
                        {/* Fill bar for non-empty slots */}
                        {slot.current_quantity > 0 && selectedSlot?.id !== slot.id && (
                          <div className="absolute bottom-1 left-1.5 right-1.5 h-[2px] bg-black/10 rounded-full overflow-hidden">
                            <div className="h-full bg-black/30" style={{ width: `${slot.utilization}%` }}></div>
                          </div>
                        )}
                        
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-xl whitespace-nowrap">
                            {slot.name}: {slot.utilization.toFixed(0)}% Kapasitas
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Ghost slot for visual editing cue */}
                    {isEditing && selectedSlot && String(selectedSlot.id).startsWith('temp-') && selectedSlot.zone === zoneName && (
                      <div className="w-[72px] h-[40px] rounded border-2 border-dashed border-orange-400 bg-orange-50 flex items-center justify-center animate-pulse">
                        <span className="text-[10px] font-bold text-orange-600">NEW</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Area Bongkar Muat indicator */}
            <div className="absolute left-0 top-1/2 -rotate-90 origin-left -translate-y-1/2 px-4 py-1 bg-gray-200 text-[9px] font-bold text-gray-500 rounded-b uppercase tracking-tighter">
              AREA BONGKAR MUAT
            </div>
          </div>

          {/* Sync Warning */}
          {layout.unallocated && layout.unallocated.length > 0 && (
            <div className="alert-critical">
              <div className="flex items-start gap-3">
                <Info size={18} className="mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">Ketidaksinkronan Posisi Barang</h4>
                  <p className="text-xs mt-1 opacity-80">Beberapa barang terdeteksi memiliki stok di sistem namun belum dialokasikan ke posisi gudang manapun:</p>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {layout.unallocated.map(item => (
                      <div key={item.item_id} className="bg-white/50 p-2 rounded text-[11px] flex justify-between items-center">
                        <span className="font-medium">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-danger">{item.diff > 0 ? '+' : ''}{item.diff}</span>
                          <button 
                            onClick={() => {
                              setAllocatingStock(true);
                              setMovingStock({ item_id: item.item_id, item_name: item.name, max_qty: item.diff, to_slot_id: selectedSlot?.id || '' });
                            }}
                            className="bg-blue-600 text-white px-2 py-0.5 rounded text-[9px] hover:bg-blue-700"
                          >
                            ALOKASIKAN
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Detail Panel */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="card sticky top-6">
            {!selectedSlot ? (
              <div className="py-10 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <MapIcon size={24} className="text-gray-300" />
                </div>
                <h3 className="font-bold text-gray-700">Detail Lokasi</h3>
                <p className="text-xs text-gray-400 mt-1 mb-4">Pilih salah satu slot di peta untuk melihat detail isi barang dan riwayat aktivitas.</p>
                {isEditing && (
                  <button onClick={handleAddSlot} className="btn-primary btn-sm flex items-center gap-1">
                    <Plus size={14} /> Tambah Lokasi Baru
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Lokasi</span>
                    <h2 className="text-2xl font-black text-dark-gray leading-tight">{selectedSlot.name}</h2>
                    <p className="text-xs font-medium text-blue-600">{selectedSlot.zone}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-[10px] font-bold border ${selectedSlot.current_quantity > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                    {selectedSlot.current_quantity > 0 ? 'TERISI' : 'KOSONG'}
                  </div>
                </div>

                {/* Capacity Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-bold text-gray-500">Kapasitas Lokasi</span>
                    <span className="font-bold text-dark-gray">{selectedSlot.utilization.toFixed(0)}%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${
                        selectedSlot.utilization >= 90 ? 'bg-red-500' : 
                        selectedSlot.utilization >= 50 ? 'bg-yellow-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${selectedSlot.utilization}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                    <span>Kapasitas: {selectedSlot.capacity}</span>
                    <span>Terisi: {selectedSlot.current_quantity}</span>
                  </div>
                </div>

                {/* Items in this slot */}
                <div className="pt-4 border-t border-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase">Barang di Lokasi Ini</h4>
                    {!isEditing && (
                      <button 
                        onClick={() => {
                          setAllocatingStock(true);
                          setMovingStock({ to_slot_id: selectedSlot.id });
                        }}
                        className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 flex items-center gap-1"
                      >
                        <Plus size={12} /> Tambah Barang
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {selectedSlot.positions && selectedSlot.positions.length > 0 ? (
                      selectedSlot.positions.map((pos, idx) => (
                        <div key={idx} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                            <Box size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-dark-gray truncate">{pos.item?.name}</p>
                            <p className="text-[11px] text-gray-400">{pos.item?.code}</p>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1">
                            <p className="text-sm font-black text-dark-gray leading-none">{pos.quantity}</p>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setMovingStock({ item_id: pos.item_id, from_slot_id: selectedSlot.id, item_name: pos.item?.name });
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-blue-600 hover:bg-blue-50 rounded transition-all"
                            >
                              <Move size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center border-2 border-dashed border-gray-100 rounded-xl">
                        <p className="text-[11px] text-gray-400">Lokasi Kosong</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Edit Form if in Edit Mode */}
                {isEditing && (
                  <div className="pt-4 border-t border-gray-50">
                    <h4 className="text-[11px] font-bold text-orange-500 uppercase mb-3">Edit Atribut Slot</h4>
                    <form onSubmit={handleUpdateSlot} className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Nama Slot</label>
                        <input 
                          type="text" 
                          value={selectedSlot.name} 
                          onChange={e => setSelectedSlot({...selectedSlot, name: e.target.value})}
                          className="form-input text-xs mt-1" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Zona</label>
                          <input 
                            type="text" 
                            value={selectedSlot.zone} 
                            onChange={e => setSelectedSlot({...selectedSlot, zone: e.target.value})}
                            className="form-input text-xs mt-1" 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Kapasitas</label>
                          <input 
                            type="number" 
                            value={selectedSlot.capacity} 
                            onChange={e => setSelectedSlot({...selectedSlot, capacity: e.target.value})}
                            className="form-input text-xs mt-1" 
                          />
                        </div>
                      </div>
                      <button type="submit" className="w-full btn-secondary btn-sm justify-center py-2">
                        Simpan Atribut
                      </button>
                    </form>
                  </div>
                )}

                {/* Activity History */}
                <div className="pt-4 border-t border-gray-50">
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase mb-3">Riwayat Aktivitas Lokasi</h4>
                  <div className="space-y-4">
                    {slotHistory.length > 0 ? (
                      slotHistory.map((h) => (
                        <div key={h.id} className="relative pl-5 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-px before:bg-gray-100 last:before:hidden">
                          <div className="absolute left-[-3px] top-1.5 w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                          <div className="text-[10px] text-gray-400 mb-1">{dayjs(h.date).format('D MMM YYYY HH:mm')}</div>
                          <p className="text-[12px] font-bold text-dark-gray leading-tight">
                            {h.type === 'in' ? 'Masuk' : 'Pindah Keluar'} — {h.item_name}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-1">oleh {h.user_name}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-gray-400 italic">Belum ada riwayat pergerakan stok di lokasi ini.</p>
                    )}
                  </div>
                  <button className="w-full mt-4 text-[11px] font-bold text-blue-600 hover:text-blue-700 py-2">Lihat Riwayat Lengkap ›</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Move / Allocate Stock Modal */}
      {(movingStock || allocatingStock) && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                {allocatingStock ? <Plus size={20} /> : <ArrowRightLeft size={20} />}
              </div>
              <div>
                <h3 className="font-black text-dark-gray text-lg leading-tight">
                  {allocatingStock ? 'Alokasikan Barang' : 'Pindahkan Barang'}
                </h3>
                <p className="text-xs text-gray-400">
                  {allocatingStock ? 'Masukkan barang ke lokasi' : `Pindahkan stok dari ${selectedSlot?.name}`}
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6 font-medium">
              {allocatingStock ? (
                movingStock?.item_name ? (
                  <>Menempatkan <span className="text-blue-600 font-bold">{movingStock.item_name}</span> ke dalam rak.</>
                ) : 'Pilih barang dari stok yang belum teralokasi.'
              ) : (
                <>Memindahkan <span className="text-blue-600 font-bold">{movingStock.item_name}</span> ke lokasi baru.</>
              )}
            </p>

            <form onSubmit={handleMoveStock} className="space-y-4">
              {allocatingStock && !movingStock?.item_id && (
                <div>
                  <label className="form-label">Pilih Barang</label>
                  <select 
                    name="item_id" 
                    required 
                    className="form-select"
                    onChange={(e) => {
                      const item = layout.unallocated.find(i => i.item_id === parseInt(e.target.value));
                      if (item) setMovingStock({ ...movingStock, item_id: item.item_id, item_name: item.name, max_qty: item.diff });
                    }}
                  >
                    <option value="">Pilih Barang Belum Teralokasi...</option>
                    {layout?.unallocated?.map(item => (
                      <option key={item.item_id} value={item.item_id}>{item.name} ({item.diff} blm dialokasikan)</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="form-label">Lokasi Tujuan</label>
                <select name="to_slot_id" required className="form-select" defaultValue={movingStock?.to_slot_id || ''}>
                  <option value="">Pilih Slot Tujuan</option>
                  {allSlots.filter(s => s.id !== movingStock?.from_slot_id).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.zone})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Jumlah {movingStock?.max_qty ? `(Maks: ${movingStock.max_qty})` : ''}</label>
                  <input 
                    type="number" 
                    name="quantity" 
                    required 
                    min="0.01" 
                    step="0.01" 
                    max={movingStock?.max_qty || undefined}
                    className="form-input" 
                    placeholder="0.00" 
                  />
                </div>
                <div>
                  <label className="form-label">Satuan</label>
                  <input type="text" disabled className="form-input bg-gray-50" value="Unit" />
                </div>
              </div>
              <div>
                <label className="form-label">Catatan (Opsional)</label>
                <textarea name="notes" className="form-input" rows="2" placeholder="Alasan pemindahan/alokasi..."></textarea>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 btn-secondary justify-center py-3">
                  {allocatingStock ? 'Konfirmasi Alokasi' : 'Konfirmasi Pindah'}
                </button>
                <button type="button" onClick={() => { setMovingStock(null); setAllocatingStock(false); }} className="flex-1 btn-ghost justify-center py-3">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatItem = ({ label, value, sub, icon, color }) => (
  <div className="card flex items-center gap-4 py-4 px-5">
    <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
      {React.cloneElement(icon, { size: 22 })}
    </div>
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-black text-dark-gray leading-tight">{value}</p>
      <p className="text-[10px] font-medium text-gray-500">{sub}</p>
    </div>
  </div>
);

export default WarehouseLayoutPage;
