import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// ─── Design tokens ─────────────────────────────────
// Sidebar gradient: rich navy → deep blue-indigo
const SIDEBAR_BG = 'linear-gradient(175deg, #1A3A6B 0%, #14306A 40%, #0E2554 75%, #091B42 100%)';

export default function Sidebar({ sidebarOpen, setSidebarOpen, mobileSidebar, setMobileSidebar }) {
  const { user } = useAuth();

  return (
    <>
      {/* Mobile backdrop */}
      {mobileSidebar && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebar(false)}
        />
      )}

      <aside
        style={{ background: SIDEBAR_BG }}
        className={`
          fixed inset-y-0 left-0 z-30 flex flex-col
          shadow-[4px_0_24px_rgba(0,0,0,0.25)]
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'w-[260px]' : 'w-[70px]'}
          ${mobileSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* ── Logo Area — WHITE background, flush with topbar ── */}
        <div
          className={`
            flex items-center h-[80px] flex-shrink-0 bg-white
            border-b border-gray-100
            ${sidebarOpen ? 'justify-start pl-5 pr-3' : 'justify-center'}
          `}
        >
          {sidebarOpen ? (
            <div className="w-full h-full flex items-center">
              <img
                src="/images/logo.png"
                alt="TAKKA STEEL"
                style={{
                  height: '72px',
                  width: 'auto',
                  maxWidth: '210px',
                  objectFit: 'contain',
                  objectPosition: 'left center',
                  /* compensate for large transparent padding in PNG */
                  transform: 'scale(1.25) translateX(8px)',
                  transformOrigin: 'left center',
                }}
              />
            </div>
          ) : (
            /* Collapsed: compact "T" badge */
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #1E4FA0, #0E2554)' }}
            >
              <span className="text-white font-black text-xl leading-none">T</span>
            </div>
          )}
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden scrollbar-none">

          {/* Dashboard */}
          <div className={`${sidebarOpen ? 'px-3' : 'px-2'} mb-1`}>
            <SidebarLink to="/" icon={<IconDashboard />} label="Dashboard" collapsed={!sidebarOpen} end />
          </div>

          {/* ─ Master Data ─ */}
          <SectionHeader label="MASTER DATA" collapsed={!sidebarOpen} />
          <div className={`${sidebarOpen ? 'px-3' : 'px-2'} space-y-0.5`}>
            <SidebarLink to="/master/items"      icon={<IconBox />}      label="Barang"    collapsed={!sidebarOpen} />
            <SidebarLink to="/master/suppliers"  icon={<IconTruck />}    label="Supplier"  collapsed={!sidebarOpen} />
            <SidebarLink to="/master/customers"  icon={<IconUsers />}    label="Customer"  collapsed={!sidebarOpen} />
            <SidebarLink to="/master/categories" icon={<IconTag />}      label="Kategori"  collapsed={!sidebarOpen} />
            <SidebarLink to="/master/units"      icon={<IconRuler />}    label="Satuan"    collapsed={!sidebarOpen} />
          </div>

          {/* ─ Transaksi ─ */}
          <SectionHeader label="TRANSAKSI" collapsed={!sidebarOpen} />
          <div className={`${sidebarOpen ? 'px-3' : 'px-2'} space-y-0.5`}>
            <SidebarLink to="/transaksi/masuk"  icon={<IconArrowIn />}  label="Barang Masuk"  collapsed={!sidebarOpen} />
            <SidebarLink to="/transaksi/keluar" icon={<IconArrowOut />} label="Barang Keluar" collapsed={!sidebarOpen} />
          </div>

          {/* ─ Stok ─ */}
          <SectionHeader label="STOK" collapsed={!sidebarOpen} />
          <div className={`${sidebarOpen ? 'px-3' : 'px-2'} space-y-0.5`}>
            <SidebarLink to="/stock" icon={<IconChart />} label="Posisi Stok" collapsed={!sidebarOpen} />
          </div>

          {/* ─ Logistik ─ */}
          <SectionHeader label="LOGISTIK" collapsed={!sidebarOpen} />
          <div className={`${sidebarOpen ? 'px-3' : 'px-2'} space-y-0.5`}>
            <SidebarLink to="/warehouse/layout" icon={<IconWarehouse />} label="Layout Gudang" collapsed={!sidebarOpen} />
          </div>

          {/* ─ Laporan (admin + owner only) ─ */}
          {(user?.role === 'admin' || user?.role === 'owner') && (
            <>
              <SectionHeader label="LAPORAN" collapsed={!sidebarOpen} />
              <div className={`${sidebarOpen ? 'px-3' : 'px-2'} space-y-0.5`}>
                <SidebarLink to="/laporan/stok" icon={<IconReport />} label="Laporan Stok" collapsed={!sidebarOpen} />
                <SidebarLink to="/laporan/advanced" icon={<IconExcel />} label="Export Excel" collapsed={!sidebarOpen} />
              </div>
            </>
          )}

          {/* ─ Pengaturan (owner only) ─ */}
          {user?.role === 'owner' && (
            <>
              {/* Divider */}
              <div className="mx-4 my-3 border-t border-white/10" />
              <div className={`${sidebarOpen ? 'px-3' : 'px-2'}`}>
                <SidebarLink to="/settings/users" icon={<IconSettings />} label="Pengaturan" collapsed={!sidebarOpen} />
              </div>
            </>
          )}
        </nav>

        {/* ── Collapse toggle — bottom strip ── */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden lg:flex items-center justify-center h-12 border-t border-white/10 transition-colors group"
          style={{ background: 'rgba(255,255,255,0.04)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.10)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          title={sidebarOpen ? 'Sembunyikan sidebar' : 'Tampilkan sidebar'}
        >
          <svg
            className={`w-4 h-4 text-white/40 transition-all duration-300 group-hover:text-white/80 ${!sidebarOpen ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </aside>
    </>
  );
}

