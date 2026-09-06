import { describe, it, expect } from 'vitest';
import { compressPdfTool } from '../tools/pdf/compress-pdf';
import { mergePdfTool } from '../tools/pdf/merge-pdf';
import { splitPdfTool } from '../tools/pdf/split-pdf';
import { jpgToPdfTool } from '../tools/pdf/jpg-to-pdf';
import { pdfToJpgTool } from '../tools/pdf/pdf-to-jpg';
import { PDFDocument } from 'pdf-lib';

describe('PDF Tools Audit & Verification (Task 1)', () => {
  // Helper to generate a valid PDF File in memory
  const createTestPdf = async (pageCount = 1, name = 'test.pdf') => {
    const doc = await PDFDocument.create();
    for (let i = 0; i < pageCount; i++) {
      const page = doc.addPage([200, 200]);
      page.drawText(`Page ${i + 1}`, { x: 50, y: 100 });
    }
    const bytes = await doc.save();
    return new File([bytes.buffer as ArrayBuffer], name, { type: 'application/pdf' });
  };

  // -------------------------------------------------------------
  // 1. COMPRESS-PDF
  // -------------------------------------------------------------
  describe('1. Compress-pdf', () => {
    it('valid PDF: successfully compresses and returns a valid PDF blob', async () => {
      const file = await createTestPdf(2, 'laporan.pdf');
      const res = await compressPdfTool.process({
        files: [file],
        options: { level: 'medium' }
      });
      expect(res.success).toBe(true);
      expect(res.items[0].blob).toBeInstanceOf(Blob);
      expect(res.items[0].type).toBe('application/pdf');
      expect(res.downloadName).toBe('laporan_compressed.pdf');
    });

    it('0 file: throws clear error message', async () => {
      await expect(compressPdfTool.process({ files: [] })).rejects.toThrow(/pilih minimal 1 file pdf/i);
    });

    it('corrupt PDF: throws error without unhandled crash', async () => {
      const corrupt = new File(['CORRUPT_NON_PDF_BINARY'], 'corrupt.pdf', { type: 'application/pdf' });
      await expect(compressPdfTool.process({ files: [corrupt] })).rejects.toThrow();
    });
  });

  // -------------------------------------------------------------
  // 2. MERGE-PDF
  // -------------------------------------------------------------
  describe('2. Merge-pdf', () => {
    it('2 PDF valid: merges 2 PDF files into 1 PDF with custom output name', async () => {
      const f1 = await createTestPdf(1, 'part1.pdf');
      const f2 = await createTestPdf(2, 'part2.pdf');
      const res = await mergePdfTool.process({
        files: [f1, f2],
        options: { outputFilename: 'hasil_gabungan' }
      });
      expect(res.success).toBe(true);
      expect(res.items.length).toBe(1);
      expect(res.downloadName).toBe('hasil_gabungan.pdf');

      // Verify merged page count = 1 + 2 = 3
      const mergedBytes = await res.items[0].blob!.arrayBuffer();
      const mergedDoc = await PDFDocument.load(mergedBytes);
      expect(mergedDoc.getPageCount()).toBe(3);
    });

    it('kurang dari 2 PDF: throws error when only 1 file is selected', async () => {
      const f1 = await createTestPdf(1, 'single.pdf');
      await expect(mergePdfTool.process({ files: [f1] })).rejects.toThrow(/minimal 2 file pdf/i);
    });

    it('PDF corrupt: throws error when one of the merging files is corrupt', async () => {
      const f1 = await createTestPdf(1, 'good.pdf');
      const f2 = new File(['CORRUPT_BYTES'], 'bad.pdf', { type: 'application/pdf' });
      await expect(mergePdfTool.process({ files: [f1, f2] })).rejects.toThrow();
    });
  });

  // -------------------------------------------------------------
  // 3. SPLIT-PDF
  // -------------------------------------------------------------
  describe('3. Split-pdf', () => {
    it('PDF multi-page valid: splits all pages into individual files in ZIP', async () => {
      const multi = await createTestPdf(3, 'skripsi.pdf');
      const res = await splitPdfTool.process({
        files: [multi],
        options: { splitMode: 'all_pages' }
      });
      expect(res.success).toBe(true);
      expect(res.downloadName).toBe('skripsi_pisah.zip');
      // Main zip item + 3 individual page items
      expect(res.items.length).toBe(4);
    });

    it('custom page range: extracts only the requested pages (e.g. page 1-2)', async () => {
      const multi = await createTestPdf(4, 'dokumen.pdf');
      const res = await splitPdfTool.process({
        files: [multi],
        options: { splitMode: 'custom_range', pageRange: '1-2' }
      });
      expect(res.success).toBe(true);
      expect(res.downloadName).toBe('dokumen_ekstrak.pdf');
      const extractedBytes = await res.items[0].blob!.arrayBuffer();
      const extractedDoc = await PDFDocument.load(extractedBytes);
      expect(extractedDoc.getPageCount()).toBe(2);
    });

    it('page range di luar batas: throws error when range exceeds total pages', async () => {
      const multi = await createTestPdf(2, 'doc.pdf');
      await expect(splitPdfTool.process({
        files: [multi],
        options: { splitMode: 'custom_range', pageRange: '99-100' }
      })).rejects.toThrow(/rentang halaman tidak valid/i);
    });

    it('PDF corrupt: throws error when splitting corrupt file', async () => {
      const corrupt = new File(['INVALID_PDF_BYTES'], 'broken.pdf', { type: 'application/pdf' });
      await expect(splitPdfTool.process({ files: [corrupt] })).rejects.toThrow();
    });
  });

  // -------------------------------------------------------------
  // 4. JPG-TO-PDF
  // -------------------------------------------------------------
  describe('4. Jpg-to-pdf', () => {
    it('0 image: throws error when 0 files provided', async () => {
      await expect(jpgToPdfTool.process({ files: [] })).rejects.toThrow(/pilih minimal 1 gambar/i);
    });

    it('file bukan image: throws error on non-image file', async () => {
      const fakeText = new File(['text content'], 'not_an_image.txt', { type: 'text/plain' });
      await expect(jpgToPdfTool.process({ files: [fakeText] })).rejects.toThrow();
    });

    it('definition check: accepts jpg, png, webp and supports batch/workflow', () => {
      expect(jpgToPdfTool.acceptedTypes).toContain('image/jpeg');
      expect(jpgToPdfTool.acceptedTypes).toContain('image/png');
      expect(jpgToPdfTool.acceptedTypes).toContain('image/webp');
      expect(jpgToPdfTool.supportsBatch).toBe(true);
      expect(jpgToPdfTool.supportsWorkflow).toBe(true);
    });
  });

  // -------------------------------------------------------------
  // 5. PDF-TO-JPG
  // -------------------------------------------------------------
  describe('5. Pdf-to-jpg', () => {
    it('0 file: throws error when 0 files provided', async () => {
      await expect(pdfToJpgTool.process({ files: [] })).rejects.toThrow(/pilih 1 file pdf/i);
    });

    it('file bukan PDF / PDF corrupt: throws error cleanly', async () => {
      const corrupt = new File(['NOT_A_PDF'], 'bad.pdf', { type: 'application/pdf' });
      await expect(pdfToJpgTool.process({ files: [corrupt] })).rejects.toThrow();
    });

    it('definition check: accepts PDF format and supports workflow', () => {
      expect(pdfToJpgTool.acceptedTypes).toContain('.pdf');
      expect(pdfToJpgTool.acceptedTypes).toContain('application/pdf');
      expect(pdfToJpgTool.supportsWorkflow).toBe(true);
    });
  });
});
