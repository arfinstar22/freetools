import { ToolDefinition, ProcessContext, ProcessResult } from '../../types/tool';

export const wordCounterTool: ToolDefinition = {
  id: 'word-counter',
  name: 'Penghitung Kata & Karakter',
  shortDescription: 'Hitung jumlah kata, karakter, paragraf, dan estimasi waktu baca',
  description: 'Analisis teks lengkap: jumlah kata, karakter (dengan & tanpa spasi), kalimat, paragraf, estimasi waktu membaca dan durasi berbicara.',
  category: 'text',
  inputMode: 'text',
  icon: 'FileText',
  popular: true,
  localProcessing: true,
  supportsBatch: false,
  supportsWorkflow: false,
  keywords: ['word counter', 'hitung kata', 'hitung karakter', 'jumlah kata skripsi', 'estimasi baca', 'karakter essay'],
  process: async (context: ProcessContext): Promise<ProcessResult> => {
    const text = context.textInput || '';
    const trimmed = text.trim();

    const charCount = text.length;
    const charNoSpacesCount = text.replace(/\s/g, '').length;
    
    // Words
    const wordsArray = trimmed ? trimmed.split(/\s+/).filter(Boolean) : [];
    const wordCount = wordsArray.length;

    // Sentences
    const sentencesArray = trimmed ? trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0) : [];
    const sentenceCount = sentencesArray.length;

    // Paragraphs
    const paragraphsArray = trimmed ? text.split(/\n+/).filter((p) => p.trim().length > 0) : [];
    const paragraphCount = paragraphsArray.length;

    // Reading time: avg 200 words per minute
    const readingTimeMinutes = (wordCount / 200).toFixed(1);
    // Speaking time: avg 130 words per minute
    const speakingTimeMinutes = (wordCount / 130).toFixed(1);

    const summary = [
      `Kata: ${wordCount}`,
      `Karakter (dengan spasi): ${charCount}`,
      `Karakter (tanpa spasi): ${charNoSpacesCount}`,
      `Kalimat: ${sentenceCount}`,
      `Paragraf: ${paragraphCount}`,
      `Estimasi Waktu Baca: ~${readingTimeMinutes} menit`,
      `Estimasi Waktu Bicara: ~${speakingTimeMinutes} menit`
    ].join('\n');

    return {
      success: true,
      message: `Teks memiliki ${wordCount} kata dan ${charCount} karakter.`,
      items: [
        {
          id: 'wc_result',
          name: 'Hasil Analisis Kata.txt',
          size: text.length,
          type: 'text/plain',
          textOutput: summary,
          metadata: {
            wordCount,
            charCount,
            charNoSpacesCount,
            sentenceCount,
            paragraphCount,
            readingTimeMinutes,
            speakingTimeMinutes
          }
        }
      ]
    };
  }
};
