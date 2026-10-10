import { formatDate, formatSize, formatTime, fr } from '@classeuri/shared';

/** The active dictionary. Swap here to add a language. */
export const t = fr;

export const size = (bytes: number) => formatSize(bytes, t.format);
export const date = (iso: string) => formatDate(iso, t.format);

/** "09:41" for today, "hier", else "8 oct.". */
export function when(timestamp: number, now: Date = new Date()): string {
  const d = new Date(timestamp);
  const days = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);
  if (days === 0) return formatTime(d);
  if (days === 1) return t.format.yesterday;
  return formatDate(d.toISOString(), t.format, now);
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export const isToday = (timestamp: number) => startOfDay(new Date(timestamp)) === startOfDay(new Date());
