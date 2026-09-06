import JSZip from 'jszip';
import { sanitizeFilename } from './format';

export function triggerDownload(blob: Blob, filename: string): void {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = sanitizeFilename(filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Safe
    }
  }, 1000);
}

export function triggerTextDownload(text: string, filename: string, mimeType: string = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([text], { type: mimeType });
  triggerDownload(blob, filename);
}

export async function createZipFromFiles(
  files: { name: string; blob: Blob | Uint8Array | string | ArrayBuffer }[],
  zipFilename: string = 'freetools_hasil.zip',
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const zip = new JSZip();
  const usedNames = new Map<string, number>();

  for (const file of files) {
    const rawName = sanitizeFilename(file.name || 'file');
    let finalEntryName = rawName;

    // Prevent duplicate filename collision in ZIP
    if (usedNames.has(rawName)) {
      const count = (usedNames.get(rawName) || 1) + 1;
      usedNames.set(rawName, count);
      const dotIdx = rawName.lastIndexOf('.');
      if (dotIdx > 0) {
        finalEntryName = `${rawName.substring(0, dotIdx)}_${count}${rawName.substring(dotIdx)}`;
      } else {
        finalEntryName = `${rawName}_${count}`;
      }
    } else {
      usedNames.set(rawName, 1);
    }

    if (typeof file.blob === 'string') {
      zip.file(finalEntryName, file.blob);
    } else if (file.blob instanceof Uint8Array || file.blob instanceof ArrayBuffer) {
      zip.file(finalEntryName, file.blob);
    } else if (file.blob && typeof file.blob.arrayBuffer === 'function') {
      const buffer = await file.blob.arrayBuffer();
      zip.file(finalEntryName, buffer);
    } else {
      zip.file(finalEntryName, file.blob as any);
    }
  }

  const content = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    },
    (metadata) => {
      if (onProgress) {
        onProgress(Math.round(metadata.percent));
      }
    }
  );

  return content;
}
