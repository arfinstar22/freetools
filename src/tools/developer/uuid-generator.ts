import { ToolDefinition, ProcessContext, ProcessResult } from '../../types/tool';

export const uuidGeneratorTool: ToolDefinition = {
  id: 'uuid-generator',
  name: 'UUID / GUID Generator',
  shortDescription: 'Generate UUID v4 unik secara massal langsung di browser',
  description: 'Hasilkan ID unik (UUID Version 4 RFC 4122) yang terjamin keunikannya untuk database, primary key, atau testing API.',
  category: 'developer',
  inputMode: 'none',
  icon: 'Hash',
  popular: false,
  localProcessing: true,
  supportsBatch: false,
  supportsWorkflow: false,
  keywords: ['uuid', 'guid', 'unique id', 'uuid v4', 'generate uuid', 'random id'],
  optionSchemas: [
    {
      id: 'count',
      label: 'Jumlah UUID',
      type: 'select',
      defaultValue: '5',
      options: [
        { label: '1 UUID', value: '1' },
        { label: '5 UUID', value: '5' },
        { label: '10 UUID', value: '10' },
        { label: '25 UUID', value: '25' },
        { label: '50 UUID', value: '50' },
        { label: '100 UUID', value: '100' }
      ]
    },
    {
      id: 'format',
      label: 'Gaya Format',
      type: 'select',
      defaultValue: 'standard',
      options: [
        { label: 'Standar (dengan tanda minus)', value: 'standard' },
        { label: 'Tanpa Tanda Minus (Compact)', value: 'no_hyphen' },
        { label: 'HURUF BESAR (Uppercase)', value: 'uppercase' },
        { label: 'Dengan Kurung Kurawal { }', value: 'braces' }
      ]
    }
  ],
  process: async (context: ProcessContext): Promise<ProcessResult> => {
    const count = Math.min(500, Math.max(1, parseInt(context.options?.count || '5', 10) || 5));
    const format = context.options?.format || 'standard';

    const uuids: string[] = [];

    for (let i = 0; i < count; i++) {
      let u = crypto.randomUUID ? crypto.randomUUID() : generateFallbackUUID();

      if (format === 'no_hyphen') {
        u = u.replace(/-/g, '');
      } else if (format === 'uppercase') {
        u = u.toUpperCase();
      } else if (format === 'braces') {
        u = `{${u}}`;
      }

      uuids.push(u);
    }

    const output = uuids.join('\n');

    return {
      success: true,
      message: `Berhasil membuat ${count} UUID v4 unik!`,
      downloadName: 'uuid_list.txt',
      items: [
        {
          id: 'uuid_result',
          name: 'uuid_list.txt',
          size: output.length,
          type: 'text/plain',
          textOutput: output,
          blob: new Blob([output], { type: 'text/plain;charset=utf-8' })
        }
      ]
    };
  }
};

function generateFallbackUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
