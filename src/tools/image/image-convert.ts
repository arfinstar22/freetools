import { ToolDefinition, ProcessContext, ProcessResult, ProcessedItem } from '../../types/tool';
import { createZipFromFiles } from '../../utils/download';
import { encodeBmp, encodeIco, encodeTiff, encodeSvg, encodeAvif } from '../../utils/image-encoders';

const MAX_CANVAS_DIM = 16384;

export const imageConvertTool: ToolDefinition = {
  id: 'image-convert',
  name: 'Ubah Format Gambar',
  shortDescription: 'Konversi format gambar ke WEBP, JPG, PNG, AVIF, BMP, ICO, GIF, TIFF, SVG',
  description: 'Ubah format gambar apapun secara cepat tanpa server dan tanpa batasan. Tersedia 9 format populer termasuk Favicon ICO, AVIF, dan TIFF.',
  category: 'image',
  acceptedTypes: [
    'image/*',
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.bmp',
    '.gif',
    '.ico',
    '.tiff',
    '.tif',
    '.avif',
    '.svg'
  ],
  inputMode: 'multi-file',
  icon: 'RefreshCw',
  popular: true,
  localProcessing: true,
  supportsBatch: true,
  supportsWorkflow: true,
  keywords: [
    'convert image',
    'ubah format gambar',
    'jpg to png',
    'png to jpg',
    'webp to jpg',
    'jpg to webp',
    'format foto',
    'png to ico',
    'bikin favicon',
    'jpg to bmp',
    'convert tiff',
    'avif to jpg',
    'convert avif'
  ],
  optionSchemas: [
    {
      id: 'targetFormat',
      label: 'Format Tujuan',
      type: 'select',
      defaultValue: 'image/webp',
      options: [
        { label: 'WEBP (Format Modern Paling Ringan & Efisien)', value: 'image/webp' },
        { label: 'JPG / JPEG (Kompatibilitas Standar Universal)', value: 'image/jpeg' },
        { label: 'PNG (Mendukung Transparansi & Detail Tajam)', value: 'image/png' },
        { label: 'AVIF (Rasio Kompresi Generasi Baru)', value: 'image/avif' },
        { label: 'BMP (Bitmap Windows Murni Tanpa Kompresi)', value: 'image/bmp' },
        { label: 'ICO (Favicon Web & Desktop Multi-Ukuran)', value: 'image/x-icon' },
        { label: 'GIF (Grafis Web Kompatibilitas Tinggi)', value: 'image/gif' },
        { label: 'TIFF (Format Arsip & Percetakan Berkualitas)', value: 'image/tiff' },
        { label: 'SVG (Vector Container Wrapper)', value: 'image/svg+xml' }
      ]
    },
    {
      id: 'quality',
      label: 'Kualitas Output (%)',
      description: 'Hanya berlaku untuk format berbasis kompresi (JPG, WEBP, AVIF).',
      type: 'range',
      defaultValue: 90,
      min: 10,
      max: 100,
      step: 5,
      unit: '%'
    },
    {
      id: 'icoSize',
      label: 'Ukuran Resolusi Favicon (Khusus Format ICO)',
      type: 'select',
      defaultValue: '32',
      options: [
        { label: '32x32 px (Standar Favicon Browser)', value: '32' },
        { label: '16x16 px (Favicon Tab Klasik)', value: '16' },
        { label: '48x48 px (Ikon Desktop Windows)', value: '48' },
        { label: '64x64 px (Ikon Resolusi Tinggi)', value: '64' },
        { label: '128x128 px (Ikon HD)', value: '128' },
        { label: '256x256 px (Maksimal ICO Windows)', value: '256' },
        { label: 'Pertahankan Resolusi Asli', value: 'original' }
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
    const rawQuality = context.options?.quality;
    let quality = 0.9;
    if (typeof rawQuality === 'number' || (typeof rawQuality === 'string' && !isNaN(Number(rawQuality)))) {
      const qVal = Number(rawQuality);
      quality = qVal > 1 ? qVal / 100 : qVal;
    }
    quality = Math.max(0.1, Math.min(1.0, quality));

    const icoSizeStr = context.options?.icoSize || '32';
    const icoTargetSize = icoSizeStr === 'original' ? 0 : parseInt(icoSizeStr, 10) || 32;

    const formatToExtMap: Record<string, string> = {
      'image/webp': 'webp',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/avif': 'avif',
      'image/bmp': 'bmp',
      'image/x-icon': 'ico',
      'image/gif': 'gif',
      'image/tiff': 'tiff',
      'image/svg+xml': 'svg'
    };

    const ext = formatToExtMap[targetFormat] || 'webp';

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

      if (!file.name.match(/\.(jpg|jpeg|png|webp|bmp|gif|ico|tiff|tif|avif|svg)$/i) && (!file.type || !file.type.startsWith('image/'))) {
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
        if (!ctx) throw new Error('Canvas context tidak didukung browser.');

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Background handling: JPG & BMP need solid white background for transparency
        if (targetFormat === 'image/jpeg' || targetFormat === 'image/bmp') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
        } else {
          ctx.clearRect(0, 0, w, h);
        }
        ctx.drawImage(img, 0, 0, w, h);

        let blob: Blob;
        let effectiveExt = ext;
        let effectiveMime = targetFormat;

        switch (targetFormat) {
          case 'image/bmp':
            blob = encodeBmp(canvas);
            break;

          case 'image/x-icon':
            blob = await encodeIco(canvas, icoTargetSize);
            break;

          case 'image/tiff':
            blob = encodeTiff(canvas);
            break;

          case 'image/svg+xml':
            blob = encodeSvg(canvas);
            break;

          case 'image/avif': {
            const avifRes = await encodeAvif(canvas, quality);
            blob = avifRes.blob;
            effectiveExt = avifRes.ext;
            effectiveMime = avifRes.format;
            break;
          }

          default:
            blob = await new Promise<Blob>((resolve, reject) => {
              canvas.toBlob(
                (b) => {
                  if (b) resolve(b);
                  else reject(new Error(`Gagal mengonversi file ${file.name}`));
                },
                targetFormat,
                quality
              );
            });
            break;
        }

        const dataUrl = canvas.toDataURL(effectiveMime.startsWith('image/') ? effectiveMime : 'image/png', quality);
        const cleanBase = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const finalName = `${cleanBase}.${effectiveExt}`;

        processedTotalSize += blob.size;
        processedItems.push({
          id: `conv_${i}`,
          name: finalName,
          size: blob.size,
          originalSize: file.size,
          type: effectiveMime,
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
