import { ToolDefinition, ProcessContext, ProcessResult, ProcessedItem } from '../../types/tool';
import { createZipFromFiles } from '../../utils/download';

const MAX_CANVAS_DIM = 16384;

export const removeMetadataTool: ToolDefinition = {
  id: 'remove-metadata',
  name: 'Hapus Metadata Foto (EXIF)',
  shortDescription: 'Hapus data lokasi GPS, jenis kamera, dan privasi foto',
  description: 'Bersihkan metadata tersembunyi seperti koordinat GPS lokasi rumah, jenis HP/kamera, dan waktu pengambilan sebelum foto diunggah ke internet.',
  category: 'image',
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp', '.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif', '.avif'],
  inputMode: 'multi-file',
  icon: 'ShieldCheck',
  popular: false,
  localProcessing: true,
  supportsBatch: true,
  supportsWorkflow: true,
  keywords: ['exif', 'metadata', 'hapus lokasi', 'gps', 'privasi foto', 'bersihkan metadata foto', 'remove exif'],
  optionSchemas: [
    {
      id: 'preserveQuality',
      label: 'Kualitas Gambar Bersih',
      type: 'select',
      defaultValue: '0.95',
      options: [
        { label: 'Kualitas Asli / Maksimal (95%)', value: '0.95' },
        { label: 'Kualitas Standar (85%)', value: '0.85' }
      ]
    }
  ],
  process: async (context: ProcessContext): Promise<ProcessResult> => {
    const startTime = performance.now();
    const files = context.files || [];

    if (files.length === 0) {
      throw new Error('Pilih minimal 1 gambar untuk dibersihkan metadatanya.');
    }

    const quality = parseFloat(context.options?.preserveQuality || '0.95');
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

      if (context.onProgress) {
        context.onProgress({
          current: i + 1,
          total: files.length,
          message: `Membersihkan metadata ${file.name} (${i + 1}/${files.length})...`,
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
        if (!ctx) throw new Error('Canvas context tidak tersedia.');

        const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
        const outputMime = isPng ? 'image/png' : 'image/jpeg';

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
              else reject(new Error(`Gagal memproses pembersihan metadata ${file.name}`));
            },
            outputMime,
            quality
          );
        });

        const cleanBase = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const ext = outputMime === 'image/png' ? 'png' : 'jpg';
        const finalName = `${cleanBase}_clean.${ext}`;

        processedTotalSize += blob.size;
        processedItems.push({
          id: `clean_${i}`,
          name: finalName,
          size: blob.size,
          originalSize: file.size,
          type: outputMime,
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
      throw new Error(`Gagal membersihkan semua gambar: ${failedFiles.join(', ')}`);
    }

    const failureNote = failedFiles.length > 0 ? ` (${failedFiles.length} file rusak dilewati)` : '';

    if (processedItems.length === 1 && files.length === 1) {
      return {
        success: true,
        message: `Metadata & data GPS berhasil dihapus sepenuhnya!${failureNote}`,
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

    const zipBlob = await createZipFromFiles(filesForZip, 'freetools_foto_bersih.zip');
    return {
      success: true,
      message: `Berhasil membersihkan metadata dari ${processedItems.length} foto!${failureNote}`,
      downloadName: 'freetools_foto_bersih.zip',
      items: [
        {
          id: 'zip_clean',
          name: 'freetools_foto_bersih.zip',
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
