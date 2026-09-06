import { ToolDefinition, ProcessContext, ProcessResult, ProcessedItem } from '../../types/tool';
import { createZipFromFiles } from '../../utils/download';

const MAX_CANVAS_DIM = 16384;

export const imageCompressTool: ToolDefinition = {
  id: 'image-compress',
  name: 'Kompres Gambar',
  shortDescription: 'Kecilkan ukuran file JPG, PNG, WEBP tanpa bikin buram',
  description: 'Kompres gambar secara instan langsung di browsermu. Mempertahankan transparansi dan ketajaman visual.',
  category: 'image',
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp', '.jpg', '.jpeg', '.png', '.webp'],
  inputMode: 'multi-file',
  icon: 'Minimize',
  popular: true,
  localProcessing: true,
  supportsBatch: true,
  supportsWorkflow: true,
  keywords: ['compress image', 'kompres gambar', 'kecilkan foto', 'kompres foto', 'kecilkan jpg', 'kompres png', 'optimasi gambar'],
  optionSchemas: [
    {
      id: 'qualityPreset',
      label: 'Pilihan Kualitas',
      type: 'select',
      defaultValue: 'balanced',
      options: [
        { label: 'Kualitas Tinggi (85%) — Detail Tajam', value: 'high' },
        { label: 'Seimbang (75%) — Direkomendasikan', value: 'balanced' },
        { label: 'Sekecil Mungkin (55%) — Ukuran Minimal', value: 'minimal' }
      ]
    },
    {
      id: 'maxDimension',
      label: 'Maksimal Dimensi (Opsional)',
      type: 'select',
      defaultValue: 'original',
      options: [
        { label: 'Pertahankan Dimensi Asli', value: 'original' },
        { label: 'Maks 1920px (Full HD)', value: '1920' },
        { label: 'Maks 1280px (HD / Web)', value: '1280' },
        { label: 'Maks 800px (Thumbnail / WhatsApp)', value: '800' }
      ]
    }
  ],
  process: async (context: ProcessContext): Promise<ProcessResult> => {
    const startTime = performance.now();
    const files = context.files || [];

    if (files.length === 0) {
      throw new Error('Pilih minimal 1 gambar untuk dikompres.');
    }

    const preset = context.options?.qualityPreset || 'balanced';
    let quality = 0.75;
    if (preset === 'high') quality = 0.85;
    if (preset === 'minimal') quality = 0.55;

    const maxDimStr = context.options?.maxDimension || 'original';
    const maxDim = maxDimStr === 'original' ? 0 : parseInt(maxDimStr, 10);

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
          message: `Mengompres ${file.name} (${i + 1}/${files.length})...`,
          percentage: Math.round(((i + 1) / files.length) * 90)
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
            reject(new Error(`Gagal membaca file gambar ${file.name}`));
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
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D tidak didukung browser.');

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
        const outputMime = isPng ? 'image/webp' : 'image/jpeg';

        if (outputMime === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
        } else {
          ctx.clearRect(0, 0, w, h);
        }
        ctx.drawImage(img, 0, 0, w, h);

        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => {
              if (b) resolve(b);
              else reject(new Error(`Gagal mengompres gambar ${file.name}`));
            },
            outputMime,
            quality
          );
        });

        const dataUrl = canvas.toDataURL(outputMime, quality);
        const ext = outputMime === 'image/webp' ? 'webp' : 'jpg';
        const cleanBase = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const finalName = `${cleanBase}_compressed.${ext}`;

        processedTotalSize += blob.size;
        processedItems.push({
          id: `comp_${i}`,
          name: finalName,
          size: blob.size,
          originalSize: file.size,
          type: outputMime,
          blob,
          dataUrl
        });
        filesForZip.push({ name: finalName, blob });
      } catch {
        failedFiles.push(file.name);
      } finally {
        if (objectUrl) {
          try {
            URL.revokeObjectURL(objectUrl);
          } catch {
            // Safe catch
          }
        }
      }
    }

    if (processedItems.length === 0) {
      throw new Error(`Gagal memproses semua gambar: ${failedFiles.join(', ')}`);
    }

    const savedPercentage = Math.max(0, Math.round(((originalTotalSize - processedTotalSize) / originalTotalSize) * 100));
    const failureNote = failedFiles.length > 0 ? ` (${failedFiles.length} file rusak dilewati)` : '';

    if (processedItems.length === 1 && files.length === 1) {
      return {
        success: true,
        message: savedPercentage > 0
          ? `Selesai! Berhasil menghemat ${savedPercentage}% ukuran gambar.${failureNote}`
          : `Gambar berhasil dioptimalkan!${failureNote}`,
        downloadName: processedItems[0].name,
        items: processedItems,
        stats: {
          originalTotalSize,
          processedTotalSize,
          savedPercentage,
          count: 1,
          timeTakenMs: Math.round(performance.now() - startTime)
        }
      };
    }

    const zipBlob = await createZipFromFiles(filesForZip, 'freetools_gambar_kompres.zip');
    return {
      success: true,
      message: `Selesai! Berhasil mengompres ${processedItems.length} gambar (hemat ${savedPercentage}%).${failureNote}`,
      downloadName: 'freetools_gambar_kompres.zip',
      items: [
        {
          id: 'zip_all',
          name: 'freetools_gambar_kompres.zip',
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
