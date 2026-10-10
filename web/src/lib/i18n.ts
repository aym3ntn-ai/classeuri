import { formatDate, formatSize, fr } from '@classeuri/shared';

/** The active dictionary. Swap here to add a language. */
export const t = fr;
export const lang = 'fr';

export const size = (bytes: number) => formatSize(bytes, t.format);
export const date = (iso: string) => formatDate(iso, t.format);
