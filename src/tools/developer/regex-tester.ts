import { ToolDefinition, ProcessContext, ProcessResult } from '../../types/tool';

export const regexTesterTool: ToolDefinition = {
  id: 'regex-tester',
  name: 'Regex Tester (Uji Pola Regex)',
  shortDescription: 'Uji regular expression dengan teks contoh secara langsung',
  description: 'Uji dan debug pola regex dengan highlight hasil pencocokan, capture groups, dan perlindungan keamanan ReDoS otomatis.',
  category: 'developer',
  inputMode: 'text',
  icon: 'SearchCheck',
  popular: false,
  localProcessing: true,
  supportsBatch: false,
  supportsWorkflow: false,
  keywords: ['regex', 'regex tester', 'regular expression', 'cek regex', 'uji regex', 'pola teks'],
  optionSchemas: [
    {
      id: 'pattern',
      label: 'Pola Regex (tanpa tanda slash)',
      type: 'text',
      defaultValue: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}'
    },
    {
      id: 'flags',
      label: 'Flags (g = global, i = case-insensitive, m = multiline)',
      type: 'text',
      defaultValue: 'g'
    }
  ],
  process: async (context: ProcessContext): Promise<ProcessResult> => {
    let testText = context.textInput || context.options?.testText || '';
    const pattern = (context.options?.pattern || '').trim();
    let flags = (context.options?.flags || 'g').replace(/[^gimsuy]/g, '');

    if (!pattern) {
      throw new Error('Masukkan pola regular expression yang ingin diuji.');
    }

    // Protection against excessive memory / ReDoS freeze
    if (testText.length > 100000) {
      testText = testText.slice(0, 100000);
    }

    if (!flags.includes('g')) {
      flags += 'g';
    }

    // Heuristic pre-check for dangerous nested quantifiers causing exponential catastrophic backtracking ReDoS (e.g. (a+)+, (\w+)*)
    const hasNestedQuantifier = /\([^)]*(\+|\*|\{\d+,?\d*\})[^)]*\)(\+|\*|\{\d+,?\d*\})/.test(pattern);
    if (hasNestedQuantifier && testText.length > 20) {
      throw new Error('Pola regex mengandung nested quantifiers yang memicu ReDoS / catastrophic backtracking (misal: (a+)+). Gunakan pola yang lebih spesifik.');
    }

    try {
      const regex = new RegExp(pattern, flags);
      const matches: { match: string; index: number; groups?: Record<string, string> }[] = [];

      const startTime = performance.now();
      let match: RegExpExecArray | null;
      let count = 0;
      const MAX_MATCHES = 500;
      const MAX_EXEC_TIME_MS = 500;

      while ((match = regex.exec(testText)) !== null && count < MAX_MATCHES) {
        if (performance.now() - startTime > MAX_EXEC_TIME_MS) {
          throw new Error('Pola regex membutuhkan waktu komputasi terlalu lama (potensi ReDoS). Eksekusi dihentikan demi keamanan browser.');
        }

        matches.push({
          match: match[0],
          index: match.index,
          groups: match.groups ? { ...match.groups } : undefined
        });

        if (match[0].length === 0) {
          regex.lastIndex++;
        }
        count++;
      }

      const patternLabel = 'Pola: /' + pattern + '/' + flags;
      const matchLimitLabel = count >= MAX_MATCHES ? ' (Dibatasi maks 500 kecocokan)' : '';

      const summary = [
        patternLabel,
        'Jumlah Cocok: ' + matches.length + matchLimitLabel,
        'Panjang Teks Diuji: ' + testText.length + ' karakter',
        '',
        '=== HASIL PENCOCOKAN ===',
        ...(matches.length > 0
          ? matches.map((m, i) => '#' + (i + 1) + ' [Karakter ke-' + m.index + ']: "' + m.match + '"')
          : ['(Tidak ada kecocokan yang ditemukan pada teks contoh)']),
        ...(matches.some((m) => m.groups)
          ? [
              '',
              '=== CAPTURE GROUPS ===',
              ...matches
                .filter((m) => m.groups)
                .map((m, i) => '#' + (i + 1) + ': ' + JSON.stringify(m.groups))
            ]
          : [])
      ].join('\n');

      return {
        success: true,
        message: matches.length > 0
          ? 'Ditemukan ' + matches.length + ' kecocokan pola regex!'
          : 'Pola valid, namun tidak ditemukan kecocokan pada teks.',
        downloadName: 'regex_matches.txt',
        items: [
          {
            id: 'regex_result',
            name: 'regex_matches.txt',
            size: summary.length,
            type: 'text/plain',
            textOutput: summary,
            metadata: {
              pattern,
              flags,
              matchesCount: matches.length,
              matches
            }
          }
        ]
      };
    } catch (err: any) {
      throw new Error(`Sintaks Regex tidak valid: ${err.message || ''}`);
    }
  }
};
