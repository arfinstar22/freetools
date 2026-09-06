import { ToolCategory, ToolDefinition } from '../types/tool';

// PDF Tools
import { compressPdfTool } from '../tools/pdf/compress-pdf';
import { mergePdfTool } from '../tools/pdf/merge-pdf';
import { splitPdfTool } from '../tools/pdf/split-pdf';
import { jpgToPdfTool } from '../tools/pdf/jpg-to-pdf';
import { pdfToJpgTool } from '../tools/pdf/pdf-to-jpg';

// Image Tools
import { imageCompressTool } from '../tools/image/image-compress';
import { imageResizeTool } from '../tools/image/image-resize';
import { imageConvertTool } from '../tools/image/image-convert';
import { removeMetadataTool } from '../tools/image/remove-metadata';
import { batchImageProcessorTool } from '../tools/image/batch-image-processor';

// Text Tools
import { wordCounterTool } from '../tools/text/word-counter';
import { textCleanerTool } from '../tools/text/text-cleaner';
import { diffCheckerTool } from '../tools/text/diff-checker';
import { caseConverterTool } from '../tools/text/case-converter';
import { removeDuplicatesTool } from '../tools/text/remove-duplicates';
import { findReplaceTool } from '../tools/text/find-replace';

// Developer Tools
import { jsonFormatterTool } from '../tools/developer/json-formatter';
import { base64Tool } from '../tools/developer/base64-tool';
import { uuidGeneratorTool } from '../tools/developer/uuid-generator';
import { jwtDecoderTool } from '../tools/developer/jwt-decoder';
import { timestampConverterTool } from '../tools/developer/timestamp-converter';
import { regexTesterTool } from '../tools/developer/regex-tester';

// Office Tools
import { invoiceGeneratorTool } from '../tools/office/invoice-generator';
import { csvJsonConverterTool } from '../tools/office/csv-json-converter';
import { expenseSplitterTool } from '../tools/office/expense-splitter';
import { randomGroupTool } from '../tools/office/random-group';
import { zipPackTool } from '../tools/office/zip-pack';

export interface CategoryInfo {
  id: ToolCategory;
  label: string;
  icon: string;
  description: string;
}

export const ALL_TOOLS: ToolDefinition[] = [
  compressPdfTool,
  mergePdfTool,
  splitPdfTool,
  jpgToPdfTool,
  pdfToJpgTool,
  imageCompressTool,
  imageResizeTool,
  imageConvertTool,
  removeMetadataTool,
  batchImageProcessorTool,
  wordCounterTool,
  textCleanerTool,
  diffCheckerTool,
  caseConverterTool,
  removeDuplicatesTool,
  findReplaceTool,
  jsonFormatterTool,
  base64Tool,
  uuidGeneratorTool,
  jwtDecoderTool,
  timestampConverterTool,
  regexTesterTool,
  invoiceGeneratorTool,
  csvJsonConverterTool,
  expenseSplitterTool,
  randomGroupTool,
  zipPackTool
];

export const CATEGORIES: CategoryInfo[] = [
  { id: 'pdf', label: 'PDF', icon: 'FileText', description: 'Kompres, gabung, pisahkan & konversi dokumen PDF' },
  { id: 'image', label: 'Gambar & Foto', icon: 'Image', description: 'Kompres, resize, konversi format & hapus EXIF' },
  { id: 'text', label: 'Teks & Penulisan', icon: 'Type', description: 'Hitung kata, pembersih spasi, diff checker & format' },
  { id: 'developer', label: 'Developer Tools', icon: 'Code', description: 'JSON formatter, Base64, UUID, JWT & Regex' },
  { id: 'office', label: 'Kantor & Utilitas', icon: 'Briefcase', description: 'Invoice generator, CSV converter, split bill & tim' }
];

export function getToolById(id: string): ToolDefinition | undefined {
  return ALL_TOOLS.find((t) => t.id === id);
}

export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return ALL_TOOLS.filter((t) => t.category === category);
}

export function getPopularTools(): ToolDefinition[] {
  return ALL_TOOLS.filter((t) => t.popular);
}

export function searchTools(query: string): ToolDefinition[] {
  const q = query.toLowerCase().trim();
  if (!q) return ALL_TOOLS;

  return ALL_TOOLS.filter((tool) => {
    return (
      tool.name.toLowerCase().includes(q) ||
      tool.shortDescription.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
      tool.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });
}
