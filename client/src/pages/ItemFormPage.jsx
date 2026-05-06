import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { itemService } from '../services/masterDataService';
import { useToast } from '../contexts/ToastContext';
import PageHeader from '../components/PageHeader';

export default function ItemFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [formData, setFormData] = useState({
    code: '', name: '', category_id: '', unit_id: '', minimum_stock: 0, current_stock: 0, description: ''
  });
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { categories, units } = await itemService.getFormData();
        setCategories(categories);
        setUnits(units);

        if (id) {
          const item = await itemService.getById(id);
          setFormData({
            code: item.code || '',
            name: item.name || '',
            category_id: item.category_id || '',
            unit_id: item.unit_id || '',
            minimum_stock: item.minimum_stock || 0,
            current_stock: item.current_stock || 0,
            description: item.description || ''
          });
        }
      } catch (err) {
        addToast('Gagal memuat data form', 'error');
        navigate('/master/items');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, navigate, addToast]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        // current_stock is omitted in update based on backend logic? Wait, backend allows it but usually current_stock shouldn't be updated manually.
        // We will pass it, backend processes minimum_stock.
        await itemService.update(id, formData);
        addToast('Barang berhasil diperbarui');
      } else {
        await itemService.create(formData);
        addToast('Barang berhasil ditambahkan');
      }
      navigate('/master/items');
    } catch (err) {
      addToast(err.response?.data?.error || 'Terjadi kesalahan', 'error');
    }
  };

  if (loading) return <div className="p-4 text-center text-gray-500">Memuat...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader 
        title={id ? 'Edit Barang' : 'Tambah Barang'} 
        backUrl="/master/items" 
      />
      
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Kode Barang *</label>
              <input type="text" name="code" value={formData.code} onChange={handleChange} required className="form-input font-mono" placeholder="BRG-001" />
              <p className="text-xs text-gray-400 mt-1">Harus unik.</p>
            </div>
            <div>
              <label className="form-label">Nama Barang *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required className="form-input" placeholder="Besi Beton 10mm" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Kategori *</label>
              <select name="category_id" value={formData.category_id} onChange={handleChange} required className="form-select">
                <option value="">-- Pilih Kategori --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Satuan *</label>
              <select name="unit_id" value={formData.unit_id} onChange={handleChange} required className="form-select">
                <option value="">-- Pilih Satuan --</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.abbr})</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-100 pt-6">
            {!id && (
              <div>
                <label className="form-label">Stok Awal</label>
                <input type="number" name="current_stock" value={formData.current_stock} onChange={handleChange} min="0" step="0.01" className="form-input" />
                <p className="text-xs text-gray-400 mt-1">Stok saat pertama kali diinput.</p>
              </div>
            )}
            <div>
              <label className="form-label">Batas Stok Minimum *</label>
              <input type="number" name="minimum_stock" value={formData.minimum_stock} onChange={handleChange} required min="0" step="0.01" className="form-input" />
              <p className="text-xs text-gray-400 mt-1">Akan memicu peringatan jika stok di bawah ini.</p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <label className="form-label">Catatan / Deskripsi</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="form-input" placeholder="Spesifikasi tambahan..."></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => navigate('/master/items')} className="btn-ghost">Batal</button>
            <button type="submit" className="btn-primary">Simpan Barang</button>
          </div>
        </form>
      </div>
    </div>
  );
}
