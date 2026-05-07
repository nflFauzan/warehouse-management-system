import { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import PageHeader from '../components/PageHeader';
import { formatNumber } from '../utils/format';
import { FileDown, Package, Users, Truck, Calendar, X } from 'lucide-react';

export default function ReportStockPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState(null);
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Default: first day of current month → today
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [filters, setFilters] = useState({ date_from: firstOfMonth, date_to: today, category_id: '' });

  useEffect(() => { 
    fetchReport(); 
    fetchFilterData();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/stock', { params: filters });
      setData(res.data);
    } catch (err) {
      addToast('Gagal memuat laporan stok', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterData = async () => {
    try {
      const [itemsRes, custRes] = await Promise.all([
        api.get('/items?limit=1000'),
        api.get('/customers?limit=1000')
      ]);
      setItems(itemsRes.data.items || []);
      setCustomers(custRes.data.customers || []);
    } catch (err) {
      console.error('Failed to load filter data');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchReport();
  };

  const handleDownload = async (endpoint, filename, params = {}) => {
    try {
      const response = await api.get(`/reports/export/${endpoint}`, {
        params,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast(`Laporan ${filename} berhasil diunduh`, 'success');
      setShowExportModal(false);
    } catch (err) {
      addToast('Gagal mengunduh laporan', 'error');
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-start">
        <div>
          <PageHeader title="Laporan Stok Periodik" />
          <p className="text-sm text-gray-500 -mt-4">Ringkasan mutasi stok per periode</p>
        </div>
        <button 
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
        >
          <FileDown size={18} /> Export Excel
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="form-label">Dari</label>
            <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} className="form-input" />
          </div>
          <div>
            <label className="form-label">Sampai</label>
            <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} className="form-input" />
          </div>
          <div className="w-44">
            <label className="form-label">Kategori</label>
            <select value={filters.category_id} onChange={(e) => setFilters({ ...filters, category_id: e.target.value })} className="form-select">
              <option value="">Semua</option>
              {data?.categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-secondary">Tampilkan</button>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">Memuat laporan...</div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="card text-center border-l-4 border-success">
              <p className="text-xs text-gray-500 uppercase mb-1">Total Masuk</p>
              <p className="text-xl font-bold font-mono text-success">+{formatNumber(data.summary.total_in)}</p>
            </div>
            <div className="card text-center border-l-4 border-danger">
              <p className="text-xs text-gray-500 uppercase mb-1">Total Keluar</p>
              <p className="text-xl font-bold font-mono text-danger">-{formatNumber(data.summary.total_out)}</p>
            </div>
            <div className="card text-center border-l-4 border-blue-500">
              <p className="text-xs text-gray-500 uppercase mb-1">Selisih Bersih</p>
              <p className={`text-xl font-bold font-mono ${data.summary.net >= 0 ? 'text-success' : 'text-danger'}`}>
                {data.summary.net >= 0 ? '+' : ''}{formatNumber(data.summary.net)}
              </p>
            </div>
          </div>

          {/* Data Table */}
          <div className="card overflow-hidden p-0 border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="py-3 px-4 text-left font-semibold text-gray-600">Kode</th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-600">Nama</th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-600">Kategori</th>
                    <th className="py-3 px-4 text-right font-semibold text-gray-600">Stok Awal</th>
                    <th className="py-3 px-4 text-right font-semibold text-gray-600">Masuk</th>
                    <th className="py-3 px-4 text-right font-semibold text-gray-600">Keluar</th>
                    <th className="py-3 px-4 text-right font-semibold text-gray-600">Stok Akhir</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-8 text-gray-400 italic">Tidak ada data pada periode ini</td></tr>
                  ) : (
                    data.items.map((row) => (
                      <tr key={row.item.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs text-gray-500">{row.item.code}</td>
                        <td className="py-3 px-4 font-medium text-gray-800">{row.item.name}</td>
                        <td className="py-3 px-4 text-gray-500">{row.item.category ? row.item.category.name : '-'}</td>
                        <td className="py-3 px-4 text-right font-mono text-gray-600">{formatNumber(row.stok_awal)}</td>
                        <td className="py-3 px-4 text-right font-mono text-success">{row.total_in > 0 ? '+' + formatNumber(row.total_in) : '-'}</td>
                        <td className="py-3 px-4 text-right font-mono text-danger">{row.total_out > 0 ? '-' + formatNumber(row.total_out) : '-'}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                          {formatNumber(row.stok_akhir)} <span className="text-gray-400 text-xs font-normal ml-1">{row.item.unit ? row.item.unit.abbr : ''}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FileDown className="text-green-600" /> Export Laporan Excel
              </h3>
              <button onClick={() => { setShowExportModal(false); setExportType(null); }} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              {!exportType ? (
                <div className="grid grid-cols-2 gap-4">
                  <ExportOption 
                    icon={<Package className="text-blue-600" />} 
                    title="Rekap per Item" 
                    desc="Multi-tahun (2023-2026) dengan breakdown bulanan" 
                    onClick={() => setExportType('items')}
                  />
                  <ExportOption 
                    icon={<Users className="text-green-600" />} 
                    title="Rekap per Customer" 
                    desc="Distribusi barang per customer per bulan" 
                    onClick={() => setExportType('customers')}
                  />
                  <ExportOption 
                    icon={<Truck className="text-purple-600" />} 
                    title="Rekap Supplier" 
                    desc="Volume dan transaksi per supplier" 
                    onClick={() => setExportType('suppliers')}
                  />
                  <ExportOption 
                    icon={<Calendar className="text-orange-600" />} 
                    title="Rekap Harian" 
                    desc="Log transaksi lengkap untuk tanggal tertentu" 
                    onClick={() => setExportType('daily')}
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <button onClick={() => setExportType(null)} className="text-sm text-blue-600 hover:underline flex items-center gap-1 mb-2">
                    &larr; Kembali pilih tipe
                  </button>
                  
                  {exportType === 'items' && (
                    <div className="space-y-4">
                      <label className="block text-sm font-semibold text-gray-700">Pilih Barang (Opsional)</label>
                      <select id="exp_item_id" className="w-full p-2.5 border rounded-xl bg-gray-50">
                        <option value="">Semua Barang</option>
                        {items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                      </select>
                      <button 
                        onClick={() => handleDownload('items', 'rekap-item', { item_id: document.getElementById('exp_item_id').value })}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md active:scale-[0.98]"
                      >
                        Generate Excel
                      </button>
                    </div>
                  )}

                  {exportType === 'customers' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Bulan</label>
                          <select id="exp_cust_month" className="w-full p-2.5 border rounded-xl bg-gray-50">
                            {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Tahun</label>
                          <select id="exp_cust_year" className="w-full p-2.5 border rounded-xl bg-gray-50">
                            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDownload('customers', 'rekap-customer', { month: document.getElementById('exp_cust_month').value, year: document.getElementById('exp_cust_year').value })}
                        className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-md active:scale-[0.98]"
                      >
                        Generate Excel
                      </button>
                    </div>
                  )}

                  {exportType === 'suppliers' && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500">Mengekspor ringkasan performa untuk semua supplier aktif.</p>
                      <button 
                        onClick={() => handleDownload('suppliers', 'rekap-supplier')}
                        className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all shadow-md active:scale-[0.98]"
                      >
                        Generate Excel
                      </button>
                    </div>
                  )}

                  {exportType === 'daily' && (
                    <div className="space-y-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Pilih Tanggal</label>
                      <input type="date" id="exp_daily_date" defaultValue={today} className="w-full p-2.5 border rounded-xl bg-gray-50" />
                      <button 
                        onClick={() => handleDownload('daily', `rekap-harian-${document.getElementById('exp_daily_date').value}`, { date: document.getElementById('exp_daily_date').value })}
                        className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all shadow-md active:scale-[0.98]"
                      >
                        Generate Excel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExportOption({ icon, title, desc, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-start p-4 border border-gray-100 rounded-2xl bg-gray-50/30 hover:bg-white hover:border-blue-200 hover:shadow-lg transition-all group text-left"
    >
      <div className="p-2 bg-white rounded-xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h4 className="font-bold text-gray-800 mb-1">{title}</h4>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </button>
  );
}
