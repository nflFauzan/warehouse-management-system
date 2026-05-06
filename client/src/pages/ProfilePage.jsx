import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';
import PageHeader from '../components/PageHeader';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({ name: '', email: '', current_password: '', new_password: '' });

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/profile');
        setFormData(prev => ({ ...prev, name: res.data.name, email: res.data.email }));
      } catch (err) {
        addToast('Gagal memuat profil', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [addToast]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await api.put('/profile', formData);
      addToast('Profil berhasil diperbarui');
      // Update auth context if setUser is available
      if (setUser && res.data.user) {
        setUser(prev => ({ ...prev, name: res.data.user.name, email: res.data.user.email }));
      }
      setFormData(prev => ({ ...prev, current_password: '', new_password: '' }));
    } catch (err) {
      addToast(err.response?.data?.error || 'Gagal memperbarui profil', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-4 text-center text-gray-500">Memuat profil...</div>;

  return (
    <div className="max-w-xl mx-auto">
      <PageHeader title="Profil Saya" />
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Nama</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="form-input" />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="form-input" />
          </div>
          <hr className="my-4" />
          <p className="text-sm font-medium text-gray-700">Ganti Password</p>
          <div>
            <label className="form-label">Password Lama</label>
            <input type="password" name="current_password" value={formData.current_password} onChange={handleChange} className="form-input" />
          </div>
          <div>
            <label className="form-label">Password Baru</label>
            <input type="password" name="new_password" value={formData.new_password} onChange={handleChange} className="form-input" minLength="6" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
