// ============================================
// Utility Functions
// ============================================

/** Format number with commas */
export function formatNumber(n: number, decimals = 2): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Get CSS class for crash point color */
export function getCrashColor(crashPoint: number): string {
  if (crashPoint < 2) return 'text-accent-red';
  if (crashPoint < 5) return 'text-accent-orange';
  if (crashPoint < 10) return 'text-accent-purple';
  return 'text-accent-green';
}

/** Get crash point background class */
export function getCrashBg(crashPoint: number): string {
  if (crashPoint < 2) return 'bg-accent-red/20 text-accent-red';
  if (crashPoint < 5) return 'bg-accent-orange/20 text-accent-orange';
  if (crashPoint < 10) return 'bg-accent-purple/20 text-accent-purple';
  return 'bg-accent-green/20 text-accent-green';
}

/** Format date for display */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Format relative time */
export function timeAgo(date: string | Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/** Truncate string */
export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + '...';
}
