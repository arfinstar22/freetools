import { ClassifiedFile, FileGroupAnalysis, FileTypeCategory } from '../types/file';

export function classifyFile(file: File): ClassifiedFile {
  const name = file.name || 'file';
  const size = file.size || 0;
  const parts = name.split('.');
  const ext = parts.length > 1 ? (parts.pop() || '').toLowerCase() : '';
  const mime = (file.type || '').toLowerCase();

  let category: FileTypeCategory = 'unknown';

  if (mime === 'application/pdf' || ext === 'pdf') {
    category = 'pdf';
  } else if (
    mime.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg', 'ico', 'tiff', 'tif', 'avif'].includes(ext)
  ) {
    category = 'image';
  } else if (
    ['txt', 'md', 'rtf', 'log', 'markdown'].includes(ext) ||
    mime.startsWith('text/plain') ||
    mime.startsWith('text/markdown')
  ) {
    category = 'text';
  } else if (
    ['json', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'java', 'cpp', 'c', 'h', 'rs', 'go', 'php', 'sql', 'yaml', 'yml', 'xml', 'sh'].includes(ext) ||
    mime === 'application/json' ||
    mime === 'text/javascript'
  ) {
    category = 'code';
  } else if (['csv', 'xlsx', 'xls', 'tsv'].includes(ext) || mime === 'text/csv') {
    category = 'spreadsheet';
  } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || mime.includes('zip') || mime.includes('tar')) {
    category = 'archive';
  }

  let previewUrl: string | undefined = undefined;
  // Generate preview for images smaller than 25MB to prevent memory ballooning
  if (category === 'image' && size < 25 * 1024 * 1024 && typeof URL !== 'undefined' && URL.createObjectURL) {
    try {
      previewUrl = URL.createObjectURL(file);
    } catch {
      // Ignore URL creation failures in non-standard environments
    }
  }

  return {
    file,
    id: `${name}_${size}_${Math.random().toString(36).substring(2, 8)}`,
    name,
    size,
    extension: ext,
    mimeType: mime,
    category,
    previewUrl
  };
}

export function revokeFileGroupPreviews(analysis?: FileGroupAnalysis | null): void {
  if (!analysis || !analysis.files) return;
  for (const item of analysis.files) {
    if (item.previewUrl) {
      try {
        URL.revokeObjectURL(item.previewUrl);
      } catch {
        // Safe catch
      }
    }
  }
}

export function analyzeFileGroup(files: File[]): FileGroupAnalysis {
  const classified = files.map(classifyFile);
  const totalFiles = files.length;
  const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);

  const categories: Record<FileTypeCategory, number> = {
    pdf: 0,
    image: 0,
    text: 0,
    code: 0,
    spreadsheet: 0,
    audio: 0,
    video: 0,
    archive: 0,
    unknown: 0
  };

  const extensionsSet = new Set<string>();

  classified.forEach((c) => {
    categories[c.category] = (categories[c.category] || 0) + 1;
    if (c.extension) extensionsSet.add(c.extension);
  });

  // Determine primary category
  let primaryCategory: FileTypeCategory = 'unknown';
  let maxCount = 0;
  for (const [cat, count] of Object.entries(categories)) {
    if (count > maxCount) {
      maxCount = count;
      primaryCategory = cat as FileTypeCategory;
    }
  }

  // Suggest actions based on files
  const suggestedActionIds: string[] = [];

  if (primaryCategory === 'pdf') {
    if (totalFiles === 1) {
      suggestedActionIds.push('compress-pdf', 'split-pdf', 'pdf-to-jpg');
    } else {
      suggestedActionIds.push('merge-pdf', 'compress-pdf', 'pdf-to-jpg');
    }
  } else if (primaryCategory === 'image') {
    if (totalFiles >= 3) {
      suggestedActionIds.push(
        'batch-image-processor',
        'jpg-to-pdf',
        'image-compress',
        'image-resize',
        'image-convert',
        'remove-metadata',
        'zip-pack'
      );
    } else {
      suggestedActionIds.push(
        'image-compress',
        'image-resize',
        'image-convert',
        'jpg-to-pdf',
        'remove-metadata',
        'zip-pack'
      );
    }
  } else if (primaryCategory === 'text') {
    suggestedActionIds.push('word-counter', 'text-cleaner', 'case-converter', 'remove-duplicates', 'diff-checker');
  } else if (primaryCategory === 'code') {
    suggestedActionIds.push('json-formatter', 'diff-checker', 'base64-tool');
  } else if (primaryCategory === 'spreadsheet') {
    suggestedActionIds.push('csv-json-converter', 'zip-pack');
  } else {
    suggestedActionIds.push('zip-pack');
  }

  return {
    totalFiles,
    totalSize,
    categories,
    primaryCategory,
    extensions: Array.from(extensionsSet),
    files: classified,
    suggestedActionIds
  };
}
