import { describe, it, expect } from 'vitest';
import { imageCompressTool } from '../tools/image/image-compress';
import { imageResizeTool } from '../tools/image/image-resize';
import { imageConvertTool } from '../tools/image/image-convert';
import { removeMetadataTool } from '../tools/image/remove-metadata';
import { batchImageProcessorTool } from '../tools/image/batch-image-processor';

describe('Image Tools Audit & Verification (Task 2)', () => {
  // -------------------------------------------------------------
  // 1. IMAGE-COMPRESS
  // -------------------------------------------------------------
  describe('1. Image-compress', () => {
    it('empty input: rejects when 0 files provided', async () => {
      await expect(imageCompressTool.process({ files: [] })).rejects.toThrow(/pilih minimal 1 gambar/i);
    });

    it('non-image / corrupt file: rejects non-image files with clear error message', async () => {
      const nonImage = new File(['text binary'], 'data.txt', { type: 'text/plain' });
      await expect(imageCompressTool.process({ files: [nonImage] })).rejects.toThrow(/gagal memproses semua gambar/i);
    });

    it('definition: has valid options and supports batch and workflow', () => {
      expect(imageCompressTool.category).toBe('image');
      expect(imageCompressTool.supportsBatch).toBe(true);
      expect(imageCompressTool.supportsWorkflow).toBe(true);
      expect(imageCompressTool.optionSchemas?.some((s) => s.id === 'qualityPreset')).toBe(true);
    });
  });

  // -------------------------------------------------------------
  // 2. IMAGE-RESIZE
  // -------------------------------------------------------------
  describe('2. Image-resize', () => {
    it('empty input: rejects when 0 files provided', async () => {
      await expect(imageResizeTool.process({ files: [] })).rejects.toThrow(/pilih minimal 1 gambar/i);
    });

    it('non-image file: skips non-image files and throws if all fail', async () => {
      const nonImage = new File(['text'], 'readme.md', { type: 'text/markdown' });
      await expect(imageResizeTool.process({ files: [nonImage] })).rejects.toThrow(/gagal memproses semua gambar/i);
    });

    it('definition: supports percentage and max_pixel mode options', () => {
      expect(imageResizeTool.category).toBe('image');
      expect(imageResizeTool.optionSchemas?.some((s) => s.id === 'mode')).toBe(true);
      expect(imageResizeTool.optionSchemas?.some((s) => s.id === 'scalePercent')).toBe(true);
      expect(imageResizeTool.optionSchemas?.some((s) => s.id === 'maxDimension')).toBe(true);
    });
  });

  // -------------------------------------------------------------
  // 3. IMAGE-CONVERT
  // -------------------------------------------------------------
  describe('3. Image-convert', () => {
    it('empty input: rejects when 0 files provided', async () => {
      await expect(imageConvertTool.process({ files: [] })).rejects.toThrow(/pilih minimal 1 gambar/i);
    });

    it('non-image input: throws when non-image files provided', async () => {
      const nonImage = new File(['12345'], 'archive.zip', { type: 'application/zip' });
      await expect(imageConvertTool.process({ files: [nonImage] })).rejects.toThrow(/gagal mengonversi semua gambar/i);
    });

    it('definition: offers target format options (webp, jpeg, png)', () => {
      expect(imageConvertTool.category).toBe('image');
      const targetFormatSchema = imageConvertTool.optionSchemas?.find((s) => s.id === 'targetFormat');
      expect(targetFormatSchema).toBeDefined();
      expect(targetFormatSchema?.options?.some((o) => o.value === 'image/webp')).toBe(true);
      expect(targetFormatSchema?.options?.some((o) => o.value === 'image/jpeg')).toBe(true);
      expect(targetFormatSchema?.options?.some((o) => o.value === 'image/png')).toBe(true);
    });
  });

  // -------------------------------------------------------------
  // 4. REMOVE-METADATA
  // -------------------------------------------------------------
  describe('4. Remove-metadata', () => {
    it('empty input: rejects when 0 files provided', async () => {
      await expect(removeMetadataTool.process({ files: [] })).rejects.toThrow(/pilih minimal 1 gambar/i);
    });

    it('corrupt input: throws clean error when processing invalid files', async () => {
      const corrupt = new File(['not an image'], 'corrupt.jpg', { type: 'text/plain' });
      await expect(removeMetadataTool.process({ files: [corrupt] })).rejects.toThrow(/gagal membersihkan semua gambar/i);
    });

    it('definition: offers quality options', () => {
      expect(removeMetadataTool.category).toBe('image');
      expect(removeMetadataTool.optionSchemas?.some((s) => s.id === 'preserveQuality')).toBe(true);
    });
  });

  // -------------------------------------------------------------
  // 5. BATCH-IMAGE-PROCESSOR
  // -------------------------------------------------------------
  describe('5. Batch-image-processor', () => {
    it('empty input: rejects when 0 files provided', async () => {
      await expect(batchImageProcessorTool.process({ files: [] })).rejects.toThrow(/pilih minimal 1 gambar/i);
    });

    it('non-image batch: rejects when all files in batch are non-image', async () => {
      const f1 = new File(['text 1'], 'file1.txt', { type: 'text/plain' });
      const f2 = new File(['text 2'], 'file2.txt', { type: 'text/plain' });
      await expect(batchImageProcessorTool.process({ files: [f1, f2] })).rejects.toThrow(/gagal memproses semua gambar/i);
    });

    it('definition: supports rename prefix, max dimensions, and quality options', () => {
      expect(batchImageProcessorTool.category).toBe('image');
      expect(batchImageProcessorTool.supportsBatch).toBe(true);
      expect(batchImageProcessorTool.supportsWorkflow).toBe(true);
      expect(batchImageProcessorTool.optionSchemas?.some((s) => s.id === 'namePrefix')).toBe(true);
      expect(batchImageProcessorTool.optionSchemas?.some((s) => s.id === 'maxDimension')).toBe(true);
      expect(batchImageProcessorTool.optionSchemas?.some((s) => s.id === 'quality')).toBe(true);
    });
  });
});
