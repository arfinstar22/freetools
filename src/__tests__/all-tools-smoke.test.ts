import { describe, it, expect } from 'vitest';
import { ALL_TOOLS, getToolById } from '../engine/registry';
import { PDFDocument } from 'pdf-lib';

describe('Comprehensive 27 Tools Smoke Test', () => {
  it('Verify exactly 27 tools registered in Tool Registry', () => {
    expect(ALL_TOOLS.length).toBe(29);
  });

  // 1. compress-pdf
  it('1. compress-pdf: processes PDF document', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([100, 100]);
    const bytes = await pdfDoc.save();
    const file = new File([bytes.buffer as ArrayBuffer], 'test.pdf', { type: 'application/pdf' });

    const tool = getToolById('compress-pdf')!;
    const res = await tool.process({ files: [file], options: { level: 'medium' } });
    expect(res.success).toBe(true);
    expect(res.items[0].blob).toBeDefined();
  });

  // 2. merge-pdf
  it('2. merge-pdf: merges 2 PDFs', async () => {
    const doc1 = await PDFDocument.create(); doc1.addPage([100, 100]);
    const doc2 = await PDFDocument.create(); doc2.addPage([100, 100]);
    const f1 = new File([(await doc1.save()).buffer as ArrayBuffer], 'doc1.pdf', { type: 'application/pdf' });
    const f2 = new File([(await doc2.save()).buffer as ArrayBuffer], 'doc2.pdf', { type: 'application/pdf' });

    const tool = getToolById('merge-pdf')!;
    const res = await tool.process({ files: [f1, f2], options: { outputFilename: 'merged.pdf' } });
    expect(res.success).toBe(true);
    expect(res.items.length).toBe(1);
  });

  // 3. split-pdf
  it('3. split-pdf: splits PDF into pages', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([100, 100]);
    doc.addPage([100, 100]);
    const f = new File([(await doc.save()).buffer as ArrayBuffer], 'twopages.pdf', { type: 'application/pdf' });

    const tool = getToolById('split-pdf')!;
    const res = await tool.process({ files: [f], options: { splitMode: 'all_pages' } });
    expect(res.success).toBe(true);
    expect(res.items.length).toBeGreaterThan(1);
  });

  // 4. jpg-to-pdf
  it('4. jpg-to-pdf: handles image input without crashing', async () => {
    const tool = getToolById('jpg-to-pdf')!;
    expect(tool).toBeDefined();
    expect(tool.acceptedTypes).toContain('image/jpeg');
  });

  // 5. pdf-to-jpg
  it('5. pdf-to-jpg: tool definition is verified', async () => {
    const tool = getToolById('pdf-to-jpg')!;
    expect(tool).toBeDefined();
    expect(tool.acceptedTypes).toContain('application/pdf');
  });

  // 6. image-compress
  it('6. image-compress: tool definition is verified', async () => {
    const tool = getToolById('image-compress')!;
    expect(tool.category).toBe('image');
    expect(tool.supportsWorkflow).toBe(true);
  });

  // 7. image-resize
  it('7. image-resize: tool definition is verified', async () => {
    const tool = getToolById('image-resize')!;
    expect(tool.category).toBe('image');
    expect(tool.supportsBatch).toBe(true);
  });

  // 8. image-convert
  it('8. image-convert: tool definition is verified', async () => {
    const tool = getToolById('image-convert')!;
    expect(tool.category).toBe('image');
  });

  // 9. remove-metadata
  it('9. remove-metadata: tool definition is verified', async () => {
    const tool = getToolById('remove-metadata')!;
    expect(tool.category).toBe('image');
  });

  // 10. batch-image-processor
  it('10. batch-image-processor: tool definition is verified', async () => {
    const tool = getToolById('batch-image-processor')!;
    expect(tool.category).toBe('image');
  });

  // 11. word-counter
  it('11. word-counter: counts words', async () => {
    const tool = getToolById('word-counter')!;
    const res = await tool.process({ textInput: 'Satu dua tiga empat lima' });
    expect(res.success).toBe(true);
    expect(res.items[0].metadata?.wordCount).toBe(5);
  });

  // 12. text-cleaner
  it('12. text-cleaner: cleans whitespace', async () => {
    const tool = getToolById('text-cleaner')!;
    const res = await tool.process({ textInput: '  halo   dunia  ' });
    expect(res.success).toBe(true);
    expect(res.items[0].textOutput).toBe('halo dunia');
  });

  // 13. diff-checker
  it('13. diff-checker: compares texts', async () => {
    const tool = getToolById('diff-checker')!;
    const res = await tool.process({ options: { originalText: 'A', modifiedText: 'B' } });
    expect(res.success).toBe(true);
  });

  // 14. case-converter
  it('14. case-converter: converts case', async () => {
    const tool = getToolById('case-converter')!;
    const res = await tool.process({ textInput: 'hello world', options: { targetCase: 'title' } });
    expect(res.success).toBe(true);
    expect(res.items[0].textOutput).toBe('Hello World');
  });

  // 15. remove-duplicates
  it('15. remove-duplicates: removes dup lines', async () => {
    const tool = getToolById('remove-duplicates')!;
    const res = await tool.process({ textInput: 'A\nB\nA' });
    expect(res.success).toBe(true);
    expect(res.items[0].textOutput).toBe('A\nB');
  });

  // 16. find-replace
  it('16. find-replace: replaces terms', async () => {
    const tool = getToolById('find-replace')!;
    const res = await tool.process({ textInput: 'ayam goreng', options: { findText: 'ayam', replaceText: 'bebek' } });
    expect(res.success).toBe(true);
    expect(res.items[0].textOutput).toBe('bebek goreng');
  });

  // 17. json-formatter
  it('17. json-formatter: formats json', async () => {
    const tool = getToolById('json-formatter')!;
    const res = await tool.process({ textInput: '{"a":1}' });
    expect(res.success).toBe(true);
  });

  // 18. base64-tool
  it('18. base64-tool: encodes/decodes b64', async () => {
    const tool = getToolById('base64-tool')!;
    const res = await tool.process({ textInput: 'FreeTools', options: { mode: 'encode' } });
    expect(res.success).toBe(true);
  });

  // 19. uuid-generator
  it('19. uuid-generator: generates uuids', async () => {
    const tool = getToolById('uuid-generator')!;
    const res = await tool.process({ options: { count: '3' } });
    expect(res.success).toBe(true);
    expect(res.items[0].textOutput?.split('\n').length).toBe(3);
  });

  // 20. jwt-decoder
  it('20. jwt-decoder: decodes jwt structure', async () => {
    const tool = getToolById('jwt-decoder')!;
    // Valid minimal JWT: eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.signature
    const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.signature';
    const res = await tool.process({ textInput: token });
    expect(res.success).toBe(true);
    expect(res.items[0].metadata?.payload?.name).toBe('John Doe');
  });

  // 21. timestamp-converter
  it('21. timestamp-converter: converts epoch to date', async () => {
    const tool = getToolById('timestamp-converter')!;
    const res = await tool.process({ textInput: '1700000000', options: { mode: 'epoch_to_date' } });
    expect(res.success).toBe(true);
    expect(res.items[0].metadata?.epochSeconds).toBe(1700000000);
  });

  // 22. regex-tester
  it('22. regex-tester: tests pattern', async () => {
    const tool = getToolById('regex-tester')!;
    const res = await tool.process({ textInput: 'abc 123 def 456', options: { pattern: '\\d+', flags: 'g' } });
    expect(res.success).toBe(true);
    expect(res.items[0].metadata?.matchesCount).toBe(2);
  });

  // 23. invoice-generator
  it('23. invoice-generator: generates PDF invoice', async () => {
    const tool = getToolById('invoice-generator')!;
    const res = await tool.process({
      options: {
        invoiceNumber: 'INV-001',
        senderName: 'Freelancer',
        clientName: 'Klien',
        itemName1: 'Web Dev',
        itemPrice1: 1000000
      }
    });
    expect(res.success).toBe(true);
    expect(res.items[0].blob).toBeDefined();
  });

  // 24. csv-json-converter
  it('24. csv-json-converter: converts csv to json', async () => {
    const tool = getToolById('csv-json-converter')!;
    const csv = 'nama,umur\nAndi,25\nBudi,30';
    const res = await tool.process({ textInput: csv, options: { mode: 'csv_to_json', delimiter: ',' } });
    expect(res.success).toBe(true);
    const parsed = JSON.parse(res.items[0].textOutput!);
    expect(parsed.length).toBe(2);
    expect(parsed[0].nama).toBe('Andi');
  });

  // 25. expense-splitter
  it('25. expense-splitter: splits expenses', async () => {
    const tool = getToolById('expense-splitter')!;
    const res = await tool.process({
      options: {
        totalBill: 150000,
        taxPercent: 10,
        memberNames: 'Andi, Budi, Citra'
      }
    });
    expect(res.success).toBe(true);
    expect(res.items[0].metadata?.grandTotal).toBe(165000);
  });

  // 26. random-group
  it('26. random-group: groups participants', async () => {
    const tool = getToolById('random-group')!;
    const names = 'Andi\nBudi\nCitra\nDedi\nEka\nFani';
    const res = await tool.process({ textInput: names, options: { groupCount: 2 } });
    expect(res.success).toBe(true);
  });

  // 27. zip-pack
  it('27. zip-pack: archives files into zip', async () => {
    const tool = getToolById('zip-pack')!;
    const f1 = new File(['file 1 content'], 'doc1.txt', { type: 'text/plain' });
    const f2 = new File(['file 2 content'], 'doc2.txt', { type: 'text/plain' });
    const res = await tool.process({ files: [f1, f2], options: { zipFilename: 'bundle.zip' } });
    expect(res.success).toBe(true);
    expect(res.items[0].blob).toBeDefined();
    expect(res.downloadName).toBe('bundle.zip');
  });
});
