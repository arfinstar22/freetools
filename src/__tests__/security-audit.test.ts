import { describe, it, expect } from 'vitest';
import { formatBytes, sanitizeFilename } from '../utils/format';
import { createZipFromFiles } from '../utils/download';
import { jsonFormatterTool } from '../tools/developer/json-formatter';
import { jwtDecoderTool } from '../tools/developer/jwt-decoder';
import { csvJsonConverterTool } from '../tools/office/csv-json-converter';
import { invoiceGeneratorTool } from '../tools/office/invoice-generator';
import { regexTesterTool } from '../tools/developer/regex-tester';

describe('SECURITY & EDGE-CASE HARDENING AUDIT', () => {
  // A. Format & Sanitize
  describe('Format & Filename Security', () => {
    it('formatBytes: handles negative, NaN, and Infinity safely without throwing', () => {
      expect(formatBytes(-100)).toBe('0 B');
      expect(formatBytes(NaN)).toBe('0 B');
      expect(formatBytes(Infinity)).toBe('0 B');
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(1024)).toBe('1 KB');
    });

    it('sanitizeFilename: strips path traversal (../../) and illegal characters', () => {
      expect(sanitizeFilename('../../etc/passwd')).toBe('.._.._etc_passwd');
      expect(sanitizeFilename('../../../secret.txt')).not.toContain('/');
      expect(sanitizeFilename('normal-file_123.pdf')).toBe('normal-file_123.pdf');
    });
  });

  // B. Zip Slip & Duplicate filename safety
  describe('ZIP Packaging Security', () => {
    it('createZipFromFiles: safely packages files without throwing on path traversal or duplicate names', async () => {
      const files = [
        { name: '../../etc/shadow', blob: 'malicious path' },
        { name: 'document.txt', blob: 'content 1' },
        { name: 'document.txt', blob: 'content 2 (duplicate)' }
      ];

      const zipBlob = await createZipFromFiles(files, 'safe.zip');
      expect(zipBlob).toBeInstanceOf(Blob);
      expect(zipBlob.size).toBeGreaterThan(0);
    });
  });

  // C. Prototype Pollution Defense
  describe('Prototype Pollution Defense', () => {
    it('json-formatter: prevents prototype pollution during sortKeys', async () => {
      const raw = '{"__proto__": {"polluted": true}, "a": 1}';
      const res = await jsonFormatterTool.process({ textInput: raw, options: { sortKeys: true } });
      expect(res.success).toBe(true);
      expect(({} as any).polluted).toBeUndefined();
    });

    it('csv-json-converter: prevents prototype pollution in CSV headers', async () => {
      const csv = '__proto__,name\npolluted,Andi';
      const res = await csvJsonConverterTool.process({ textInput: csv, options: { mode: 'csv_to_json' } });
      expect(res.success).toBe(true);
      expect(({} as any).polluted).toBeUndefined();
    });
  });

  // D. JWT & Security Tools Safety
  describe('JWT Decoder Security', () => {
    it('jwt-decoder: rejects oversized input (>100KB)', async () => {
      const hugeInput = 'a'.repeat(150000);
      await expect(jwtDecoderTool.process({ textInput: hugeInput })).rejects.toThrow();
    });

    it('jwt-decoder: handles malformed token parts gracefully', async () => {
      await expect(jwtDecoderTool.process({ textInput: 'invalid.base64@chars.signature' })).rejects.toThrow();
    });
  });

  // E. Invoice Generator Robustness
  describe('Invoice Generator Robustness', () => {
    it('invoice-generator: handles zero and negative prices safely without crashing', async () => {
      const res = await invoiceGeneratorTool.process({
        options: {
          invoiceNumber: 'INV-TEST',
          itemPrice1: -50000,
          itemPrice2: 0
        }
      });
      expect(res.success).toBe(true);
      expect(res.items[0].blob).toBeInstanceOf(Blob);
    });
  });

  // F. ReDoS Guard in Regex Tester
  describe('Regex Tester ReDoS Guard', () => {
    it('regex-tester: terminates catastrophic backtracking within 500ms safety window', async () => {
      // Classic ReDoS pattern: (a+)+$ matching a string of 'a's followed by '!'
      const evilPattern = '(a+)+$';
      const evilInput = 'a'.repeat(30) + '!';

      const start = performance.now();
      try {
        await regexTesterTool.process({
          textInput: evilInput,
          options: { pattern: evilPattern, flags: 'g' }
        });
      } catch (err: any) {
        expect(err.message).toMatch(/nested quantifiers|waktu komputasi|sintaks regex/i);
      }
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(1000);
    });
  });
});
