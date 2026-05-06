import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';
import { formatNumber } from '../utils/format';
import { formatDate } from '../utils/dateUtils';

export default function DashboardPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/dashboard');
        setData(res.data);
      } catch (err) {
        addToast('Gagal memuat dashboard', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [addToast]);

  if (loading) return <div className="h-full flex items-center justify-center text-gray-400">Memuat dashboard...</div>;
  if (!data) return <div className="h-full flex items-center justify-center text-red-400">Gagal memuat data</div>;

  const { stats, recent_transactions, critical_items, chart_data } = data;

  // Calculate max value for chart scaling
  const chartMax = Math.max(...chart_data.map(d => Math.max(d.in, d.out)), 1);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-bold text-dark-gray">Selamat Datang, {user?.name} 👋</h1>
        <p className="text-sm text-gray-400 mt-1">Ringkasan aktivitas gudang hari ini</p>
      </div>

      {/* Critical Stock Alert */}
      {stats.critical_items > 0 && (
        <div className="alert-critical flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
          <div>
            <p className="font-semibold text-sm">⚠️ Peringatan Stok Kritis</p>
            <p className="text-xs mt-0.5">{stats.critical_items} item memiliki stok di bawah batas minimum.{' '}
              <Link to="/stock?status=critical" className="underline font-semibold hover:text-yellow-700">Lihat Detail →</Link>
            </p>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          label="Total SKU Aktif" 
          value={stats.total_sku} 
          sub="Item"
          bgColor="bg-blue-primary"
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>}
        />
        <StatCard 
          label="Masuk Hari Ini" 
          value={stats.in_today} 
          sub="Transaksi"
          bgColor="bg-success"
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16l-4-4m0 0l4-4m-4 4h18"/>}
        />
        <StatCard 
          label="Keluar Hari Ini" 
          value={stats.out_today} 
          sub="Transaksi"
          bgColor="bg-danger"
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>}
        />
        <StatCard 
          label="Stok Kritis" 
          value={stats.critical_items} 
          sub="Item"
          bgColor={stats.critical_items > 0 ? 'bg-yellow-accent' : 'bg-gray-200'}
          textColor={stats.critical_items > 0 ? 'text-danger' : 'text-gray-400'}
          iconColor={stats.critical_items > 0 ? 'text-dark-gray' : 'text-gray-400'}
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>}
        />
      </div>

      {/* Grid: Recent + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-dark-gray uppercase tracking-wider">Transaksi Terbaru</h2>
            <Link to="/stock" className="text-xs text-blue-primary hover:underline font-medium">Lihat Semua →</Link>
          </div>
          <div className="space-y-2.5">
            {recent_transactions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Belum ada transaksi</p>
            ) : (
              recent_transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <span className={`${tx.type === 'in' ? 'bg-green-100 text-success' : 'bg-red-100 text-danger'} text-[10px] font-bold w-12 text-center py-1 rounded`}>
                    {tx.type === 'in' ? 'IN' : 'OUT'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark-gray truncate">{tx.item ? tx.item.name : '-'}</p>
                    <p className="text-xs text-gray-400">{tx.item ? tx.item.code : ''} · {tx.createdBy ? tx.createdBy.name : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold font-mono ${tx.type === 'in' ? 'text-success' : 'text-danger'}`}>
                      {tx.type === 'in' ? '+' : '-'}{formatNumber(tx.quantity)}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(tx.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chart + Quick Actions */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-sm font-bold text-dark-gray uppercase tracking-wider mb-4">Aktivitas 7 Hari Terakhir</h2>
            <div className="h-[200px] flex items-end gap-2">
              {chart_data.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div className="flex gap-0.5 items-end flex-1 w-full">
                    {/* IN bar */}
                    <div className="flex-1 flex flex-col justify-end h-full">
                      {day.in > 0 && (
                        <div 
                          className="w-full bg-success rounded-t transition-all duration-300 min-h-[4px] relative group"
                          style={{ height: `${(day.in / chartMax) * 100}%` }}
                        >
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-mono text-success opacity-0 group-hover:opacity-100 transition-opacity">{day.in}</span>
                        </div>
                      )}
                    </div>
                    {/* OUT bar */}
                    <div className="flex-1 flex flex-col justify-end h-full">
                      {day.out > 0 && (
                        <div 
                          className="w-full bg-danger rounded-t transition-all duration-300 min-h-[4px] relative group"
                          style={{ height: `${(day.out / chartMax) * 100}%` }}
                        >
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-mono text-danger opacity-0 group-hover:opacity-100 transition-opacity">{day.out}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-gray-400 mt-1">{day.label}</span>
                </div>
              ))}
            </div>
            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-gray-50">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-success"></div><span className="text-xs text-gray-500">Masuk</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-danger"></div><span className="text-xs text-gray-500">Keluar</span></div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Link to="/transaksi/masuk/create" className="btn-primary text-center py-4 rounded-xl flex items-center justify-center gap-2 no-underline shadow-sm hover:shadow-md transition-shadow">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
              Barang Masuk
            </Link>
            <Link to="/transaksi/keluar/create" className="btn-secondary text-center py-4 rounded-xl flex items-center justify-center gap-2 no-underline shadow-sm hover:shadow-md transition-shadow">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
              Barang Keluar
            </Link>
          </div>
        </div>
      </div>

      {/* Critical Items Table */}
      {critical_items.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-danger uppercase tracking-wider">Item Stok Kritis</h2>
            <Link to="/stock?status=critical" className="text-xs text-blue-primary hover:underline font-medium">Lihat Semua →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="text-left py-2.5 px-3">Kode</th>
                  <th className="text-left py-2.5 px-3">Nama Barang</th>
                  <th className="text-left py-2.5 px-3">Kategori</th>
                  <th className="text-right py-2.5 px-3">Stok</th>
                  <th className="text-right py-2.5 px-3">Min.</th>
                </tr>
              </thead>
              <tbody>
                {critical_items.map((item) => (
                  <tr key={item.id} className="bg-[#FFF5F5] border-b border-red-100">
                    <td className="py-2.5 px-3 font-mono text-xs">{item.code}</td>
                    <td className="py-2.5 px-3 font-medium">{item.name}</td>
                    <td className="py-2.5 px-3 text-gray-500">{item.category ? item.category.name : '-'}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-danger">
                      {formatNumber(item.current_stock)} <span className="text-gray-400 font-normal">{item.unit ? item.unit.abbr : ''}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-500">{formatNumber(item.minimum_stock)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Inline Helper ---
function StatCard({ label, value, sub, bgColor, icon, textColor = 'text-dark-gray', iconColor = 'text-white' }) {
  return (
    <div className="card flex items-center gap-5 hover:shadow-md transition-shadow">
      <div className={`w-14 h-14 ${bgColor} rounded-full flex items-center justify-center flex-shrink-0 shadow-sm`}>
        <svg className={`w-6 h-6 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
        <p className={`text-2xl font-bold font-mono ${textColor}`}>{value}</p>
        <p className="text-[11px] text-gray-400">{sub}</p>
      </div>
    </div>
  );
}
