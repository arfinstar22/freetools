import { ToolDefinition, ProcessContext, ProcessResult } from '../../types/tool';

export const findReplaceTool: ToolDefinition = {
  id: 'find-replace',
  name: 'Cari & Ganti Teks (Find & Replace)',
  shortDescription: 'Cari kata atau pola tertentu dan ganti sekaligus',
  description: 'Ganti kata, kalimat, atau pola tertentu pada dokumen teks secara serentak. Mendukung pencarian Regex dan case-sensitive.',
  category: 'text',
  inputMode: 'text',
  icon: 'Replace',
  popular: false,
  localProcessing: true,
  supportsBatch: false,
  supportsWorkflow: true,
  keywords: ['find and replace', 'cari dan ganti', 'ganti kata', 'replace all', 'cari kata'],
  optionSchemas: [
    {
      id: 'findText',
      label: 'Kata / Teks yang Dicari',
      type: 'text',
      defaultValue: 'lama'
    },
    {
      id: 'replaceText',
      label: 'Ganti Menjadi',
      type: 'text',
      defaultValue: 'baru'
    },
    {
      id: 'matchCase',
      label: 'Perhatikan Huruf Besar/Kecil (Case Sensitive)',
      type: 'boolean',
      defaultValue: false
    },
    {
      id: 'useRegex',
      label: 'Gunakan Regular Expression (Regex)',
      type: 'boolean',
      defaultValue: false
    }
  ],
  process: async (context: ProcessContext): Promise<ProcessResult> => {
    const text = context.textInput || context.options?.inputText || '';
    const findStr = context.options?.findText || '';
    const replaceStr = context.options?.replaceText ?? '';
    const matchCase = context.options?.matchCase ?? false;
    const useRegex = context.options?.useRegex ?? false;

    if (!text) {
      throw new Error('Masukkan teks sumber yang ingin diproses.');
    }

    if (!findStr) {
      throw new Error('Masukkan kata atau teks yang ingin dicari.');
    }

    if (useRegex) {
      const hasNestedQuantifier = /\([^)]*(\+|\*|\{\d+,?\d*\})[^)]*\)(\+|\*|\{\d+,?\d*\})/.test(findStr);
      if (hasNestedQuantifier && text.length > 20) {
        throw new Error('Pola regex mengandung nested quantifiers yang berpotensi ReDoS (misal: (a+)+). Gunakan pola yang lebih spesifik.');
      }
    }

    let result = '';
    let matchCount = 0;

    try {
      if (useRegex) {
        const flags = matchCase ? 'g' : 'gi';
        const regex = new RegExp(findStr, flags);
        const matches = text.match(regex);
        matchCount = matches ? matches.length : 0;
        result = text.replace(regex, replaceStr);
      } else {
        const escaped = findStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const flags = matchCase ? 'g' : 'gi';
        const regex = new RegExp(escaped, flags);
        const matches = text.match(regex);
        matchCount = matches ? matches.length : 0;
        // In literal replacement mode, use a function replacer so '$' characters in replaceStr aren't misinterpreted as backreferences
        result = text.replace(regex, () => replaceStr);
      }
    } catch (err: any) {
      throw new Error(`Pola pencarian Regex tidak valid: ${err.message}`);
    }

    return {
      success: true,
      message: matchCount > 0
        ? `Berhasil mengganti ${matchCount} kecocokan kata!`
        : 'Tidak ada kata yang cocok ditemukan dalam teks.',
      downloadName: 'teks_hasil_ganti.txt',
      items: [
        {
          id: 'replace_result',
          name: 'teks_hasil_ganti.txt',
          size: result.length,
          type: 'text/plain',
          textOutput: result,
          blob: new Blob([result], { type: 'text/plain;charset=utf-8' }),
          metadata: { matchCount }
        }
      ]
    };
  }
};
