// Browser preview only (`expo start --web`): nothing is stored, the "local" URI is
// the remote URL. The Android app uses files.ts.

import type { FileRef } from '@classeuri/shared';

export async function downloadFile(ref: FileRef, onProgress: (fraction: number) => void): Promise<string> {
  const response = await fetch(ref.url, { method: 'HEAD' });
  if (!response.ok) throw new Error(`Download failed: ${ref.path}`);
  onProgress(1);
  return ref.url;
}

export function deleteFile(_uri: string): void {}

export function fileExists(_uri: string): boolean {
  return true;
}

export function deleteAllFiles(): void {}
