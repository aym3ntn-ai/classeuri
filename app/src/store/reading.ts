import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Variant } from '@/lib/catalog';
import { storage } from './storage';

export interface Position {
  page: number;
  pages: number;
}

interface ReadingState {
  /** Last page read, per document and variant. */
  positions: Record<string, Position>;
  /** What the "Reprendre la lecture" card reopens. */
  last: { docId: string; variant: Variant } | null;
  setPosition: (docId: string, variant: Variant, position: Position) => void;
}

export const positionKey = (docId: string, variant: Variant) => `${docId}#${variant}`;

export const useReading = create<ReadingState>()(
  persist(
    (set) => ({
      positions: {},
      last: null,
      setPosition: (docId, variant, position) =>
        set((s) => ({
          positions: { ...s.positions, [positionKey(docId, variant)]: position },
          last: { docId, variant },
        })),
    }),
    { name: 'classeuri.reading', storage },
  ),
);
