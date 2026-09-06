export type ToolCategory = 'pdf' | 'image' | 'text' | 'developer' | 'office';

export type ToolInputMode = 'file' | 'multi-file' | 'text' | 'form' | 'none';

export interface ToolOptionSchema {
  id: string;
  label: string;
  description?: string;
  type: 'select' | 'range' | 'boolean' | 'text' | 'number' | 'textarea';
  defaultValue: any;
  options?: { label: string; value: any; description?: string }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
  rows?: number;
}

export interface ProcessProgress {
  current: number;
  total: number;
  message?: string;
  percentage: number;
}

export interface ProcessContext {
  files?: File[];
  textInput?: string;
  options?: Record<string, any>;
  onProgress?: (progress: ProcessProgress) => void;
  signal?: AbortSignal;
}

export interface ProcessedItem {
  id: string;
  name: string;
  size: number;
  originalSize?: number;
  type: string;
  blob?: Blob;
  dataUrl?: string;
  textOutput?: string;
  metadata?: Record<string, any>;
}

export interface ProcessResult {
  success: boolean;
  message?: string;
  items: ProcessedItem[];
  downloadName?: string;
  stats?: {
    originalTotalSize?: number;
    processedTotalSize?: number;
    savedPercentage?: number;
    timeTakenMs?: number;
    count?: number;
  };
  error?: string;
}

export interface ToolDefinition {
  id: string;
  name: string;
  shortDescription: string;
  description: string;
  category: ToolCategory;
  acceptedTypes?: string[];
  inputMode: ToolInputMode;
  icon: string;
  popular?: boolean;
  localProcessing: boolean;
  supportsBatch: boolean;
  supportsWorkflow: boolean;
  defaultOptions?: Record<string, any>;
  optionSchemas?: ToolOptionSchema[];
  keywords: string[];
  process: (context: ProcessContext) => Promise<ProcessResult>;
}
