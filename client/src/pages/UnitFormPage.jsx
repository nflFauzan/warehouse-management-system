import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { unitService } from '../services/masterDataService';
import { useToast } from '../contexts/ToastContext';

export default function UnitFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [name, setName] = useState('');
  const [abbr, setAbbr] = useState('');
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (id) {
      unitService.getById(id)
        .then(data => {
          setName(data.name);
          setAbbr(data.abbr);
          setLoading(false);
        })
        .catch(err => {
          addToast('Gagal memuat satuan', 'error');
          navigate('/master/units');
        });
    }
  }, [id, navigate, addToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        await unitService.update(id, { name, abbr });
        addToast('Satuan berhasil diperbarui');
      } else {
        await unitService.create({ name, abbr });
        addToast('Satuan berhasil ditambahkan');
      }
      navigate('/master/units');
    } catch (err) {
      addToast(err.response?.data?.error || 'Terjadi kesalahan', 'error');
    }
  };

  if (loading) return <div className="p-4 text-center text-gray-500">Memuat...</div>;

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/master/units" className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
        </Link>
        <h1 className="text-xl font-bold text-dark-gray">{id ? 'Edit' : 'Tambah'} Satuan</h1>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Nama Satuan *</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              className="form-input" 
              placeholder="Kilogram"
            />
          </div>
          <div>
            <label className="form-label">Singkatan *</label>
            <input 
              type="text" 
              value={abbr} 
              onChange={(e) => setAbbr(e.target.value)} 
              required 
              className="form-input" 
              placeholder="KG"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary">Simpan</button>
            <Link to="/master/units" className="btn-ghost">Batal</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
