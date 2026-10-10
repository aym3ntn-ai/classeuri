import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { storage } from './storage';

// EXPO_PUBLIC_SOURCE_URL points a development build at a local catalog.
export const DEFAULT_SOURCE = process.env.EXPO_PUBLIC_SOURCE_URL ?? 'https://aym3ntn-ai.github.io/classeuri/';

export type ThemeChoice = 'system' | 'light' | 'dark';

interface SettingsState {
  sourceUrl: string;
  /** Re-download files already on the phone when they change online. */
  autoUpdate: boolean;
  /** Keep automatic and bulk downloads off mobile data. */
  wifiOnly: boolean;
  theme: ThemeChoice;
  /** Semester shown on the home screen, as `<year>/<semester>`; null picks the latest. */
  semester: string | null;
  set: (patch: Partial<Omit<SettingsState, 'set'>>) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      sourceUrl: DEFAULT_SOURCE,
      autoUpdate: true,
      wifiOnly: true,
      theme: 'system',
      semester: null,
      set: (patch) => set(patch),
    }),
    { name: 'classeuri.settings', storage },
  ),
);
