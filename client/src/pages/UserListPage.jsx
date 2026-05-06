import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userService } from '../services/masterDataService';
import { useToast } from '../contexts/ToastContext';

export default function UserListPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (err) {
      addToast('Gagal memuat data user', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4 text-center text-gray-500">Memuat...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-dark-gray">Kelola User</h1>
          <p className="text-sm text-gray-500">Hanya Owner yang dapat mengelola user</p>
        </div>
        <Link to="/settings/users/create" className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          Tambah User
        </Link>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              <th className="py-3 px-4 text-left">Nama</th>
              <th className="py-3 px-4 text-left">Email</th>
              <th className="py-3 px-4 text-center">Role</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-8 text-gray-400">Belum ada user</td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-4 font-medium">{u.name}</td>
                  <td className="py-3 px-4 text-gray-500">{u.email}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="badge bg-blue-50 text-blue-primary border border-blue-200 capitalize">{u.role}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={u.is_active ? 'badge-safe' : 'badge-empty'}>
                      {u.is_active ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Link to={`/settings/users/${u.id}/edit`} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-yellow-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </Link>
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
