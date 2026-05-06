import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supplierService } from '../services/masterDataService';
import { useToast } from '../contexts/ToastContext';

export default function SupplierFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [formData, setFormData] = useState({
    code: '', name: '', phone: '', email: '', address: ''
  });
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (id) {
      supplierService.getById(id)
        .then(data => {
          setFormData({
            code: data.code || '',
            name: data.name || '',
            phone: data.phone || '',
            email: data.email || '',
            address: data.address || ''
          });
          setLoading(false);
        })
        .catch(err => {
          addToast('Gagal memuat supplier', 'error');
          navigate('/master/suppliers');
        });
    }
  }, [id, navigate, addToast]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        await supplierService.update(id, formData);
        addToast('Supplier berhasil diperbarui');
      } else {
        await supplierService.create(formData);
        addToast('Supplier berhasil ditambahkan');
      }
      navigate('/master/suppliers');
    } catch (err) {
      addToast(err.response?.data?.error || 'Terjadi kesalahan', 'error');
    }
  };

  if (loading) return <div className="p-4 text-center text-gray-500">Memuat...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/master/suppliers" className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
        </Link>
        <h1 className="text-xl font-bold text-dark-gray">{id ? 'Edit' : 'Tambah'} Supplier</h1>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Kode Supplier *</label>
              <input type="text" name="code" value={formData.code} onChange={handleChange} required className="form-input font-mono" placeholder="SUP-001" />
            </div>
            <div>
              <label className="form-label">Nama Perusahaan *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required className="form-input" placeholder="PT Sukses Makmur" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Telepon</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="form-input" placeholder="08123456789" />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" placeholder="info@supplier.com" />
            </div>
          </div>
          <div>
            <label className="form-label">Alamat Lengkap</label>
            <textarea name="address" value={formData.address} onChange={handleChange} rows="3" className="form-input" placeholder="Jl. Raya Industri..."></textarea>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary">Simpan</button>
            <Link to="/master/suppliers" className="btn-ghost">Batal</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
