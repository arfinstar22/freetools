import { ToolDefinition, ProcessContext, ProcessResult } from '../../types/tool';

export const csvJsonConverterTool: ToolDefinition = {
  id: 'csv-json-converter',
  name: 'Konversi CSV ↔ JSON',
  shortDescription: 'Ubah file CSV ke JSON array atau sebaliknya dalam 1 klik',
  description: 'Konversi data tabel spreadsheet CSV ke JSON atau ubah JSON array menjadi file CSV dengan pemisah koma / titik koma.',
  category: 'office',
  inputMode: 'text',
  icon: 'TableProperties',
  popular: false,
  localProcessing: true,
  supportsBatch: false,
  supportsWorkflow: true,
  keywords: ['csv to json', 'json to csv', 'konversi csv', 'excel to json', 'tabel csv', 'converter csv'],
  optionSchemas: [
    {
      id: 'mode',
      label: 'Arah Konversi',
      type: 'select',
      defaultValue: 'csv_to_json',
      options: [
        { label: 'CSV → JSON Array', value: 'csv_to_json' },
        { label: 'JSON Array → CSV', value: 'json_to_csv' }
      ]
    },
    {
      id: 'delimiter',
      label: 'Pemisah Kolom (Delimiter)',
      type: 'select',
      defaultValue: ',',
      options: [
        { label: 'Koma (,)', value: ',' },
        { label: 'Titik Koma (;)', value: ';' },
        { label: 'Tab (\\t)', value: '\t' }
      ]
    }
  ],
  process: async (context: ProcessContext): Promise<ProcessResult> => {
    const text = (context.textInput || '').trim();
    if (!text) {
      throw new Error('Masukkan data teks CSV atau JSON.');
    }

    const mode = context.options?.mode || 'csv_to_json';
    const delimiter = context.options?.delimiter || ',';

    let output = '';
    let ext = 'json';
    let mime = 'application/json';

    if (mode === 'csv_to_json') {
      const rows = parseCSV(text, delimiter);
      if (rows.length === 0) {
        throw new Error('Data CSV kosong.');
      }
      const headers = rows[0];
      const safeHeaders = headers.map((h) => {
        const clean = h.trim();
        if (clean === '__proto__' || clean === 'constructor' || clean === 'prototype') {
          return `${clean}_header`;
        }
        return clean;
      });

      const resultData = rows.slice(1).map((row) => {
        const obj: Record<string, any> = Object.create(null);
        safeHeaders.forEach((h, idx) => {
          let val: any = row[idx] !== undefined ? row[idx] : '';
          // Try parse numbers
          if (val !== '' && !isNaN(Number(val))) {
            val = Number(val);
          }
          obj[h] = val;
        });
        return { ...obj };
      });

      output = JSON.stringify(resultData, null, 2);
      ext = 'json';
      mime = 'application/json';
    } else {
      // json to csv
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch (err: any) {
        throw new Error(`Format JSON tidak valid: ${err.message}`);
      }

      if (!Array.isArray(parsed)) {
        parsed = [parsed];
      }

      if (parsed.length === 0) {
        throw new Error('Array JSON kosong.');
      }

      const headers: string[] = Array.from(
        new Set(
          parsed.flatMap((item: any) =>
            typeof item === 'object' && item !== null ? Object.keys(item) : []
          )
        )
      );

      const csvLines: string[] = [];
      csvLines.push(headers.map((h) => escapeCSVCell(h)).join(delimiter));

      parsed.forEach((item: any) => {
        const row = headers.map((header) => {
          const val = item && typeof item === 'object' && header in item ? item[header] : '';
          return escapeCSVCell(typeof val === 'object' ? JSON.stringify(val) : String(val));
        });
        csvLines.push(row.join(delimiter));
      });

      output = csvLines.join('\n');
      ext = 'csv';
      mime = 'text/csv;charset=utf-8';
    }

    const downloadName = `hasil_konversi.${ext}`;

    return {
      success: true,
      message: `Konversi ${mode === 'csv_to_json' ? 'CSV ke JSON' : 'JSON ke CSV'} berhasil!`,
      downloadName,
      items: [
        {
          id: 'csv_json_result',
          name: downloadName,
          size: output.length,
          type: mime,
          textOutput: output,
          blob: new Blob([output], { type: mime })
        }
      ]
    };
  }
};

function parseCSV(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function escapeCSVCell(cell: string): string {
  if (cell.includes(',') || cell.includes(';') || cell.includes('\n') || cell.includes('"')) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}
