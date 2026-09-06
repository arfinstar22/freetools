import { ToolDefinition, ProcessContext, ProcessResult } from '../../types/tool';

export const timestampConverterTool: ToolDefinition = {
  id: 'timestamp-converter',
  name: 'Konversi Unix Timestamp',
  shortDescription: 'Ubah Unix Epoch timestamp ke tanggal & waktu lokal/UTC',
  description: 'Konversi angka Unix epoch timestamp (detik atau milidetik) menjadi format tanggal dan waktu yang mudah dibaca, serta sebaliknya.',
  category: 'developer',
  inputMode: 'text',
  icon: 'Clock',
  popular: false,
  localProcessing: true,
  supportsBatch: false,
  supportsWorkflow: false,
  keywords: ['timestamp', 'unix timestamp', 'epoch', 'waktu unix', 'konversi tanggal', 'date to timestamp'],
  optionSchemas: [
    {
      id: 'mode',
      label: 'Jenis Input',
      type: 'select',
      defaultValue: 'epoch_to_date',
      options: [
        { label: 'Unix Timestamp → Tanggal & Waktu', value: 'epoch_to_date' },
        { label: 'Tanggal (ISO/String) → Unix Timestamp', value: 'date_to_epoch' },
        { label: 'Waktu Saat Ini (Sekarang)', value: 'now' }
      ]
    }
  ],
  process: async (context: ProcessContext): Promise<ProcessResult> => {
    const raw = (context.textInput || '').trim();
    const mode = context.options?.mode || 'epoch_to_date';

    let d: Date;

    if (mode === 'now' || (!raw && mode === 'epoch_to_date')) {
      d = new Date();
    } else if (mode === 'epoch_to_date') {
      let num = Number(raw);
      if (isNaN(num)) {
        throw new Error('Masukkan angka Unix Timestamp yang valid.');
      }
      // If seconds (10 digits), convert to ms
      if (Math.abs(num) < 10000000000) {
        num = num * 1000;
      }
      d = new Date(num);
    } else {
      // date_to_epoch
      d = new Date(raw);
      if (isNaN(d.getTime())) {
        throw new Error('Format tanggal tidak valid. Contoh: 2026-09-04 15:30:00 atau ISO string.');
      }
    }

    if (isNaN(d.getTime()) || !isFinite(d.getTime())) {
      throw new Error('Nilai timestamp di luar rentang waktu yang didukung.');
    }

    const epochSeconds = Math.floor(d.getTime() / 1000);
    const epochMillis = d.getTime();
    const isoString = d.toISOString();
    const utcString = d.toUTCString();
    const localId = d.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });

    const output = [
      `Unix Timestamp (detik): ${epochSeconds}`,
      `Unix Timestamp (milidetik): ${epochMillis}`,
      `Waktu Lokal Indonesia: ${localId}`,
      `Waktu UTC: ${utcString}`,
      `Format ISO 8601: ${isoString}`,
      `Hari: ${d.toLocaleDateString('id-ID', { weekday: 'long' })}`
    ].join('\n');

    return {
      success: true,
      message: `Konversi selesai: ${localId}`,
      items: [
        {
          id: 'ts_result',
          name: 'timestamp_hasil.txt',
          size: output.length,
          type: 'text/plain',
          textOutput: output,
          metadata: {
            epochSeconds,
            epochMillis,
            isoString,
            localId
          }
        }
      ]
    };
  }
};
