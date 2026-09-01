import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStringOrTimestamp: string | number): string {
  if (!dateStringOrTimestamp) return '—';
  try {
    const d = typeof dateStringOrTimestamp === 'number' 
      ? new Date(dateStringOrTimestamp) 
      : new Date(dateStringOrTimestamp);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch (_) {
    return String(dateStringOrTimestamp);
  }
}

export function formatRelativeTime(dateStringOrTimestamp: string | number): string {
  if (!dateStringOrTimestamp) return '—';
  try {
    const d = typeof dateStringOrTimestamp === 'number' 
      ? new Date(dateStringOrTimestamp) 
      : new Date(dateStringOrTimestamp);
    const diffSeconds = Math.floor((Date.now() - d.getTime()) / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return `${Math.floor(diffSeconds / 86400)}d ago`;
  } catch (_) {
    return 'recently';
  }
}

export function getBadgeColor(badgeName: string): { bg: string; text: string; border: string } {
  const lower = badgeName.toLowerCase();
  if (lower.includes('nitro')) {
    return { bg: 'bg-fuchsia-950/60', text: 'text-fuchsia-400', border: 'border-fuchsia-800/60' };
  }
  if (lower.includes('early supporter')) {
    return { bg: 'bg-amber-950/60', text: 'text-amber-400', border: 'border-amber-700/60' };
  }
  if (lower.includes('bug hunter')) {
    return { bg: 'bg-emerald-950/60', text: 'text-emerald-400', border: 'border-emerald-700/60' };
  }
  if (lower.includes('hypesquad bravery')) {
    return { bg: 'bg-rose-950/60', text: 'text-rose-400', border: 'border-rose-800/60' };
  }
  if (lower.includes('hypesquad brilliance')) {
    return { bg: 'bg-orange-950/60', text: 'text-orange-400', border: 'border-orange-800/60' };
  }
  if (lower.includes('hypesquad balance')) {
    return { bg: 'bg-teal-950/60', text: 'text-teal-400', border: 'border-teal-700/60' };
  }
  if (lower.includes('developer')) {
    return { bg: 'bg-cyan-950/60', text: 'text-cyan-400', border: 'border-cyan-700/60' };
  }
  if (lower.includes('staff')) {
    return { bg: 'bg-purple-950/60', text: 'text-purple-300', border: 'border-purple-600/70' };
  }
  return { bg: 'bg-zinc-900', text: 'text-zinc-400', border: 'border-zinc-800' };
}
