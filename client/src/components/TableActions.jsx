import { Link } from 'react-router-dom';

export default function TableActions({ editUrl, onDelete, showDelete = true }) {
  return (
    <div className="flex items-center justify-center gap-1">
      {editUrl && (
        <Link to={editUrl} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-yellow-600 transition-colors" title="Edit">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
        </Link>
      )}
      {showDelete && onDelete && (
        <button onClick={onDelete} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-danger transition-colors" title="Hapus">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      )}
    </div>
  );
}
