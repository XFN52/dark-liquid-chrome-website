/** 41 240 · 99.94 · 8.0 — группировка тысяч неразрывным пробелом */
export function formatNumber(value: number, decimals = 0): string {
  const fixed = value.toFixed(decimals);
  const parts = fixed.split('.');
  const int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return decimals > 0 ? `${int}.${parts[1]}` : int;
}
