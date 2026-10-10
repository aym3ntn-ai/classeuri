import { CATALOG_SCHEMA_VERSION, type Catalog } from '@classeuri/shared';
import * as Network from 'expo-network';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { allCourses, catalogUrl, courseFiles, diffCatalogs, mergeFlags, type Flag } from '@/lib/catalog';
import { downloadMany, useDownloads } from './downloads';
import { useSettings } from './settings';
import { storage } from './storage';

export interface SyncResult {
  added: number;
  updated: number;
}

export class CatalogVersionError extends Error {}

interface CatalogState {
  catalog: Catalog | null;
  lastSyncedAt: number | null;
  /** Documents that appeared or changed since they were last opened. */
  flags: Record<string, Flag>;
  syncing: boolean;
  sync: () => Promise<SyncResult>;
  clearFlag: (docId: string) => void;
  reset: () => void;
}

const TIMEOUT_MS = 15_000;

async function fetchCatalog(sourceUrl: string): Promise<Catalog> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // GitHub Pages caches for ten minutes; the query string asks for a fresh copy.
    const response = await fetch(`${catalogUrl(sourceUrl)}?t=${Date.now()}`, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as Catalog;
    if (data.schemaVersion !== CATALOG_SCHEMA_VERSION) throw new CatalogVersionError();
    if (!Array.isArray(data.years)) throw new Error('Malformed catalog');
    return data;
  } finally {
    clearTimeout(timer);
  }
}

/** True when automatic and bulk downloads may run on the current connection. */
export async function canBulkDownload(): Promise<boolean> {
  if (!useSettings.getState().wifiOnly) return true;
  const state = await Network.getNetworkStateAsync();
  return state.type === Network.NetworkStateType.WIFI || state.type === Network.NetworkStateType.ETHERNET;
}

/** Drops downloads the catalog no longer lists, and refreshes those whose content changed. */
async function reconcileDownloads(catalog: Catalog) {
  const downloads = useDownloads.getState();
  const refs = new Map(allCourses(catalog).flatMap(courseFiles).map((f) => [f.path, f]));

  const orphans = Object.keys(downloads.files).filter((path) => !refs.has(path));
  if (orphans.length > 0) downloads.remove(orphans);

  if (!useSettings.getState().autoUpdate || !(await canBulkDownload())) return;
  const stale = Object.entries(downloads.files).flatMap(([path, local]) => {
    const ref = refs.get(path);
    return ref && ref.hash !== local.hash ? [ref] : [];
  });
  await downloadMany(stale);
}

export const useCatalog = create<CatalogState>()(
  persist(
    (set, get) => ({
      catalog: null,
      lastSyncedAt: null,
      flags: {},
      syncing: false,

      sync: async () => {
        set({ syncing: true });
        try {
          const next = await fetchCatalog(useSettings.getState().sourceUrl);
          const fresh = diffCatalogs(get().catalog, next);
          set((s) => ({ catalog: next, lastSyncedAt: Date.now(), flags: mergeFlags(s.flags, fresh, next) }));
          // Not awaited: large files must not hold the refresh spinner.
          void reconcileDownloads(next);
          const kinds = Object.values(fresh);
          return {
            added: kinds.filter((k) => k === 'new').length,
            updated: kinds.filter((k) => k === 'updated').length,
          };
        } finally {
          set({ syncing: false });
        }
      },

      clearFlag: (docId) =>
        set((s) => {
          if (!(docId in s.flags)) return s;
          const flags = { ...s.flags };
          delete flags[docId];
          return { flags };
        }),

      reset: () => set({ catalog: null, lastSyncedAt: null, flags: {} }),
    }),
    {
      name: 'classeuri.catalog',
      storage,
      partialize: (s) => ({ catalog: s.catalog, lastSyncedAt: s.lastSyncedAt, flags: s.flags }),
    },
  ),
);
