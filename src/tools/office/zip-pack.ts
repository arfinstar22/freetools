import { ToolDefinition, ProcessContext, ProcessResult } from '../../types/tool';
import { createZipFromFiles } from '../../utils/download';

export const zipPackTool: ToolDefinition = {
  id: 'zip-pack',
  name: 'Buat Arsip ZIP',
  shortDescription: 'Kemas satu atau banyak file/foto menjadi 1 file ZIP',
  description: 'Satukan berbagai macam file, dokumen, atau foto menjadi satu berkas .ZIP terkompresi secara instan di browser.',
  category: 'office',
  acceptedTypes: ['*/*'],
  inputMode: 'multi-file',
  icon: 'FileArchive',
  popular: true,
  localProcessing: true,
  supportsBatch: true,
  supportsWorkflow: true,
  keywords: ['zip', 'buat zip', 'kompres zip', 'arsip zip', 'kemas file', 'bundle zip', 'zip pack'],
  optionSchemas: [
    {
      id: 'zipFilename',
      label: 'Nama File ZIP',
      type: 'text',
      defaultValue: 'freetools_arsip.zip'
    }
  ],
  process: async (context: ProcessContext): Promise<ProcessResult> => {
    const startTime = performance.now();
    const files = context.files || [];

    if (files.length === 0) {
      throw new Error('Pilih minimal 1 file untuk dikemas ke dalam ZIP.');
    }

    const zipNameRaw = (context.options?.zipFilename || 'freetools_arsip').trim();
    const zipFilename = zipNameRaw.endsWith('.zip') ? zipNameRaw : `${zipNameRaw}.zip`;
    const originalTotalSize = files.reduce((acc, f) => acc + f.size, 0);

    const itemsForZip = files.map((f) => ({
      name: f.name,
      blob: f
    }));

    if (context.onProgress) {
      context.onProgress({
        current: 1,
        total: 1,
        message: `Mengemas ${files.length} file ke dalam ${zipFilename}...`,
        percentage: 30
      });
    }

    const zipBlob = await createZipFromFiles(itemsForZip, zipFilename, (pct) => {
      if (context.onProgress) {
        context.onProgress({
          current: 1,
          total: 1,
          message: `Mengemas ke dalam ZIP (${pct}%)...`,
          percentage: 30 + Math.round((pct / 100) * 65)
        });
      }
    });

    return {
      success: true,
      message: `Berhasil mengemas ${files.length} file menjadi ${zipFilename}!`,
      downloadName: zipFilename,
      items: [
        {
          id: 'zip_result',
          name: zipFilename,
          size: zipBlob.size,
          originalSize: originalTotalSize,
          type: 'application/zip',
          blob: zipBlob
        }
      ],
      stats: {
        originalTotalSize,
        processedTotalSize: zipBlob.size,
        count: files.length,
        timeTakenMs: Math.round(performance.now() - startTime)
      }
    };
  }
};
