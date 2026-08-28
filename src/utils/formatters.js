export function formatINR(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2
  }).format(num);
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(d);
}

export function formatDateOnly(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(d);
}

export function getMonthName(monthStr) {
  // monthStr: YYYY-MM
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, 1));
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function getCurrentMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export const CATEGORY_CONFIG = {
  Food: {
    name: 'Food',
    color: '#10b981', // emerald-500
    bgLight: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    icon: 'Utensils'
  },
  Shopping: {
    name: 'Shopping',
    color: '#6366f1', // indigo-500
    bgLight: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    text: 'text-indigo-400',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    icon: 'ShoppingBag'
  },
  Entertainment: {
    name: 'Entertainment',
    color: '#f59e0b', // amber-500
    bgLight: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    icon: 'Film'
  },
  Medical: {
    name: 'Medical',
    color: '#f43f5e', // rose-500
    bgLight: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    icon: 'HeartPulse'
  },
  Transport: {
    name: 'Transport',
    color: '#0ea5e9', // sky-500
    bgLight: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    text: 'text-sky-400',
    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    icon: 'Car'
  },
  Others: {
    name: 'Others',
    color: '#8b5cf6', // purple-500
    bgLight: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    icon: 'MoreHorizontal'
  }
};
