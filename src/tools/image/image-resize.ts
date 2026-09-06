import { ToolDefinition, ProcessContext, ProcessResult, ProcessedItem } from '../../types/tool';
import { createZipFromFiles } from '../../utils/download';

const MAX_CANVAS_DIM = 16384;

export const imageResizeTool: ToolDefinition = {
  id: 'image-resize',
  name: 'Ubah Ukuran Gambar (Resize)',
  shortDescription: 'Ubah dimensi lebar/tinggi atau persentase gambar',
  description: 'Ubah resolusi foto menjadi ukuran tertentu (pixel atau persentase). Menjaga rasio aspek tetap proporsional dan mempertahankan transparansi PNG/WEBP.',
  category: 'image',
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp', '.jpg', '.jpeg', '.png', '.webp'],
  inputMode: 'multi-file',
  icon: 'Scaling',
  popular: true,
  localProcessing: true,
  supportsBatch: true,
  supportsWorkflow: true,
  keywords: ['resize', 'ubah ukuran', 'ganti resolusi', 'skala gambar', 'pixel', 'lebar tinggi', 'foto pas foto'],
  optionSchemas: [
    {
      id: 'mode',
      label: 'Metode Pengubahan',
      type: 'select',
      defaultValue: 'percentage',
      options: [
        { label: 'Berdasarkan Persentase (Skala %)', value: 'percentage' },
        { label: 'Berdasarkan Dimensi Maksimal (Pixel)', value: 'max_pixel' }
      ]
    },
    {
      id: 'scalePercent',
      label: 'Persentase Ukuran',
      type: 'select',
      defaultValue: '50',
      options: [
        { label: '75% dari ukuran asli', value: '75' },
        { label: '50% (Setengah ukuran)', value: '50' },
        { label: '25% (Seperempat ukuran)', value: '25' },
        { label: '150% (Perbesar 1.5x)', value: '150' },
        { label: '200% (Perbesar 2x)', value: '200' }
      ]
    },
    {
      id: 'maxDimension',
      label: 'Dimensi Maksimal (Pixel)',
      type: 'select',
      defaultValue: '1200',
      options: [
        { label: '1920px (Full HD)', value: '1920' },
        { label: '1200px (Standar Web)', value: '1200' },
        { label: '800px (Social Media)', value: '800' },
        { label: '400px (Thumbnail / Avatar)', value: '400' }
      ]
    }
  ],
  process: async (context: ProcessContext): Promise<ProcessResult> => {
    const startTime = performance.now();
    const files = context.files || [];

    if (files.length === 0) {
      throw new Error('Pilih minimal 1 gambar untuk diubah ukurannya.');
    }

    const mode = context.options?.mode || 'percentage';
    const scalePercent = Math.max(0.01, parseFloat(context.options?.scalePercent || '50') / 100);
    const maxDim = Math.max(1, parseInt(context.options?.maxDimension || '1200', 10));

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
          message: `Mengubah ukuran ${file.name} (${i + 1}/${files.length})...`,
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
            reject(new Error(`Gagal membuka gambar ${file.name}`));
          };
          img.src = objectUrl!;
        });

        const origW = img.naturalWidth || img.width || 100;
        const origH = img.naturalHeight || img.height || 100;
        let targetW = origW;
        let targetH = origH;

        if (mode === 'percentage') {
          targetW = Math.max(1, Math.round(origW * scalePercent));
          targetH = Math.max(1, Math.round(origH * scalePercent));
        } else {
          if (origW > maxDim || origH > maxDim) {
            if (origW > origH) {
              targetW = maxDim;
              targetH = Math.round((origH * maxDim) / origW);
            } else {
              targetH = maxDim;
              targetW = Math.round((origW * maxDim) / origH);
            }
          }
        }

        // Hardware safety clamp
        targetW = Math.min(MAX_CANVAS_DIM, Math.max(1, targetW));
        targetH = Math.min(MAX_CANVAS_DIM, Math.max(1, targetH));

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D context tidak tersedia.');

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
        const isWebp = file.type === 'image/webp' || file.name.toLowerCase().endsWith('.webp');
        const outputMime = isPng ? 'image/png' : isWebp ? 'image/webp' : 'image/jpeg';

        if (outputMime === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, targetW, targetH);
        } else {
          ctx.clearRect(0, 0, targetW, targetH);
        }

        ctx.drawImage(img, 0, 0, targetW, targetH);

        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => {
              if (b) resolve(b);
              else reject(new Error(`Gagal memproses hasil resize untuk ${file.name}`));
            },
            outputMime,
            0.9
          );
        });

        const dataUrl = canvas.toDataURL(outputMime, 0.9);
        const cleanBase = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const ext = outputMime === 'image/png' ? 'png' : outputMime === 'image/webp' ? 'webp' : 'jpg';
        const finalName = `${cleanBase}_${targetW}x${targetH}.${ext}`;

        processedTotalSize += blob.size;
        processedItems.push({
          id: `resized_${i}`,
          name: finalName,
          size: blob.size,
          originalSize: file.size,
          type: outputMime,
          blob,
          dataUrl,
          metadata: { width: targetW, height: targetH, originalWidth: origW, originalHeight: origH }
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

    const failureNote = failedFiles.length > 0 ? ` (${failedFiles.length} file dilewati karena format rusak)` : '';

    if (processedItems.length === 1 && files.length === 1) {
      return {
        success: true,
        message: `Ukuran berhasil diubah menjadi ${processedItems[0].metadata?.width} x ${processedItems[0].metadata?.height} px!${failureNote}`,
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

    const zipBlob = await createZipFromFiles(filesForZip, 'freetools_gambar_resize.zip');
    return {
      success: true,
      message: `Berhasil mengubah ukuran ${processedItems.length} gambar!${failureNote}`,
      downloadName: 'freetools_gambar_resize.zip',
      items: [
        {
          id: 'zip_resized',
          name: 'freetools_gambar_resize.zip',
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
