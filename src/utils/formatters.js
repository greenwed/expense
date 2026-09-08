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

export function formatDayHeader(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(d);
}

export function getMonthName(monthStr) {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, 1));
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function getMonthShort(monthStr) {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, 1));
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function getCurrentMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function groupExpensesByDay(expenses = []) {
  const groups = {};
  expenses.forEach((item) => {
    const d = new Date(item.date);
    const dayKey = isNaN(d.getTime()) ? 'Unknown' : d.toISOString().slice(0, 10);
    if (!groups[dayKey]) {
      groups[dayKey] = {
        date: dayKey,
        formattedDate: dayKey === 'Unknown' ? 'Other' : formatDayHeader(item.date),
        dayTotal: 0,
        items: []
      };
    }
    groups[dayKey].dayTotal += Number(item.amount) || 0;
    groups[dayKey].items.push(item);
  });

  return Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date));
}

export const CATEGORY_CONFIG = {
  Food: {
    name: 'Food',
    color: '#0EA5E9',
    bgColor: 'bg-sky-50 text-sky-600 border-sky-100',
    barColor: 'bg-sky-500',
    icon: 'Utensils'
  },
  Shopping: {
    name: 'Shopping',
    color: '#F97316',
    bgColor: 'bg-orange-50 text-orange-600 border-orange-100',
    barColor: 'bg-orange-500',
    icon: 'ShoppingBag'
  },
  Entertainment: {
    name: 'Entertainment',
    color: '#8B5CF6',
    bgColor: 'bg-purple-50 text-purple-600 border-purple-100',
    barColor: 'bg-purple-500',
    icon: 'Film'
  },
  Medical: {
    name: 'Medical',
    color: '#10B981',
    bgColor: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    barColor: 'bg-emerald-500',
    icon: 'HeartPulse'
  },
  Transport: {
    name: 'Transport',
    color: '#6366F1',
    bgColor: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    barColor: 'bg-indigo-500',
    icon: 'Car'
  },
  Others: {
    name: 'Others',
    color: '#F43F5E',
    bgColor: 'bg-rose-50 text-rose-600 border-rose-100',
    barColor: 'bg-rose-500',
    icon: 'MoreHorizontal'
  }
};

export const CATEGORY_PALETTE = [
  '#0EA5E9', // Sky Blue
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#EAB308', // Yellow
  '#10B981', // Emerald
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#64748B'  // Slate
];

export const CATEGORY_ICONS = [
  'Tag',
  'Utensils',
  'ShoppingBag',
  'Film',
  'HeartPulse',
  'Car',
  'Coffee',
  'Briefcase',
  'Dumbbell',
  'Fuel',
  'Home',
  'Gift',
  'GraduationCap',
  'Gamepad2',
  'Plane',
  'Wifi',
  'BookOpen',
  'Music',
  'Camera',
  'PawPrint',
  'DollarSign'
];

export function getCategoryConfig(categoryName, customList = []) {
  if (!categoryName) return CATEGORY_CONFIG.Others;
  
  if (CATEGORY_CONFIG[categoryName]) {
    return CATEGORY_CONFIG[categoryName];
  }

  const customMatch = (customList || []).find(
    c => c.name && c.name.toLowerCase() === categoryName.toLowerCase()
  );

  if (customMatch) {
    return {
      name: customMatch.name,
      color: customMatch.color || '#8B5CF6',
      bgColor: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      barColor: 'bg-indigo-500',
      icon: customMatch.icon || 'Tag',
      isCustom: true
    };
  }

  return {
    name: categoryName,
    color: '#8B5CF6',
    bgColor: 'bg-purple-50 text-purple-600 border-purple-100',
    barColor: 'bg-purple-500',
    icon: 'Tag',
    isCustom: true
  };
}

/**
 * Returns the public web app domain for invite links.
 * In Android Capacitor or local environment, returns the canonical production URL.
 */
export function getAppBaseUrl() {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const hostname = window.location.hostname;
    const isLocalOrCapacitor =
      window.Capacitor?.isNativePlatform?.() ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      window.location.protocol === 'capacitor:';

    if (!isLocalOrCapacitor && origin && origin !== 'null' && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return origin;
    }
  }
  return 'https://trackrupee.vercel.app';
}

