export function getStockStatusBadge(stock, minStock) {
  if (stock <= 0) {
    return <span className="badge-empty">KOSONG</span>;
  }
  if (stock <= minStock) {
    return <span className="badge-critical">KRITIS</span>;
  }
  return <span className="badge-safe">AMAN</span>;
}
