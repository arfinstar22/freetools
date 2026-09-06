export function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes <= 0 || !isFinite(bytes) || isNaN(bytes)) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (i < 0 || i >= sizes.length || !isFinite(i)) return '0 B';
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatNumber(num: number): string {
  if (!num || !isFinite(num) || isNaN(num)) return '0';
  return new Intl.NumberFormat('id-ID').format(num);
}

export function formatTime(ms: number): string {
  if (!ms || ms < 0 || !isFinite(ms)) return '0ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)} detik`;
}

export function truncate(str: string, maxLength: number = 30): string {
  if (!str || str.length <= maxLength) return str || '';
  return `${str.slice(0, maxLength - 3)}...`;
}

export function sanitizeFilename(filename: string): string {
  if (!filename) return 'file';
  const clean = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return clean || 'file';
}
