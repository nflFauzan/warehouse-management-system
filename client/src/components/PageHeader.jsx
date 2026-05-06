import { Link } from 'react-router-dom';

export default function PageHeader({ title, backUrl, actionUrl, actionLabel }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {backUrl && (
          <Link to={backUrl} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
          </Link>
        )}
        <h1 className="text-xl font-bold text-dark-gray">{title}</h1>
      </div>
      
      {actionUrl && actionLabel && (
        <Link to={actionUrl} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg> 
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
