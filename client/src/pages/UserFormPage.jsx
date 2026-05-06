import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { userService } from '../services/masterDataService';
import { useToast } from '../contexts/ToastContext';

export default function UserFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'staff', is_active: true
  });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      userService.getById(id)
        .then(user => {
          setFormData({
            name: user.name || '',
            email: user.email || '',
            password: '',
            role: user.role || 'staff',
            is_active: user.is_active !== false
          });
        })
        .catch(() => addToast('Gagal memuat data user', 'error'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...formData };
      if (!payload.password) delete payload.password;
      if (isEdit) {
        await userService.update(id, payload);
        addToast('User berhasil diperbarui');
      } else {
        await userService.create(payload);
        addToast('User berhasil ditambahkan');
      }
      navigate('/settings/users');
    } catch (err) {
      addToast(err.response?.data?.error || 'Gagal menyimpan user', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4 text-center text-gray-500">Memuat...</div>;

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/settings/users" className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <h1 className="text-xl font-bold text-dark-gray">{isEdit ? 'Edit User' : 'Tambah User'}</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Nama *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="form-input" />
          </div>
          <div>
            <label className="form-label">Email *</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="form-input" />
          </div>
          <div>
            <label className="form-label">Password {isEdit ? '(kosongkan jika tidak ganti)' : '*'}</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required={!isEdit} minLength={6} className="form-input" />
          </div>
          <div>
            <label className="form-label">Role *</label>
            <select name="role" value={formData.role} onChange={handleChange} required className="form-select">
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
          </div>
          {isEdit && (
            <div className="flex items-center gap-2">
              <input type="checkbox" name="is_active" id="is_active" checked={formData.is_active} onChange={handleChange} className="rounded border-gray-300" />
              <label htmlFor="is_active" className="text-sm">Aktif</label>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
            <Link to="/settings/users" className="btn-ghost">Batal</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
