import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { 
  Save, Plus, Trash2, Box, Info, Move, 
  LayoutGrid, MousePointer2, Grab, Check, X,
  Hammer, Package, Zap, ChevronRight, Layers,
  MapPin, Wind, Sparkles, Database, BarChart3,
  Truck, Warehouse, ArrowUpRight, History,
  Maximize2, Minimize2, Settings2, Activity
} from 'lucide-react';
import dayjs from 'dayjs';

const GRID_SIZE = 15; // Increased grid size for more detail
const CELL_SIZE = 48; // Smaller cells for better overview

const WarehouseLayoutPage = () => {
  const { addToast } = useToast();
  const [layout, setLayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotHistory, setSlotHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draggingSlot, setDraggingSlot] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [tempSlots, setTempSlots] = useState([]);
  const [stats, setStats] = useState({ totalItems: 0, utilization: 0, totalCapacity: 0, occupiedQty: 0 });
  const [quantityDialog, setQuantityDialog] = useState(null);
  const [allocateModal, setAllocateModal] = useState(false);
  const [moveModal, setMoveModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLayout();
  }, []);

  const fetchLayout = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/warehouse/layout');
      if (res.data) {
        setLayout(res.data);
        setTempSlots(res.data.slots || []);
        calculateStats(res.data.slots || []);
      }
      setLoading(false);
    } catch (err) {
      addToast('Gagal memuat layout gudang', 'error');
      setLoading(false);
    }
  };

  const calculateStats = (slots) => {
    const totalCap = slots.reduce((sum, s) => sum + parseFloat(s.capacity || 0), 0) || 0;
    const totalQty = slots.reduce((sum, s) => sum + parseFloat(s.current_quantity || 0), 0) || 0;
    setStats({
      totalItems: slots.filter(s => s.type === 'storage').length,
      totalCapacity: totalCap,
      occupiedQty: totalQty,
      utilization: totalCap > 0 ? (totalQty / totalCap) * 100 : 0
    });
  };

  useEffect(() => {
    if (selectedSlot && !String(selectedSlot.id).startsWith('temp-')) {
      fetchSlotHistory(selectedSlot.id);
    } else {
      setSlotHistory([]);
    }
  }, [selectedSlot]);

  const fetchSlotHistory = async (id) => {
    setLoadingHistory(true);
    try {
      const res = await axios.get(`/api/v1/warehouse/slots/${id}/history`);
      setSlotHistory(res.data || []);
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // --- COLLISION LOGIC ---
  const isOccupied = (x, y, w = 1, h = 1, excludeId = null) => {
    return tempSlots.some(s => {
      if (s.id === excludeId) return false;
      const sx = s.x, sy = s.y, sw = s.width || 1, sh = s.height || 1;
      // Overlap check
      return (x < sx + sw && x + w > sx && y < sy + sh && y + h > sy);
    });
  };

  const handleGridDrop = async (x, y) => {
    if (draggingSlot) {
      if (isOccupied(x, y, draggingSlot.width, draggingSlot.height, draggingSlot.id)) {
        return addToast('Area ini sudah terisi!', 'warning');
      }
      
      setTempSlots(prev => prev.map(s => s.id === draggingSlot.id ? { ...s, x, y } : s));
      setDraggingSlot(null);
      setHoveredCell(null);
    } else if (draggedItem) {
      const slot = tempSlots.find(s => {
        const sw = s.width || 1, sh = s.height || 1;
        return x >= s.x && x < s.x + sw && y >= s.y && y < s.y + sh;
      });
      if (slot && slot.type === 'storage') {
        if (String(slot.id).startsWith('temp-')) return addToast('Simpan denah dulu sebelum alokasi barang!', 'warning');
        setQuantityDialog({ item: draggedItem, slot });
      }
      setDraggedItem(null);
      setHoveredCell(null);
    }
  };

  const submitAllocation = async (itemId, slotId, quantity, notes) => {
    setSubmitting(true);
    try {
      await axios.post('/api/v1/warehouse/move', { item_id: itemId, to_slot_id: slotId, quantity: parseFloat(quantity), notes: notes || 'Alokasi manual' });
      addToast('Barang berhasil dialokasikan ke rak!', 'success');
      setQuantityDialog(null);
      setAllocateModal(false);
      fetchLayout();
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal mengalokasikan barang', 'error');
    } finally { setSubmitting(false); }
  };

  const submitMove = async (itemId, fromSlotId, toSlotId, quantity, notes) => {
    setSubmitting(true);
    try {
      await axios.post('/api/v1/warehouse/move', { item_id: itemId, from_slot_id: fromSlotId, to_slot_id: parseInt(toSlotId), quantity: parseFloat(quantity), notes: notes || 'Pindah antar rak' });
      addToast('Stok berhasil dipindahkan!', 'success');
      setMoveModal(null);
      fetchLayout();
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal memindahkan stok', 'error');
    } finally { setSubmitting(false); }
  };

  const saveWorld = async () => {
    try {
      const slotsToSave = tempSlots.map(s => ({
        ...s,
        id: String(s.id).startsWith('temp-') ? null : s.id
      }));
      const payload = layout || { name: 'Gudang Utama', rows: GRID_SIZE, cols: GRID_SIZE };
      await axios.post('/api/v1/warehouse/layout', { ...payload, slots: slotsToSave });
      addToast('Layout gudang berhasil diperbarui!', 'success');
      setIsEditing(false);
      fetchLayout();
    } catch (err) { addToast('Gagal simpan: ' + (err.response?.data?.message || err.message), 'error'); }
  };

  const buildNewSlot = (type = 'storage') => {
    // Find empty spot
    let fx = 0, fy = 0;
    let found = false;
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (!isOccupied(j, i)) {
          fx = j; fy = i; found = true; break;
        }
      }
      if (found) break;
    }

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const rowLetter = letters[Math.floor(tempSlots.length / 5)] || 'Z';
    const slotNum = (tempSlots.length % 5) + 1;
    const defaultName = type === 'storage' ? `${rowLetter}-${slotNum}` : `${type.toUpperCase()}-${tempSlots.length + 1}`;

    const newSlot = {
      id: `temp-${Date.now()}`,
      name: defaultName,
      type: type,
      zone: 'GENERAL',
      capacity: type === 'storage' ? 1000 : 0,
      width: type === 'pathway' ? 1 : 2,
      height: type === 'pathway' ? 1 : 1,
      x: fx, y: fy,
      current_quantity: 0,
      utilization: 0,
      positions: []
    };
    setTempSlots([...tempSlots, newSlot]);
    setSelectedSlot(newSlot);
  };

  const destroySlot = (id) => {
    const slot = tempSlots.find(s => s.id === id);
    if (slot && slot.current_quantity > 0) return addToast('Slot masih berisi stok! Kosongkan dulu.', 'error');
    setTempSlots(prev => prev.filter(s => s.id !== id));
    setSelectedSlot(null);
  };

  const updateSelectedSlot = (updates) => {
    if (!selectedSlot) return;
    const updated = { ...selectedSlot, ...updates };
    
    // If moving or resizing, check for collisions
    if (updates.x !== undefined || updates.y !== undefined || updates.width !== undefined || updates.height !== undefined) {
      if (isOccupied(updated.x, updated.y, updated.width, updated.height, selectedSlot.id)) {
        return addToast('Tidak bisa mengubah ukuran/posisi: Area terhalang!', 'warning');
      }
    }

    setTempSlots(prev => prev.map(s => s.id === selectedSlot.id ? updated : s));
    setSelectedSlot(updated);
  };

  // --- RENDER HELPERS ---
  const getOccupancyColor = (util) => {
    if (util === 0) return 'bg-gray-100 text-gray-400 border-gray-200';
    if (util < 50) return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    if (util < 90) return 'bg-amber-50 text-amber-600 border-amber-200';
    return 'bg-rose-50 text-rose-600 border-rose-200';
  };

  const getSlotBaseStyle = (slot) => {
    const isSelected = selectedSlot?.id === slot.id;
    
    let base = "absolute transition-all duration-200 rounded-lg border-2 flex flex-col items-center justify-center p-1 text-center overflow-hidden ";
    
    if (slot.type === 'storage') {
      const util = slot.utilization || 0;
      if (util === 0) base += "bg-gray-50 border-gray-200 text-gray-400";
      else if (util < 50) base += "bg-emerald-50 border-emerald-400 text-emerald-700 shadow-sm shadow-emerald-100";
      else if (util < 90) base += "bg-amber-50 border-amber-400 text-amber-700 shadow-sm shadow-amber-100";
      else base += "bg-rose-50 border-rose-500 text-rose-700 shadow-sm shadow-rose-100";
    } else if (slot.type === 'pathway') {
      base += "bg-gray-200/50 border-transparent text-gray-400 border-dashed border-gray-300";
    } else if (slot.type === 'loading') {
      base += "bg-blue-50 border-blue-400 text-blue-700";
    } else if (slot.type === 'unloading') {
      base += "bg-indigo-50 border-indigo-400 text-indigo-700";
    }

    if (isSelected) base += " ring-4 ring-blue-500/30 z-30 scale-[1.02] shadow-xl";
    else base += " z-10 hover:z-20 hover:scale-[1.01] cursor-pointer";

    if (isEditing) base += " cursor-grab active:cursor-grabbing";

    return base;
  };

  if (loading) return (
    <div className="h-screen -mt-20 flex flex-col items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-500 font-medium">Memuat Layout Operasional...</p>
    </div>
  );

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-4">
      
      {/* Header Panel */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Warehouse size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-none">Manajemen Layout Gudang</h1>
            <p className="text-sm text-gray-500 mt-1">Operasional & Visualisasi Stok Real-time</p>
          </div>
          
          <div className="h-10 w-px bg-gray-100 mx-4" />
          
          <div className="flex gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Rak</span>
              <span className="text-sm font-bold text-gray-800">{stats.totalItems} Units</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Utilisasi Global</span>
              <span className={`text-sm font-bold ${stats.utilization > 90 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {stats.utilization.toFixed(1)}%
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Kapasitas Terpakai</span>
              <span className="text-sm font-bold text-gray-800">{stats.occupiedQty} / {stats.totalCapacity} KG</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          {isEditing ? (
            <>
              <button onClick={() => { setIsEditing(false); fetchLayout(); }} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                Batal
              </button>
              <button onClick={saveWorld} className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2">
                <Check size={18} /> Simpan Layout
              </button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className="px-6 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all flex items-center gap-2">
              <Hammer size={18} /> Edit Mode
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* Main Warehouse Map */}
        <div className="flex-1 bg-gray-50 rounded-3xl border-2 border-gray-100 relative overflow-hidden flex flex-col">
          
          {/* Map Controls / Legend */}
          <div className="absolute top-4 left-4 z-40 flex flex-col gap-2">
            <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase">
                <div className="w-3 h-3 rounded bg-gray-100 border border-gray-200" /> Kosong
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase">
                <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-400" /> {'< 50%'}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase">
                <div className="w-3 h-3 rounded bg-amber-100 border border-amber-400" /> {'50% - 90%'}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase">
                <div className="w-3 h-3 rounded bg-rose-100 border border-rose-500" /> Penuh
              </div>
            </div>
          </div>

          {/* The Grid Container */}
          <div className="flex-1 overflow-auto p-12 flex items-start justify-center custom-scrollbar">
            <div 
              className="relative bg-white shadow-2xl rounded-sm"
              style={{
                width: `${GRID_SIZE * CELL_SIZE}px`,
                height: `${GRID_SIZE * CELL_SIZE}px`,
                backgroundImage: `
                  linear-gradient(to right, #f1f5f9 1px, transparent 1px),
                  linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)
                `,
                backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              {/* Drop Grid Layer */}
              {isEditing && Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                const x = i % GRID_SIZE;
                const y = Math.floor(i / GRID_SIZE);
                const isHover = hoveredCell?.x === x && hoveredCell?.y === y;
                return (
                  <div 
                    key={`grid-${x}-${y}`}
                    className={`absolute border border-transparent transition-colors ${isHover ? 'bg-blue-500/10' : ''}`}
                    style={{
                      left: x * CELL_SIZE,
                      top: y * CELL_SIZE,
                      width: CELL_SIZE,
                      height: CELL_SIZE
                    }}
                    onDragOver={(e) => { e.preventDefault(); setHoveredCell({ x, y }); }}
                    onDrop={() => handleGridDrop(x, y)}
                  />
                );
              })}

              {/* Zones & Lanes (Visual Only) */}
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
                <div className="absolute top-0 left-0 w-full h-8 bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 uppercase tracking-widest border-b border-blue-200">
                  <Truck size={12} className="mr-2" /> Area Bongkar Muat (Inbound)
                </div>
                <div className="absolute bottom-0 left-0 w-full h-8 bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600 uppercase tracking-widest border-t border-indigo-200">
                  <Truck size={12} className="mr-2" /> Area Muat Barang (Outbound)
                </div>
              </div>

              {/* The Slots */}
              {tempSlots.map(slot => (
                <div
                  key={slot.id}
                  draggable={isEditing}
                  onDragStart={() => setDraggingSlot(slot)}
                  onClick={() => setSelectedSlot(slot)}
                  className={getSlotBaseStyle(slot)}
                  style={{
                    left: slot.x * CELL_SIZE + 2,
                    top: slot.y * CELL_SIZE + 2,
                    width: (slot.width || 1) * CELL_SIZE - 4,
                    height: (slot.height || 1) * CELL_SIZE - 4
                  }}
                >
                  {slot.type === 'storage' ? (
                    <>
                      <span className="text-[10px] font-black leading-none mb-1 truncate w-full px-1">{slot.name}</span>
                      <div className="w-full flex-1 flex flex-col items-center justify-center">
                        <span className="text-[9px] font-bold opacity-70 leading-none">{Math.round(slot.utilization || 0)}%</span>
                        <div className="w-4/5 h-1 bg-black/5 rounded-full mt-1 overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              slot.utilization > 90 ? 'bg-rose-500' : 
                              slot.utilization > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${slot.utilization}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-[8px] font-bold opacity-60 mt-1">{Math.round(slot.current_quantity)} KG</span>
                    </>
                  ) : (
                    <div className="opacity-40">
                      {slot.type === 'pathway' ? <Move size={14} /> : 
                       slot.type === 'loading' ? <ArrowUpRight size={14} /> : <ArrowUpRight className="rotate-180" size={14} />}
                      <span className="text-[8px] font-black uppercase mt-1 block">{slot.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Unallocated Panel */}
          <div className="bg-white border-t border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3 px-2">
              <div className="flex items-center gap-2">
                <Box size={16} className="text-gray-400" />
                <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Antrian Alokasi Barang</h4>
              </div>
              <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {layout?.unallocated?.length || 0} Item Menunggu
              </span>
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
              {layout?.unallocated?.map(item => (
                <div 
                  key={item.item_id}
                  draggable
                  onDragStart={() => setDraggedItem(item)}
                  className="flex-shrink-0 w-48 bg-gray-50 p-3 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-grab active:cursor-grabbing group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-[9px] font-bold text-blue-500 uppercase leading-none">{item.code}</p>
                    <span className="text-[10px] font-black text-gray-700">{item.diff} unit</span>
                  </div>
                  <p className="text-xs font-bold text-gray-800 truncate">{item.name}</p>
                </div>
              ))}
              {(!layout?.unallocated || layout.unallocated.length === 0) && (
                <div className="w-full py-4 text-center text-gray-300 text-xs font-medium italic">
                  Semua stok telah teralokasi ke rak.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Panel */}
        <div className="w-80 flex flex-col gap-4 overflow-hidden">
          
          {/* Edit Palette */}
          {isEditing && (
            <div className="bg-gray-900 rounded-3xl p-5 shadow-lg flex flex-col gap-4">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Plus size={14} className="text-blue-400" /> Tambah Elemen
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => buildNewSlot('storage')} className="flex flex-col items-center gap-2 p-3 bg-gray-800 rounded-2xl border border-gray-700 hover:border-blue-500 transition-all group">
                  <Database size={18} className="text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-bold text-white uppercase">Rak Stok</span>
                </button>
                <button onClick={() => buildNewSlot('pathway')} className="flex flex-col items-center gap-2 p-3 bg-gray-800 rounded-2xl border border-gray-700 hover:border-gray-500 transition-all group">
                  <Move size={18} className="text-gray-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-bold text-white uppercase">Jalan/Lane</span>
                </button>
                <button onClick={() => buildNewSlot('loading')} className="flex flex-col items-center gap-2 p-3 bg-gray-800 rounded-2xl border border-gray-700 hover:border-blue-400 transition-all group">
                  <Truck size={18} className="text-blue-300 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-bold text-white uppercase">Inbound</span>
                </button>
                <button onClick={() => buildNewSlot('unloading')} className="flex flex-col items-center gap-2 p-3 bg-gray-800 rounded-2xl border border-gray-700 hover:border-indigo-400 transition-all group">
                  <Truck size={18} className="text-indigo-300 group-hover:scale-110 transition-transform rotate-180" />
                  <span className="text-[9px] font-bold text-white uppercase">Outbound</span>
                </button>
              </div>
            </div>
          )}

          {/* Inspect Panel */}
          <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            {selectedSlot ? (
              <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
                {/* Panel Header */}
                <div className="p-6 border-b border-gray-50">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 ${getOccupancyColor(selectedSlot.utilization)}`}>
                      {selectedSlot.type === 'storage' ? <Database size={24} /> : <Box size={24} />}
                    </div>
                    <div className="flex gap-2">
                      {isEditing && (
                        <button onClick={() => destroySlot(selectedSlot.id)} className="w-8 h-8 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                          <Trash2 size={16} />
                        </button>
                      )}
                      <button onClick={() => setSelectedSlot(null)} className="w-8 h-8 bg-gray-50 text-gray-400 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-all">
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Nama / Kode Rak</label>
                      <input 
                        disabled={!isEditing}
                        value={selectedSlot.name}
                        onChange={e => updateSelectedSlot({ name: e.target.value.toUpperCase() })}
                        className="text-lg font-bold text-gray-800 bg-gray-50 disabled:bg-transparent rounded-lg px-2 py-1 w-full focus:ring-2 focus:ring-blue-100 outline-none"
                      />
                    </div>

                    {isEditing && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Lebar (Cell)</label>
                          <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                            <button onClick={() => updateSelectedSlot({ width: Math.max(1, (selectedSlot.width || 1) - 1) })} className="w-6 h-6 bg-white rounded shadow-sm flex items-center justify-center text-gray-400 hover:text-blue-500"><Minimize2 size={12} /></button>
                            <span className="flex-1 text-center text-xs font-bold">{selectedSlot.width || 1}</span>
                            <button onClick={() => updateSelectedSlot({ width: (selectedSlot.width || 1) + 1 })} className="w-6 h-6 bg-white rounded shadow-sm flex items-center justify-center text-gray-400 hover:text-blue-500"><Maximize2 size={12} /></button>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Tinggi (Cell)</label>
                          <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                            <button onClick={() => updateSelectedSlot({ height: Math.max(1, (selectedSlot.height || 1) - 1) })} className="w-6 h-6 bg-white rounded shadow-sm flex items-center justify-center text-gray-400 hover:text-blue-500"><Minimize2 size={12} /></button>
                            <span className="flex-1 text-center text-xs font-bold">{selectedSlot.height || 1}</span>
                            <button onClick={() => updateSelectedSlot({ height: (selectedSlot.height || 1) + 1 })} className="w-6 h-6 bg-white rounded shadow-sm flex items-center justify-center text-gray-400 hover:text-blue-500"><Maximize2 size={12} /></button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details Tab */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {selectedSlot.type === 'storage' ? (
                    <>
                      {/* Stats Overview */}
                      <div className="p-6 bg-gray-50/50 space-y-4">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Utilisasi Rak</p>
                            <p className="text-2xl font-black text-gray-800">{selectedSlot.utilization?.toFixed(1)}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Sisa Kapasitas</p>
                            <p className="text-sm font-bold text-emerald-600">{Math.max(0, (selectedSlot.capacity || 0) - (selectedSlot.current_quantity || 0))} KG</p>
                          </div>
                        </div>
                        
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-700 ${
                              selectedSlot.utilization > 90 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 
                              selectedSlot.utilization > 50 ? 'bg-amber-400' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${selectedSlot.utilization}%` }}
                          />
                        </div>

                        {isEditing && (
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Set Kapasitas Maks (KG)</label>
                            <input 
                              type="number"
                              value={selectedSlot.capacity}
                              onChange={e => updateSelectedSlot({ capacity: parseFloat(e.target.value) || 0 })}
                              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
                            />
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {!isEditing && (
                        <div className="px-6 pb-4 flex gap-2">
                          <button onClick={() => setAllocateModal(true)} className="flex-1 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5">
                            <Plus size={13} /> Alokasi Barang
                          </button>
                          {selectedSlot.positions?.length > 0 && (
                            <button onClick={() => { const p = selectedSlot.positions[0]; setMoveModal({ fromSlotId: selectedSlot.id, fromSlotName: selectedSlot.name, itemId: p.item_id, itemName: p.item?.name, maxQty: parseFloat(p.quantity) }); }} className="flex-1 py-2 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600 transition-all flex items-center justify-center gap-1.5">
                              <Move size={13} /> Pindah Stok
                            </button>
                          )}
                        </div>
                      )}
                      {/* Content List */}
                      <div className="flex-1 overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                          <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Package size={14} /> Isi Rak Saat Ini
                          </h5>
                          <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {selectedSlot.positions?.length || 0} SKU
                          </span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                          {selectedSlot.positions?.length > 0 ? (
                            selectedSlot.positions.map((pos, idx) => (
                              <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3 group hover:border-blue-200 transition-all">
                                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                  <Package size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[9px] font-bold text-blue-400 uppercase leading-none mb-0.5">{pos.item?.code}</p>
                                  <p className="text-[11px] font-bold text-gray-800 truncate">{pos.item?.name}</p>
                                  <p className="text-[9px] text-gray-500">{pos.quantity} unit</p>
                                </div>
                                {!isEditing && (
                                  <button onClick={() => setMoveModal({ fromSlotId: selectedSlot.id, fromSlotName: selectedSlot.name, itemId: pos.item_id, itemName: pos.item?.name, maxQty: parseFloat(pos.quantity) })} title="Pindah ke rak lain" className="w-7 h-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center hover:bg-amber-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                                    <Move size={12} />
                                  </button>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-10">
                              <Box size={32} className="mb-2" />
                              <p className="text-[10px] font-bold uppercase">Rak Kosong</p>
                            </div>
                          )}
                        </div>

                        {/* History Section */}
                        <div className="border-t border-gray-100 bg-gray-50/30">
                           <div className="px-6 py-3 flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                             <History size={14} /> Riwayat Pergerakan
                           </div>
                           <div className="px-6 pb-6 max-h-40 overflow-y-auto space-y-3 custom-scrollbar">
                             {loadingHistory ? (
                               <div className="flex justify-center py-4"><div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
                             ) : slotHistory.length > 0 ? (
                               slotHistory.map((h, i) => (
                                 <div key={i} className="flex gap-3 relative pb-3 last:pb-0">
                                   {i < slotHistory.length - 1 && <div className="absolute left-1.5 top-4 bottom-0 w-px bg-gray-200" />}
                                   <div className={`w-3 h-3 rounded-full mt-1 shrink-0 z-10 ${h.type === 'in' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                                   <div className="min-w-0">
                                     <p className="text-[10px] font-bold text-gray-800 leading-tight">
                                       {h.type === 'in' ? 'Barang Masuk' : 'Pemindahan'} - {h.item_name}
                                     </p>
                                     <p className="text-[9px] text-gray-400 mt-0.5">{dayjs(h.date).format('DD/MM HH:mm')} oleh {h.user_name}</p>
                                   </div>
                                 </div>
                               ))
                             ) : (
                               <p className="text-[9px] text-gray-400 italic">Belum ada riwayat.</p>
                             )}
                           </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
                      <div className="w-16 h-16 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-300 mb-4">
                        <Settings2 size={32} />
                      </div>
                      <h5 className="text-sm font-bold text-gray-700 uppercase mb-2">Elemen Struktural</h5>
                      <p className="text-xs text-gray-400 font-medium leading-relaxed">
                        Elemen ini digunakan untuk pemetaan visual alur kerja gudang (pathway, loading dock, dll) dan tidak menampung stok barang.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-6">
                  <LayoutGrid size={40} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 uppercase italic mb-2">Detail Objek</h3>
                <p className="text-xs text-gray-400 font-medium max-w-[200px] leading-relaxed">
                  Pilih rak atau area di peta untuk melihat kapasitas, isi stok, dan riwayat pergerakan.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      {quantityDialog && (
        <QuantityDialog dialog={quantityDialog} onSubmit={submitAllocation} onClose={() => setQuantityDialog(null)} submitting={submitting} />
      )}
      {allocateModal && selectedSlot && (
        <AllocateModal slot={selectedSlot} unallocated={layout?.unallocated || []} slots={tempSlots} onSubmit={submitAllocation} onClose={() => setAllocateModal(false)} submitting={submitting} />
      )}
      {moveModal && (
        <MoveModal modal={moveModal} slots={tempSlots} onSubmit={submitMove} onClose={() => setMoveModal(null)} submitting={submitting} />
      )}
    </div>
  );
};

