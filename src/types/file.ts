export type FileTypeCategory = 'pdf' | 'image' | 'text' | 'code' | 'spreadsheet' | 'audio' | 'video' | 'archive' | 'unknown';

export interface ClassifiedFile {
  file: File;
  id: string;
  name: string;
  size: number;
  extension: string;
  mimeType: string;
  category: FileTypeCategory;
  previewUrl?: string;
}

export interface FileGroupAnalysis {
  totalFiles: number;
  totalSize: number;
  categories: Record<FileTypeCategory, number>;
  primaryCategory: FileTypeCategory;
  extensions: string[];
  files: ClassifiedFile[];
  suggestedActionIds: string[];
}
