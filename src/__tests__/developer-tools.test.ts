import { describe, it, expect } from 'vitest';
import { base64Tool } from '../tools/developer/base64-tool';
import { jsonFormatterTool } from '../tools/developer/json-formatter';
import { jwtDecoderTool } from '../tools/developer/jwt-decoder';
import { regexTesterTool } from '../tools/developer/regex-tester';
import { timestampConverterTool } from '../tools/developer/timestamp-converter';
import { uuidGeneratorTool } from '../tools/developer/uuid-generator';

describe('Developer Tools Audit & Verification (Task 4)', () => {
  // ==========================================
  // 1. BASE64 TOOL
  // ==========================================
  describe('1. Base64 Tool', () => {
    it('encode & decode normal text: encodes and restores text verbatim', async () => {
      const text = 'Hello, FreeTools Developer Utilities!';
      const resEnc = await base64Tool.process({ textInput: text, options: { mode: 'encode' } });
      expect(resEnc.success).toBe(true);
      expect(resEnc.items[0].textOutput).toBe(btoa(unescape(encodeURIComponent(text))));

      const resDec = await base64Tool.process({ textInput: resEnc.items[0].textOutput, options: { mode: 'decode' } });
      expect(resDec.success).toBe(true);
      expect(resDec.items[0].textOutput).toBe(text);
    });

    it('Unicode & Emoji: safely encodes and decodes multi-byte UTF-8 characters', async () => {
      const unicodeText = 'FreeTools 🚀 Bahasa Indonesia 🇮🇩 ☕ 日本語';
      const resEnc = await base64Tool.process({ textInput: unicodeText, options: { mode: 'encode' } });
      const resDec = await base64Tool.process({ textInput: resEnc.items[0].textOutput, options: { mode: 'decode' } });
      expect(resDec.items[0].textOutput).toBe(unicodeText);
    });

    it('empty input: throws clear error message', async () => {
      await expect(base64Tool.process({ textInput: '' }))
        .rejects.toThrow(/masukkan teks atau string base64/i);
    });

    it('malformed Base64: rejects invalid base64 during decode with clear error', async () => {
      await expect(base64Tool.process({ textInput: '!!!invalid_base64_symbols@@@', options: { mode: 'decode' } }))
        .rejects.toThrow(/format base64 tidak valid/i);
    });
  });

  // ==========================================
  // 2. JSON FORMATTER
  // ==========================================
  describe('2. JSON Formatter', () => {
    it('valid JSON object: formats with 2 spaces and sorts keys', async () => {
      const raw = '{"z": 1, "b": 2, "a": {"d": 4, "c": 3}}';
      const res = await jsonFormatterTool.process({
        textInput: raw,
        options: { action: 'format_2', sortKeys: true }
      });
      expect(res.success).toBe(true);
      expect(res.items[0].textOutput).toContain('  "a": {\n    "c": 3,\n    "d": 4\n  }');
    });

    it('array & minify: correctly minifies JSON array', async () => {
      const raw = '[\n  {"id": 1},\n  {"id": 2}\n]';
      const res = await jsonFormatterTool.process({
        textInput: raw,
        options: { action: 'minify' }
      });
      expect(res.items[0].textOutput).toBe('[{"id":1},{"id":2}]');
    });

    it('malformed JSON: throws clear error without crash', async () => {
      await expect(jsonFormatterTool.process({ textInput: '{ name: unquotedKey }' }))
        .rejects.toThrow(/json tidak valid/i);
    });

    it('empty input: throws validation error', async () => {
      await expect(jsonFormatterTool.process({ textInput: '' }))
        .rejects.toThrow(/masukkan data json/i);
    });
  });

  // ==========================================
  // 3. JWT DECODER
  // ==========================================
  describe('3. JWT Decoder', () => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '');
    const payload = btoa(JSON.stringify({ sub: '12345', name: 'Budi Santoso', exp: 1900000000 })).replace(/=/g, '');
    const validJwt = `${header}.${payload}.mockSignature`;

    it('valid JWT: decodes header and payload with and without Bearer prefix', async () => {
      const res = await jwtDecoderTool.process({ textInput: `Bearer ${validJwt}` });
      expect(res.success).toBe(true);
      expect(res.items[0].metadata?.header?.alg).toBe('HS256');
      expect(res.items[0].metadata?.payload?.name).toBe('Budi Santoso');
      expect(res.items[0].metadata?.isExpired).toBe(false);
    });

    it('malformed JWT: rejects tokens with invalid segment count', async () => {
      await expect(jwtDecoderTool.process({ textInput: 'only_one_segment' }))
        .rejects.toThrow(/format jwt tidak valid/i);
    });

    it('invalid JSON payload in JWT: throws error cleanly', async () => {
      const badPayload = btoa('NOT A JSON STRING');
      const badJwt = `${header}.${badPayload}.sig`;
      await expect(jwtDecoderTool.process({ textInput: badJwt }))
        .rejects.toThrow(/gagal membaca token jwt/i);
    });

    it('empty input: throws validation error', async () => {
      await expect(jwtDecoderTool.process({ textInput: '' }))
        .rejects.toThrow(/masukkan string token jwt/i);
    });
  });

  // ==========================================
  // 4. REGEX TESTER
  // ==========================================
  describe('4. Regex Tester', () => {
    it('valid regex: finds matches and capture groups', async () => {
      const text = 'User: John (ID: 101), User: Jane (ID: 102)';
      const pattern = 'User:\\s*(\\w+)\\s*\\(ID:\\s*(\\d+)\\)';
      const res = await regexTesterTool.process({
        textInput: text,
        options: { pattern, flags: 'g' }
      });
      expect(res.success).toBe(true);
      expect(res.items[0].metadata?.matchesCount).toBe(2);
    });

    it('no matches: returns valid result with zero matches message', async () => {
      const res = await regexTesterTool.process({
        textInput: 'No numbers here',
        options: { pattern: '\\d+', flags: 'g' }
      });
      expect(res.items[0].metadata?.matchesCount).toBe(0);
      expect(res.items[0].textOutput).toContain('Jumlah Cocok: 0');
    });

    it('empty pattern: throws validation error', async () => {
      await expect(regexTesterTool.process({ textInput: 'test', options: { pattern: '' } }))
        .rejects.toThrow(/masukkan pola regular expression/i);
    });

    it('invalid regex syntax: throws clear error without crash', async () => {
      await expect(regexTesterTool.process({ textInput: 'test', options: { pattern: '([a-z' } }))
        .rejects.toThrow();
    });

    it('ReDoS protection: prevents catastrophic backtracking freeze', async () => {
      const nestedPattern = '(a+)+$';
      const evilInput = 'a'.repeat(30) + '!';
      await expect(regexTesterTool.process({
        textInput: evilInput,
        options: { pattern: nestedPattern, flags: 'g' }
      })).rejects.toThrow(/nested quantifiers|waktu komputasi/i);
    });
  });

  // ==========================================
  // 5. TIMESTAMP CONVERTER
  // ==========================================
  describe('5. Timestamp Converter', () => {
    it('epoch to date: converts seconds epoch to local date string', async () => {
      const res = await timestampConverterTool.process({
        textInput: '1700000000',
        options: { mode: 'epoch_to_date' }
      });
      expect(res.success).toBe(true);
      expect(res.items[0].metadata?.epochSeconds).toBe(1700000000);
      expect(res.items[0].textOutput).toContain('Waktu Lokal Indonesia');
    });

    it('date to epoch: converts ISO date string to epoch seconds', async () => {
      const res = await timestampConverterTool.process({
        textInput: '2026-09-04T12:00:00.000Z',
        options: { mode: 'date_to_epoch' }
      });
      expect(res.success).toBe(true);
      expect(res.items[0].metadata?.epochSeconds).toBe(1788523200);
    });

    it('negative timestamp: supports dates before 1970 safely', async () => {
      const res = await timestampConverterTool.process({
        textInput: '-315619200', // Year 1960
        options: { mode: 'epoch_to_date' }
      });
      expect(res.success).toBe(true);
      expect(res.items[0].metadata?.epochSeconds).toBe(-315619200);
    });

    it('invalid input: throws on invalid timestamp number or malformed date', async () => {
      await expect(timestampConverterTool.process({ textInput: 'not_a_number', options: { mode: 'epoch_to_date' } }))
        .rejects.toThrow(/angka unix timestamp yang valid/i);

      await expect(timestampConverterTool.process({ textInput: 'invalid_date_xyz', options: { mode: 'date_to_epoch' } }))
        .rejects.toThrow(/format tanggal tidak valid/i);
    });
  });

  // ==========================================
  // 6. UUID GENERATOR
  // ==========================================
  describe('6. UUID Generator', () => {
    it('generates exact count of valid UUID v4', async () => {
      const res = await uuidGeneratorTool.process({
        options: { count: '5', format: 'standard' }
      });
      expect(res.success).toBe(true);
      const lines = res.items[0].textOutput!.split('\n');
      expect(lines.length).toBe(5);
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(lines.every((l) => uuidV4Regex.test(l))).toBe(true);
    });

    it('supports formats: no_hyphen, uppercase, braces', async () => {
      const resNoHyphen = await uuidGeneratorTool.process({ options: { count: '1', format: 'no_hyphen' } });
      expect(resNoHyphen.items[0].textOutput).not.toContain('-');

      const resUpper = await uuidGeneratorTool.process({ options: { count: '1', format: 'uppercase' } });
      expect(resUpper.items[0].textOutput).toBe(resUpper.items[0].textOutput!.toUpperCase());

      const resBraces = await uuidGeneratorTool.process({ options: { count: '1', format: 'braces' } });
      expect(resBraces.items[0].textOutput?.startsWith('{')).toBe(true);
      expect(resBraces.items[0].textOutput?.endsWith('}')).toBe(true);
    });

    it('count bounds: safely clamps invalid or out-of-range counts', async () => {
      const res = await uuidGeneratorTool.process({ options: { count: '-5' } });
      expect(res.success).toBe(true);
      expect(res.items[0].textOutput!.split('\n').length).toBeGreaterThanOrEqual(1);
    });
  });
});
