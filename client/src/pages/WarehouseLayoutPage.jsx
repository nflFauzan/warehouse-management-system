import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { Save, Plus, Trash2, Box, Info, Move } from 'lucide-react';

const WarehouseLayoutPage = () => {
  const { addToast } = useToast();
  const [layout, setLayout] = useState({ name: 'Main Warehouse', rows: 10, cols: 10, slots: [] });
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [movingStock, setMovingStock] = useState(null);

  useEffect(() => {
    fetchLayout();
  }, []);

  const fetchReport = async () => {
    // ... logic if needed
  }

  const fetchLayout = async () => {
    try {
      const res = await axios.get('/api/v1/warehouse/layout');
      if (res.data) {
        setLayout(res.data);
      }
      setLoading(false);
    } catch (err) {
      addToast('Failed to fetch layout', 'error');
      setLoading(false);
    }
  };

  const handleSaveLayout = async () => {
    try {
      await axios.post('/api/v1/warehouse/layout', layout);
      addToast('Layout saved successfully', 'success');
      fetchLayout();
      setIsEditing(false);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save layout', 'error');
    }
  };

  const toggleSlot = (x, y) => {
    if (!isEditing) {
      const slot = layout.slots.find(s => s.x === x && s.y === y);
      setSelectedSlot(slot);
      return;
    }

    const existingIndex = layout.slots.findIndex(s => s.x === x && s.y === y);
    const newSlots = [...layout.slots];

    if (existingIndex >= 0) {
      const slot = newSlots[existingIndex];
      if (slot.positions && slot.positions.some(p => p.quantity > 0)) {
        addToast('Cannot remove slot with active stock', 'error');
        return;
      }
      newSlots.splice(existingIndex, 1);
    } else {
      newSlots.push({
        name: `Slot ${x}-${y}`,
        x, y,
        capacity: 100,
        zone: 'Default',
        rack: 'R1',
        section: 'S1'
      });
    }
    setLayout({ ...layout, slots: newSlots });
  };

  const updateSlotDetails = (details) => {
    const newSlots = layout.slots.map(s => 
      (s.x === selectedSlot.x && s.y === selectedSlot.y) ? { ...s, ...details } : s
    );
    setLayout({ ...layout, slots: newSlots });
    setSelectedSlot({ ...selectedSlot, ...details });
  };

  const handleMoveStock = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.target);
      const data = {
        item_id: movingStock.item_id,
        from_slot_id: movingStock.from_slot_id,
        to_slot_id: formData.get('to_slot_id'),
        quantity: formData.get('quantity'),
        notes: formData.get('notes')
      };
      await axios.post('/api/v1/warehouse/move', data);
      addToast('Stock moved successfully', 'success');
      setMovingStock(null);
      fetchLayout();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to move stock', 'error');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Warehouse Layout...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{layout.name}</h1>
          <p className="text-gray-500">Grid: {layout.rows} x {layout.cols}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${isEditing ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-gray-200 text-gray-600'}`}
          >
            {isEditing ? 'Exit Editor' : 'Edit Layout'}
          </button>
          {isEditing && (
            <button
              onClick={handleSaveLayout}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Save size={18} /> Save Changes
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Grid Visualization */}
        <div className="lg:col-span-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100 overflow-auto">
          <div 
            className="grid gap-1 mx-auto" 
            style={{ 
              gridTemplateColumns: `repeat(${layout.cols}, minmax(40px, 1fr))`,
              width: 'fit-content'
            }}
          >
            {Array.from({ length: layout.rows }).map((_, y) => (
              Array.from({ length: layout.cols }).map((_, x) => {
                const slot = layout.slots.find(s => s.x === x && s.y === y);
                const hasStock = slot?.positions?.some(p => p.quantity > 0);
                const isSelected = selectedSlot?.x === x && selectedSlot?.y === y;
                
                return (
                  <div
                    key={`${x}-${y}`}
                    onClick={() => toggleSlot(x, y)}
                    className={`
                      w-10 h-10 border rounded cursor-pointer transition-all flex items-center justify-center text-[10px] relative
                      ${slot ? (hasStock ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-green-50 border-green-200 text-green-600') : 'bg-gray-50 border-gray-100'}
                      ${isEditing ? 'hover:border-blue-400 hover:bg-blue-50' : 'hover:scale-105'}
                      ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 z-10' : ''}
                    `}
                    title={slot ? `${slot.name} (${slot.zone})` : 'Empty Space'}
                  >
                    {slot ? (hasStock ? <Box size={14} /> : slot.name.split(' ')[1] || 'S') : ''}
                    {slot && slot.capacity > 0 && (
                       <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500" 
                            style={{ width: `${Math.min(100, (slot.positions?.reduce((a, b) => a + parseFloat(b.quantity), 0) / slot.capacity) * 100)}%` }}
                          />
                       </div>
                    )}
                  </div>
                );
              })
            ))}
          </div>
        </div>

        {/* Info / Editor Panel */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Info size={20} className="text-blue-500" />
              {selectedSlot ? 'Slot Details' : 'Select a Slot'}
            </h2>

            {selectedSlot ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Slot Name</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={selectedSlot.name}
                    onChange={(e) => updateSlotDetails({ name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg disabled:bg-gray-50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Zone</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={selectedSlot.zone || ''}
                      onChange={(e) => updateSlotDetails({ zone: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Capacity</label>
                    <input
                      type="number"
                      disabled={!isEditing}
                      value={selectedSlot.capacity || 0}
                      onChange={(e) => updateSlotDetails({ capacity: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg disabled:bg-gray-50"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">Current Stock</h3>
                  {selectedSlot.positions?.length > 0 ? (
                    <div className="space-y-2">
                      {selectedSlot.positions.map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-sm">
                          <span>{p.item?.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{p.quantity}</span>
                            <button 
                              onClick={() => setMovingStock({ item_id: p.item_id, from_slot_id: selectedSlot.id, item_name: p.item?.name })}
                              className="p-1 hover:text-blue-600" title="Move Stock"
                            >
                              <Move size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No items in this slot</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm italic">Click on a grid cell to view or edit details.</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Plus size={20} className="text-green-500" /> Legend
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-50 border border-green-200 rounded" />
                <span>Empty Slot</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded" />
                <span>Slot with Stock</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-50 border border-gray-100 rounded" />
                <span>Unallocated Space</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Move Stock Modal */}
      {movingStock && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Move Stock</h3>
            <p className="text-sm text-gray-600 mb-4">Moving <b>{movingStock.item_name}</b> from current slot.</p>
            <form onSubmit={handleMoveStock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Destination Slot</label>
                <select name="to_slot_id" required className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Select Slot</option>
                  {layout.slots.filter(s => s.id !== movingStock.from_slot_id).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.zone})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input type="number" name="quantity" required min="0.01" step="0.01" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea name="notes" className="w-full px-3 py-2 border rounded-lg" rows="2"></textarea>
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <button type="button" onClick={() => setMovingStock(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Confirm Move</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseLayoutPage;
