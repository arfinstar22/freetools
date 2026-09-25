import { describe, it, expect } from 'vitest';
import {
  ALL_TOOLS,
  CATEGORIES,
  getToolById,
  getToolsByCategory,
  getPopularTools,
  searchTools
} from '../engine/registry';
import { ToolCategory, ToolInputMode } from '../types/tool';

describe('Tool Registry & Integration Audit (Task 5)', () => {
  const validCategories: ToolCategory[] = ['pdf', 'image', 'text', 'developer', 'office'];
  const validInputModes: ToolInputMode[] = ['file', 'multi-file', 'text', 'form', 'none'];

  it('Total tools count: exactly 29 tools are registered in ALL_TOOLS', () => {
    expect(ALL_TOOLS.length).toBe(29);
  });

  it('Unique Tool IDs: no duplicate tool IDs exist in the registry', () => {
    const idSet = new Set<string>();
    for (const tool of ALL_TOOLS) {
      expect(tool.id).toBeTruthy();
      expect(typeof tool.id).toBe('string');
      expect(idSet.has(tool.id)).toBe(false);
      idSet.add(tool.id);
    }
    expect(idSet.size).toBe(29);
  });

  it('Tool Metadata Validation: all tools have valid names, descriptions, icons, and process functions', () => {
    for (const tool of ALL_TOOLS) {
      expect(tool.name).toBeTruthy();
      expect(tool.name.trim().length).toBeGreaterThan(0);

      expect(tool.shortDescription).toBeTruthy();
      expect(tool.shortDescription.trim().length).toBeGreaterThan(0);

      expect(tool.description).toBeTruthy();
      expect(tool.description.trim().length).toBeGreaterThan(0);

      expect(tool.icon).toBeTruthy();
      expect(typeof tool.icon).toBe('string');

      expect(validCategories).toContain(tool.category);
      expect(validInputModes).toContain(tool.inputMode);

      expect(typeof tool.process).toBe('function');
      expect(tool.localProcessing).toBe(true);
      expect(Array.isArray(tool.keywords)).toBe(true);
      expect(tool.keywords.length).toBeGreaterThan(0);
    }
  });

  it('Tool Lookup by ID: every single registered tool can be found by getToolById()', () => {
    for (const tool of ALL_TOOLS) {
      const found = getToolById(tool.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(tool.id);
      expect(found?.name).toBe(tool.name);
    }
  });

  it('Tool Lookup Edge Case: non-existent ID returns undefined without error', () => {
    expect(getToolById('non-existent-tool-id-xyz')).toBeUndefined();
    expect(getToolById('')).toBeUndefined();
  });

  it('Category Structure: all 5 categories defined with non-empty labels and icons', () => {
    expect(CATEGORIES.length).toBe(5);
    const categoryIds = CATEGORIES.map((c) => c.id);
    expect(categoryIds).toEqual(['pdf', 'image', 'text', 'developer', 'office']);

    for (const cat of CATEGORIES) {
      expect(cat.label).toBeTruthy();
      expect(cat.icon).toBeTruthy();
      expect(cat.description).toBeTruthy();
    }
  });

  it('Category Filtering: getToolsByCategory returns correct tool subset for every category', () => {
    const pdfTools = getToolsByCategory('pdf');
    expect(pdfTools.length).toBe(5);
    expect(pdfTools.every((t) => t.category === 'pdf')).toBe(true);

    const imageTools = getToolsByCategory('image');
    expect(imageTools.length).toBe(7);
    expect(imageTools.every((t) => t.category === 'image')).toBe(true);

    const textTools = getToolsByCategory('text');
    expect(textTools.length).toBe(6);
    expect(textTools.every((t) => t.category === 'text')).toBe(true);

    const devTools = getToolsByCategory('developer');
    expect(devTools.length).toBe(6);
    expect(devTools.every((t) => t.category === 'developer')).toBe(true);

    const officeTools = getToolsByCategory('office');
    expect(officeTools.length).toBe(5);
    expect(officeTools.every((t) => t.category === 'office')).toBe(true);
  });

  it('Popular Tools: getPopularTools returns only tools flagged as popular', () => {
    const popular = getPopularTools();
    expect(popular.length).toBeGreaterThan(0);
    expect(popular.every((t) => t.popular === true)).toBe(true);
  });

  it('Search Tools: searchTools finds tools by keyword, name, and description query', () => {
    const searchPdf = searchTools('pdf');
    expect(searchPdf.length).toBeGreaterThanOrEqual(5);

    const searchJpg = searchTools('jpg');
    expect(searchJpg.length).toBeGreaterThanOrEqual(3);

    const searchJson = searchTools('json');
    expect(searchJson.some((t) => t.id === 'json-formatter')).toBe(true);

    const searchEmpty = searchTools('');
    expect(searchEmpty.length).toBe(29);
  });

  it('Option Schemas: optionSchemas when defined are valid and have defaultValue', () => {
    for (const tool of ALL_TOOLS) {
      if (tool.optionSchemas && tool.optionSchemas.length > 0) {
        for (const schema of tool.optionSchemas) {
          expect(schema.id).toBeTruthy();
          expect(schema.label).toBeTruthy();
          expect(['select', 'range', 'boolean', 'text', 'number', 'textarea']).toContain(schema.type);
          expect(schema.defaultValue).toBeDefined();

          if (schema.type === 'select') {
            expect(Array.isArray(schema.options)).toBe(true);
            expect(schema.options!.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });
});
