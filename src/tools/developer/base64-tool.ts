import { ToolDefinition, ProcessContext, ProcessResult } from '../../types/tool';

export const base64Tool: ToolDefinition = {
  id: 'base64-tool',
  name: 'Base64 Encoder & Decoder',
  shortDescription: 'Encode & decode teks atau file ke format Base64 secara instan',
  description: 'Konversi teks atau berkas menjadi string Base64 yang aman untuk transfer data, atau decode Base64 kembali ke bentuk aslinya.',
  category: 'developer',
  inputMode: 'text',
  icon: 'Binary',
  popular: false,
  localProcessing: true,
  supportsBatch: false,
  supportsWorkflow: true,
  keywords: ['base64', 'encode base64', 'decode base64', 'konversi base64', 'b64', 'data url'],
  optionSchemas: [
    {
      id: 'mode',
      label: 'Mode Operasi',
      type: 'select',
      defaultValue: 'encode',
      options: [
        { label: 'Encode (Teks → Base64)', value: 'encode' },
        { label: 'Decode (Base64 → Teks)', value: 'decode' }
      ]
    }
  ],
  process: async (context: ProcessContext): Promise<ProcessResult> => {
    const input = (context.textInput || '').trim();
    if (!input) {
      throw new Error('Masukkan teks atau string Base64 yang ingin diproses.');
    }

    const mode = context.options?.mode || 'encode';
    let output = '';

    if (mode === 'encode') {
      try {
        const bytes = new TextEncoder().encode(input);
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        output = btoa(binary);
      } catch (err: any) {
        throw new Error(`Gagal mengenkode teks: ${err.message}`);
      }
    } else {
      try {
        const binary = atob(input);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        output = new TextDecoder().decode(bytes);
      } catch {
        throw new Error('Format Base64 tidak valid atau string rusak.');
      }
    }

    return {
      success: true,
      message: mode === 'encode' ? 'Teks berhasil di-encode ke Base64!' : 'Base64 berhasil di-decode ke teks!',
      downloadName: mode === 'encode' ? 'base64_encoded.txt' : 'decoded_text.txt',
      items: [
        {
          id: 'base64_result',
          name: mode === 'encode' ? 'base64_encoded.txt' : 'decoded_text.txt',
          size: output.length,
          type: 'text/plain',
          textOutput: output,
          blob: new Blob([output], { type: 'text/plain;charset=utf-8' })
        }
      ]
    };
  }
};
