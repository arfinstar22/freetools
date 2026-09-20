import { describe, it, expect } from 'vitest';
import { compressPdfTool } from '../tools/pdf/compress-pdf';
import { imageCompressTool } from '../tools/image/image-compress';
import { imageConvertTool } from '../tools/image/image-convert';
import { encodeBmp, encodeIco, encodeTiff, encodeSvg } from '../utils/image-encoders';
import { PDFDocument } from 'pdf-lib';

describe('Enhanced Professional Tools Audit (PDF & Image & Encoders)', () => {
  // Helper to generate a test PDF
  const createTestPdf = async (pageCount = 1, name = 'test.pdf') => {
    const doc = await PDFDocument.create();
    for (let i = 0; i < pageCount; i++) {
      const page = doc.addPage([300, 300]);
      page.drawText(`Page content ${i + 1}`, { x: 50, y: 150 });
    }
    const bytes = await doc.save();
    return new File([bytes.buffer as ArrayBuffer], name, { type: 'application/pdf' });
  };

  // Helper to generate a canvas that works even in headless JSDOM
  const createTestCanvas = (width = 16, height = 16) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const mockData = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < mockData.length; i += 4) {
      mockData[i] = 16;     // R
      mockData[i + 1] = 185;// G
      mockData[i + 2] = 129;// B
      mockData[i + 3] = 255;// A
    }

    const mockCtx = {
      getImageData: () => ({ data: mockData, width, height }),
      drawImage: () => {},
      fillRect: () => {},
      clearRect: () => {}
    };

    canvas.getContext = (() => mockCtx) as any;
    canvas.toBlob = ((callback: (blob: Blob | null) => void) => {
      // Return a minimal valid dummy PNG blob for ICO stream test
      callback(new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13])], { type: 'image/png' }));
    }) as any;
    canvas.toDataURL = (() => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==') as any;

    return canvas;
  };

  // ---------------------------------------------------------------------------
  // 1. COMPRESS PDF
  // ---------------------------------------------------------------------------
  describe('1. Enhanced Compress PDF Tool', () => {
    it('has compressionPercent slider schema and compressMode options', () => {
      const percentSchema = compressPdfTool.optionSchemas?.find((s) => s.id === 'compressionPercent');
      expect(percentSchema).toBeDefined();
      expect(percentSchema?.type).toBe('range');
      expect(percentSchema?.min).toBe(10);
      expect(percentSchema?.max).toBe(90);
      expect(percentSchema?.unit).toBe('%');

      const modeSchema = compressPdfTool.optionSchemas?.find((s) => s.id === 'compressMode');
      expect(modeSchema).toBeDefined();
      expect(modeSchema?.options?.some((o) => o.value === 'smart')).toBe(true);
      expect(modeSchema?.options?.some((o) => o.value === 'standard')).toBe(true);
      expect(modeSchema?.options?.some((o) => o.value === 'visual')).toBe(true);
    });

    it('compresses PDF with custom percentage (40%)', async () => {
      const file = await createTestPdf(2, 'skripsi.pdf');
      const res = await compressPdfTool.process({
        files: [file],
        options: { compressionPercent: 40, compressMode: 'standard' }
      });

      expect(res.success).toBe(true);
      expect(res.items.length).toBe(1);
      expect(res.items[0].blob).toBeInstanceOf(Blob);
      expect(res.items[0].type).toBe('application/pdf');
      expect(res.downloadName).toBe('skripsi_compressed.pdf');
    });

    it('compresses PDF with backward-compatible level option (low/high)', async () => {
      const file = await createTestPdf(1, 'dokumen.pdf');
      const res = await compressPdfTool.process({
        files: [file],
        options: { level: 'high' }
      });

      expect(res.success).toBe(true);
      expect(res.items[0].blob).toBeInstanceOf(Blob);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. COMPRESS IMAGE
  // ---------------------------------------------------------------------------
  describe('2. Enhanced Image Compress Tool', () => {
    it('has qualityPercent range schema', () => {
      const percentSchema = imageCompressTool.optionSchemas?.find((s) => s.id === 'qualityPercent');
      expect(percentSchema).toBeDefined();
      expect(percentSchema?.type).toBe('range');
      expect(percentSchema?.min).toBe(10);
      expect(percentSchema?.max).toBe(95);
      expect(percentSchema?.unit).toBe('%');
    });

    it('maintains qualityPreset option for preset compatibility', () => {
      const presetSchema = imageCompressTool.optionSchemas?.find((s) => s.id === 'qualityPreset');
      expect(presetSchema).toBeDefined();
      expect(presetSchema?.defaultValue).toBe('balanced');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. CONVERT IMAGE
  // ---------------------------------------------------------------------------
  describe('3. Enhanced Image Convert Tool with 9 Formats', () => {
    it('supports all 9 target formats', () => {
      const formatSchema = imageConvertTool.optionSchemas?.find((s) => s.id === 'targetFormat');
      expect(formatSchema).toBeDefined();

      const expectedFormats = [
        'image/webp',
        'image/jpeg',
        'image/png',
        'image/avif',
        'image/bmp',
        'image/x-icon',
        'image/gif',
        'image/tiff',
        'image/svg+xml'
      ];

      for (const fmt of expectedFormats) {
        expect(formatSchema?.options?.some((o) => o.value === fmt)).toBe(true);
      }
    });

    it('supports icoSize options for Favicon generator', () => {
      const icoSchema = imageConvertTool.optionSchemas?.find((s) => s.id === 'icoSize');
      expect(icoSchema).toBeDefined();
      expect(icoSchema?.options?.some((o) => o.value === '32')).toBe(true);
      expect(icoSchema?.options?.some((o) => o.value === '16')).toBe(true);
      expect(icoSchema?.options?.some((o) => o.value === '48')).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. CLIENT-SIDE IMAGE ENCODERS (BMP, ICO, TIFF, SVG)
  // ---------------------------------------------------------------------------
  describe('4. Zero-Dependency Pure Image Encoders', () => {
    it('encodeBmp: generates a valid 24-bit Windows BMP with correct magic header', async () => {
      const canvas = createTestCanvas(16, 16);
      const bmpBlob = encodeBmp(canvas);

      expect(bmpBlob).toBeInstanceOf(Blob);
      expect(bmpBlob.type).toBe('image/bmp');

      const buf = await bmpBlob.arrayBuffer();
      const view = new DataView(buf);
      // 'BM' header: 0x42, 0x4D
      expect(view.getUint8(0)).toBe(0x42);
      expect(view.getUint8(1)).toBe(0x4d);
      // Width and Height in DIB header
      expect(view.getInt32(18, true)).toBe(16);
      expect(view.getInt32(22, true)).toBe(16);
      // Bit count = 24
      expect(view.getUint16(28, true)).toBe(24);
    });

    it('encodeIco: generates a valid Windows ICO / Favicon with correct icon header', async () => {
      const canvas = createTestCanvas(32, 32);
      const icoBlob = await encodeIco(canvas, 32);

      expect(icoBlob).toBeInstanceOf(Blob);
      expect(icoBlob.type).toBe('image/x-icon');

      const buf = await icoBlob.arrayBuffer();
      const view = new DataView(buf);
      // Header: 00 00 01 00 (type 1 = icon)
      expect(view.getUint16(0, true)).toBe(0);
      expect(view.getUint16(2, true)).toBe(1);
      expect(view.getUint16(4, true)).toBe(1); // 1 image
      // Dir entry width & height
      expect(view.getUint8(6)).toBe(32);
      expect(view.getUint8(7)).toBe(32);
    });

    it('encodeTiff: generates a valid Little-Endian RGB TIFF with magic 42', async () => {
      const canvas = createTestCanvas(8, 8);
      const tiffBlob = encodeTiff(canvas);

      expect(tiffBlob).toBeInstanceOf(Blob);
      expect(tiffBlob.type).toBe('image/tiff');

      const buf = await tiffBlob.arrayBuffer();
      const view = new DataView(buf);
      // 'II' Little Endian
      expect(view.getUint8(0)).toBe(0x49);
      expect(view.getUint8(1)).toBe(0x49);
      // Magic 42
      expect(view.getUint16(2, true)).toBe(42);
    });

    it('encodeSvg: generates a valid SVG XML container wrapping the image', async () => {
      const canvas = createTestCanvas(64, 64);
      const svgBlob = encodeSvg(canvas);

      expect(svgBlob).toBeInstanceOf(Blob);
      expect(svgBlob.type).toContain('image/svg+xml');

      const text = await svgBlob.text();
      expect(text).toContain('<svg');
      expect(text).toContain('width="64"');
      expect(text).toContain('height="64"');
      expect(text).toContain('<image');
      expect(text).toContain('</svg>');
    });
  });
});
