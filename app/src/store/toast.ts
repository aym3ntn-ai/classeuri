import { create } from 'zustand';

interface ToastState {
  message: string | null;
  /** Bumped on every toast so the same message can be shown twice in a row. */
  key: number;
  show: (message: string) => void;
  hide: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  key: 0,
  show: (message) => set((s) => ({ message, key: s.key + 1 })),
  hide: () => set({ message: null }),
}));

export const toast = (message: string) => useToast.getState().show(message);
