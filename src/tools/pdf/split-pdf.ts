import { PDFDocument } from 'pdf-lib';
import { ToolDefinition, ProcessContext, ProcessResult } from '../../types/tool';
import { createZipFromFiles } from '../../utils/download';

export const splitPdfTool: ToolDefinition = {
  id: 'split-pdf',
  name: 'Pisahkan PDF',
  shortDescription: 'Pisahkan halaman PDF jadi file-file terpisah',
  description: 'Ekstrak halaman tertentu dari PDF atau pecah setiap halaman menjadi file PDF terpisah.',
  category: 'pdf',
  acceptedTypes: ['.pdf', 'application/pdf'],
  inputMode: 'file',
  icon: 'Scissors',
  popular: false,
  localProcessing: true,
  supportsBatch: false,
  supportsWorkflow: false,
  keywords: ['split', 'pisah', 'ekstrak', 'halaman', 'pecah pdf', 'potong pdf'],
  optionSchemas: [
    {
      id: 'splitMode',
      label: 'Metode Pemisahan',
      type: 'select',
      defaultValue: 'all_pages',
      options: [
        { label: 'Setiap Halaman (1 file per halaman)', value: 'all_pages' },
        { label: 'Rentang Halaman Tertentu', value: 'custom_range' }
      ]
    },
    {
      id: 'pageRange',
      label: 'Rentang Halaman (contoh: 1-3, 5, 7-10)',
      type: 'text',
      defaultValue: '1-2'
    }
  ],
  process: async (context: ProcessContext): Promise<ProcessResult> => {
    const startTime = performance.now();
    const files = context.files || [];

    if (files.length === 0) {
      throw new Error('Pilih 1 file PDF yang ingin dipisahkan.');
    }

    const file = files[0];
    const fileBuffer = await file.arrayBuffer();
    const sourcePdf = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
    const totalPages = sourcePdf.getPageCount();

    if (totalPages === 0) {
      throw new Error('File PDF ini tidak memiliki halaman.');
    }

    const splitMode = context.options?.splitMode || 'all_pages';
    const baseName = file.name.replace(/\.pdf$/i, '');
    const outputItems: { name: string; blob: Blob; size: number }[] = [];

    if (splitMode === 'all_pages') {
      for (let i = 0; i < totalPages; i++) {
        if (context.onProgress) {
          context.onProgress({
            current: i + 1,
            total: totalPages,
            message: `Memisahkan halaman ${i + 1} dari ${totalPages}...`,
            percentage: Math.round(((i + 1) / totalPages) * 90)
          });
        }

        const newPdf = await PDFDocument.create();
        const [page] = await newPdf.copyPages(sourcePdf, [i]);
        newPdf.addPage(page);
        const bytes = await newPdf.save();
        const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
        const name = `${baseName}_hal_${i + 1}.pdf`;
        outputItems.push({ name, blob, size: blob.size });
      }
    } else {
      // Parse custom range, e.g. "1-3, 5, 7-10"
      const rangeStr = (context.options?.pageRange || '1').toString();
      const pageIndicesToExtract = new Set<number>();
      const parts = rangeStr.split(',');

      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          const [startStr, endStr] = trimmed.split('-');
          const start = Math.max(1, parseInt(startStr, 10) || 1);
          const end = Math.min(totalPages, parseInt(endStr, 10) || totalPages);
          for (let p = start; p <= end; p++) {
            pageIndicesToExtract.add(p - 1);
          }
        } else {
          const p = parseInt(trimmed, 10);
          if (!isNaN(p) && p >= 1 && p <= totalPages) {
            pageIndicesToExtract.add(p - 1);
          }
        }
      }

      if (pageIndicesToExtract.size === 0) {
        throw new Error('Rentang halaman tidak valid atau di luar jumlah halaman file ini.');
      }

      const newPdf = await PDFDocument.create();
      const sortedIndices = Array.from(pageIndicesToExtract).sort((a, b) => a - b);
      const copiedPages = await newPdf.copyPages(sourcePdf, sortedIndices);
      copiedPages.forEach((pg) => newPdf.addPage(pg));

      const bytes = await newPdf.save();
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const name = `${baseName}_ekstrak.pdf`;
      outputItems.push({ name, blob, size: blob.size });
    }

    if (outputItems.length === 1) {
      return {
        success: true,
        message: `Halaman berhasil diekstrak!`,
        downloadName: outputItems[0].name,
        items: [
          {
            id: 'split_single',
            name: outputItems[0].name,
            size: outputItems[0].blob.size,
            originalSize: file.size,
            type: 'application/pdf',
            blob: outputItems[0].blob
          }
        ],
        stats: {
          originalTotalSize: file.size,
          processedTotalSize: outputItems[0].blob.size,
          count: 1,
          timeTakenMs: Math.round(performance.now() - startTime)
        }
      };
    }

    // Multiple files -> create ZIP
    const zipBlob = await createZipFromFiles(outputItems, `${baseName}_pisah.zip`);
    return {
      success: true,
      message: `Berhasil memisahkan ${outputItems.length} halaman PDF!`,
      downloadName: `${baseName}_pisah.zip`,
      items: [
        {
          id: 'split_zip',
          name: `${baseName}_pisah.zip`,
          size: zipBlob.size,
          originalSize: file.size,
          type: 'application/zip',
          blob: zipBlob
        },
        ...outputItems.map((item, idx) => ({
          id: `page_${idx}`,
          name: item.name,
          size: item.size,
          type: 'application/pdf',
          blob: item.blob
        }))
      ],
      stats: {
        originalTotalSize: file.size,
        processedTotalSize: zipBlob.size,
        count: outputItems.length,
        timeTakenMs: Math.round(performance.now() - startTime)
      }
    };
  }
};
