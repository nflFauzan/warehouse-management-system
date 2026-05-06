export function formatNumber(num) {
  if (!num) return '0';
  return parseFloat(num).toLocaleString('id-ID');
}
