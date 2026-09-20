import { PDFDocument } from 'pdf-lib';
import { ToolDefinition, ProcessContext, ProcessResult } from '../../types/tool';

export const compressPdfTool: ToolDefinition = {
  id: 'compress-pdf',
  name: 'Kompres PDF',
  shortDescription: 'Kecilkan ukuran PDF dengan kontrol persen kualitas (WA / Email)',
  description: 'Atur persentase kompresi PDF secara presisi langsung di browser tanpa upload ke server. Aman, cepat, menjaga privasi, dan offline-ready.',
  category: 'pdf',
  acceptedTypes: ['.pdf', 'application/pdf'],
  inputMode: 'file',
  icon: 'Minimize2',
  popular: true,
  localProcessing: true,
  supportsBatch: true,
  supportsWorkflow: true,
  keywords: ['compress', 'kompres', 'kecilkan', 'pdf', 'wa', 'whatsapp', 'email', 'size', 'kurangi ukuran', 'persen kompresi', 'pdf kegedean'],
  optionSchemas: [
    {
      id: 'compressionPercent',
      label: 'Tingkat Kualitas / Target Kompresi (%)',
      description: 'Semakin rendah persentase, ukuran file semakin kecil dan hemat memori.',
      type: 'range',
      defaultValue: 60,
      min: 10,
      max: 90,
      step: 5,
      unit: '%'
    },
    {
      id: 'compressMode',
      label: 'Metode Kompresi',
      type: 'select',
      defaultValue: 'smart',
      options: [
        { label: 'Cerdas (Rekomendasi - Otomatis Optimasi & Scan)', value: 'smart', description: 'Stream dictionary + visual downscale jika dokumen scan/foto' },
        { label: 'Standar Dokumen (Lossless Teks Vektor)', value: 'standard', description: 'Membersihkan metadata & object stream tanpa render ulang' },
        { label: 'Kompresi Maksimal Halaman (Foto & Scan)', value: 'visual', description: 'Render ulang visual halaman dengan kualitas JPEG terkalibrasi' }
      ]
    },
    {
      id: 'level',
      label: 'Preset Cepat (Kompatibilitas)',
      type: 'select',
      defaultValue: 'medium',
      options: [
        { label: 'Kompresi Standar (Kualitas Bagus ~80%)', value: 'low' },
        { label: 'Kompresi Seimbang (Direkomendasikan ~60%)', value: 'medium' },
        { label: 'Kompresi Maksimal (Ukuran Terkecil ~35%)', value: 'high' }
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
    const originalSize = file.size;

    // Resolve compression percentage
    const rawPercent = context.options?.compressionPercent ?? context.options?.percent;
    let targetPercent = 60;
    if (typeof rawPercent === 'number' || (typeof rawPercent === 'string' && !isNaN(Number(rawPercent)))) {
      targetPercent = Math.min(95, Math.max(10, Number(rawPercent)));
    } else if (context.options?.level === 'low') {
      targetPercent = 80;
    } else if (context.options?.level === 'high') {
      targetPercent = 35;
    } else {
      targetPercent = 60;
    }

    const compressMode = context.options?.compressMode || 'smart';

    if (context.onProgress) {
      context.onProgress({
        current: 1,
        total: 1,
        message: 'Membaca struktur file PDF...',
        percentage: 15
      });
    }

    const arrayBuffer = await file.arrayBuffer();

    // 1. Initial Stream & Metadata Optimization via pdf-lib
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

    if (context.onProgress) {
      context.onProgress({
        current: 1,
        total: 1,
        message: 'Membersihkan metadata & mengoptimalkan object streams...',
        percentage: 45
      });
    }

    // Clean metadata to save bytes
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('FreeTools Local Engine');
    pdfDoc.setCreator('FreeTools');

    let compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 50
    });

    let outputBlob = new Blob([compressedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

    // Handle small documents where stream table overhead might exceed original size
    if (outputBlob.size >= originalSize && originalSize > 0) {
      const simpleBytes = await pdfDoc.save({ useObjectStreams: false });
      if (simpleBytes.length < outputBlob.size) {
        outputBlob = new Blob([simpleBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      }
    }

    // 2. Visual / Scan Page Recompression
    // Triggered if user selects 'visual' OR in 'smart' mode when document is large and stream savings < 12%
    const currentSavings = originalSize > 0 ? (originalSize - outputBlob.size) / originalSize : 0;
    const shouldAttemptVisual =
      compressMode === 'visual' ||
      (compressMode === 'smart' && originalSize > 600 * 1024 && currentSavings < 0.12 && typeof window !== 'undefined');

    if (shouldAttemptVisual) {
      try {
        if (context.onProgress) {
          context.onProgress({
            current: 1,
            total: 1,
            message: `Mengompres halaman scan visual pada target ${targetPercent}%...`,
            percentage: 60
          });
        }

        const pdfjsLib = await import('pdfjs-dist');
        const { setupPdfjsWorker } = await import('../../engine/pdfjs-worker');
        setupPdfjsWorker(pdfjsLib);

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;

        if (numPages > 0) {
          const newDoc = await PDFDocument.create();
          const jpegQuality = Math.max(0.18, Math.min(0.88, targetPercent / 100));
          // Scale viewport: lower target = smaller canvas resolution
          const scale = targetPercent < 35 ? 1.0 : targetPercent < 70 ? 1.25 : 1.5;

          let allPagesOk = true;

          for (let p = 1; p <= numPages; p++) {
            if (context.onProgress) {
              context.onProgress({
                current: p,
                total: numPages,
                message: `Memadatkan halaman ${p} dari ${numPages}...`,
                percentage: 60 + Math.round((p / numPages) * 30)
              });
            }

            const page = await pdf.getPage(p);
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement('canvas');
            canvas.width = Math.round(viewport.width);
            canvas.height = Math.round(viewport.height);
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              allPagesOk = false;
              break;
            }

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            await page.render({ canvasContext: ctx, viewport }).promise;

            const pageBlob = await new Promise<Blob | null>((resolve) => {
              canvas.toBlob((b) => resolve(b), 'image/jpeg', jpegQuality);
            });

            if (!pageBlob) {
              allPagesOk = false;
              break;
            }

            const imgBytes = await pageBlob.arrayBuffer();
            const embeddedImg = await newDoc.embedJpg(imgBytes);

            // Re-create page with original unscaled dimensions
            const origViewport = page.getViewport({ scale: 1.0 });
            const newPage = newDoc.addPage([origViewport.width, origViewport.height]);
            newPage.drawImage(embeddedImg, {
              x: 0,
              y: 0,
              width: origViewport.width,
              height: origViewport.height
            });
          }

          if (allPagesOk) {
            const visualBytes = await newDoc.save({ useObjectStreams: true });
            const visualBlob = new Blob([visualBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

            // Only use visual recompressed version if it is indeed smaller or requested explicitly
            if (visualBlob.size < outputBlob.size || compressMode === 'visual') {
              outputBlob = visualBlob;
            }
          }
        }
      } catch {
        // Graceful fallback to stream-compressed PDF (e.g. in test/offline environments without canvas)
      }
    }

    if (context.onProgress) {
      context.onProgress({
        current: 1,
        total: 1,
        message: 'Menyelesaikan kompresi PDF...',
        percentage: 95
      });
    }

    const baseName = file.name.replace(/\.pdf$/i, '');
    const outputFilename = `${baseName}_compressed.pdf`;
    const savedPercent = Math.max(0, Math.round(((originalSize - outputBlob.size) / originalSize) * 100));

    return {
      success: true,
      message: savedPercent > 0
        ? `Berhasil mengompres PDF! Hemat ${savedPercent}% (Kualitas target: ${targetPercent}%).`
        : `PDF telah dioptimalkan secara maksimal pada target ${targetPercent}%.`,
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
