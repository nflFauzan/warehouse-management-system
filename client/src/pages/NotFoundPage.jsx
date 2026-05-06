import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="text-center">
        <p className="text-6xl font-bold text-gray-300 mb-4">404</p>
        <p className="text-xl font-semibold text-dark-gray mb-2">Halaman Tidak Ditemukan</p>
        <p className="text-gray-500 mb-6">Halaman yang Anda cari tidak tersedia.</p>
        <Link to="/" className="btn-secondary">Kembali ke Dashboard</Link>
      </div>
    </div>
  );
}
