import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Topbar({ sidebarOpen, setSidebarOpen, setMobileSidebar }) {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      await logout();
      navigate('/login');
    } catch {
      addToast('Logout gagal', 'error');
    }
  };

  const roleLabel = {
    owner: 'Owner',
    admin: 'Admin',
    staff: 'Staff Gudang',
  };

  const avatarInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="sticky top-0 z-20 flex items-center h-[80px] px-5 bg-white border-b border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] gap-3">

      {/* ── Left: Hamburger (desktop collapse + mobile toggle) ── */}
      <div className="flex items-center gap-2">
        {/* Desktop: toggle sidebar collapse */}
        <button
          onClick={() => setSidebarOpen && setSidebarOpen(o => !o)}
          className="hidden lg:flex w-9 h-9 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          title="Toggle sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Mobile: open sidebar drawer */}
        <button
          onClick={() => setMobileSidebar(p => !p)}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* ── Center: Search bar (optional decoration) ── */}
      <div className="hidden md:flex flex-1 max-w-xs">
        <div className="relative w-full">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Cari sesuatu..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder-gray-400"
          />
        </div>
      </div>

      {/* ── Right: Actions ── */}
      <div className="ml-auto flex items-center gap-2">

        {/* Notification bell */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          {/* Active dot */}
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200 mx-1" />

        {/* User menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="text-white font-bold text-sm">{avatarInitial}</span>
            </div>

            {/* Name + role (hidden on small screens) */}
            <div className="hidden sm:block text-left">
              <p className="text-[13px] font-semibold text-gray-800 leading-tight">{user?.name}</p>
              <p className="text-[11px] text-gray-400 leading-tight">{roleLabel[user?.role] || user?.role}</p>
            </div>

            {/* Caret */}
            <svg
              className={`hidden sm:block w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-50">
              {/* User info header */}
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-semibold rounded-full capitalize">
                  {user?.role}
                </span>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <Link
                  to="/settings/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  Profil Saya
                </Link>

                {user?.role === 'owner' && (
                  <Link
                    to="/settings/users"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                    </svg>
                    Kelola User
                  </Link>
                )}
              </div>

              {/* Logout */}
              <div className="border-t border-gray-100 py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                  Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
