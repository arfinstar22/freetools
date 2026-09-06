import { ToolDefinition, ProcessContext, ProcessResult, ProcessedItem } from '../../types/tool';
import { createZipFromFiles } from '../../utils/download';

const MAX_CANVAS_DIM = 16384;

export const batchImageProcessorTool: ToolDefinition = {
  id: 'batch-image-processor',
  name: 'Proses Gambar Massal (Batch)',
  shortDescription: 'Resize, kompres, rename puluhan gambar sekaligus jadi ZIP',
  description: 'Proses puluhan hingga ratusan gambar dalam satu kali klik. Cocok untuk dokumentasi acara, katalog produk, atau arsip kantor.',
  category: 'image',
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp', '.jpg', '.jpeg', '.png', '.webp'],
  inputMode: 'multi-file',
  icon: 'Package',
  popular: true,
  localProcessing: true,
  supportsBatch: true,
  supportsWorkflow: true,
  keywords: ['batch image', 'proses massal', 'rename banyak foto', 'kompres banyak foto', 'resize banyak foto', 'katalog foto', 'arsip foto'],
  optionSchemas: [
    {
      id: 'namePrefix',
      label: 'Nama Awalan (Rename Prefix)',
      type: 'text',
      defaultValue: 'foto'
    },
    {
      id: 'maxDimension',
      label: 'Ukuran Maksimal (Lebar/Tinggi)',
      type: 'select',
      defaultValue: '1280',
      options: [
        { label: 'Pertahankan Dimensi Asli', value: '0' },
        { label: '1920px (Full HD)', value: '1920' },
        { label: '1280px (Standar Web)', value: '1280' },
        { label: '800px (Kecil / WA)', value: '800' }
      ]
    },
    {
      id: 'quality',
      label: 'Kualitas Kompresi',
      type: 'select',
      defaultValue: '0.75',
      options: [
        { label: 'Kualitas Tinggi (85%)', value: '0.85' },
        { label: 'Seimbang (75%)', value: '0.75' },
        { label: 'Sekecil Mungkin (55%)', value: '0.55' }
      ]
    }
  ],
  process: async (context: ProcessContext): Promise<ProcessResult> => {
    const startTime = performance.now();
    const files = context.files || [];

    if (files.length === 0) {
      throw new Error('Pilih minimal 1 gambar untuk diproses massal.');
    }

    const prefix = (context.options?.namePrefix || 'foto').trim() || 'foto';
    const maxDim = parseInt(context.options?.maxDimension || '1280', 10);
    const quality = parseFloat(context.options?.quality || '0.75');

    let originalTotalSize = 0;
    let processedTotalSize = 0;
    const processedItems: ProcessedItem[] = [];
    const filesForZip: { name: string; blob: Blob }[] = [];
    const failedFiles: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      originalTotalSize += file.size;

      // Validate image format & MIME
      if (file.type && !file.type.startsWith('image/') && !file.type.includes('octet-stream')) {
        failedFiles.push(file.name);
        continue;
      }

      if (!file.name.match(/\.(jpg|jpeg|png|webp|bmp|gif)$/i) && (!file.type || !file.type.startsWith('image/'))) {
        failedFiles.push(file.name);
        continue;
      }

      if (context.onProgress) {
        context.onProgress({
          current: i + 1,
          total: files.length,
          message: `Memproses ${i + 1} dari ${files.length} gambar...`,
          percentage: Math.round(((i + 1) / files.length) * 85)
        });
      }

      let objectUrl: string | null = null;

      try {
        const img = new Image();
        objectUrl = URL.createObjectURL(file);

        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => {
            reject(new Error(`Waktu tunggu memuat gambar "${file.name}" habis.`));
          }, 4000);

          img.onload = () => {
            clearTimeout(timer);
            resolve();
          };
          img.onerror = () => {
            clearTimeout(timer);
            reject(new Error(`Gagal membaca ${file.name}`));
          };
          img.src = objectUrl!;
        });

        let w = img.naturalWidth || img.width || 100;
        let h = img.naturalHeight || img.height || 100;

        // Hardware safety clamp
        w = Math.min(MAX_CANVAS_DIM, Math.max(1, w));
        h = Math.min(MAX_CANVAS_DIM, Math.max(1, h));

        if (maxDim > 0 && (w > maxDim || h > maxDim)) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, w);
        canvas.height = Math.max(1, h);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context tidak tersedia.');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => {
              if (b) resolve(b);
              else reject(new Error(`Gagal memproses gambar ${file.name}`));
            },
            'image/jpeg',
            quality
          );
        });

        const padNumber = String(processedItems.length + 1).padStart(files.length > 99 ? 3 : 2, '0');
        const finalName = `${prefix}_${padNumber}.jpg`;

        processedTotalSize += blob.size;
        processedItems.push({
          id: `batch_${i}`,
          name: finalName,
          size: blob.size,
          originalSize: file.size,
          type: 'image/jpeg',
          blob
        });
        filesForZip.push({ name: finalName, blob });
      } catch {
        failedFiles.push(file.name);
      } finally {
        if (objectUrl) {
          try {
            URL.revokeObjectURL(objectUrl);
          } catch {
            // Safe
          }
        }
      }
    }

    if (processedItems.length === 0) {
      throw new Error(`Gagal memproses semua gambar: ${failedFiles.join(', ')}`);
    }

    if (context.onProgress) {
      context.onProgress({
        current: files.length,
        total: files.length,
        message: 'Mengemas file ZIP...',
        percentage: 95
      });
    }

    const zipFilename = `${prefix}_hasil.zip`;
    const zipBlob = await createZipFromFiles(filesForZip, zipFilename);
    const savedPercentage = Math.max(0, Math.round(((originalTotalSize - processedTotalSize) / originalTotalSize) * 100));
    const failureNote = failedFiles.length > 0 ? ` (${failedFiles.length} file dilewati karena format rusak)` : '';

    return {
      success: true,
      message: `Selesai! Berhasil memproses & mengemas ${processedItems.length} foto menjadi ZIP.${failureNote}`,
      downloadName: zipFilename,
      items: [
        {
          id: 'zip_batch',
          name: zipFilename,
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
        savedPercentage,
        count: processedItems.length,
        timeTakenMs: Math.round(performance.now() - startTime)
      }
    };
  }
};
