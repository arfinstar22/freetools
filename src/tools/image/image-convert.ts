import { ToolDefinition, ProcessContext, ProcessResult, ProcessedItem } from '../../types/tool';
import { createZipFromFiles } from '../../utils/download';

const MAX_CANVAS_DIM = 16384;

export const imageConvertTool: ToolDefinition = {
  id: 'image-convert',
  name: 'Ubah Format Gambar',
  shortDescription: 'Konversi format gambar ke JPG, PNG, atau WEBP',
  description: 'Ubah format gambar apapun (JPG, PNG, WEBP, BMP) secara cepat tanpa menurunkan ketajaman visual.',
  category: 'image',
  acceptedTypes: ['image/*', '.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif'],
  inputMode: 'multi-file',
  icon: 'RefreshCw',
  popular: true,
  localProcessing: true,
  supportsBatch: true,
  supportsWorkflow: true,
  keywords: ['convert image', 'ubah format gambar', 'jpg to png', 'png to jpg', 'webp to jpg', 'jpg to webp', 'format foto'],
  optionSchemas: [
    {
      id: 'targetFormat',
      label: 'Format Tujuan',
      type: 'select',
      defaultValue: 'image/webp',
      options: [
        { label: 'WEBP (Format Modern Paling Ringan)', value: 'image/webp' },
        { label: 'JPG (Kompatibilitas Standar)', value: 'image/jpeg' },
        { label: 'PNG (Mendukung Transparansi)', value: 'image/png' }
      ]
    },
    {
      id: 'quality',
      label: 'Kualitas Output',
      type: 'select',
      defaultValue: '0.9',
      options: [
        { label: 'Maksimal (95%)', value: '0.95' },
        { label: 'Tinggi (90% - Direkomendasikan)', value: '0.9' },
        { label: 'Sedang (80%)', value: '0.8' }
      ]
    }
  ],
  process: async (context: ProcessContext): Promise<ProcessResult> => {
    const startTime = performance.now();
    const files = context.files || [];

    if (files.length === 0) {
      throw new Error('Pilih minimal 1 gambar untuk dikonversi.');
    }

    const targetFormat = context.options?.targetFormat || 'image/webp';
    const quality = parseFloat(context.options?.quality || '0.9') || 0.9;
    const ext = targetFormat === 'image/webp' ? 'webp' : targetFormat === 'image/jpeg' ? 'jpg' : 'png';

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
          message: `Mengonversi ${file.name} ke .${ext.toUpperCase()} (${i + 1}/${files.length})...`,
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

        let w = img.naturalWidth || img.width || 100;
        let h = img.naturalHeight || img.height || 100;

        // Hardware safety clamp
        w = Math.min(MAX_CANVAS_DIM, Math.max(1, w));
        h = Math.min(MAX_CANVAS_DIM, Math.max(1, h));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context tidak didukung.');

        if (targetFormat === 'image/jpeg') {
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
              else reject(new Error(`Gagal mengonversi file ${file.name}`));
            },
            targetFormat,
            quality
          );
        });

        const dataUrl = canvas.toDataURL(targetFormat, quality);
        const cleanBase = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const finalName = `${cleanBase}.${ext}`;

        processedTotalSize += blob.size;
        processedItems.push({
          id: `conv_${i}`,
          name: finalName,
          size: blob.size,
          originalSize: file.size,
          type: targetFormat,
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
            // Safe
          }
        }
      }
    }

    if (processedItems.length === 0) {
      throw new Error(`Gagal mengonversi semua gambar: ${failedFiles.join(', ')}`);
    }

    const failureNote = failedFiles.length > 0 ? ` (${failedFiles.length} file rusak dilewati)` : '';

    if (processedItems.length === 1 && files.length === 1) {
      return {
        success: true,
        message: `Berhasil mengubah format menjadi .${ext.toUpperCase()}!${failureNote}`,
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

    const zipBlob = await createZipFromFiles(filesForZip, `freetools_convert_${ext}.zip`);
    return {
      success: true,
      message: `Berhasil mengubah format ${processedItems.length} gambar menjadi .${ext.toUpperCase()}!${failureNote}`,
      downloadName: `freetools_convert_${ext}.zip`,
      items: [
        {
          id: 'zip_converted',
          name: `freetools_convert_${ext}.zip`,
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
