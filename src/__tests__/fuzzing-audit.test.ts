import { describe, it, expect } from 'vitest';
import { jsonFormatterTool } from '../tools/developer/json-formatter';
import { csvJsonConverterTool } from '../tools/office/csv-json-converter';
import { expenseSplitterTool } from '../tools/office/expense-splitter';
import { randomGroupTool } from '../tools/office/random-group';
import { caseConverterTool } from '../tools/text/case-converter';
import { wordCounterTool } from '../tools/text/word-counter';
import { textCleanerTool } from '../tools/text/text-cleaner';
import { removeDuplicatesTool } from '../tools/text/remove-duplicates';
import { findReplaceTool } from '../tools/text/find-replace';
import { timestampConverterTool } from '../tools/developer/timestamp-converter';

describe('Production Input Fuzzing & Boundary Values (Task 7)', () => {
  // 1. Numeric Fuzzing
  describe('Numeric Fuzzing', () => {
    it('expense-splitter: fuzzes abnormal numbers (NaN, Infinity, -Infinity, negative, scientific notation)', async () => {
      const abnormalBills = [NaN, Infinity, -Infinity, -50000, 0, 0.00001, 1e7, 'invalid'];

      for (const bill of abnormalBills) {
        const res = await expenseSplitterTool.process({
          options: {
            totalBill: bill as any,
            taxPercent: 10,
            memberNames: 'Andi, Budi'
          }
        });
        expect(res.success).toBe(true);
        expect(res.items[0].metadata?.grandTotal).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(res.items[0].metadata?.grandTotal)).toBe(true);
      }
    });

    it('random-group: handles invalid groupCount (NaN, negative, float, zero)', async () => {
      const names = 'Andi\nBudi\nCitra\nDedi';
      const abnormalCounts = [NaN, -1, 0, 1.5, 'invalid'];

      for (const gc of abnormalCounts) {
        const res = await randomGroupTool.process({
          textInput: names,
          options: { groupCount: gc as any }
        });
        expect(res.success).toBe(true);
        expect(res.items[0].textOutput).toContain('KELOMPOK 1');
      }
    });

    it('timestamp-converter: handles boundary timestamp numbers without throw', async () => {
      const timestamps = ['0', '-1', '2147483647', '-2147483648', '253402300799', '-62135596800'];
      for (const ts of timestamps) {
        const res = await timestampConverterTool.process({
          textInput: ts,
          options: { mode: 'epoch_to_date' }
        });
        expect(res.success).toBe(true);
        expect(res.items[0].textOutput).toContain('Waktu Lokal Indonesia');
      }
    });
  });

  // 2. Text Fuzzing
  describe('Text Fuzzing', () => {
    it('text tools: withstands RTL text, emojis, null-byte strings, and 100k length strings', async () => {
      const rtlText = 'مرحبا بالعالم! FreeTools 🚀 \u0000\u0001\u0002';
      const hugeText = 'kata '.repeat(20000);

      // Word counter
      const wcRtl = await wordCounterTool.process({ textInput: rtlText });
      expect(wcRtl.success).toBe(true);
      const wcHuge = await wordCounterTool.process({ textInput: hugeText });
      expect(wcHuge.success).toBe(true);

      // Text cleaner
      const tcRtl = await textCleanerTool.process({ textInput: rtlText });
      expect(tcRtl.success).toBe(true);

      // Case converter
      const ccRtl = await caseConverterTool.process({ textInput: rtlText, options: { targetCase: 'upper' } });
      expect(ccRtl.success).toBe(true);

      // Remove duplicates
      const rdRtl = await removeDuplicatesTool.process({ textInput: `${rtlText}\n${rtlText}` });
      expect(rdRtl.success).toBe(true);
      expect(rdRtl.items[0].textOutput).toBe(rtlText);

      // Find replace
      const frRtl = await findReplaceTool.process({ textInput: rtlText, options: { findText: 'FreeTools', replaceText: 'Utility' } });
      expect(frRtl.success).toBe(true);
      expect(frRtl.items[0].textOutput).toContain('Utility');
    });
  });

  // 3. JSON & CSV Fuzzing
  describe('JSON & CSV Fuzzing', () => {
    it('json-formatter: handles deeply nested objects (depth 10) and arrays safely', async () => {
      let nested: any = { leaf: 'value' };
      for (let i = 0; i < 10; i++) {
        nested = { depth: i, next: nested };
      }

      const raw = JSON.stringify(nested);
      const res = await jsonFormatterTool.process({ textInput: raw, options: { sortKeys: true } });
      expect(res.success).toBe(true);
      expect(res.items[0].textOutput).toContain('"leaf": "value"');
    });

    it('csv-json-converter: handles embedded commas, semicolons, tabs, and quotes in CSV cells', async () => {
      const complexCsv = 'id,data,notes\n1,"Value with, comma; and ""quoted"" word","Line with\nembedded newline"\n2,Simple,Standard';
      const res = await csvJsonConverterTool.process({ textInput: complexCsv, options: { mode: 'csv_to_json', delimiter: ',' } });
      expect(res.success).toBe(true);
      const parsed = JSON.parse(res.items[0].textOutput!);
      expect(parsed.length).toBe(2);
      expect(parsed[0].data).toBe('Value with, comma; and "quoted" word');
    });
  });
});
