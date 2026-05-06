import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supplierService } from '../services/masterDataService';
import { useToast } from '../contexts/ToastContext';

export default function SupplierListPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const data = await supplierService.getAll();
      setSuppliers(data.suppliers || []);
    } catch (err) {
      addToast('Gagal memuat supplier', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Nonaktifkan supplier ini?')) return;
    try {
      await supplierService.delete(id);
      addToast('Supplier berhasil dinonaktifkan');
      fetchSuppliers();
    } catch (err) {
      addToast('Gagal menghapus supplier', 'error');
    }
  };

  if (loading) return <div className="p-4 text-center text-gray-500">Memuat...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-dark-gray">Master Supplier</h1>
        </div>
        <Link to="/master/suppliers/create" className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg> Tambah
        </Link>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              <th className="text-left py-3 px-4">Kode</th>
              <th className="text-left py-3 px-4">Nama Supplier</th>
              <th className="text-left py-3 px-4">Kontak</th>
              <th className="text-center py-3 px-4">Status</th>
              <th className="text-center py-3 px-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-8 text-gray-400">Belum ada data supplier</td></tr>
            ) : (
              suppliers.map((s) => (
                <tr key={s.id} className={`border-b border-gray-50 hover:bg-gray-50/50 ${!s.is_active ? 'bg-gray-50/50' : ''}`}>
                  <td className="py-3 px-4 font-mono text-xs">{s.code}</td>
                  <td className="py-3 px-4 font-medium">{s.name}</td>
                  <td className="py-3 px-4 text-gray-500">
                    <p>{s.phone || '-'}</p>
                    <p className="text-xs">{s.email || ''}</p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {s.is_active ? (
                      <span className="badge-safe">AKTIF</span>
                    ) : (
                      <span className="badge-empty">NONAKTIF</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Link to={`/master/suppliers/${s.id}/edit`} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-yellow-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </Link>
                      {s.is_active && (
                        <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-danger">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
