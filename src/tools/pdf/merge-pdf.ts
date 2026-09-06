import { PDFDocument } from 'pdf-lib';
import { ToolDefinition, ProcessContext, ProcessResult } from '../../types/tool';

export const mergePdfTool: ToolDefinition = {
  id: 'merge-pdf',
  name: 'Gabungkan PDF',
  shortDescription: 'Gabungkan beberapa file PDF jadi 1 dokumen rapi',
  description: 'Satukan beberapa file PDF menjadi satu file utuh. Urutan halaman bisa kamu sesuaikan.',
  category: 'pdf',
  acceptedTypes: ['.pdf', 'application/pdf'],
  inputMode: 'multi-file',
  icon: 'Layers',
  popular: true,
  localProcessing: true,
  supportsBatch: true,
  supportsWorkflow: true,
  keywords: ['merge', 'gabung', 'satukan', 'combine', 'gabungkan pdf', 'satukan pdf'],
  optionSchemas: [
    {
      id: 'outputFilename',
      label: 'Nama File Hasil',
      type: 'text',
      defaultValue: 'freetools_gabungan.pdf'
    }
  ],
  process: async (context: ProcessContext): Promise<ProcessResult> => {
    const startTime = performance.now();
    const files = context.files || [];

    if (files.length < 2) {
      throw new Error('Pilih minimal 2 file PDF untuk digabungkan.');
    }

    const mergedPdf = await PDFDocument.create();
    let originalTotalSize = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      originalTotalSize += file.size;

      if (context.onProgress) {
        context.onProgress({
          current: i + 1,
          total: files.length,
          message: `Menggabungkan ${file.name} (${i + 1}/${files.length})...`,
          percentage: Math.round(((i + 1) / files.length) * 80)
        });
      }

      const fileBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    if (context.onProgress) {
      context.onProgress({
        current: files.length,
        total: files.length,
        message: 'Menyimpan file hasil gabungan...',
        percentage: 95
      });
    }

    const mergedBytes = await mergedPdf.save();
    const outputBlob = new Blob([mergedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    const outputName = (context.options?.outputFilename?.trim() || 'freetools_gabungan') + (context.options?.outputFilename?.endsWith('.pdf') ? '' : '.pdf');

    return {
      success: true,
      message: `Berhasil menggabungkan ${files.length} file PDF menjadi 1 file!`,
      downloadName: outputName,
      items: [
        {
          id: 'merged_pdf',
          name: outputName,
          size: outputBlob.size,
          originalSize: originalTotalSize,
          type: 'application/pdf',
          blob: outputBlob
        }
      ],
      stats: {
        originalTotalSize,
        processedTotalSize: outputBlob.size,
        count: files.length,
        timeTakenMs: Math.round(performance.now() - startTime)
      }
    };
  }
};
