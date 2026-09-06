import { ToolDefinition, ProcessContext, ProcessResult } from '../../types/tool';

export const expenseSplitterTool: ToolDefinition = {
  id: 'expense-splitter',
  name: 'Hitung Patungan & Bagi Tagihan (Bill Splitter)',
  shortDescription: 'Bagi rata bon makanan, liburan, atau pengeluaran bareng teman',
  description: 'Hitung total tagihan, biaya tambahan (pajak/service charge/tip), dan rincian pembagian per orang dengan verifikasi total tanpa selisih.',
  category: 'office',
  inputMode: 'form',
  icon: 'Calculator',
  popular: false,
  localProcessing: true,
  supportsBatch: false,
  supportsWorkflow: false,
  keywords: ['split bill', 'patungan', 'bagi tagihan', 'hitung patungan', 'bon makanan', 'expense splitter'],
  optionSchemas: [
    {
      id: 'totalBill',
      label: 'Total Tagihan Subtotal (Rp)',
      type: 'number',
      defaultValue: 250000
    },
    {
      id: 'taxPercent',
      label: 'Pajak & Service Charge (%)',
      type: 'number',
      defaultValue: 10
    },
    {
      id: 'memberNames',
      label: 'Nama Anggota (pisahkan dengan koma atau baris baru)',
      type: 'text',
      defaultValue: 'Andi, Budi, Citra, Dedi, Eka'
    },
    {
      id: 'roundingMode',
      label: 'Metode Pembulatan',
      type: 'select',
      defaultValue: 'exact',
      options: [
        { label: 'Tepat / Presisi Rupiah (Tanpa Selisih)', value: 'exact' },
        { label: 'Bulatkan ke atas ke Rp 100 terdekat', value: 'round_100' },
        { label: 'Bulatkan ke atas ke Rp 1.000 terdekat', value: 'round_1000' }
      ]
    }
  ],
  process: async (context: ProcessContext): Promise<ProcessResult> => {
    const rawBill = Number(context.options?.totalBill);
    const totalBill = !isNaN(rawBill) && isFinite(rawBill) && rawBill > 0 ? rawBill : 0;

    const rawTax = Number(context.options?.taxPercent);
    const taxPercent = !isNaN(rawTax) && isFinite(rawTax) && rawTax > 0 ? rawTax : 0;
    const memberStr = context.options?.memberNames !== undefined ? context.options.memberNames : 'Andi, Budi';
    const roundingMode = context.options?.roundingMode || 'exact';

    const members = memberStr
      .split(/[\n,]/)
      .map((m: string) => m.trim())
      .filter(Boolean);

    if (members.length === 0) {
      throw new Error('Masukkan minimal 1 nama anggota.');
    }

    const taxAmount = Math.round((totalBill * taxPercent) / 100);
    const grandTotal = totalBill + taxAmount;

    const basePerPerson = Math.floor(grandTotal / members.length);
    const remainder = grandTotal % members.length;

    let memberPayments: { name: string; amount: number; note?: string }[] = [];

    if (roundingMode === 'round_1000') {
      const rounded = Math.ceil(grandTotal / members.length / 1000) * 1000;
      const totalCollected = rounded * members.length;
      const surplus = totalCollected - grandTotal;
      memberPayments = members.map((name: string) => ({
        name,
        amount: rounded,
        note: surplus > 0 ? `(Termasuk kelebihan kas Rp ${new Intl.NumberFormat('id-ID').format(surplus)})` : undefined
      }));
    } else if (roundingMode === 'round_100') {
      const rounded = Math.ceil(grandTotal / members.length / 100) * 100;
      const totalCollected = rounded * members.length;
      const surplus = totalCollected - grandTotal;
      memberPayments = members.map((name: string) => ({
        name,
        amount: rounded,
        note: surplus > 0 ? `(Termasuk kelebihan kas Rp ${new Intl.NumberFormat('id-ID').format(surplus)})` : undefined
      }));
    } else {
      // Exact distribution with remainder assigned transparently
      memberPayments = members.map((name: string, index: number) => {
        const extra = index < remainder ? 1 : 0;
        return {
          name,
          amount: basePerPerson + extra,
          note: extra > 0 && remainder > 0 ? '(+Rp 1 penyesuaian pecahan)' : undefined
        };
      });
    }

    const totalCalculated = memberPayments.reduce((acc, m) => acc + m.amount, 0);

    const lines = [
      '=== RINCIAN HITUNG PATUNGAN ===',
      `Subtotal: Rp ${new Intl.NumberFormat('id-ID').format(totalBill)}`,
      `Pajak & Service (${taxPercent}%): Rp ${new Intl.NumberFormat('id-ID').format(taxAmount)}`,
      `Grand Total Tagihan: Rp ${new Intl.NumberFormat('id-ID').format(grandTotal)}`,
      `Jumlah Orang: ${members.length} orang`,
      '',
      `👉 ESTIMASI RATA-RATA: Rp ${new Intl.NumberFormat('id-ID').format(Math.round(grandTotal / members.length))} / orang`,
      '',
      '=== DAFTAR PEMBAYARAN ANGGOTA ===',
      ...memberPayments.map((m, i) => `${i + 1}. ${m.name}: Rp ${new Intl.NumberFormat('id-ID').format(m.amount)} ${m.note || ''}`),
      '',
      `Total Terkumpul: Rp ${new Intl.NumberFormat('id-ID').format(totalCalculated)} (${totalCalculated >= grandTotal ? 'Lunas / Cukup' : 'Kurang'})`
    ];

    const outputText = lines.join('\n');

    return {
      success: true,
      message: `Rata-rata bayar Rp ${new Intl.NumberFormat('id-ID').format(memberPayments[0]?.amount || 0)} per orang (${members.length} orang).`,
      downloadName: 'rincian_patungan.txt',
      items: [
        {
          id: 'splitter_result',
          name: 'rincian_patungan.txt',
          size: outputText.length,
          type: 'text/plain',
          textOutput: outputText,
          blob: new Blob([outputText], { type: 'text/plain;charset=utf-8' }),
          metadata: {
            grandTotal,
            totalCalculated,
            membersCount: members.length,
            memberPayments
          }
        }
      ]
    };
  }
};
