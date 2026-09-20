import { PDFDocument } from 'pdf-lib';
import { ToolDefinition, ProcessContext, ProcessResult } from '../../types/tool';

export const jpgToPdfTool: ToolDefinition = {
  id: 'jpg-to-pdf',
  name: 'Gambar ke PDF',
  shortDescription: 'Ubah satu atau banyak gambar jadi 1 dokumen PDF rapi',
  description: 'Konversi file JPG, PNG, atau WEBP menjadi file dokumen PDF berkualitas tinggi tanpa watermark.',
  category: 'pdf',
  acceptedTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/*',
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.bmp',
    '.gif',
    '.avif',
    '.tiff',
    '.tif'
  ],
  inputMode: 'multi-file',
  icon: 'FileImage',
  popular: true,
  localProcessing: true,
  supportsBatch: true,
  supportsWorkflow: true,
  keywords: ['jpg to pdf', 'gambar ke pdf', 'foto ke pdf', 'png to pdf', 'buat pdf dari foto', 'convert image pdf'],
  optionSchemas: [
    {
      id: 'orientation',
      label: 'Orientasi Halaman',
      type: 'select',
      defaultValue: 'auto',
      options: [
        { label: 'Otomatis (Ikuti Gambar)', value: 'auto' },
        { label: 'Tegak (Portrait - A4)', value: 'portrait' },
        { label: 'Mendatar (Landscape - A4)', value: 'landscape' }
      ]
    },
    {
      id: 'margin',
      label: 'Margin Halaman',
      type: 'select',
      defaultValue: 'none',
      options: [
        { label: 'Tanpa Margin (Full Page)', value: 'none' },
        { label: 'Margin Sedang (20px)', value: 'small' },
        { label: 'Margin Luas (40px)', value: 'large' }
      ]
    },
    {
      id: 'outputFilename',
      label: 'Nama File PDF',
      type: 'text',
      defaultValue: 'freetools_dokumen.pdf'
    }
  ],
  process: async (context: ProcessContext): Promise<ProcessResult> => {
    const startTime = performance.now();
    const files = context.files || [];

    if (files.length === 0) {
      throw new Error('Pilih minimal 1 gambar (JPG/PNG/WEBP) untuk diubah ke PDF.');
    }

    const pdfDoc = await PDFDocument.create();
    let originalTotalSize = 0;
    const orientation = context.options?.orientation || 'auto';
    const marginType = context.options?.margin || 'none';
    const margin = marginType === 'small' ? 20 : marginType === 'large' ? 40 : 0;

    const A4_WIDTH = 595.28;
    const A4_HEIGHT = 841.89;
    let successfulCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      originalTotalSize += file.size;

      if (file.type && !file.type.startsWith('image/') && !file.name.match(/\.(jpg|jpeg|png|webp|bmp|gif|avif|tiff|tif)$/i)) {
        throw new Error(`File "${file.name}" bukan format gambar yang didukung.`);
      }

      if (context.onProgress) {
        context.onProgress({
          current: i + 1,
          total: files.length,
          message: `Menambahkan ${file.name} (${i + 1}/${files.length})...`,
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
          }, 8000);

          img.onload = () => {
            clearTimeout(timer);
            resolve();
          };
          img.onerror = () => {
            clearTimeout(timer);
            reject(new Error(`Gagal memuat gambar ${file.name}`));
          };
          img.src = objectUrl!;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 100;
        canvas.height = img.naturalHeight || img.height || 100;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Browser tidak mendukung canvas 2D context.');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);
        const base64Data = jpegDataUrl.split(',')[1];
        const binaryString = atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let k = 0; k < len; k++) {
          bytes[k] = binaryString.charCodeAt(k);
        }

        const embeddedImage = await pdfDoc.embedJpg(bytes);
        const imgWidth = embeddedImage.width;
        const imgHeight = embeddedImage.height;

        let pageWidth: number;
        let pageHeight: number;

        if (orientation === 'portrait') {
          pageWidth = A4_WIDTH;
          pageHeight = A4_HEIGHT;
        } else if (orientation === 'landscape') {
          pageWidth = A4_HEIGHT;
          pageHeight = A4_WIDTH;
        } else {
          if (margin === 0) {
            pageWidth = imgWidth;
            pageHeight = imgHeight;
          } else {
            pageWidth = imgWidth > imgHeight ? A4_HEIGHT : A4_WIDTH;
            pageHeight = imgWidth > imgHeight ? A4_WIDTH : A4_HEIGHT;
          }
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        if (margin === 0 && orientation === 'auto') {
          page.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: pageWidth,
            height: pageHeight
          });
        } else {
          const availableWidth = pageWidth - margin * 2;
          const availableHeight = pageHeight - margin * 2;
          const scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
          const finalWidth = imgWidth * scale;
          const finalHeight = imgHeight * scale;
          const x = margin + (availableWidth - finalWidth) / 2;
          const y = margin + (availableHeight - finalHeight) / 2;

          page.drawImage(embeddedImage, {
            x,
            y,
            width: finalWidth,
            height: finalHeight
          });
        }

        successfulCount++;
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

    if (successfulCount === 0) {
      throw new Error('Tidak ada gambar valid yang berhasil diolah ke PDF.');
    }

    if (context.onProgress) {
      context.onProgress({
        current: files.length,
        total: files.length,
        message: 'Mengemas dokumen PDF...',
        percentage: 95
      });
    }

    const pdfBytes = await pdfDoc.save();
    const outputBlob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    const rawName = context.options?.outputFilename?.trim() || 'freetools_dokumen';
    const outputName = rawName.endsWith('.pdf') ? rawName : `${rawName}.pdf`;

    return {
      success: true,
      message: `Berhasil mengubah ${successfulCount} gambar menjadi file PDF!`,
      downloadName: outputName,
      items: [
        {
          id: 'jpg_to_pdf_result',
          name: outputName,
          size: outputBlob.size,
          originalSize: originalTotalSize,
          type: 'application/pdf',
          blob: outputBlob
        }
      ],
      stats: {
        originalTotalSize,
        processedTotalSize: outputBlob.size,
        count: successfulCount,
        timeTakenMs: Math.round(performance.now() - startTime)
      }
    };
  }
};
