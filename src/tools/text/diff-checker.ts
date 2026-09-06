import { ToolDefinition, ProcessContext, ProcessResult } from '../../types/tool';
import * as Diff from 'diff';

export const diffCheckerTool: ToolDefinition = {
  id: 'diff-checker',
  name: 'Diff Checker (Bandingkan Teks)',
  shortDescription: 'Bandingkan perbedaan 2 teks atau kode secara instan',
  description: 'Temukan perbedaan baris, kata, atau karakter antara teks lama dan teks baru secara visual dengan penanda penambahan (+) dan penghapusan (-).',
  category: 'text',
  inputMode: 'form',
  icon: 'GitCompare',
  popular: true,
  localProcessing: true,
  supportsBatch: false,
  supportsWorkflow: false,
  keywords: ['diff', 'bandingkan', 'beda teks', 'compare text', 'cek perbedaan kode', 'diff checker'],
  optionSchemas: [
    {
      id: 'originalText',
      label: 'Teks / Kode Asli (Versi Lama)',
      type: 'textarea',
      defaultValue: 'Nama: Andi\nKota: Jakarta\nStatus: Aktif',
      rows: 6
    },
    {
      id: 'modifiedText',
      label: 'Teks / Kode Baru (Versi Revisi)',
      type: 'textarea',
      defaultValue: 'Nama: Andi Saputra\nKota: Bandung\nStatus: Aktif',
      rows: 6
    },
    {
      id: 'diffType',
      label: 'Jenis Pembandingan',
      type: 'select',
      defaultValue: 'lines',
      options: [
        { label: 'Per Baris (Lines)', value: 'lines' },
        { label: 'Per Kata (Words)', value: 'words' },
        { label: 'Per Karakter (Characters)', value: 'chars' }
      ]
    }
  ],
  process: async (context: ProcessContext): Promise<ProcessResult> => {
    const text1 = context.options?.originalText ?? '';
    const text2 = context.options?.modifiedText ?? '';
    const diffType = context.options?.diffType || 'lines';

    let changes: Diff.Change[] = [];

    if (diffType === 'words') {
      changes = (Diff.diffWords(text1, text2) || []) as Diff.Change[];
    } else if (diffType === 'chars') {
      changes = (Diff.diffChars(text1, text2) || []) as Diff.Change[];
    } else {
      changes = (Diff.diffLines(text1, text2) || []) as Diff.Change[];
    }

    let additions = 0;
    let deletions = 0;
    let unchanged = 0;

    const diffLines: string[] = [];
    diffLines.push('=== HASIL PERBANDINGAN TEKS (DIFF) ===');
    diffLines.push(`Metode: ${diffType === 'words' ? 'Per Kata' : diffType === 'chars' ? 'Per Karakter' : 'Per Baris'}`);
    diffLines.push('');

    changes.forEach((part) => {
      const count = part.count || (part.value.split('\n').length - 1) || 1;
      if (part.added) {
        additions += count;
        diffLines.push(`[+] ${part.value.replace(/\n$/, '')}`);
      } else if (part.removed) {
        deletions += count;
        diffLines.push(`[-] ${part.value.replace(/\n$/, '')}`);
      } else {
        unchanged += count;
        diffLines.push(`    ${part.value.replace(/\n$/, '')}`);
      }
    });

    const isIdentical = additions === 0 && deletions === 0;

    return {
      success: true,
      message: isIdentical
        ? 'Kedua teks identik sama persis!'
        : `Ditemukan perbedaan: +${additions} penambahan, -${deletions} penghapusan.`,
      downloadName: 'hasil_perbandingan_diff.txt',
      items: [
        {
          id: 'diff_result',
          name: 'hasil_perbandingan_diff.txt',
          size: (text1 + text2).length,
          type: 'text/plain',
          textOutput: diffLines.join('\n'),
          blob: new Blob([diffLines.join('\n')], { type: 'text/plain;charset=utf-8' }),
          metadata: {
            changes,
            additions,
            deletions,
            unchanged,
            isIdentical
          }
        }
      ]
    };
  }
};
