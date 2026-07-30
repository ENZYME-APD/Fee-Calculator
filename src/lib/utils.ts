import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const CATEGORY_ORDER: Record<string, number> = {
  'MANAGEMENT': 1,
  'TEAM GLOBAL': 2,
  'TEAM': 2,
  'TEAM JAKARTA': 3,
  'CONSULTANTS': 4,
};

export function getCategoryOrder(category?: string): number {
  if (!category) return 99;
  return CATEGORY_ORDER[category.toUpperCase()] || 99;
}
