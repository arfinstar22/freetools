import { describe, it, expect } from 'vitest';
import { wordCounterTool } from '../tools/text/word-counter';
import { textCleanerTool } from '../tools/text/text-cleaner';
import { diffCheckerTool } from '../tools/text/diff-checker';
import { caseConverterTool } from '../tools/text/case-converter';
import { removeDuplicatesTool } from '../tools/text/remove-duplicates';
import { findReplaceTool } from '../tools/text/find-replace';

describe('Text Tools Audit & Verification (Task 3)', () => {
  // ==========================================
  // 1. WORD COUNTER
  // ==========================================
  describe('1. Word-counter', () => {
    it('normal text: correctly computes words, characters, sentences, paragraphs', async () => {
      const text = 'Halo dunia! Ini adalah FreeTools. Semoga bermanfaat.';
      const res = await wordCounterTool.process({ textInput: text });
      expect(res.success).toBe(true);
      expect(res.items[0].metadata?.wordCount).toBe(7);
      expect(res.items[0].metadata?.sentenceCount).toBe(3);
      expect(res.items[0].metadata?.paragraphCount).toBe(1);
    });

    it('empty text: returns zero metrics without throwing', async () => {
      const res = await wordCounterTool.process({ textInput: '' });
      expect(res.success).toBe(true);
      expect(res.items[0].metadata?.wordCount).toBe(0);
      expect(res.items[0].metadata?.charCount).toBe(0);
    });

    it('Unicode and Emoji: handles non-ASCII characters and emojis accurately', async () => {
      const text = 'Selamat pagi ☕ Indonesia 🇮🇩 🚀';
      const res = await wordCounterTool.process({ textInput: text });
      expect(res.success).toBe(true);
      expect(res.items[0].metadata?.wordCount).toBe(6);
    });

    it('extreme whitespace and newlines: splits tokens cleanly', async () => {
      const text = '   \n\n\t   kataSatu    \t\n\n   kataDua   \n\n\n  ';
      const res = await wordCounterTool.process({ textInput: text });
      expect(res.items[0].metadata?.wordCount).toBe(2);
    });

    it('large text: processes large string in linear time', async () => {
      const largeText = 'kata '.repeat(10000);
      const res = await wordCounterTool.process({ textInput: largeText });
      expect(res.items[0].metadata?.wordCount).toBe(10000);
    });
  });

  // ==========================================
  // 2. TEXT CLEANER
  // ==========================================
  describe('2. Text-cleaner', () => {
    it('whitespace & empty lines: strips extra spaces and collapsed newlines', async () => {
      const text = '  Baris 1   dengan    spasi  \n\n\n\n  Baris 2  ';
      const res = await textCleanerTool.process({
        textInput: text,
        options: { removeExtraSpaces: true, removeEmptyLines: true, trimLines: true }
      });
      expect(res.success).toBe(true);
      expect(res.items[0].textOutput).toBe('Baris 1 dengan spasi\nBaris 2');
    });

    it('HTML stripping: removes HTML tags cleanly when option enabled', async () => {
      const text = '<div><h1>Judul</h1><p>Paragraf <b>tebal</b>.</p></div>';
      const res = await textCleanerTool.process({
        textInput: text,
        options: { stripHtml: true, removeExtraSpaces: true }
      });
      expect(res.items[0].textOutput).toBe('JudulParagraf tebal.');
    });

    it('empty input: returns empty string cleanly', async () => {
      const res = await textCleanerTool.process({ textInput: '' });
      expect(res.success).toBe(true);
      expect(res.items[0].textOutput).toBe('');
    });
  });

  // ==========================================
  // 3. DIFF CHECKER
  // ==========================================
  describe('3. Diff-checker', () => {
    it('identical text: reports isIdentical true with 0 additions/deletions', async () => {
      const text = 'Teks yang sama persis\nBaris kedua';
      const res = await diffCheckerTool.process({
        options: { originalText: text, modifiedText: text, diffType: 'lines' }
      });
      expect(res.success).toBe(true);
      expect(res.items[0].metadata?.isIdentical).toBe(true);
      expect(res.items[0].metadata?.additions).toBe(0);
      expect(res.items[0].metadata?.deletions).toBe(0);
    });

    it('additions & deletions: formats visual [+] and [-] changes correctly', async () => {
      const t1 = 'Baris 1\nBaris 2 lama\nBaris 3';
      const t2 = 'Baris 1\nBaris 2 baru\nBaris 3\nBaris 4 tambahan';
      const res = await diffCheckerTool.process({
        options: { originalText: t1, modifiedText: t2, diffType: 'lines' }
      });
      expect(res.success).toBe(true);
      expect(res.items[0].metadata?.isIdentical).toBe(false);
      expect(res.items[0].textOutput).toContain('[+]');
      expect(res.items[0].textOutput).toContain('[-]');
    });

    it('empty text: handles empty comparison safely', async () => {
      const res = await diffCheckerTool.process({
        options: { originalText: '', modifiedText: '' }
      });
      expect(res.success).toBe(true);
      expect(res.items[0].metadata?.isIdentical).toBe(true);
    });
  });

  // ==========================================
  // 4. CASE CONVERTER
  // ==========================================
  describe('4. Case-converter', () => {
    it('supports upper, lower, title, sentence, camel, snake, kebab, pascal', async () => {
      const text = 'free tools indonesia';

      const resUpper = await caseConverterTool.process({ textInput: text, options: { targetCase: 'upper' } });
      expect(resUpper.items[0].textOutput).toBe('FREE TOOLS INDONESIA');

      const resLower = await caseConverterTool.process({ textInput: 'HELLO WORLD', options: { targetCase: 'lower' } });
      expect(resLower.items[0].textOutput).toBe('hello world');

      const resTitle = await caseConverterTool.process({ textInput: text, options: { targetCase: 'title' } });
      expect(resTitle.items[0].textOutput).toBe('Free Tools Indonesia');

      const resCamel = await caseConverterTool.process({ textInput: text, options: { targetCase: 'camel' } });
      expect(resCamel.items[0].textOutput).toBe('freeToolsIndonesia');

      const resSnake = await caseConverterTool.process({ textInput: text, options: { targetCase: 'snake' } });
      expect(resSnake.items[0].textOutput).toBe('free_tools_indonesia');

      const resKebab = await caseConverterTool.process({ textInput: text, options: { targetCase: 'kebab' } });
      expect(resKebab.items[0].textOutput).toBe('free-tools-indonesia');

      const resPascal = await caseConverterTool.process({ textInput: text, options: { targetCase: 'pascal' } });
      expect(resPascal.items[0].textOutput).toBe('FreeToolsIndonesia');
    });

    it('empty text: returns empty string safely', async () => {
      const res = await caseConverterTool.process({ textInput: '', options: { targetCase: 'upper' } });
      expect(res.success).toBe(true);
      expect(res.items[0].textOutput).toBe('');
    });
  });

  // ==========================================
  // 5. REMOVE DUPLICATES
  // ==========================================
  describe('5. Remove-duplicates', () => {
    it('removes duplicate lines with whitespace trimming', async () => {
      const text = 'alpha\n  beta  \nalpha\ngamma\n  beta';
      const res = await removeDuplicatesTool.process({
        textInput: text,
        options: { caseSensitive: false, trimWhitespace: true }
      });
      expect(res.success).toBe(true);
      expect(res.items[0].textOutput).toBe('alpha\nbeta\ngamma');
    });

    it('case-sensitive mode: keeps different-case variants distinct', async () => {
      const text = 'Alpha\nalpha\nALPHA';
      const res = await removeDuplicatesTool.process({
        textInput: text,
        options: { caseSensitive: true }
      });
      expect(res.items[0].textOutput).toBe('Alpha\nalpha\nALPHA');
    });

    it('sortResult option: sorts unique lines alphabetically A-Z', async () => {
      const text = 'Zebra\nApel\nMangga';
      const res = await removeDuplicatesTool.process({
        textInput: text,
        options: { sortResult: true }
      });
      expect(res.items[0].textOutput).toBe('Apel\nMangga\nZebra');
    });

    it('empty input: handles empty text safely', async () => {
      const res = await removeDuplicatesTool.process({ textInput: '' });
      expect(res.success).toBe(true);
      expect(res.items[0].textOutput).toBe('');
    });
  });

  // ==========================================
  // 6. FIND & REPLACE
  // ==========================================
  describe('6. Find-replace', () => {
    it('normal literal replacement: replaces text and counts occurrences', async () => {
      const text = 'kucing hitam dan kucing putih';
      const res = await findReplaceTool.process({
        textInput: text,
        options: { findText: 'kucing', replaceText: 'kelinci' }
      });
      expect(res.success).toBe(true);
      expect(res.items[0].textOutput).toBe('kelinci hitam dan kelinci putih');
      expect(res.items[0].metadata?.matchCount).toBe(2);
    });

    it('literal dollar sign replacement: does not misinterpret $ in replacement string as backreference', async () => {
      const text = 'Harga barang ini Rp 100.';
      const res = await findReplaceTool.process({
        textInput: text,
        options: { findText: 'Rp 100', replaceText: '$100 USD', useRegex: false }
      });
      expect(res.items[0].textOutput).toBe('Harga barang ini $100 USD.');
    });

    it('zero matches: returns original text with informative message', async () => {
      const text = 'Halo dunia';
      const res = await findReplaceTool.process({
        textInput: text,
        options: { findText: 'tidak_ada', replaceText: 'ada' }
      });
      expect(res.items[0].textOutput).toBe('Halo dunia');
      expect(res.items[0].metadata?.matchCount).toBe(0);
    });

    it('valid regex replacement: supports regex pattern replacement', async () => {
      const text = 'item123 and item456';
      const res = await findReplaceTool.process({
        textInput: text,
        options: { findText: 'item(\\d+)', replaceText: 'code-$1', useRegex: true }
      });
      expect(res.items[0].textOutput).toBe('code-123 and code-456');
    });

    it('invalid regex syntax: throws clear error without crash', async () => {
      const text = 'test input';
      await expect(findReplaceTool.process({
        textInput: text,
        options: { findText: '[a-z', useRegex: true }
      })).rejects.toThrow(/regex tidak valid/i);
    });

    it('validation: throws when findText or source text is missing', async () => {
      await expect(findReplaceTool.process({ textInput: '', options: { findText: 'a' } }))
        .rejects.toThrow(/masukkan teks sumber/i);

      await expect(findReplaceTool.process({ textInput: 'teks', options: { findText: '' } }))
        .rejects.toThrow(/masukkan kata atau teks yang ingin dicari/i);
    });
  });
});
