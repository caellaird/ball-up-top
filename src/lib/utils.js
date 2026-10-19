import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
} 


export const isIframe = window.self !== window.top;

// Server timestamps come back without a timezone marker (already UTC).
// Parse them as UTC so they aren't mistaken for local time (which shifts them by the tz offset).
export function parseServerDate(value) {
  if (!value) return null;
  const s = String(value);
  if (/[zZ]$/.test(s) || /[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s);
  return new Date(s + "Z");
}