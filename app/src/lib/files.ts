// Downloaded PDFs on the device. Files are named after their content hash, so an
// updated document never overwrites the copy that is currently open.

import { Directory, File, Paths } from 'expo-file-system';
import type { FileRef } from '@classeuri/shared';

const dir = () => new Directory(Paths.document, 'pdf');

/** Downloads `ref` and returns the local URI. Rejects when the transfer fails or is incomplete. */
export async function downloadFile(ref: FileRef, onProgress: (fraction: number) => void): Promise<string> {
  const folder = dir();
  if (!folder.exists) folder.create({ intermediates: true, idempotent: true });

  const dest = new File(folder, `${ref.hash}.pdf`);
  const partial = new File(folder, `${ref.hash}.part`);
  if (partial.exists) partial.delete();

  const task = File.createDownloadTask(ref.url, partial, {
    onProgress: ({ bytesWritten, totalBytes }) => onProgress(bytesWritten / (totalBytes > 0 ? totalBytes : ref.size)),
  });
  const file = await task.downloadAsync();
  // A truncated transfer, or a copy that no longer matches the catalog, is not kept.
  if (!file || file.size !== ref.size) {
    if (partial.exists) partial.delete();
    throw new Error(`Incomplete download: ${ref.path}`);
  }
  if (dest.exists) dest.delete();
  partial.moveSync(dest);
  return dest.uri;
}

export function deleteFile(uri: string): void {
  const file = new File(uri);
  if (file.exists) file.delete();
}

export function fileExists(uri: string): boolean {
  return new File(uri).exists;
}

export function deleteAllFiles(): void {
  const folder = dir();
  if (folder.exists) folder.delete();
}
