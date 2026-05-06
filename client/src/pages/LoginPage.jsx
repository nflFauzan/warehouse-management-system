import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      addToast('Login berhasil!');
      navigate('/');
    } catch (err) {
      addToast(err.response?.data?.error || 'Login gagal. Periksa kembali email dan password Anda.', 'error');
    }
  };

  return (
    <div className="h-full font-sans flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-primary relative flex-col items-center justify-center p-12">
        <div className="text-center z-10">
          <img src="/images/logo.png" alt="TAKKA STEEL" className="h-24 w-auto object-contain mx-auto mb-6" />
          <h1 className="text-white text-2xl font-bold tracking-wide mb-2">Warehouse Management System</h1>
          <p className="text-white/60 text-sm max-w-xs mx-auto">Sistem manajemen inventaris gudang untuk mengelola stok barang secara efisien dan akurat.</p>
        </div>
        {/* Decorative circles */}
        <div className="absolute top-10 left-10 w-32 h-32 border border-white/10 rounded-full"></div>
        <div className="absolute bottom-20 right-16 w-48 h-48 border border-white/10 rounded-full"></div>
        <div className="absolute top-1/4 right-10 w-20 h-20 border border-white/10 rounded-full"></div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center bg-light-gray p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="text-center mb-8 lg:hidden">
            <img src="/images/logo.png" alt="TAKKA STEEL" className="h-16 w-auto object-contain mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Warehouse Management System</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-xl font-bold text-dark-gray mb-1">Masuk ke Akun</h2>
            <p className="text-gray-400 text-sm mb-6">Silakan masukkan kredensial Anda</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="form-label">Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/></svg>
                  </span>
                  <input type="email" required autoFocus className="form-input pl-10" placeholder="nama@takka.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                  </span>
                  <input type="password" required className="form-input pl-10" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </div>
              <button type="submit" className="w-full text-center py-3 bg-blue-primary text-white font-semibold rounded-lg hover:brightness-110 hover:shadow-md transition-all text-sm">
                Masuk
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center mb-2">Demo Login:</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-light-gray rounded-lg px-3 py-2 text-center cursor-pointer" onClick={() => { setEmail('owner@takka.com'); setPassword('password'); }}>
                  <p className="text-[10px] text-gray-400 font-medium uppercase">Owner</p>
                  <p className="text-[11px] text-gray-600 font-mono mt-0.5">owner@takka.com</p>
                </div>
                <div className="bg-light-gray rounded-lg px-3 py-2 text-center cursor-pointer" onClick={() => { setEmail('admin@takka.com'); setPassword('password'); }}>
                  <p className="text-[10px] text-gray-400 font-medium uppercase">Admin</p>
                  <p className="text-[11px] text-gray-600 font-mono mt-0.5">admin@takka.com</p>
                </div>
                <div className="bg-light-gray rounded-lg px-3 py-2 text-center cursor-pointer" onClick={() => { setEmail('staff@takka.com'); setPassword('password'); }}>
                  <p className="text-[10px] text-gray-400 font-medium uppercase">Staff</p>
                  <p className="text-[11px] text-gray-600 font-mono mt-0.5">staff@takka.com</p>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-2">Password: <span className="font-mono">password</span></p>
            </div>
          </div>

          <p className="text-center text-gray-400 text-xs mt-6">© 2025 TAKKA STEEL. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
