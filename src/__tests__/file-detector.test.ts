import { describe, it, expect } from 'vitest';
import { classifyFile, analyzeFileGroup } from '../engine/file-detector';

describe('File Detector & Analyzer', () => {
  it('should accurately classify PDF files by extension and mime', () => {
    const file = new File(['%PDF-1.4 mock content'], 'laporan.pdf', { type: 'application/pdf' });
    const classified = classifyFile(file);
    expect(classified.category).toBe('pdf');
    expect(classified.extension).toBe('pdf');
  });

  it('should accurately classify Image files', () => {
    const file = new File(['fake image bytes'], 'foto.jpg', { type: 'image/jpeg' });
    const classified = classifyFile(file);
    expect(classified.category).toBe('image');
  });

  it('should group and analyze multiple mixed files without throwing', () => {
    const files = [
      new File(['1'], 'doc1.pdf', { type: 'application/pdf' }),
      new File(['2'], 'doc2.pdf', { type: 'application/pdf' }),
      new File(['3'], 'foto.png', { type: 'image/png' })
    ];

    const group = analyzeFileGroup(files);
    expect(group.totalFiles).toBe(3);
    expect(group.primaryCategory).toBe('pdf');
    expect(group.suggestedActionIds).toContain('merge-pdf');
  });

  it('should safely handle unsupported unknown file extensions', () => {
    const file = new File(['binary'], 'unknown.xyz123', { type: '' });
    const classified = classifyFile(file);
    expect(classified.category).toBe('unknown');

    const group = analyzeFileGroup([file]);
    expect(group.primaryCategory).toBe('unknown');
    expect(group.suggestedActionIds).toContain('zip-pack');
  });
});
