// Locale formatting done by hand instead of through Intl, so the output is the
// same in Node, browsers and Hermes on Android.

import type { Dictionary } from './fr.ts';

type FormatStrings = Dictionary['format'];

/** 1887436 → "1,8 Mo"; 26515 → "26 Ko". */
export function formatSize(bytes: number, f: FormatStrings): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < f.sizeUnits.length - 1) {
    value /= 1024;
    unit++;
  }
  // One decimal from Mo up, and only below 10 ("1,8 Mo", "24 Mo").
  const text = unit >= 2 && value < 10 ? value.toFixed(1).replace('.', f.decimalSeparator) : String(Math.round(value));
  return `${text} ${f.sizeUnits[unit]}`;
}

/** "8 oct.", with the year appended when it is not the current one. */
export function formatDate(iso: string, f: FormatStrings, now: Date = new Date()): string {
  const d = new Date(iso);
  const day = d.getDate() === 1 ? '1ᵉʳ' : String(d.getDate());
  const base = `${day} ${f.months[d.getMonth()]}`;
  return d.getFullYear() === now.getFullYear() ? base : `${base} ${d.getFullYear()}`;
}

/** "09:41" */
export function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
