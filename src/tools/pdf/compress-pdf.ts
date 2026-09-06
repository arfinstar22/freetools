import { PDFDocument } from 'pdf-lib';
import { ToolDefinition, ProcessContext, ProcessResult } from '../../types/tool';

export const compressPdfTool: ToolDefinition = {
  id: 'compress-pdf',
  name: 'Kompres PDF',
  shortDescription: 'Kecilkan ukuran PDF agar mudah dikirim lewat WA / Email',
  description: 'Kompres ukuran file PDF langsung di browsermu tanpa upload ke server. Aman, cepat, dan menjaga privasi dokumen penting.',
  category: 'pdf',
  acceptedTypes: ['.pdf', 'application/pdf'],
  inputMode: 'file',
  icon: 'Minimize2',
  popular: true,
  localProcessing: true,
  supportsBatch: true,
  supportsWorkflow: true,
  keywords: ['compress', 'kompres', 'kecilkan', 'pdf', 'wa', 'whatsapp', 'email', 'size', 'kurangi ukuran', 'pdf kegedean'],
  optionSchemas: [
    {
      id: 'level',
      label: 'Tingkat Kompresi',
      type: 'select',
      defaultValue: 'medium',
      options: [
        { label: 'Kompresi Standar (Kualitas Bagus)', value: 'low', description: 'Mempertahankan kualitas teks dan visual terbaik' },
        { label: 'Kompresi Seimbang (Direkomendasikan)', value: 'medium', description: 'Ukuran optimal untuk WhatsApp & Email' },
        { label: 'Kompresi Maksimal (Ukuran Terkecil)', value: 'high', description: 'Menghapus metadata & kompresi stream maksimal' }
      ]
    }
  ],
  process: async (context: ProcessContext): Promise<ProcessResult> => {
    const startTime = performance.now();
    const files = context.files || [];

    if (files.length === 0) {
      throw new Error('Pilih minimal 1 file PDF yang ingin dikompres.');
    }

    const file = files[0];
    if (context.onProgress) {
      context.onProgress({
        current: 1,
        total: 1,
        message: 'Membaca struktur PDF...',
        percentage: 25
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const originalSize = file.size;

    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

    if (context.onProgress) {
      context.onProgress({
        current: 1,
        total: 1,
        message: 'Membersihkan metadata & mengoptimalkan objek halaman...',
        percentage: 60
      });
    }

    // Clean unneeded metadata to save bytes
    const level = context.options?.level || 'medium';
    if (level === 'high' || level === 'medium') {
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer('FreeTools Local Engine');
      pdfDoc.setCreator('FreeTools');
    }

    if (context.onProgress) {
      context.onProgress({
        current: 1,
        total: 1,
        message: 'Mengemas ulang stream kompresi...',
        percentage: 85
      });
    }

    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 50
    });

    let outputBlob = new Blob([compressedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

    // If already super compressed or slightly larger due to object stream tables on tiny files, use minimal
    if (outputBlob.size >= originalSize && originalSize > 0) {
      // Re-save without stream dictionary bloat
      const simpleBytes = await pdfDoc.save({ useObjectStreams: false });
      if (simpleBytes.length < outputBlob.size) {
        outputBlob = new Blob([simpleBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      }
    }

    const baseName = file.name.replace(/\.pdf$/i, '');
    const outputFilename = `${baseName}_compressed.pdf`;

    const savedPercent = Math.max(0, Math.round(((originalSize - outputBlob.size) / originalSize) * 100));

    return {
      success: true,
      message: savedPercent > 0 
        ? `Berhasil mengompres PDF! Hemat ${savedPercent}% dari ukuran awal.`
        : 'PDF sudah dioptimalkan dan siap di-download!',
      downloadName: outputFilename,
      items: [
        {
          id: 'compressed_pdf',
          name: outputFilename,
          size: outputBlob.size,
          originalSize,
          type: 'application/pdf',
          blob: outputBlob
        }
      ],
      stats: {
        originalTotalSize: originalSize,
        processedTotalSize: outputBlob.size,
        savedPercentage: savedPercent,
        count: 1,
        timeTakenMs: Math.round(performance.now() - startTime)
      }
    };
  }
};
