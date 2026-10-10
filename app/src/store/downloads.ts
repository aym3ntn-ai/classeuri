import type { CatalogCourse, CatalogDocument, FileRef } from '@classeuri/shared';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { courseFiles, docFiles } from '@/lib/catalog';
import { deleteAllFiles, deleteFile, downloadFile } from '@/lib/files';
import { storage } from './storage';

export interface LocalFile {
  uri: string;
  /** Hash of the copy on the phone; differs from the catalog when an update is pending. */
  hash: string;
  size: number;
}

interface DownloadsState {
  /** Files on the phone, keyed by repo path. */
  files: Record<string, LocalFile>;
  /** Transfers in flight, 0–1, keyed by repo path. Not persisted. */
  progress: Record<string, number>;
  /** Downloads `ref` unless an identical copy is already there. Resolves to the local URI. */
  download: (ref: FileRef) => Promise<string>;
  remove: (paths: string[]) => void;
  removeAll: () => void;
}

const inFlight = new Map<string, Promise<string>>();

export const useDownloads = create<DownloadsState>()(
  persist(
    (set, get) => ({
      files: {},
      progress: {},

      download: (ref) => {
        const existing = get().files[ref.path];
        if (existing?.hash === ref.hash) return Promise.resolve(existing.uri);
        const running = inFlight.get(ref.path);
        if (running) return running;

        const setProgress = (value: number | null) =>
          set((s) => {
            const progress = { ...s.progress };
            if (value === null) delete progress[ref.path];
            else progress[ref.path] = value;
            return { progress };
          });

        setProgress(0);
        const job = downloadFile(ref, setProgress)
          .then((uri) => {
            const old = get().files[ref.path];
            set((s) => ({ files: { ...s.files, [ref.path]: { uri, hash: ref.hash, size: ref.size } } }));
            if (old && old.uri !== uri) deleteFile(old.uri);
            return uri;
          })
          .finally(() => {
            inFlight.delete(ref.path);
            setProgress(null);
          });
        inFlight.set(ref.path, job);
        return job;
      },

      remove: (paths) =>
        set((s) => {
          const files = { ...s.files };
          for (const path of paths) {
            const file = files[path];
            if (file) deleteFile(file.uri);
            delete files[path];
          }
          return { files };
        }),

      removeAll: () => {
        deleteAllFiles();
        set({ files: {} });
      },
    }),
    { name: 'classeuri.downloads', storage, partialize: (s) => ({ files: s.files }) },
  ),
);

/** Downloads several files one after the other; resolves to the number that failed. */
export async function downloadMany(refs: FileRef[]): Promise<number> {
  let failed = 0;
  for (const ref of refs) {
    try {
      await useDownloads.getState().download(ref);
    } catch {
      failed++;
    }
  }
  return failed;
}

type Files = DownloadsState['files'];

export const isDocDownloaded = (doc: CatalogDocument, files: Files) => docFiles(doc).every((f) => files[f.path]);

export const downloadedDocCount = (course: CatalogCourse, files: Files) =>
  course.sections.reduce((n, s) => n + s.documents.filter((d) => isDocDownloaded(d, files)).length, 0);

export const downloadedSize = (course: CatalogCourse, files: Files) =>
  courseFiles(course).reduce((sum, f) => sum + (files[f.path]?.size ?? 0), 0);

export const totalDownloadedSize = (files: Files) => Object.values(files).reduce((sum, f) => sum + f.size, 0);

/** Transfer progress of a document (0–1), or null when nothing is in flight. */
export function docProgress(doc: CatalogDocument, progress: Record<string, number>, files: Files): number | null {
  const refs = docFiles(doc);
  if (!refs.some((f) => f.path in progress)) return null;
  const done = refs.reduce((sum, f) => sum + (progress[f.path] ?? (files[f.path] ? 1 : 0)) * f.size, 0);
  return done / refs.reduce((sum, f) => sum + f.size, 0);
}
