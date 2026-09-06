import { describe, it, expect } from 'vitest';
import { ALL_TOOLS, getToolById, getToolsByCategory, getPopularTools, searchTools } from '../engine/registry';

describe('Tool Registry', () => {
  it('should have all tools registered with valid IDs and definitions', () => {
    expect(ALL_TOOLS.length).toBeGreaterThanOrEqual(25);

    const ids = new Set();
    for (const tool of ALL_TOOLS) {
      expect(tool.id).toBeTruthy();
      expect(ids.has(tool.id)).toBe(false);
      ids.add(tool.id);
      expect(tool.name).toBeTruthy();
      expect(tool.shortDescription).toBeTruthy();
      expect(tool.category).toBeTruthy();
      expect(typeof tool.process).toBe('function');
      expect(tool.localProcessing).toBe(true);
    }
  });

  it('should retrieve tool by ID correctly', () => {
    const compressPdf = getToolById('compress-pdf');
    expect(compressPdf).toBeDefined();
    expect(compressPdf?.id).toBe('compress-pdf');
    expect(compressPdf?.category).toBe('pdf');

    const nonExistent = getToolById('unknown-tool-xyz');
    expect(nonExistent).toBeUndefined();
  });

  it('should filter tools by category', () => {
    const pdfTools = getToolsByCategory('pdf');
    expect(pdfTools.length).toBeGreaterThanOrEqual(5);
    expect(pdfTools.every((t) => t.category === 'pdf')).toBe(true);

    const devTools = getToolsByCategory('developer');
    expect(devTools.length).toBeGreaterThanOrEqual(6);
    expect(devTools.every((t) => t.category === 'developer')).toBe(true);
  });

  it('should filter popular tools', () => {
    const popular = getPopularTools();
    expect(popular.length).toBeGreaterThan(0);
    expect(popular.every((t) => t.popular)).toBe(true);
  });

  it('should search tools by keywords and name', () => {
    const searchPdf = searchTools('pdf');
    expect(searchPdf.some((t) => t.id === 'compress-pdf')).toBe(true);

    const searchJson = searchTools('json');
    expect(searchJson.some((t) => t.id === 'json-formatter')).toBe(true);
  });
});
