import { ToolDefinition, ProcessContext, ProcessResult } from '../../types/tool';
import { createZipFromFiles } from '../../utils/download';

export const pdfToJpgTool: ToolDefinition = {
  id: 'pdf-to-jpg',
  name: 'PDF ke Gambar (JPG/PNG)',
  shortDescription: 'Ekstrak setiap halaman PDF menjadi gambar kualitas tinggi',
  description: 'Ubah halaman PDF menjadi gambar JPG atau PNG beresolusi tinggi langsung di browser tanpa kompresi buram.',
  category: 'pdf',
  acceptedTypes: ['.pdf', 'application/pdf'],
  inputMode: 'file',
  icon: 'Image',
  popular: true,
  localProcessing: true,
  supportsBatch: false,
  supportsWorkflow: true,
  keywords: ['pdf to jpg', 'pdf to image', 'pdf ke gambar', 'pdf ke foto', 'ubah pdf jadi jpg', 'ekstrak gambar pdf'],
  optionSchemas: [
    {
      id: 'format',
      label: 'Format Gambar',
      type: 'select',
      defaultValue: 'image/jpeg',
      options: [
        { label: 'JPG (Ukuran Lebih Ringan)', value: 'image/jpeg' },
        { label: 'PNG (Kualitas Tanpa Kompresi)', value: 'image/png' }
      ]
    },
    {
      id: 'scale',
      label: 'Kualitas & Resolusi',
      type: 'select',
      defaultValue: '2',
      options: [
        { label: 'Standar (1.5x Scale)', value: '1.5' },
        { label: 'Tinggi - HD (2x Scale - Direkomendasikan)', value: '2' },
        { label: 'Ultra HD (3x Scale)', value: '3' }
      ]
    }
  ],
  process: async (context: ProcessContext): Promise<ProcessResult> => {
    const startTime = performance.now();
    const files = context.files || [];

    if (files.length === 0) {
      throw new Error('Pilih 1 file PDF untuk diubah menjadi gambar.');
    }

    const file = files[0];
    const arrayBuffer = await file.arrayBuffer();
    const format = context.options?.format || 'image/jpeg';
    const scale = parseFloat(context.options?.scale || '2') || 2;
    const ext = format === 'image/png' ? 'png' : 'jpg';

    if (context.onProgress) {
      context.onProgress({
        current: 1,
        total: 1,
        message: 'Membaca dokumen PDF...',
        percentage: 10
      });
    }

    // Dynamic import for performance and lazy-loading
    const pdfjsLib = await import('pdfjs-dist');
    const { setupPdfjsWorker } = await import('../../engine/pdfjs-worker');
    setupPdfjsWorker(pdfjsLib);

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    if (numPages === 0) {
      throw new Error('File PDF tidak memiliki halaman yang bisa diproses.');
    }

    const renderedImages: { name: string; blob: Blob; size: number; dataUrl: string }[] = [];
    const baseName = file.name.replace(/\.pdf$/i, '');

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      if (context.onProgress) {
        context.onProgress({
          current: pageNum,
          total: numPages,
          message: `Merender halaman ${pageNum} dari ${numPages}...`,
          percentage: 10 + Math.round((pageNum / numPages) * 80)
        });
      }

      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Browser tidak mendukung rendering Canvas 2D.');

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };

      await page.render(renderContext).promise;

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error(`Gagal mengubah canvas ke blob untuk halaman ${pageNum}`));
          },
          format,
          0.92
        );
      });

      const dataUrl = canvas.toDataURL(format, 0.92);
      const imgName = `${baseName}_hal_${pageNum}.${ext}`;
      renderedImages.push({
        name: imgName,
        blob,
        size: blob.size,
        dataUrl
      });
    }

    if (renderedImages.length === 1) {
      return {
        success: true,
        message: `Berhasil mengubah PDF menjadi gambar ${ext.toUpperCase()}!`,
        downloadName: renderedImages[0].name,
        items: [
          {
            id: 'img_1',
            name: renderedImages[0].name,
            size: renderedImages[0].size,
            originalSize: file.size,
            type: format,
            blob: renderedImages[0].blob,
            dataUrl: renderedImages[0].dataUrl
          }
        ],
        stats: {
          originalTotalSize: file.size,
          processedTotalSize: renderedImages[0].size,
          count: 1,
          timeTakenMs: Math.round(performance.now() - startTime)
        }
      };
    }

    if (context.onProgress) {
      context.onProgress({
        current: numPages,
        total: numPages,
        message: 'Mengemas semua gambar ke dalam ZIP...',
        percentage: 95
      });
    }

    const zipBlob = await createZipFromFiles(renderedImages, `${baseName}_gambar.zip`);

    return {
      success: true,
      message: `Berhasil mengubah ${renderedImages.length} halaman PDF menjadi gambar!`,
      downloadName: `${baseName}_gambar.zip`,
      items: [
        {
          id: 'pdf_images_zip',
          name: `${baseName}_gambar.zip`,
          size: zipBlob.size,
          originalSize: file.size,
          type: 'application/zip',
          blob: zipBlob
        },
        ...renderedImages.map((img, idx) => ({
          id: `img_${idx + 1}`,
          name: img.name,
          size: img.size,
          type: format,
          blob: img.blob,
          dataUrl: img.dataUrl
        }))
      ],
      stats: {
        originalTotalSize: file.size,
        processedTotalSize: zipBlob.size,
        count: renderedImages.length,
        timeTakenMs: Math.round(performance.now() - startTime)
      }
    };
  }
};
