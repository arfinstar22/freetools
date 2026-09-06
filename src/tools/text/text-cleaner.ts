import { ToolDefinition, ProcessContext, ProcessResult } from '../../types/tool';

export const textCleanerTool: ToolDefinition = {
  id: 'text-cleaner',
  name: 'Pembersih Teks (Text Cleaner)',
  shortDescription: 'Hapus spasi berlebih, baris kosong, dan tag HTML dalam 1 klik',
  description: 'Rapikan format teks berantakan: hilangkan spasi ganda, hapus baris kosong, bersihkan tag HTML, dan rapikan jeda paragraf.',
  category: 'text',
  inputMode: 'text',
  icon: 'Eraser',
  popular: true,
  localProcessing: true,
  supportsBatch: false,
  supportsWorkflow: true,
  keywords: ['clean text', 'bersihkan teks', 'hapus spasi', 'hapus spasi ganda', 'rapikan teks', 'strip html', 'format teks'],
  optionSchemas: [
    {
      id: 'removeExtraSpaces',
      label: 'Hapus spasi ganda / berlebih',
      type: 'boolean',
      defaultValue: true
    },
    {
      id: 'removeEmptyLines',
      label: 'Hapus baris kosong / jeda enter kosong',
      type: 'boolean',
      defaultValue: true
    },
    {
      id: 'stripHtml',
      label: 'Hapus tag HTML (<p>, <div>, <b>, dll)',
      type: 'boolean',
      defaultValue: false
    },
    {
      id: 'trimLines',
      label: 'Trim spasi di awal & akhir setiap baris',
      type: 'boolean',
      defaultValue: true
    }
  ],
  process: async (context: ProcessContext): Promise<ProcessResult> => {
    let text = context.textInput || '';
    const removeExtraSpaces = context.options?.removeExtraSpaces ?? true;
    const removeEmptyLines = context.options?.removeEmptyLines ?? true;
    const stripHtml = context.options?.stripHtml ?? false;
    const trimLines = context.options?.trimLines ?? true;

    if (stripHtml) {
      text = text.replace(/<[^>]*>/g, '');
    }

    let lines = text.split('\n');

    if (trimLines) {
      lines = lines.map((line) => line.trim());
    }

    if (removeExtraSpaces) {
      lines = lines.map((line) => line.replace(/[ \t]+/g, ' '));
    }

    if (removeEmptyLines) {
      lines = lines.filter((line) => line.length > 0);
    }

    const cleanedText = lines.join('\n');
    const originalLen = (context.textInput || '').length;
    const cleanedLen = cleanedText.length;

    return {
      success: true,
      message: `Teks berhasil dirapikan! (${originalLen - cleanedLen} karakter tidak perlu dibersihkan)`,
      downloadName: 'teks_bersih.txt',
      items: [
        {
          id: 'cleaned_text',
          name: 'teks_bersih.txt',
          size: cleanedLen,
          type: 'text/plain',
          textOutput: cleanedText,
          blob: new Blob([cleanedText], { type: 'text/plain;charset=utf-8' })
        }
      ]
    };
  }
};
