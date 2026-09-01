import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(dateString: string | Date): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

export function formatAge(bornAt: string | Date): string {
  const born = new Date(bornAt);
  const now = new Date();
  const diffHours = (now.getTime() - born.getTime()) / (1000 * 3600);
  const days = Math.floor(diffHours / 24);
  const hours = Math.floor(diffHours % 24);
  
  if (days === 0) return `${hours} hrs`;
  return `${days}d ${hours}h`;
}

export function getRarityBadgeColor(rarity: string): string {
  switch (rarity) {
    case 'COMMON':
      return 'bg-slate-700/60 text-slate-300 border-slate-600';
    case 'UNCOMMON':
      return 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40';
    case 'RARE':
      return 'bg-blue-950/70 text-blue-300 border-blue-500/40';
    case 'LEGENDARY':
      return 'bg-amber-950/80 text-amber-300 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.25)]';
    default:
      return 'bg-slate-800 text-slate-300 border-slate-700';
  }
}

export function getWaterTypeColor(waterType: string): string {
  switch (waterType) {
    case 'FRESHWATER':
      return 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60';
    case 'SALTWATER':
      return 'text-blue-400 bg-blue-950/60 border-blue-800/60';
    case 'BRACKISH':
      return 'text-teal-400 bg-teal-950/60 border-teal-800/60';
    default:
      return 'text-slate-400 bg-slate-900 border-slate-800';
  }
}

export function getHealthColor(health: number): { text: string; bg: string; bar: string } {
  if (health > 70) {
    return { text: 'text-emerald-400', bg: 'bg-emerald-500/20', bar: 'bg-emerald-500' };
  } else if (health > 30) {
    return { text: 'text-amber-400', bg: 'bg-amber-500/20', bar: 'bg-amber-500' };
  } else {
    return { text: 'text-rose-400', bg: 'bg-rose-500/20', bar: 'bg-rose-500' };
  }
}

export function getHungerColor(hunger: number): { text: string; bg: string; bar: string } {
  if (hunger > 60) {
    return { text: 'text-cyan-400', bg: 'bg-cyan-500/20', bar: 'bg-cyan-500' };
  } else if (hunger > 25) {
    return { text: 'text-amber-400', bg: 'bg-amber-500/20', bar: 'bg-amber-500' };
  } else {
    return { text: 'text-rose-400', bg: 'bg-rose-500/20', bar: 'bg-rose-500' };
  }
}

export function calculateNextFeedingTime(
  hunger: number,
  hungerRate: string = 'MEDIUM'
): { text: string; isDue: boolean; isCritical: boolean } {
  const ratePerHourMap: Record<string, number> = {
    SLOW: 2.8,
    MEDIUM: 5.0,
    FAST: 8.3,
  };
  const rate = ratePerHourMap[hungerRate] || 5.0;

  if (hunger <= 20) {
    const hoursToZero = Math.max(0, hunger / rate);
    const mins = Math.round(hoursToZero * 60);
    return {
      text: mins <= 0 ? 'Starving (Feed Immediately!)' : `Starving in ${mins}m!`,
      isDue: true,
      isCritical: true,
    };
  }

  if (hunger <= 50) {
    return {
      text: 'Feeding Due Now',
      isDue: true,
      isCritical: false,
    };
  }

  // Hours remaining until hunger drops below 50%
  const hoursRemaining = (hunger - 50) / rate;
  const wholeHours = Math.floor(hoursRemaining);
  const remainingMins = Math.round((hoursRemaining - wholeHours) * 60);

  if (wholeHours === 0) {
    return {
      text: `In ~${remainingMins} mins`,
      isDue: false,
      isCritical: false,
    };
  }

  return {
    text: `In ~${wholeHours}h ${remainingMins}m`,
    isDue: false,
    isCritical: false,
  };
}

export function formatDateTime(dateString: string | Date): string {
  const d = new Date(dateString);
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

