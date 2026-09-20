import { ToolDefinition, ProcessContext, ProcessResult, ProcessedItem } from '../../types/tool';
import { createZipFromFiles } from '../../utils/download';
import { encodeBmp } from '../../utils/image-encoders';

const MAX_CANVAS_DIM = 16384;

export const imageCompressTool: ToolDefinition = {
  id: 'image-compress',
  name: 'Kompres Gambar',
  shortDescription: 'Kecilkan ukuran file JPG, PNG, WEBP dengan kontrol persen kualitas',
  description: 'Kompres gambar secara instan langsung di browsermu dengan mempertahankan format asli (PNG tetap PNG, JPG tetap JPG). Menjaga transparansi, ketajaman visual, dan privasi 100%.',
  category: 'image',
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp', '.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif'],
  inputMode: 'multi-file',
  icon: 'Minimize',
  popular: true,
  localProcessing: true,
  supportsBatch: true,
  supportsWorkflow: true,
  keywords: ['compress image', 'kompres gambar', 'kecilkan foto', 'kompres foto', 'kecilkan jpg', 'kompres png', 'optimasi gambar', 'persen kompresi foto'],
  optionSchemas: [
    {
      id: 'qualityPercent',
      label: 'Tingkat Kualitas Kompresi (%)',
      description: 'Pilih persentase kualitas output (75% seimbang untuk web, 50% hemat kuota, 85% detail foto).',
      type: 'range',
      defaultValue: 75,
      min: 10,
      max: 95,
      step: 5,
      unit: '%'
    },
    {
      id: 'outputFormat',
      label: 'Format File Hasil',
      type: 'select',
      defaultValue: 'original',
      options: [
        { label: 'Format Asli (PNG tetap PNG, JPG tetap JPG)', value: 'original' },
        { label: 'Ubah ke JPG (Kompatibilitas Standar)', value: 'image/jpeg' },
        { label: 'Ubah ke PNG (Mendukung Transparansi)', value: 'image/png' },
        { label: 'Ubah ke WEBP (Ukuran Paling Ringan)', value: 'image/webp' }
      ]
    },
    {
      id: 'qualityPreset',
      label: 'Preset Cepat Kualitas',
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
      label: 'Maksimal Dimensi Resolusi',
      type: 'select',
      defaultValue: 'original',
      options: [
        { label: 'Pertahankan Dimensi Asli', value: 'original' },
        { label: 'Maks 1920px (Full HD / Standar Desktop)', value: '1920' },
        { label: 'Maks 1280px (HD / Web & Blog)', value: '1280' },
        { label: 'Maks 800px (Thumbnail / WhatsApp Ringan)', value: '800' }
      ]
    }
  ],
  process: async (context: ProcessContext): Promise<ProcessResult> => {
    const startTime = performance.now();
    const files = context.files || [];

    if (files.length === 0) {
      throw new Error('Pilih minimal 1 gambar untuk dikompres.');
    }

    // Resolve quality: range slider takes priority if explicitly set or numeric
    let quality = 0.75;
    const rawQualityPercent = context.options?.qualityPercent;
    if (typeof rawQualityPercent === 'number' || (typeof rawQualityPercent === 'string' && !isNaN(Number(rawQualityPercent)))) {
      const p = Number(rawQualityPercent);
      quality = Math.max(0.1, Math.min(0.98, p / 100));
    } else {
      const preset = context.options?.qualityPreset || 'balanced';
      if (preset === 'high') quality = 0.85;
      else if (preset === 'minimal') quality = 0.55;
      else quality = 0.75;
    }

    const chosenFormat = context.options?.outputFormat || 'original';
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

      if (!file.name.match(/\.(jpg|jpeg|png|webp|bmp|gif|avif)$/i) && (!file.type || !file.type.startsWith('image/'))) {
        failedFiles.push(file.name);
        continue;
      }

      // Determine output MIME type and file extension based on user preference or original format
      const extMatch = file.name.match(/\.([a-zA-Z0-9]+)$/);
      const rawExt = extMatch ? extMatch[1].toLowerCase() : '';

      let outputMime = file.type || 'image/jpeg';
      let ext = rawExt || 'jpg';

      if (chosenFormat === 'original') {
        if (rawExt === 'png' || file.type === 'image/png') {
          outputMime = 'image/png';
          ext = 'png';
        } else if (rawExt === 'webp' || file.type === 'image/webp') {
          outputMime = 'image/webp';
          ext = 'webp';
        } else if (rawExt === 'bmp' || file.type === 'image/bmp') {
          outputMime = 'image/bmp';
          ext = 'bmp';
        } else if (rawExt === 'avif' || file.type === 'image/avif') {
          outputMime = 'image/avif';
          ext = 'avif';
        } else {
          outputMime = 'image/jpeg';
          ext = rawExt === 'jpeg' ? 'jpeg' : 'jpg';
        }
      } else {
        outputMime = chosenFormat;
        ext = chosenFormat === 'image/png' ? 'png' : chosenFormat === 'image/webp' ? 'webp' : 'jpg';
      }

      if (context.onProgress) {
        context.onProgress({
          current: i + 1,
          total: files.length,
          message: `Mengompres ${file.name} (${i + 1}/${files.length}) format .${ext.toUpperCase()}...`,
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
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('Canvas 2D tidak didukung browser.');

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        if (outputMime === 'image/jpeg' || outputMime === 'image/bmp') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
        } else {
          ctx.clearRect(0, 0, w, h);
        }
        ctx.drawImage(img, 0, 0, w, h);

        // For PNG, perform slight color step quantization when quality is reduced
        // This preserves pure PNG format while enabling DEFLATE to compress significantly
        if (outputMime === 'image/png' && quality < 0.95) {
          try {
            const step = quality <= 0.35 ? 16 : quality <= 0.6 ? 8 : quality <= 0.8 ? 4 : 2;
            const imgData = ctx.getImageData(0, 0, w, h);
            const d = imgData.data;
            for (let p = 0; p < d.length; p += 4) {
              if (d[p + 3] > 0) {
                d[p] = Math.min(255, Math.round(d[p] / step) * step);
                d[p + 1] = Math.min(255, Math.round(d[p + 1] / step) * step);
                d[p + 2] = Math.min(255, Math.round(d[p + 2] / step) * step);
              }
            }
            ctx.putImageData(imgData, 0, 0);
          } catch {
            // Safe fallback if getImageData fails
          }
        }

        let blob: Blob;
        if (outputMime === 'image/bmp') {
          blob = encodeBmp(canvas);
        } else {
          blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
              (b) => {
                if (b) resolve(b);
                else reject(new Error(`Gagal mengompres gambar ${file.name}`));
              },
              outputMime,
              quality
            );
          });
        }

        const dataUrl = canvas.toDataURL(outputMime === 'image/bmp' ? 'image/png' : outputMime, quality);
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
    const qPctDisplay = Math.round(quality * 100);

    if (processedItems.length === 1 && files.length === 1) {
      return {
        success: true,
        message: savedPercentage > 0
          ? `Selesai! Berhasil menghemat ${savedPercentage}% ukuran gambar (${processedItems[0].name.split('.').pop()?.toUpperCase()} • Kualitas: ${qPctDisplay}%).${failureNote}`
          : `Gambar berhasil dioptimalkan pada kualitas ${qPctDisplay}%!${failureNote}`,
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
      message: `Selesai! Berhasil mengompres ${processedItems.length} gambar (hemat ${savedPercentage}%, kualitas ${qPctDisplay}%).${failureNote}`,
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
