import { ToolDefinition, ProcessContext, ProcessResult, ProcessedItem } from '../../types/tool';
import { createZipFromFiles } from '../../utils/download';

export const removeBackgroundTool: ToolDefinition = {
  id: 'remove-background',
  name: 'Hapus Background Foto',
  shortDescription: 'Hapus latar belakang foto otomatis dengan AI — gratis & offline',
  description: 'Hapus background foto secara otomatis menggunakan AI segmentation langsung di browser. Mendukung foto orang, produk, hewan, dan objek lainnya. Model di-download sekali (~5MB), lalu bisa digunakan offline selamanya.',
  category: 'image',
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp', '.jpg', '.jpeg', '.png', '.webp'],
  inputMode: 'multi-file',
  icon: 'Scissors',
  popular: true,
  localProcessing: true,
  supportsBatch: true,
  supportsWorkflow: true,
  keywords: [
    'remove background', 'hapus background', 'hapus latar belakang', 'background remover',
    'transparan', 'potong objek', 'cutout', 'hapus bg', 'remove bg', 'foto produk',
    'background foto', 'latar foto', 'pas foto'
  ],
  optionSchemas: [
    {
      id: 'outputFormat',
      label: 'Format Hasil',
      type: 'select',
      defaultValue: 'image/png',
      options: [
        { label: 'PNG (Transparan — Direkomendasikan)', value: 'image/png' },
        { label: 'WEBP (Transparan, Ukuran Lebih Kecil)', value: 'image/webp' }
      ]
    },
    {
      id: 'quality',
      label: 'Kualitas Model AI',
      type: 'select',
      defaultValue: 'isnet_fp16',
      options: [
        { label: 'Cepat (Quantized) — Lebih ringan, cocok HP', value: 'isnet_quint8' },
        { label: 'Seimbang (FP16) — Direkomendasikan', value: 'isnet_fp16' }
      ]
    }
  ],
  process: async (context: ProcessContext): Promise<ProcessResult> => {
    const startTime = performance.now();
    const files = context.files || [];

    if (files.length === 0) {
      throw new Error('Pilih minimal 1 gambar untuk dihapus backgroundnya.');
    }

    const outputFormat = context.options?.outputFormat || 'image/png';
    const modelQuality = (context.options?.quality || 'isnet_fp16') as 'isnet' | 'isnet_fp16' | 'isnet_quint8';

    // Lazy-load the heavy library only when needed
    context.onProgress?.({
      current: 0,
      total: files.length,
      message: 'Memuat model AI segmentation... (download pertama ~5MB, selanjutnya dari cache)',
      percentage: 5
    });

    // Dynamic import to keep initial bundle light
    const { removeBackground } = await import('@imgly/background-removal');

    let originalTotalSize = 0;
    let processedTotalSize = 0;
    const processedItems: ProcessedItem[] = [];
    const filesForZip: { name: string; blob: Blob }[] = [];
    const failedFiles: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      originalTotalSize += file.size;

      if (file.type && !file.type.startsWith('image/')) {
        failedFiles.push(file.name);
        continue;
      }

      context.onProgress?.({
        current: i + 1,
        total: files.length,
        message: `Menghapus background ${file.name} (${i + 1}/${files.length})...`,
        percentage: Math.round(10 + ((i + 1) / files.length) * 80)
      });

      try {
        const resultBlob = await removeBackground(file, {
          model: modelQuality,
          output: {
            format: outputFormat as 'image/png' | 'image/webp',
            quality: 0.9
          }
        });

        // Ensure we have correct Blob type
        const blob = resultBlob instanceof Blob
          ? resultBlob
          : new Blob([resultBlob], { type: outputFormat });

        const ext = outputFormat === 'image/webp' ? 'webp' : 'png';
        const cleanBase = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const finalName = `${cleanBase}_nobg.${ext}`;

        // Generate preview dataUrl
        const dataUrl = await blobToDataUrl(blob);

        processedTotalSize += blob.size;
        processedItems.push({
          id: `rmbg_${i}`,
          name: finalName,
          size: blob.size,
          originalSize: file.size,
          type: outputFormat,
          blob,
          dataUrl
        });
        filesForZip.push({ name: finalName, blob });
      } catch (err: any) {
        console.error(`Failed to remove background for ${file.name}:`, err);
        failedFiles.push(file.name);
      }
    }

    if (processedItems.length === 0) {
      throw new Error(`Gagal memproses semua gambar: ${failedFiles.join(', ')}`);
    }

    const failureNote = failedFiles.length > 0 ? ` (${failedFiles.length} file gagal diproses)` : '';

    if (processedItems.length === 1 && files.length === 1) {
      return {
        success: true,
        message: `Background berhasil dihapus! Gambar sekarang transparan.${failureNote}`,
        downloadName: processedItems[0].name,
        items: processedItems,
        stats: {
          originalTotalSize,
          processedTotalSize,
          count: 1,
          timeTakenMs: Math.round(performance.now() - startTime)
        }
      };
    }

    const zipBlob = await createZipFromFiles(filesForZip, 'freetools_hapus_background.zip');
    return {
      success: true,
      message: `Berhasil menghapus background dari ${processedItems.length} gambar!${failureNote}`,
      downloadName: 'freetools_hapus_background.zip',
      items: [
        {
          id: 'zip_rmbg',
          name: 'freetools_hapus_background.zip',
          size: zipBlob.size,
          originalSize: originalTotalSize,
          type: 'application/zip',
          blob: zipBlob
        },
        ...processedItems
      ],
      stats: {
        originalTotalSize,
        processedTotalSize: zipBlob.size,
        count: processedItems.length,
        timeTakenMs: Math.round(performance.now() - startTime)
      }
    };
  }
};

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Gagal membaca blob'));
    reader.readAsDataURL(blob);
  });
}
