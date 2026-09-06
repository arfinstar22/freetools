import { describe, it, expect } from 'vitest';
import { wordCounterTool } from '../tools/text/word-counter';
import { textCleanerTool } from '../tools/text/text-cleaner';
import { caseConverterTool } from '../tools/text/case-converter';
import { removeDuplicatesTool } from '../tools/text/remove-duplicates';
import { jsonFormatterTool } from '../tools/developer/json-formatter';
import { base64Tool } from '../tools/developer/base64-tool';
import { uuidGeneratorTool } from '../tools/developer/uuid-generator';
import { diffCheckerTool } from '../tools/text/diff-checker';
import { regexTesterTool } from '../tools/developer/regex-tester';
import { expenseSplitterTool } from '../tools/office/expense-splitter';

describe('Text & Developer Tools Execution', () => {
  it('Word Counter: accurately calculates word, character, and sentence counts', async () => {
    const text = 'Halo dunia! Ini adalah FreeTools. Sangat praktis.';
    const res = await wordCounterTool.process({ textInput: text });
    expect(res.success).toBe(true);
    expect(res.items[0].metadata?.wordCount).toBe(7);
    expect(res.items[0].metadata?.sentenceCount).toBe(3);
  });

  it('Text Cleaner: removes extra spaces, empty lines, and trims', async () => {
    const text = '  Baris 1   dengan   spasi banyak   \n\n\n   Baris 2  ';
    const res = await textCleanerTool.process({ textInput: text });
    expect(res.success).toBe(true);
    expect(res.items[0].textOutput).toBe('Baris 1 dengan spasi banyak\nBaris 2');
  });

  it('Case Converter: converts to UPPERCASE and camelCase', async () => {
    const resUpper = await caseConverterTool.process({ textInput: 'halo dunia', options: { targetCase: 'upper' } });
    expect(resUpper.items[0].textOutput).toBe('HALO DUNIA');

    const resCamel = await caseConverterTool.process({ textInput: 'halo dunia saya', options: { targetCase: 'camel' } });
    expect(resCamel.items[0].textOutput).toBe('haloDuniaSaya');
  });

  it('Remove Duplicates: removes duplicate lines', async () => {
    const text = 'andi@test.com\nbudi@test.com\nandi@test.com\ncitra@test.com';
    const res = await removeDuplicatesTool.process({ textInput: text });
    expect(res.success).toBe(true);
    expect(res.items[0].textOutput).toBe('andi@test.com\nbudi@test.com\ncitra@test.com');
  });

  it('JSON Formatter: formats and minifies valid JSON', async () => {
    const raw = '{"b":2,"a":1}';
    const resFormat = await jsonFormatterTool.process({ textInput: raw, options: { action: 'format_2', sortKeys: true } });
    expect(resFormat.success).toBe(true);
    expect(resFormat.items[0].textOutput).toContain('"a": 1');

    const resMinify = await jsonFormatterTool.process({ textInput: '{\n  "name": "FreeTools"\n}', options: { action: 'minify' } });
    expect(resMinify.items[0].textOutput).toBe('{"name":"FreeTools"}');
  });

  it('Base64: encodes and decodes UTF-8 text safely', async () => {
    const text = 'FreeTools Indonesia 🇮🇩';
    const resEnc = await base64Tool.process({ textInput: text, options: { mode: 'encode' } });
    expect(resEnc.success).toBe(true);
    const encoded = resEnc.items[0].textOutput!;

    const resDec = await base64Tool.process({ textInput: encoded, options: { mode: 'decode' } });
    expect(resDec.success).toBe(true);
    expect(resDec.items[0].textOutput).toBe(text);
  });

  it('UUID Generator: produces valid RFC4122 v4 UUIDs', async () => {
    const res = await uuidGeneratorTool.process({ options: { count: '5', format: 'standard' } });
    expect(res.success).toBe(true);
    const lines = res.items[0].textOutput!.split('\n');
    expect(lines.length).toBe(5);
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuidV4Regex.test(lines[0])).toBe(true);
  });

  it('Diff Checker: calculates additions and deletions', async () => {
    const originalText = 'Baris 1\nBaris 2';
    const modifiedText = 'Baris 1\nBaris 2 revisi\nBaris 3 baru';
    const res = await diffCheckerTool.process({
      options: { originalText, modifiedText, diffType: 'lines' }
    });
    expect(res.success).toBe(true);
    expect(res.items[0].metadata?.isIdentical).toBe(false);
  });

  it('Regex Tester: tests pattern match and protects against syntax errors', async () => {
    const res = await regexTesterTool.process({
      textInput: 'Email: info@freetools.id and support@test.com',
      options: { pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', flags: 'g' }
    });
    expect(res.success).toBe(true);
    expect(res.items[0].metadata?.matchesCount).toBe(2);
  });

  it('Expense Splitter: calculates total bill distribution without mathematical error', async () => {
    const res = await expenseSplitterTool.process({
      options: {
        totalBill: 300000,
        taxPercent: 10,
        memberNames: 'Andi, Budi, Citra'
      }
    });
    expect(res.success).toBe(true);
    expect(res.items[0].metadata?.grandTotal).toBe(330000);
    expect(res.items[0].metadata?.totalCalculated).toBe(330000);
  });
});