/* ─────────────────────────────────────────────
   SidebarLink
───────────────────────────────────────────── */
function SidebarLink({ to, icon, label, collapsed, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `relative flex items-center gap-3 rounded-xl transition-all duration-200 ease-out group
         ${collapsed ? 'justify-center px-0 py-3 w-full' : 'px-3 py-2.5'}
         ${isActive
           ? 'bg-[#FFD60A] text-gray-900 font-semibold shadow-lg shadow-yellow-500/20'
           : 'text-white/65 hover:text-white hover:bg-white/10'
         }`
      }
    >
      {({ isActive }) => (
        <>
          {/* Left glow bar on active (expanded) */}
          {!collapsed && isActive && (
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full -ml-3"
              style={{ background: '#FFD60A', boxShadow: '0 0 8px rgba(255,214,10,0.8)' }}
            />
          )}

          {/* Icon */}
          <span className={`flex-shrink-0 transition-all duration-200 ${
            isActive ? 'text-gray-800 scale-105' : 'text-white/50 group-hover:text-white group-hover:scale-105'
          }`}>
            {icon}
          </span>

          {/* Label */}
          {!collapsed && (
            <span className="text-[13.5px] leading-none truncate">{label}</span>
          )}

          {/* Hover tooltip when collapsed */}
          {collapsed && (
            <span className="
              pointer-events-none absolute left-full ml-4 top-1/2 -translate-y-1/2 z-50
              bg-gray-900/95 text-white text-xs font-medium rounded-lg px-3 py-2
              whitespace-nowrap shadow-xl border border-white/10
              opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0
              transition-all duration-200
            ">
              {label}
              {/* Tooltip arrow */}
              <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900/95" />
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

/* ─────────────────────────────────────────────
   SectionHeader
───────────────────────────────────────────── */
function SectionHeader({ label, collapsed }) {
  if (collapsed) {
    return <div className="my-3 mx-auto w-8 h-px bg-white/15 rounded" />;
  }
  return (
    <div className="px-6 pt-5 pb-2">
      <span
        className="text-[10px] font-bold tracking-[0.12em] uppercase"
        style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em' }}
      >
        {label}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Icons
───────────────────────────────────────────── */
const I = ({ children }) => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const IconDashboard  = () => <I><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></I>;
const IconBox        = () => <I><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></I>;
const IconTruck      = () => <I><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></I>;
const IconUsers      = () => <I><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></I>;
const IconTag        = () => <I><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></I>;
const IconRuler      = () => <I><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></I>;
const IconArrowIn    = () => <I><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></I>;
const IconArrowOut   = () => <I><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></I>;
const IconChart      = () => <I><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17v-5"/><path d="M12 17v-9"/><path d="M15 17v-3"/></I>;
const IconReport     = () => <I><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></I>;
const IconSettings   = () => <I><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></I>;
const IconWarehouse  = () => <I><path d="M3 21v-8a2 2 0 012-2h14a2 2 0 012 2v8"/><path d="M9 21V9a2 2 0 012-2h2a2 2 0 012 2v12"/><path d="M2 3h20"/></I>;
const IconExcel      = () => <I><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13l3 3-3 3"/><path d="M16 13l-3 3 3 3"/></I>;
