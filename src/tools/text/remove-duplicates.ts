import { ToolDefinition, ProcessContext, ProcessResult } from '../../types/tool';

export const removeDuplicatesTool: ToolDefinition = {
  id: 'remove-duplicates',
  name: 'Hapus Baris Duplikat',
  shortDescription: 'Hapus baris teks/daftar yang kembar secara otomatis',
  description: 'Bersihkan daftar email, nomor HP, kata, atau URL yang duplikat dalam hitungan detik. Dilengkapi opsi pengurutan alfabet (A-Z).',
  category: 'text',
  inputMode: 'text',
  icon: 'CopySlash',
  popular: false,
  localProcessing: true,
  supportsBatch: false,
  supportsWorkflow: true,
  keywords: ['remove duplicate', 'hapus duplikat', 'baris kembar', 'daftar unik', 'dedup', 'unik'],
  optionSchemas: [
    {
      id: 'caseSensitive',
      label: 'Perhatikan Huruf Besar/Kecil',
      type: 'boolean',
      defaultValue: false
    },
    {
      id: 'trimWhitespace',
      label: 'Abaikan spasi di awal & akhir baris',
      type: 'boolean',
      defaultValue: true
    },
    {
      id: 'sortResult',
      label: 'Urutkan Hasil (A - Z)',
      type: 'boolean',
      defaultValue: false
    }
  ],
  process: async (context: ProcessContext): Promise<ProcessResult> => {
    const text = context.textInput || '';
    const caseSensitive = context.options?.caseSensitive ?? false;
    const trimWhitespace = context.options?.trimWhitespace ?? true;
    const sortResult = context.options?.sortResult ?? false;

    const rawLines = text.split('\n');
    const seen = new Set<string>();
    const uniqueLines: string[] = [];

    for (const raw of rawLines) {
      let line = trimWhitespace ? raw.trim() : raw;
      if (line === '') continue;

      const compareKey = caseSensitive ? line : line.toLowerCase();
      if (!seen.has(compareKey)) {
        seen.add(compareKey);
        uniqueLines.push(line);
      }
    }

    if (sortResult) {
      uniqueLines.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    }

    const cleanedText = uniqueLines.join('\n');
    const removedCount = rawLines.filter((l) => l.trim() !== '').length - uniqueLines.length;

    return {
      success: true,
      message: `Berhasil menghapus ${removedCount} baris duplikat. Tersisa ${uniqueLines.length} baris unik.`,
      downloadName: 'daftar_unik.txt',
      items: [
        {
          id: 'dedup_result',
          name: 'daftar_unik.txt',
          size: cleanedText.length,
          type: 'text/plain',
          textOutput: cleanedText,
          blob: new Blob([cleanedText], { type: 'text/plain;charset=utf-8' })
        }
      ]
    };
  }
};
