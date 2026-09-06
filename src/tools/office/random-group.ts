import { ToolDefinition, ProcessContext, ProcessResult } from '../../types/tool';

export const randomGroupTool: ToolDefinition = {
  id: 'random-group',
  name: 'Acak Kelompok / Tim (Random Group)',
  shortDescription: 'Bagi daftar nama peserta ke dalam beberapa kelompok secara adil',
  description: 'Bagi nama siswa, peserta workshop, tim proyek, atau arisan ke dalam sejumlah kelompok secara acak dan seimbang.',
  category: 'office',
  inputMode: 'text',
  icon: 'Users',
  popular: false,
  localProcessing: true,
  supportsBatch: false,
  supportsWorkflow: false,
  keywords: ['random group', 'acak kelompok', 'bagi tim', 'arisan', 'undian nama', 'pembagian grup'],
  optionSchemas: [
    {
      id: 'groupCount',
      label: 'Jumlah Kelompok yang Dibentuk',
      type: 'number',
      defaultValue: 3
    }
  ],
  process: async (context: ProcessContext): Promise<ProcessResult> => {
    const text = (context.textInput || '').trim();
    if (!text) {
      throw new Error('Masukkan daftar nama (satu nama per baris atau dipisahkan koma).');
    }

    const parsedCount = parseInt(context.options?.groupCount || '3', 10);
    const groupCount = Math.max(1, isNaN(parsedCount) ? 3 : parsedCount);

    // Parse names from lines or commas
    const names = text
      .split(/[\n,]/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (names.length < groupCount) {
      throw new Error(`Jumlah nama (${names.length}) lebih sedikit dari jumlah kelompok (${groupCount}).`);
    }

    // Fisher-Yates shuffle
    const shuffled = [...names];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const groups: string[][] = Array.from({ length: groupCount }, () => []);
    shuffled.forEach((name, index) => {
      groups[index % groupCount].push(name);
    });

    const lines: string[] = [];
    lines.push(`=== HASIL PEMBAGIAN ${groupCount} KELOMPOK ===`);
    lines.push(`Total Peserta: ${names.length} orang\n`);

    groups.forEach((group, idx) => {
      lines.push(`👥 KELOMPOK ${idx + 1} (${group.length} orang):`);
      group.forEach((member, mIdx) => {
        lines.push(`  ${mIdx + 1}. ${member}`);
      });
      lines.push('');
    });

    const output = lines.join('\n');

    return {
      success: true,
      message: `Berhasil membagi ${names.length} orang ke dalam ${groupCount} kelompok!`,
      downloadName: 'pembagian_kelompok.txt',
      items: [
        {
          id: 'groups_result',
          name: 'pembagian_kelompok.txt',
          size: output.length,
          type: 'text/plain',
          textOutput: output,
          blob: new Blob([output], { type: 'text/plain;charset=utf-8' })
        }
      ]
    };
  }
};
