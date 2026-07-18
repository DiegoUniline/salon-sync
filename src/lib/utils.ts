import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns YYYY-MM-DD for the given date using local time (not UTC).
 * Prevents the "sale registered on the next day" bug caused by
 * `new Date().toISOString().split('T')[0]` after 18:00 in negative TZs.
 */
export function todayLocalISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
