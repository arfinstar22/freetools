import { ToolDefinition, ProcessContext, ProcessResult } from '../../types/tool';

export const jsonFormatterTool: ToolDefinition = {
  id: 'json-formatter',
  name: 'JSON Formatter & Minifier',
  shortDescription: 'Format, validasi, dan kecilkan struktur JSON berantakan',
  description: 'Rapikan JSON yang tidak terstruktur dengan indentasi rapi (2 atau 4 spasi), urutkan key, validasi sintaks, atau kecilkan (minify) untuk payload API.',
  category: 'developer',
  inputMode: 'text',
  icon: 'Code2',
  popular: true,
  localProcessing: true,
  supportsBatch: false,
  supportsWorkflow: true,
  keywords: ['json', 'format json', 'beautify json', 'minify json', 'validasi json', 'json prettify', 'developer tool'],
  optionSchemas: [
    {
      id: 'action',
      label: 'Tindakan',
      type: 'select',
      defaultValue: 'format_2',
      options: [
        { label: 'Format Rapi (2 Spasi)', value: 'format_2' },
        { label: 'Format Rapi (4 Spasi)', value: 'format_4' },
        { label: 'Format Rapi (Tab)', value: 'format_tab' },
        { label: 'Kecilkan / Minify (1 Baris)', value: 'minify' }
      ]
    },
    {
      id: 'sortKeys',
      label: 'Urutkan Kunci (Sort Keys A-Z)',
      type: 'boolean',
      defaultValue: false
    }
  ],
  process: async (context: ProcessContext): Promise<ProcessResult> => {
    const raw = (context.textInput || '').trim();
    if (!raw) {
      throw new Error('Masukkan data JSON yang ingin diformat.');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch (e: any) {
      throw new Error(`JSON tidak valid: ${e.message}`);
    }

    const sortKeys = context.options?.sortKeys ?? false;
    if (sortKeys) {
      parsed = sortObjectKeys(parsed);
    }

    const action = context.options?.action || 'format_2';
    let output = '';

    if (action === 'minify') {
      output = JSON.stringify(parsed);
    } else if (action === 'format_4') {
      output = JSON.stringify(parsed, null, 4);
    } else if (action === 'format_tab') {
      output = JSON.stringify(parsed, null, '\t');
    } else {
      output = JSON.stringify(parsed, null, 2);
    }

    return {
      success: true,
      message: action === 'minify' ? 'JSON berhasil diminify!' : 'JSON berhasil dirapikan!',
      downloadName: 'data.json',
      items: [
        {
          id: 'json_result',
          name: 'data.json',
          size: output.length,
          type: 'application/json',
          textOutput: output,
          blob: new Blob([output], { type: 'application/json;charset=utf-8' })
        }
      ]
    };
  }
};

function sortObjectKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj)
      .filter((k) => k !== '__proto__' && k !== 'constructor' && k !== 'prototype')
      .sort()
      .reduce((result: Record<string, any>, key: string) => {
        result[key] = sortObjectKeys(obj[key]);
        return result;
      }, Object.create(null));
  }
  return obj;
}
