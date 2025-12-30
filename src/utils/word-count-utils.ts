export function formatNumber(num: number): string {
  if (!Number.isFinite(num) || num < 0) {
    return '0';
  }

  if (num < 1000) {
    return num.toString();
  }
  
  return `${(num / 1000).toFixed(1)}k`;
}

