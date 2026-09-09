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

export const GLOBAL_CATEGORIES = [
  { name: 'Food & Dining', emoji: '🍔', icon: 'Utensils', color: '#0EA5E9', bgColor: 'bg-sky-50 text-sky-600 border-sky-100', barColor: 'bg-sky-500' },
  { name: 'Transport', emoji: '🚗', icon: 'Car', color: '#6366F1', bgColor: 'bg-indigo-50 text-indigo-600 border-indigo-100', barColor: 'bg-indigo-500' },
  { name: 'Rent & Housing', emoji: '🏠', icon: 'Home', color: '#F59E0B', bgColor: 'bg-amber-50 text-amber-600 border-amber-100', barColor: 'bg-amber-500' },
  { name: 'Groceries', emoji: '🛒', icon: 'ShoppingBag', color: '#10B981', bgColor: 'bg-emerald-50 text-emerald-600 border-emerald-100', barColor: 'bg-emerald-500' },
  { name: 'Healthcare', emoji: '💊', icon: 'HeartPulse', color: '#EC4899', bgColor: 'bg-pink-50 text-pink-600 border-pink-100', barColor: 'bg-pink-500' },
  { name: 'Entertainment', emoji: '🎬', icon: 'Film', color: '#8B5CF6', bgColor: 'bg-purple-50 text-purple-600 border-purple-100', barColor: 'bg-purple-500' },
  { name: 'Utilities & Bills', emoji: '📱', icon: 'Zap', color: '#3B82F6', bgColor: 'bg-blue-50 text-blue-600 border-blue-100', barColor: 'bg-blue-500' },
  { name: 'Travel', emoji: '✈️', icon: 'Plane', color: '#14B8A6', bgColor: 'bg-teal-50 text-teal-600 border-teal-100', barColor: 'bg-teal-500' },
  { name: 'Education', emoji: '🎓', icon: 'GraduationCap', color: '#F97316', bgColor: 'bg-orange-50 text-orange-600 border-orange-100', barColor: 'bg-orange-500' },
  { name: 'Shopping', emoji: '👗', icon: 'ShoppingBag', color: '#EAB308', bgColor: 'bg-yellow-50 text-yellow-600 border-yellow-100', barColor: 'bg-yellow-500' },
  { name: 'Work & Business', emoji: '💼', icon: 'Briefcase', color: '#475569', bgColor: 'bg-slate-50 text-slate-600 border-slate-200', barColor: 'bg-slate-600' },
  { name: 'Gifts', emoji: '🎁', icon: 'Gift', color: '#F43F5E', bgColor: 'bg-rose-50 text-rose-600 border-rose-100', barColor: 'bg-rose-500' },
  { name: 'Fitness', emoji: '🏋️', icon: 'Dumbbell', color: '#06B6D4', bgColor: 'bg-cyan-50 text-cyan-600 border-cyan-100', barColor: 'bg-cyan-500' },
  { name: 'Pet Care', emoji: '🐾', icon: 'PawPrint', color: '#A855F7', bgColor: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100', barColor: 'bg-fuchsia-500' },
  { name: 'Others', emoji: '📦', icon: 'MoreHorizontal', color: '#64748B', bgColor: 'bg-slate-100 text-slate-600 border-slate-200', barColor: 'bg-slate-500' }
];

export const CATEGORY_ALIASES = {
  food: 'Food & Dining',
  medical: 'Healthcare',
  utilities: 'Utilities & Bills',
  housing: 'Rent & Housing',
  rent: 'Rent & Housing'
};

export const CATEGORY_CONFIG = GLOBAL_CATEGORIES.reduce((acc, cat) => {
  acc[cat.name] = cat;
  return acc;
}, {
  Food: { name: 'Food & Dining', emoji: '🍔', icon: 'Utensils', color: '#0EA5E9', bgColor: 'bg-sky-50 text-sky-600 border-sky-100', barColor: 'bg-sky-500' },
  Medical: { name: 'Healthcare', emoji: '💊', icon: 'HeartPulse', color: '#EC4899', bgColor: 'bg-pink-50 text-pink-600 border-pink-100', barColor: 'bg-pink-500' },
  Utilities: { name: 'Utilities & Bills', emoji: '📱', icon: 'Zap', color: '#3B82F6', bgColor: 'bg-blue-50 text-blue-600 border-blue-100', barColor: 'bg-blue-500' },
  Housing: { name: 'Rent & Housing', emoji: '🏠', icon: 'Home', color: '#F59E0B', bgColor: 'bg-amber-50 text-amber-600 border-amber-100', barColor: 'bg-amber-500' },
  Settlement: { name: 'Settlement', emoji: '🤝', icon: 'CheckCircle2', color: '#10B981', bgColor: 'bg-emerald-50 text-emerald-600 border-emerald-100', barColor: 'bg-emerald-500' }
});

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

  const lower = String(categoryName).toLowerCase();
  if (CATEGORY_ALIASES[lower] && CATEGORY_CONFIG[CATEGORY_ALIASES[lower]]) {
    return CATEGORY_CONFIG[CATEGORY_ALIASES[lower]];
  }

  const customMatch = (customList || []).find(
    c => c.name && c.name.toLowerCase() === lower
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

