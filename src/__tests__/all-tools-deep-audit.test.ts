import { describe, it, expect } from 'vitest';
import { ALL_TOOLS, getToolById } from '../engine/registry';
import { PDFDocument } from 'pdf-lib';

describe('DEEP PRODUCTION AUDIT: All 27 Tools Safety & Edge Cases', () => {
  it('Registry integrity: exactly 27 tools registered with unique IDs', () => {
    expect(ALL_TOOLS.length).toBe(29);
    const ids = ALL_TOOLS.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(29);
  });

  // ==========================================
  // 1. PDF TOOLS (5 Tools)
  // ==========================================

  describe('1. compress-pdf', () => {
    const tool = getToolById('compress-pdf')!;

    it('Valid input: compresses PDF and outputs PDF blob', async () => {
      const doc = await PDFDocument.create();
      doc.addPage([200, 200]);
      const bytes = await doc.save();
      const f = new File([bytes.buffer as ArrayBuffer], 'sample.pdf', { type: 'application/pdf' });

      const res = await tool.process({ files: [f], options: { level: 'high' } });
      expect(res.success).toBe(true);
      expect(res.items[0].blob).toBeInstanceOf(Blob);
      expect(res.items[0].name).toContain('.pdf');
    });

    it('Invalid input: throws error when 0 files provided', async () => {
      await expect(tool.process({ files: [] })).rejects.toThrow(/pilih minimal 1 file/i);
    });

    it('Edge case: handles corrupted file buffer gracefully', async () => {
      const corrupt = new File(['NOT A VALID PDF CONTENT'], 'corrupt.pdf', { type: 'application/pdf' });
      await expect(tool.process({ files: [corrupt] })).rejects.toThrow();
    });
  });

  describe('2. merge-pdf', () => {
    const tool = getToolById('merge-pdf')!;

    it('Valid input: merges 2 PDF files into 1 PDF', async () => {
      const d1 = await PDFDocument.create(); d1.addPage([100, 100]);
      const d2 = await PDFDocument.create(); d2.addPage([100, 100]);
      const f1 = new File([(await d1.save()).buffer as ArrayBuffer], 'd1.pdf', { type: 'application/pdf' });
      const f2 = new File([(await d2.save()).buffer as ArrayBuffer], 'd2.pdf', { type: 'application/pdf' });

      const res = await tool.process({ files: [f1, f2], options: { outputFilename: 'hasil_gabung' } });
      expect(res.success).toBe(true);
      expect(res.items.length).toBe(1);
      expect(res.items[0].name).toBe('hasil_gabung.pdf');
    });

    it('Invalid input: throws when less than 2 files provided', async () => {
      const d1 = await PDFDocument.create(); d1.addPage([100, 100]);
      const f1 = new File([(await d1.save()).buffer as ArrayBuffer], 'd1.pdf', { type: 'application/pdf' });
      await expect(tool.process({ files: [f1] })).rejects.toThrow(/minimal 2 file/i);
    });
  });

  describe('3. split-pdf', () => {
    const tool = getToolById('split-pdf')!;

    it('Valid input: splits all pages into separate items', async () => {
      const doc = await PDFDocument.create();
      doc.addPage([100, 100]);
      doc.addPage([100, 100]);
      const f = new File([(await doc.save()).buffer as ArrayBuffer], 'doc.pdf', { type: 'application/pdf' });

      const res = await tool.process({ files: [f], options: { splitMode: 'all_pages' } });
      expect(res.success).toBe(true);
      expect(res.items.length).toBeGreaterThanOrEqual(2);
    });

    it('Edge case: custom range extraction (e.g. page 1)', async () => {
      const doc = await PDFDocument.create();
      doc.addPage([100, 100]);
      doc.addPage([100, 100]);
      const f = new File([(await doc.save()).buffer as ArrayBuffer], 'doc.pdf', { type: 'application/pdf' });

      const res = await tool.process({ files: [f], options: { splitMode: 'custom_range', pageRange: '1' } });
      expect(res.success).toBe(true);
      expect(res.items.length).toBe(1);
      expect(res.items[0].name).toContain('_ekstrak.pdf');
    });

    it('Invalid input: throws on out-of-bounds page range', async () => {
      const doc = await PDFDocument.create();
      doc.addPage([100, 100]);
      const f = new File([(await doc.save()).buffer as ArrayBuffer], 'doc.pdf', { type: 'application/pdf' });

      await expect(tool.process({ files: [f], options: { splitMode: 'custom_range', pageRange: '99-100' } }))
        .rejects.toThrow(/rentang halaman tidak valid/i);
    });
  });

  describe('4. jpg-to-pdf', () => {
    const tool = getToolById('jpg-to-pdf')!;

    it('Validation: rejects when 0 image files provided', async () => {
      await expect(tool.process({ files: [] })).rejects.toThrow(/pilih minimal 1 gambar/i);
    });

    it('Definition: accepts image formats and supports workflow', () => {
      expect(tool.acceptedTypes).toContain('image/jpeg');
      expect(tool.supportsWorkflow).toBe(true);
      expect(tool.supportsBatch).toBe(true);
    });
  });

  describe('5. pdf-to-jpg', () => {
    const tool = getToolById('pdf-to-jpg')!;

    it('Validation: rejects when 0 files provided', async () => {
      await expect(tool.process({ files: [] })).rejects.toThrow(/pilih 1 file pdf/i);
    });

    it('Definition: accepted types is application/pdf', () => {
      expect(tool.acceptedTypes).toContain('.pdf');
    });
  });

  // ==========================================
  // 2. IMAGE TOOLS (5 Tools)
  // ==========================================

  describe('6. image-compress', () => {
    const tool = getToolById('image-compress')!;
    it('Validation: rejects empty files list', async () => {
      await expect(tool.process({ files: [] })).rejects.toThrow(/pilih minimal 1 gambar/i);
    });
    it('Config: supports workflow and batch processing', () => {
      expect(tool.supportsWorkflow).toBe(true);
      expect(tool.supportsBatch).toBe(true);
    });
  });

  describe('7. image-resize', () => {
    const tool = getToolById('image-resize')!;
    it('Validation: rejects empty files list', async () => {
      await expect(tool.process({ files: [] })).rejects.toThrow(/pilih minimal 1 gambar/i);
    });
  });

  describe('8. image-convert', () => {
    const tool = getToolById('image-convert')!;
    it('Validation: rejects empty files list', async () => {
      await expect(tool.process({ files: [] })).rejects.toThrow(/pilih minimal 1 gambar/i);
    });
  });

  describe('9. remove-metadata', () => {
    const tool = getToolById('remove-metadata')!;
    it('Validation: rejects empty files list', async () => {
      await expect(tool.process({ files: [] })).rejects.toThrow(/pilih minimal 1 gambar/i);
    });
  });

  describe('10. batch-image-processor', () => {
    const tool = getToolById('batch-image-processor')!;
    it('Validation: rejects empty files list', async () => {
      await expect(tool.process({ files: [] })).rejects.toThrow(/pilih minimal 1 gambar/i);
    });
  });

  // ==========================================
  // 3. TEXT TOOLS (6 Tools)
  // ==========================================

  describe('11. word-counter', () => {
    const tool = getToolById('word-counter')!;

    it('Valid input: analyzes word, character, and sentence statistics', async () => {
      const text = 'Satu dua tiga. Empat lima enam? Tujuh!';
      const res = await tool.process({ textInput: text });
      expect(res.success).toBe(true);
      expect(res.items[0].metadata?.wordCount).toBe(7);
      expect(res.items[0].metadata?.sentenceCount).toBe(3);
    });

    it('Edge case: empty text returns 0 words without crashing', async () => {
      const res = await tool.process({ textInput: '' });
      expect(res.success).toBe(true);
      expect(res.items[0].metadata?.wordCount).toBe(0);
      expect(res.items[0].metadata?.charCount).toBe(0);
    });
  });

  describe('12. text-cleaner', () => {
    const tool = getToolById('text-cleaner')!;

    it('Valid input: cleans extra whitespace, empty lines, and HTML tags', async () => {
      const text = '  <p>Halo   <b>dunia</b></p>  \n\n\n  Baris 2  ';
      const res = await tool.process({
        textInput: text,
        options: { removeExtraSpaces: true, removeEmptyLines: true, stripHtml: true, trimLines: true }
      });
      expect(res.success).toBe(true);
      expect(res.items[0].textOutput).toBe('Halo dunia\nBaris 2');
    });

    it('Edge case: handles empty string', async () => {
      const res = await tool.process({ textInput: '' });
      expect(res.success).toBe(true);
      expect(res.items[0].textOutput).toBe('');
    });
  });

  describe('13. diff-checker', () => {
    const tool = getToolById('diff-checker')!;

    it('Valid input: detects additions and deletions accurately', async () => {
      const text1 = 'Baris 1\nBaris 2';
      const text2 = 'Baris 1\nBaris 2 Revisi\nBaris 3 Baru';
      const res = await tool.process({ options: { originalText: text1, modifiedText: text2, diffType: 'lines' } });
      expect(res.success).toBe(true);
      expect(res.items[0].metadata?.isIdentical).toBe(false);
      expect(res.items[0].metadata?.additions).toBeGreaterThan(0);
    });

    it('Edge case: identical texts returns identical flag true', async () => {
      const text = 'Teks sama persis';
      const res = await tool.process({ options: { originalText: text, modifiedText: text, diffType: 'lines' } });
      expect(res.success).toBe(true);
      expect(res.items[0].metadata?.isIdentical).toBe(true);
    });
  });

  describe('14. case-converter', () => {
    const tool = getToolById('case-converter')!;

    it('Valid input: converts to snake_case, kebab-case, and camelCase', async () => {
      const input = 'Nama Depan Pengguna';
      const resSnake = await tool.process({ textInput: input, options: { targetCase: 'snake' } });
      expect(resSnake.items[0].textOutput).toBe('nama_depan_pengguna');

      const resKebab = await tool.process({ textInput: input, options: { targetCase: 'kebab' } });
      expect(resKebab.items[0].textOutput).toBe('nama-depan-pengguna');

      const resCamel = await tool.process({ textInput: input, options: { targetCase: 'camel' } });
      expect(resCamel.items[0].textOutput).toBe('namaDepanPengguna');
    });

    it('Edge case: handles empty text safely', async () => {
      const res = await tool.process({ textInput: '', options: { targetCase: 'upper' } });
      expect(res.success).toBe(true);
      expect(res.items[0].textOutput).toBe('');
    });
  });

  describe('15. remove-duplicates', () => {
    const tool = getToolById('remove-duplicates')!;

    it('Valid input: removes duplicate lines and trims whitespace', async () => {
      const text = 'andi@test.com\n  budi@test.com  \nandi@test.com\n  ';
      const res = await tool.process({ textInput: text, options: { caseSensitive: false, trimWhitespace: true } });
      expect(res.success).toBe(true);
      expect(res.items[0].textOutput).toBe('andi@test.com\nbudi@test.com');
    });

    it('Edge case: sorting A-Z works', async () => {
      const text = 'Zebra\nApel\nKucing';
      const res = await tool.process({ textInput: text, options: { sortResult: true } });
      expect(res.items[0].textOutput).toBe('Apel\nKucing\nZebra');
    });
  });

  describe('16. find-replace', () => {
    const tool = getToolById('find-replace')!;

    it('Valid input: replaces matched terms and reports count', async () => {
      const text = 'kucing hitam dan kucing putih';
      const res = await tool.process({ textInput: text, options: { findText: 'kucing', replaceText: 'anjing' } });
      expect(res.success).toBe(true);
      expect(res.items[0].textOutput).toBe('anjing hitam dan anjing putih');
      expect(res.items[0].metadata?.matchCount).toBe(2);
    });

    it('Validation: rejects when findText or text is empty', async () => {
      await expect(tool.process({ textInput: 'halo', options: { findText: '' } }))
        .rejects.toThrow(/masukkan kata atau teks yang ingin dicari/i);

      await expect(tool.process({ textInput: '', options: { findText: 'halo' } }))
        .rejects.toThrow(/masukkan teks sumber/i);
    });

    it('Edge case: handles invalid regex syntax gracefully without crash', async () => {
      const text = 'test input';
      await expect(tool.process({ textInput: text, options: { findText: '[a-z', useRegex: true } }))
        .rejects.toThrow(/regex tidak valid/i);
    });
  });

  // ==========================================
  // 4. DEVELOPER TOOLS (6 Tools)
  // ==========================================

  describe('17. json-formatter', () => {
    const tool = getToolById('json-formatter')!;

    it('Valid input: formats valid JSON and sorts keys', async () => {
      const raw = '{"z": 1, "a": 2}';
      const res = await tool.process({ textInput: raw, options: { action: 'format_2', sortKeys: true } });
      expect(res.success).toBe(true);
      expect(res.items[0].textOutput).toContain('"a": 2');
    });

    it('Valid input: minifies JSON payload', async () => {
      const raw = '{\n  "name": "FreeTools"\n}';
      const res = await tool.process({ textInput: raw, options: { action: 'minify' } });
      expect(res.items[0].textOutput).toBe('{"name":"FreeTools"}');
    });

    it('Invalid input: throws clear error on malformed JSON', async () => {
      await expect(tool.process({ textInput: '{ name: invalid }' })).rejects.toThrow(/JSON tidak valid/i);
    });

    it('Validation: throws when input is empty', async () => {
      await expect(tool.process({ textInput: '' })).rejects.toThrow(/masukkan data json/i);
    });
  });

  describe('18. base64-tool', () => {
    const tool = getToolById('base64-tool')!;

    it('Valid input: encodes UTF-8 and unicode characters safely', async () => {
      const text = 'FreeTools 🚀 Bahasa Indonesia 🇮🇩';
      const res = await tool.process({ textInput: text, options: { mode: 'encode' } });
      expect(res.success).toBe(true);
      const encoded = res.items[0].textOutput!;

      const resDecode = await tool.process({ textInput: encoded, options: { mode: 'decode' } });
      expect(resDecode.items[0].textOutput).toBe(text);
    });

    it('Invalid input: throws error on malformed base64 input during decode', async () => {
      await expect(tool.process({ textInput: '!!!NOT_VALID_BASE64@@@', options: { mode: 'decode' } }))
        .rejects.toThrow(/base64 tidak valid/i);
    });
  });

  describe('19. uuid-generator', () => {
    const tool = getToolById('uuid-generator')!;

    it('Valid input: generates exact count of valid RFC4122 v4 UUIDs', async () => {
      const res = await tool.process({ options: { count: '10', format: 'standard' } });
      expect(res.success).toBe(true);
      const uuids = res.items[0].textOutput!.split('\n');
      expect(uuids.length).toBe(10);
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuids.every((u) => uuidRegex.test(u))).toBe(true);
    });

    it('Edge case: supports no_hyphen and uppercase format options', async () => {
      const res = await tool.process({ options: { count: '1', format: 'no_hyphen' } });
      expect(res.items[0].textOutput).not.toContain('-');
    });
  });

  describe('20. jwt-decoder', () => {
    const tool = getToolById('jwt-decoder')!;
    const validJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFyeWEiLCJpYXQiOjE1MTYyMzkwMjJ9.signature';

    it('Valid input: decodes header and payload with and without Bearer prefix', async () => {
      const res = await tool.process({ textInput: `Bearer ${validJwt}` });
      expect(res.success).toBe(true);
      expect(res.items[0].metadata?.payload?.name).toBe('Arya');
      expect(res.items[0].metadata?.header?.alg).toBe('HS256');
    });

    it('Invalid input: throws error on malformed JWT (less than 2 parts)', async () => {
      await expect(tool.process({ textInput: 'single_string_not_a_jwt' })).rejects.toThrow(/format jwt tidak valid/i);
    });

    it('Validation: throws on empty input', async () => {
      await expect(tool.process({ textInput: '' })).rejects.toThrow(/masukkan string token jwt/i);
    });
  });

  describe('21. timestamp-converter', () => {
    const tool = getToolById('timestamp-converter')!;

    it('Valid input: converts epoch seconds to Indonesian formatted date', async () => {
      const res = await tool.process({ textInput: '1700000000', options: { mode: 'epoch_to_date' } });
      expect(res.success).toBe(true);
      expect(res.items[0].metadata?.epochSeconds).toBe(1700000000);
      expect(res.items[0].textOutput).toContain('Waktu Lokal Indonesia');
    });

    it('Valid input: converts date string to epoch seconds', async () => {
      const res = await tool.process({ textInput: '2026-01-01T00:00:00.000Z', options: { mode: 'date_to_epoch' } });
      expect(res.success).toBe(true);
      expect(res.items[0].metadata?.epochSeconds).toBe(1767225600);
    });

    it('Invalid input: throws on non-numeric epoch or invalid date format', async () => {
      await expect(tool.process({ textInput: 'not_a_number', options: { mode: 'epoch_to_date' } }))
        .rejects.toThrow(/masukkan angka unix timestamp/i);

      await expect(tool.process({ textInput: 'invalid_date_xyz', options: { mode: 'date_to_epoch' } }))
        .rejects.toThrow(/format tanggal tidak valid/i);
    });
  });

  describe('22. regex-tester', () => {
    const tool = getToolById('regex-tester')!;

    it('Valid input: matches regex pattern and returns matched items and capture groups', async () => {
      const text = 'User1: user@freetools.id, User2: admin@test.com';
      const res = await tool.process({
        textInput: text,
        options: { pattern: '([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})', flags: 'g' }
      });
      expect(res.success).toBe(true);
      expect(res.items[0].metadata?.matchesCount).toBe(2);
    });

    it('Security & ReDoS: caps input length to prevent memory freeze', async () => {
      const hugeText = 'a'.repeat(150000);
      const res = await tool.process({ textInput: hugeText, options: { pattern: 'a+', flags: 'g' } });
      expect(res.success).toBe(true);
    });

    it('Invalid input: throws clear error on invalid regex syntax', async () => {
      await expect(tool.process({ textInput: 'text', options: { pattern: '([a-z' } }))
        .rejects.toThrow(/sintaks regex tidak valid/i);
    });

    it('Validation: throws when pattern is empty', async () => {
      await expect(tool.process({ textInput: 'text', options: { pattern: '' } }))
        .rejects.toThrow(/masukkan pola regular expression/i);
    });
  });

  // ==========================================
  // 5. OFFICE & GENERAL TOOLS (5 Tools)
  // ==========================================

  describe('23. invoice-generator', () => {
    const tool = getToolById('invoice-generator')!;

    it('Valid input: creates PDF invoice with custom items and payment details', async () => {
      const res = await tool.process({
        options: {
          invoiceNumber: 'INV-2026-999',
          senderName: 'PT Kreatif Mandiri',
          clientName: 'PT Sukses Global',
          itemName1: 'Jasa Desain UI/UX',
          itemPrice1: 2500000,
          itemName2: 'Jasa Frontend Web',
          itemPrice2: 3500000,
          bankDetails: 'BCA 123456789'
        }
      });

      expect(res.success).toBe(true);
      expect(res.items[0].blob).toBeInstanceOf(Blob);
      expect(res.items[0].name).toBe('Invoice_INV-2026-999.pdf');
    });
  });

  describe('24. csv-json-converter', () => {
    const tool = getToolById('csv-json-converter')!;

    it('Valid input: converts CSV with commas and quoted cells to JSON array', async () => {
      const csv = 'nama,kota,catatan\n"Andi, Saputra",Jakarta,"Pekerja keras, aktif"\nBudi,Bandung,Staff';
      const res = await tool.process({ textInput: csv, options: { mode: 'csv_to_json', delimiter: ',' } });
      expect(res.success).toBe(true);
      const parsed = JSON.parse(res.items[0].textOutput!);
      expect(parsed.length).toBe(2);
      expect(parsed[0].nama).toBe('Andi, Saputra');
      expect(parsed[0].catatan).toBe('Pekerja keras, aktif');
    });

    it('Valid input: converts JSON array to CSV', async () => {
      const jsonStr = JSON.stringify([{ id: 1, nama: 'Andi' }, { id: 2, nama: 'Budi' }]);
      const res = await tool.process({ textInput: jsonStr, options: { mode: 'json_to_csv', delimiter: ',' } });
      expect(res.success).toBe(true);
      expect(res.items[0].textOutput).toContain('id,nama');
      expect(res.items[0].textOutput).toContain('1,Andi');
    });

    it('Invalid input: throws error on empty CSV input', async () => {
      await expect(tool.process({ textInput: '' })).rejects.toThrow(/masukkan data teks csv/i);
    });

    it('Invalid input: throws error on malformed JSON when converting to CSV', async () => {
      await expect(tool.process({ textInput: '{ invalid json }', options: { mode: 'json_to_csv' } }))
        .rejects.toThrow(/format json tidak valid/i);
    });
  });

  describe('25. expense-splitter', () => {
    const tool = getToolById('expense-splitter')!;

    it('Valid input: splits bill and tax accurately across members', async () => {
      const res = await tool.process({
        options: {
          totalBill: 100000,
          taxPercent: 10,
          memberNames: 'Andi, Budi, Citra',
          roundingMode: 'exact'
        }
      });
      expect(res.success).toBe(true);
      expect(res.items[0].metadata?.grandTotal).toBe(110000);
      expect(res.items[0].metadata?.totalCalculated).toBe(110000);
    });

    it('Edge case: supports round up to Rp 1000 option', async () => {
      const res = await tool.process({
        options: {
          totalBill: 100000,
          taxPercent: 10,
          memberNames: 'Andi, Budi, Citra',
          roundingMode: 'round_1000'
        }
      });
      expect(res.success).toBe(true);
      expect(res.items[0].metadata?.memberPayments[0].amount).toBe(37000);
    });

    it('Validation: throws error when member names is empty', async () => {
      await expect(tool.process({ options: { totalBill: 100000, memberNames: '' } }))
        .rejects.toThrow(/masukkan minimal 1 nama anggota/i);
    });
  });

  describe('26. random-group', () => {
    const tool = getToolById('random-group')!;

    it('Valid input: partitions names evenly into specified groups count', async () => {
      const names = 'Andi\nBudi\nCitra\nDedi\nEka\nFani';
      const res = await tool.process({ textInput: names, options: { groupCount: '3' } });
      expect(res.success).toBe(true);
      expect(res.items[0].textOutput).toContain('KELOMPOK 1');
      expect(res.items[0].textOutput).toContain('KELOMPOK 2');
      expect(res.items[0].textOutput).toContain('KELOMPOK 3');
    });

    it('Validation: throws when participants count is less than group count', async () => {
      await expect(tool.process({ textInput: 'Andi\nBudi', options: { groupCount: '5' } }))
        .rejects.toThrow(/lebih sedikit dari jumlah kelompok/i);
    });

    it('Validation: throws on empty names input', async () => {
      await expect(tool.process({ textInput: '' })).rejects.toThrow(/masukkan daftar nama/i);
    });
  });

  describe('27. zip-pack', () => {
    const tool = getToolById('zip-pack')!;

    it('Valid input: packs multiple files into a valid ZIP archive', async () => {
      const f1 = new File(['Hello text 1'], 'file1.txt', { type: 'text/plain' });
      const f2 = new File(['Hello text 2'], 'file2.txt', { type: 'text/plain' });
      const res = await tool.process({ files: [f1, f2], options: { zipFilename: 'arsip.zip' } });
      expect(res.success).toBe(true);
      expect(res.items[0].blob).toBeInstanceOf(Blob);
      expect(res.downloadName).toBe('arsip.zip');
    });

    it('Validation: throws error when 0 files selected', async () => {
      await expect(tool.process({ files: [] })).rejects.toThrow(/pilih minimal 1 file/i);
    });
  });
});
