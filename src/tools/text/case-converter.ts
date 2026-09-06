import { ToolDefinition, ProcessContext, ProcessResult } from '../../types/tool';

export const caseConverterTool: ToolDefinition = {
  id: 'case-converter',
  name: 'Konversi Huruf Besar & Kecil',
  shortDescription: 'Ubah teks ke UPPERCASE, lowercase, Title Case, camelCase, snake_case',
  description: 'Konversi gaya penulisan teks dengan cepat: HURUF BESAR, huruf kecil, Huruf Depan Besar (Title Case), camelCase, snake_case, kebab-case, atau Sentence case.',
  category: 'text',
  inputMode: 'text',
  icon: 'Type',
  popular: false,
  localProcessing: true,
  supportsBatch: false,
  supportsWorkflow: true,
  keywords: ['case converter', 'huruf besar', 'huruf kecil', 'kapital', 'uppercase', 'lowercase', 'title case', 'camelcase', 'snake_case'],
  optionSchemas: [
    {
      id: 'targetCase',
      label: 'Format Huruf',
      type: 'select',
      defaultValue: 'title',
      options: [
        { label: 'HURUF BESAR SEMUA (UPPERCASE)', value: 'upper' },
        { label: 'huruf kecil semua (lowercase)', value: 'lower' },
        { label: 'Huruf Kapital Setiap Kata (Title Case)', value: 'title' },
        { label: 'Huruf kapital awal kalimat (Sentence case)', value: 'sentence' },
        { label: 'camelCase (Contoh: namaDepanSaya)', value: 'camel' },
        { label: 'snake_case (Contoh: nama_depan_saya)', value: 'snake' },
        { label: 'kebab-case (Contoh: nama-depan-saya)', value: 'kebab' },
        { label: 'PascalCase (Contoh: NamaDepanSaya)', value: 'pascal' }
      ]
    }
  ],
  process: async (context: ProcessContext): Promise<ProcessResult> => {
    const text = context.textInput || '';
    const targetCase = context.options?.targetCase || 'title';

    let result = '';

    const words = text
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    switch (targetCase) {
      case 'upper':
        result = text.toUpperCase();
        break;
      case 'lower':
        result = text.toLowerCase();
        break;
      case 'title':
        result = text.replace(
          /\b\w+/g,
          (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        );
        break;
      case 'sentence':
        result = text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
        break;
      case 'camel':
        result = words
          .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
          .join('');
        break;
      case 'snake':
        result = words.map((w) => w.toLowerCase()).join('_');
        break;
      case 'kebab':
        result = words.map((w) => w.toLowerCase()).join('-');
        break;
      case 'pascal':
        result = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
        break;
      default:
        result = text;
    }

    return {
      success: true,
      message: 'Format huruf berhasil diubah!',
      downloadName: 'teks_hasil.txt',
      items: [
        {
          id: 'case_result',
          name: 'teks_hasil.txt',
          size: result.length,
          type: 'text/plain',
          textOutput: result,
          blob: new Blob([result], { type: 'text/plain;charset=utf-8' })
        }
      ]
    };
  }
};
