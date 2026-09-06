import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { ToolDefinition, ProcessContext, ProcessResult } from '../../types/tool';

function sanitizePdfText(str: string): string {
  // Replace unencodable characters for standard Helvetica (WinAnsi)
  return str.replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ').trim();
}

export const invoiceGeneratorTool: ToolDefinition = {
  id: 'invoice-generator',
  name: 'Pembuat Invoice PDF (Invoice Generator)',
  shortDescription: 'Buat tagihan/invoice profesional siap cetak & kirim ke klien',
  description: 'Buat surat tagihan atau faktur formal dalam hitungan detik. Bebas watermark, tanpa perlu login, langsung jadi PDF rapi.',
  category: 'office',
  inputMode: 'form',
  icon: 'Receipt',
  popular: true,
  localProcessing: true,
  supportsBatch: false,
  supportsWorkflow: false,
  keywords: ['invoice', 'faktur', 'tagihan', 'buat invoice', 'kwitansi', 'invoice generator', 'freelance invoice'],
  optionSchemas: [
    {
      id: 'invoiceNumber',
      label: 'Nomor Invoice',
      type: 'text',
      defaultValue: 'INV-2026-001'
    },
    {
      id: 'senderName',
      label: 'Nama Kamu / Perusahaan / Freelancer',
      type: 'text',
      defaultValue: 'Studio Kreatif Digital'
    },
    {
      id: 'clientName',
      label: 'Nama Klien / Perusahaan Tujuan',
      type: 'text',
      defaultValue: 'PT Mitra Sukses Abadi'
    },
    {
      id: 'itemName1',
      label: 'Deskripsi Jasa / Barang #1',
      type: 'text',
      defaultValue: 'Desain UI/UX Website & Prototyping'
    },
    {
      id: 'itemPrice1',
      label: 'Harga Barang/Jasa #1 (Rp)',
      type: 'number',
      defaultValue: 3500000
    },
    {
      id: 'itemName2',
      label: 'Deskripsi Jasa / Barang #2 (Opsional)',
      type: 'text',
      defaultValue: 'Pengembangan Frontend & Responsive Layout'
    },
    {
      id: 'itemPrice2',
      label: 'Harga Barang/Jasa #2 (Rp)',
      type: 'number',
      defaultValue: 4500000
    },
    {
      id: 'bankDetails',
      label: 'Informasi Pembayaran / Rekening Bank',
      type: 'text',
      defaultValue: 'BCA: 123-456-7890 a/n Studio Kreatif'
    }
  ],
  process: async (context: ProcessContext): Promise<ProcessResult> => {
    const opts = context.options || {};
    const invNum = sanitizePdfText(opts.invoiceNumber || 'INV-001') || 'INV-001';
    const sender = sanitizePdfText(opts.senderName || 'Penyedia Jasa') || 'Penyedia Jasa';
    const client = sanitizePdfText(opts.clientName || 'Klien') || 'Klien';
    const item1 = sanitizePdfText(opts.itemName1 || 'Jasa Konsultasi') || 'Jasa Konsultasi';
    const price1 = Math.max(0, Number(opts.itemPrice1) || 0);
    const item2 = sanitizePdfText(opts.itemName2 || '');
    const price2 = Math.max(0, Number(opts.itemPrice2) || 0);
    const bank = sanitizePdfText(opts.bankDetails || 'Transfer Bank') || 'Transfer Bank';

    const total = price1 + price2;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { width, height } = page.getSize();

    // Top Header Banner
    page.drawRectangle({
      x: 0,
      y: height - 100,
      width: width,
      height: 100,
      color: rgb(0.06, 0.09, 0.16) // slate-900
    });

    page.drawText('INVOICE', {
      x: 40,
      y: height - 60,
      size: 28,
      font: fontBold,
      color: rgb(0.13, 0.77, 0.36) // Brand green
    });

    page.drawText(`# ${invNum}`, {
      x: width - 180,
      y: height - 56,
      size: 14,
      font: fontBold,
      color: rgb(1, 1, 1)
    });

    const todayStr = new Date().toLocaleDateString('id-ID', { dateStyle: 'long' });

    // Details info
    let currentY = height - 140;

    page.drawText('Diterbitkan Oleh:', { x: 40, y: currentY, size: 10, font: fontBold, color: rgb(0.4, 0.4, 0.4) });
    page.drawText('Ditujukan Kepada:', { x: 300, y: currentY, size: 10, font: fontBold, color: rgb(0.4, 0.4, 0.4) });

    currentY -= 18;
    page.drawText(sender, { x: 40, y: currentY, size: 12, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(client, { x: 300, y: currentY, size: 12, font: fontBold, color: rgb(0.1, 0.1, 0.1) });

    currentY -= 16;
    page.drawText(`Tanggal: ${todayStr}`, { x: 40, y: currentY, size: 10, font, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(`Status: Menunggu Pembayaran`, { x: 300, y: currentY, size: 10, font, color: rgb(0.3, 0.3, 0.3) });

    // Items table header
    currentY -= 40;
    page.drawRectangle({
      x: 40,
      y: currentY - 6,
      width: width - 80,
      height: 24,
      color: rgb(0.94, 0.95, 0.96)
    });

    page.drawText('DESKRIPSI', { x: 50, y: currentY, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText('JUMLAH (IDR)', { x: width - 160, y: currentY, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2) });

    // Item 1
    currentY -= 30;
    page.drawText(item1, { x: 50, y: currentY, size: 11, font, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(`Rp ${new Intl.NumberFormat('id-ID').format(price1)}`, { x: width - 160, y: currentY, size: 11, font, color: rgb(0.1, 0.1, 0.1) });

    // Item 2
    if (item2) {
      currentY -= 25;
      page.drawText(item2, { x: 50, y: currentY, size: 11, font, color: rgb(0.1, 0.1, 0.1) });
      page.drawText(`Rp ${new Intl.NumberFormat('id-ID').format(price2)}`, { x: width - 160, y: currentY, size: 11, font, color: rgb(0.1, 0.1, 0.1) });
    }

    // Divider line
    currentY -= 20;
    page.drawLine({
      start: { x: 40, y: currentY },
      end: { x: width - 40, y: currentY },
      thickness: 1,
      color: rgb(0.85, 0.85, 0.85)
    });

    // Total
    currentY -= 30;
    page.drawText('TOTAL PEMBAYARAN:', { x: width - 280, y: currentY, size: 12, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(`Rp ${new Intl.NumberFormat('id-ID').format(total)}`, { x: width - 160, y: currentY, size: 14, font: fontBold, color: rgb(0.08, 0.6, 0.28) });

    // Bank details box
    currentY -= 80;
    page.drawRectangle({
      x: 40,
      y: currentY - 10,
      width: width - 80,
      height: 55,
      color: rgb(0.97, 0.99, 0.97),
      borderColor: rgb(0.7, 0.9, 0.7),
      borderWidth: 1
    });

    page.drawText('Informasi Pembayaran / Transfer:', { x: 55, y: currentY + 24, size: 10, font: fontBold, color: rgb(0.1, 0.5, 0.2) });
    page.drawText(bank, { x: 55, y: currentY + 6, size: 11, font, color: rgb(0.2, 0.2, 0.2) });

    // Footer note
    page.drawText('Dibuat secara gratis dan aman dengan FreeTools (freetools-darfin.my.id)', {
      x: 40,
      y: 40,
      size: 9,
      font,
      color: rgb(0.6, 0.6, 0.6)
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    const filename = `Invoice_${invNum}.pdf`;

    return {
      success: true,
      message: `Invoice #${invNum} berhasil dibuat!`,
      downloadName: filename,
      items: [
        {
          id: 'invoice_pdf',
          name: filename,
          size: blob.size,
          type: 'application/pdf',
          blob
        }
      ]
    };
  }
};