export default WarehouseLayoutPage;

function QuantityDialog({ dialog, onSubmit, onClose, submitting }) {
  const [qty, setQty] = React.useState(dialog.item.diff || 1);
  const [notes, setNotes] = React.useState('');
  const max = parseFloat(dialog.item.diff) || 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 rounded-t-3xl text-white">
          <h3 className="font-black text-base">Konfirmasi Alokasi</h3>
          <p className="text-blue-100 text-xs mt-1">Ke rak: <span className="font-bold text-white">{dialog.slot.name}</span></p>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-blue-50 rounded-2xl p-3">
            <p className="text-[10px] font-bold text-blue-500 uppercase">{dialog.item.code}</p>
            <p className="font-bold text-gray-800 text-sm">{dialog.item.name}</p>
            <p className="text-xs text-gray-500 mt-1">Tersedia: <span className="font-bold text-blue-600">{max} unit</span></p>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Jumlah</label>
            <input type="number" min="0.01" max={max} value={qty} onChange={e => setQty(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base font-bold text-center outline-none focus:ring-2 focus:ring-blue-300" autoFocus />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Catatan (opsional)</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="mis. Penerimaan batch A" className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 text-sm">Batal</button>
            <button onClick={() => onSubmit(dialog.item.item_id, dialog.slot.id, qty, notes)} disabled={submitting || parseFloat(qty) <= 0 || parseFloat(qty) > max} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 text-sm disabled:opacity-50">{submitting ? 'Menyimpan...' : 'Alokasikan'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AllocateModal({ slot, unallocated, slots, onSubmit, onClose, submitting }) {
  const [selItem, setSelItem] = React.useState('');
  const [qty, setQty] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const item = unallocated.find(u => String(u.item_id) === String(selItem));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4">
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-5 rounded-t-3xl text-white">
          <h3 className="font-black text-base">Alokasi Barang ke Rak</h3>
          <p className="text-emerald-100 text-xs mt-1">Rak tujuan: <span className="font-bold text-white">{slot.name}</span></p>
        </div>
        <div className="p-5 space-y-4">
          {unallocated.length === 0 ? (
            <div className="text-center py-8 text-gray-400"><p className="font-bold text-sm">Semua stok sudah teralokasi</p></div>
          ) : (
            <>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Pilih Barang</label>
                <select value={selItem} onChange={e => { setSelItem(e.target.value); setQty(''); }} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-300">
                  <option value="">-- Pilih barang --</option>
                  {unallocated.map(u => <option key={u.item_id} value={u.item_id}>{u.code} - {u.name} ({u.diff} unit)</option>)}
                </select>
              </div>
              {item && <div className="bg-emerald-50 rounded-xl p-3 text-xs">Tersedia: <span className="font-bold text-emerald-700">{item.diff} unit</span></div>}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Jumlah</label>
                <input type="number" min="0.01" max={item?.diff || 0} value={qty} onChange={e => setQty(e.target.value)} disabled={!selItem} placeholder="Masukkan jumlah" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-300 disabled:bg-gray-50" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Catatan (opsional)</label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="mis. Penerimaan batch A" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300" />
              </div>
            </>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 text-sm">Batal</button>
            {unallocated.length > 0 && <button onClick={() => onSubmit(parseInt(selItem), slot.id, qty, notes)} disabled={submitting || !selItem || !qty || parseFloat(qty) <= 0} className="flex-1 py-2.5 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 text-sm disabled:opacity-50">{submitting ? 'Menyimpan...' : 'Alokasikan'}</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function MoveModal({ modal, slots, onSubmit, onClose, submitting }) {
  const [toSlotId, setToSlotId] = React.useState('');
  const [qty, setQty] = React.useState(modal.maxQty || '');
  const [notes, setNotes] = React.useState('');
  const storageSlots = slots.filter(s => s.type === 'storage' && s.id !== modal.fromSlotId);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 rounded-t-3xl text-white">
          <h3 className="font-black text-base">Pindah Stok Antar Rak</h3>
          <p className="text-amber-100 text-xs mt-1">Dari: <span className="font-bold text-white">{modal.fromSlotName}</span></p>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-amber-50 rounded-2xl p-3">
            <p className="text-[10px] font-bold text-amber-600 uppercase">Barang</p>
            <p className="font-bold text-gray-800 text-sm">{modal.itemName}</p>
            <p className="text-xs text-gray-500 mt-1">Stok di rak ini: <span className="font-bold text-amber-700">{modal.maxQty} unit</span></p>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Rak Tujuan</label>
            <select value={toSlotId} onChange={e => setToSlotId(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300">
              <option value="">-- Pilih rak tujuan --</option>
              {storageSlots.map(s => <option key={s.id} value={s.id}>{s.name} (terisi: {Math.round(s.current_quantity || 0)}/{s.capacity || '∞'})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Jumlah yang dipindah</label>
            <input type="number" min="0.01" max={modal.maxQty} value={qty} onChange={e => setQty(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Catatan (opsional)</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="mis. Reorganisasi gudang" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300" />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 text-sm">Batal</button>
            <button onClick={() => onSubmit(modal.itemId, modal.fromSlotId, toSlotId, qty, notes)} disabled={submitting || !toSlotId || !qty || parseFloat(qty) <= 0} className="flex-1 py-2.5 bg-amber-500 text-white font-bold rounded-2xl hover:bg-amber-600 text-sm disabled:opacity-50">{submitting ? 'Menyimpan...' : 'Pindahkan'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
