import { IntentResult } from '../types/ai';
import { WorkflowPlan } from '../types/workflow';

interface IntentRule {
  keywords: string[];
  toolId: string;
  goal: string;
  explanation: string;
  preset?: Record<string, any>;
  generateWorkflow?: (query: string) => WorkflowPlan | undefined;
}

const RULES: IntentRule[] = [
  // Multi-step Email/WA Batch Workflow
  {
    keywords: [
      'email', 'wa', 'whatsapp', 'kirim foto', 'banyak foto', 'katalog',
      'dokumentasi', 'arsipkan foto', 'puluhan foto', 'ratusan foto',
      'foto wa', 'kecilkan semua foto', 'kompres semua foto',
      'jadikan zip', 'buat zip', 'dikecilin dan dijadikan zip',
      'foto mau dikecilin dan dijadikan zip'
    ],
    toolId: 'batch-image-processor',
    goal: 'Kirim kumpulan foto lewat Email / WhatsApp / ZIP',
    explanation: 'Untuk kumpulan foto yang ingin dikirim, aku sarankan alur otomatis: Samakan resolusi, kompres ukuran, bersihkan metadata privasi, lalu kemas menjadi 1 file ZIP.',
    generateWorkflow: (query) => {
      const q = query.toLowerCase();
      if (
        q.includes('foto') ||
        q.includes('gambar') ||
        q.includes('jpg') ||
        q.includes('png') ||
        q.includes('zip') ||
        q.includes('wa') ||
        q.includes('email')
      ) {
        return {
          id: 'wf-batch-images',
          title: 'Alur Cepat Kirim Foto (Resize + Kompres + ZIP)',
          goal: 'Optimalkan kumpulan foto agar ringan dan rapi dalam satu file ZIP',
          description: 'Samakan ukuran gambar ke standar web, kompres kualitas seimbang, dan bungkus otomatis ke file ZIP.',
          badge: 'Rekomendasi Alur',
          outputStrategy: 'zip',
          outputZipName: 'freetools_foto_rapi.zip',
          steps: [
            {
              id: 'step_1',
              toolId: 'image-resize',
              name: '1. Samakan Resolusi (Maks 1200px)',
              options: { mode: 'max_pixel', maxDimension: '1200' },
              enabled: true
            },
            {
              id: 'step_2',
              toolId: 'image-compress',
              name: '2. Kompres Ukuran (Hemat ~70%)',
              options: { qualityPreset: 'balanced' },
              enabled: true
            },
            {
              id: 'step_3',
              toolId: 'remove-metadata',
              name: '3. Hapus Metadata Lokasi & Privasi',
              options: { preserveQuality: '0.9' },
              enabled: true
            },
            {
              id: 'step_4',
              toolId: 'zip-pack',
              name: '4. Kemas ke Arsip ZIP',
              options: { zipFilename: 'freetools_foto_rapi.zip' },
              enabled: true
            }
          ]
        };
      }
      return undefined;
    }
  },

  // PDF Compress
  {
    keywords: [
      'kegedean', 'terlalu besar', 'kecilin pdf', 'kompres pdf', 'compress pdf',
      'pdf wa', 'pdf whatsapp', 'kurangi ukuran pdf', 'pdf hemat', 'pdf berat',
      'pdf tidak bisa dikirim', 'ukuran pdf terlalu besar', 'mau kecilin pdf',
      'tolong kecilkan pdf', 'kecilkan file pdf', 'perkecil pdf'
    ],
    toolId: 'compress-pdf',
    goal: 'Mengecilkan ukuran file PDF',
    explanation: 'Bisa. Aku saranin kompres PDF ke ukuran lebih kecil agar mudah dikirim.'
  },

  // PDF Merge
  {
    keywords: [
      'gabung pdf', 'gabungkan pdf', 'satukan pdf', 'merge pdf', 'jadikan satu pdf',
      'kombinasi pdf', 'gabung berkas pdf', 'gabung beberapa pdf', 'satukan dokumen pdf',
      'satukan file pdf', 'kumpul pdf', 'susun pdf'
    ],
    toolId: 'merge-pdf',
    goal: 'Menggabungkan beberapa file PDF jadi 1 dokumen',
    explanation: 'Bisa. Satukan beberapa file PDF menjadi 1 file berurutan secara rapi.'
  },

  // PDF Split
  {
    keywords: [
      'pisah pdf', 'pisahkan pdf', 'split pdf', 'pecah pdf', 'potong pdf',
      'ambil halaman pdf', 'ekstrak halaman pdf', 'bagi pdf', 'ambil beberapa halaman pdf'
    ],
    toolId: 'split-pdf',
    goal: 'Memisahkan halaman-halaman dalam PDF',
    explanation: 'Bisa. Ekstrak halaman tertentu atau pisah setiap lembar menjadi file tersendiri.'
  },

  // JPG to PDF
  {
    keywords: [
      'jpg to pdf', 'foto ke pdf', 'gambar ke pdf', 'png to pdf', 'buat pdf dari foto',
      'jadikan pdf', 'ubah foto jadi pdf', 'konversi gambar ke pdf', 'bikin pdf dari foto'
    ],
    toolId: 'jpg-to-pdf',
    goal: 'Mengubah foto/gambar menjadi file PDF',
    explanation: 'Bisa. Ubah satu atau banyak foto langsung menjadi 1 file dokumen PDF siap print.'
  },

  // PDF to JPG
  {
    keywords: [
      'pdf to jpg', 'pdf to image', 'pdf ke gambar', 'pdf ke foto', 'ubah pdf jadi gambar',
      'ekstrak gambar pdf', 'pdf ke png', 'halaman pdf jadi gambar'
    ],
    toolId: 'pdf-to-jpg',
    goal: 'Mengubah halaman PDF menjadi gambar JPG/PNG',
    explanation: 'Bisa. Render setiap halaman dokumen PDF ke gambar beresolusi tinggi.'
  },

  // Image Compress
  {
    keywords: [
      'kecilin foto', 'kecilin gambar', 'kompres gambar', 'kompres foto',
      'compress image', 'gambar kegedean', 'foto berat', 'kurangi mb foto',
      'kecilkan resolusi', 'kompres jpg', 'kompres png', 'optimasi foto'
    ],
    toolId: 'image-compress',
    goal: 'Mengecilkan ukuran foto/gambar tanpa buram',
    explanation: 'Bisa. Kompres foto langsung di browser agar ukurannya jauh lebih ringan.'
  },

  // Image Resize
  {
    keywords: [
      'resize foto', 'ubah ukuran foto', 'ubah dimensi foto', 'ganti resolusi',
      'pixel foto', 'pas foto', 'skala gambar', 'lebar tinggi foto', 'resolusi foto'
    ],
    toolId: 'image-resize',
    goal: 'Mengubah lebar, tinggi, atau dimensi foto',
    explanation: 'Bisa. Atur dimensi pixel atau persentase skala foto dengan rasio tetap proporsional.'
  },

  // Image Convert
  {
    keywords: [
      'ubah format foto', 'jpg ke png', 'png ke jpg', 'jpg ke webp', 'webp ke jpg',
      'convert gambar', 'ganti format gambar', 'convert foto', 'format webp'
    ],
    toolId: 'image-convert',
    goal: 'Mengubah format file gambar (JPG / PNG / WEBP)',
    explanation: 'Bisa. Ubah format gambar ke format yang kamu inginkan tanpa ribet.'
  },

  // Remove Metadata
  {
    keywords: [
      'hapus exif', 'hapus lokasi', 'privasi foto', 'hapus metadata', 'metadata foto',
      'bersihkan lokasi', 'hilangkan gps foto', 'hapus kamera foto', 'exif remover'
    ],
    toolId: 'remove-metadata',
    goal: 'Menghapus data GPS dan identitas kamera pada foto',
    explanation: 'Bisa. Bersihkan koordinat lokasi GPS dan info perangkat dari foto sebelum disebar.'
  },

  // Batch Image Processing
  {
    keywords: [
      'proses banyak foto', 'batch foto', 'rename banyak foto', 'katalog foto',
      'ubah nama banyak foto', 'proses massal foto'
    ],
    toolId: 'batch-image-processor',
    goal: 'Memproses banyak gambar sekaligus (Batch)',
    explanation: 'Bisa. Resize, kompres, dan rename puluhan foto sekaligus menjadi 1 arsip rapi.'
  },

  // ZIP Pack
  {
    keywords: [
      'buat zip', 'bikin zip', 'jadikan zip', 'arsip zip', 'kompres zip',
      'pack zip', 'kemas file', 'satukan jadi zip'
    ],
    toolId: 'zip-pack',
    goal: 'Mengemas berkas ke dalam file ZIP',
    explanation: 'Bisa. Kemas satu atau banyak file/foto menjadi satu arsip .ZIP terkompresi.'
  },

  // Word Counter
  {
    keywords: [
      'hitung kata', 'word count', 'jumlah kata', 'hitung karakter', 'baca skripsi',
      'berapa kata', 'panjang artikel', 'hitung spasi', 'cek jumlah kata'
    ],
    toolId: 'word-counter',
    goal: 'Menghitung statistik jumlah kata dan estimasi baca',
    explanation: 'Bisa. Analisis jumlah kata, karakter, paragraf, dan waktu baca teksmu.'
  },

  // Text Cleaner
  {
    keywords: [
      'bersihkan teks', 'rapikan teks', 'hapus spasi', 'hapus spasi ganda',
      'hapus enter kosong', 'text cleaner', 'strip html', 'rapikan paragraf'
    ],
    toolId: 'text-cleaner',
    goal: 'Merapikan teks yang berantakan',
    explanation: 'Bisa. Bersihkan spasi ganda, baris kosong, atau tag HTML dalam satu klik.'
  },

  // Diff Checker
  {
    keywords: [
      'beda teks', 'bandingkan teks', 'diff checker', 'cek perbedaan', 'compare text',
      'perbedaan kode', 'bandingkan file', 'cek revisi teks'
    ],
    toolId: 'diff-checker',
    goal: 'Membandingkan perbedaan 2 teks atau kode',
    explanation: 'Bisa. Lihat perbedaan baris dan kata antara dua versi teks secara visual.'
  },

  // Case Converter
  {
    keywords: [
      'huruf besar', 'huruf kecil', 'uppercase', 'lowercase', 'title case',
      'camelcase', 'snake_case', 'kapital', 'huruf besar semua', 'huruf kecil semua'
    ],
    toolId: 'case-converter',
    goal: 'Mengubah format huruf besar dan kecil',
    explanation: 'Bisa. Ubah format teks ke UPPERCASE, lowercase, Title Case, camelCase, dan lainnya.'
  },

  // Remove Duplicates
  {
    keywords: [
      'hapus duplikat', 'baris kembar', 'dedup', 'daftar unik', 'remove duplicate',
      'email duplikat', 'hilangkan nama ganda', 'baris sama'
    ],
    toolId: 'remove-duplicates',
    goal: 'Menghapus baris atau data duplikat',
    explanation: 'Bisa. Hapus baris kembar dan urutkan daftar secara alfabetis.'
  },

  // Find & Replace
  {
    keywords: [
      'cari dan ganti', 'find and replace', 'ganti kata', 'replace all', 'cari kata',
      'ganti kalimat', 'ubah kata serentak'
    ],
    toolId: 'find-replace',
    goal: 'Mencari dan mengganti kata secara serentak',
    explanation: 'Bisa. Cari kata atau pola regex tertentu dan ganti sekaligus di seluruh teks.'
  },

  // JSON Formatter
  {
    keywords: [
      'format json', 'rapikan json', 'beautify json', 'minify json', 'validasi json',
      'json prettify', 'susun json', 'cek json'
    ],
    toolId: 'json-formatter',
    goal: 'Merapikan atau mengecilkan struktur data JSON',
    explanation: 'Bisa. Format JSON dengan indentasi rapi atau minify menjadi satu baris.'
  },

  // Base64
  {
    keywords: [
      'base64', 'encode base64', 'decode base64', 'b64', 'konversi base64', 'teks ke base64'
    ],
    toolId: 'base64-tool',
    goal: 'Melakukan encode atau decode Base64',
    explanation: 'Bisa. Konversi teks ke format Base64 atau kembalikan Base64 ke teks normal.'
  },

  // UUID
  {
    keywords: [
      'uuid', 'guid', 'generate uuid', 'id unik', 'random id', 'primary key', 'bikin uuid'
    ],
    toolId: 'uuid-generator',
    goal: 'Membuat ID unik UUID v4',
    explanation: 'Bisa. Hasilkan UUID v4 acak dan unik dalam format yang kamu butuhkan.'
  },

  // JWT Decoder
  {
    keywords: [
      'jwt', 'decode jwt', 'token payload', 'bearer token', 'json web token',
      'cek expired token', 'baca token jwt'
    ],
    toolId: 'jwt-decoder',
    goal: 'Membongkar data payload dan header JWT',
    explanation: 'Bisa. Decode token JWT secara aman di browser tanpa dikirim ke server.'
  },

  // Timestamp
  {
    keywords: [
      'timestamp', 'unix timestamp', 'epoch', 'waktu unix', 'konversi epoch',
      'date to timestamp', 'ubah epoch ke tanggal'
    ],
    toolId: 'timestamp-converter',
    goal: 'Mengonversi Unix Epoch timestamp ke waktu lokal',
    explanation: 'Bisa. Ubah angka timestamp ke format tanggal jam Indonesia atau sebaliknya.'
  },

  // Regex Tester
  {
    keywords: [
      'regex', 'regular expression', 'uji regex', 'tes regex', 'pola regex', 'cek regex'
    ],
    toolId: 'regex-tester',
    goal: 'Menguji Regular Expression (Regex)',
    explanation: 'Bisa. Uji dan cek kecocokan pola regex terhadap teks contoh secara instan.'
  },

  // Invoice Generator
  {
    keywords: [
      'invoice', 'faktur', 'tagihan', 'buat invoice', 'kwitansi',
      'tagihan freelance', 'surat tagihan', 'bikin faktur', 'faktur pembayaran'
    ],
    toolId: 'invoice-generator',
    goal: 'Membuat surat tagihan / invoice PDF profesional',
    explanation: 'Bisa. Buat invoice PDF formal dengan rincian harga, pajak, dan rekening pembayaran.'
  },

  // CSV Converter
  {
    keywords: [
      'csv to json', 'json to csv', 'konversi csv', 'excel to json',
      'tabel csv', 'ubah csv ke json'
    ],
    toolId: 'csv-json-converter',
    goal: 'Mengonversi data tabel CSV ke JSON atau sebaliknya',
    explanation: 'Bisa. Ubah data CSV menjadi array JSON terstruktur atau sebaliknya.'
  },

  // Split Bill
  {
    keywords: [
      'patungan', 'split bill', 'bagi tagihan', 'hitung patungan',
      'bon makanan', 'bayar bareng', 'bagi bon'
    ],
    toolId: 'expense-splitter',
    goal: 'Menghitung pembagian tagihan & patungan',
    explanation: 'Bisa. Hitung total biaya plus pajak dan bagi rata ke setiap anggota.'
  },

  // Random Group
  {
    keywords: [
      'acak kelompok', 'bagi tim', 'arisan', 'undian nama',
      'random group', 'kelompok kerja', 'bagi kelompok'
    ],
    toolId: 'random-group',
    goal: 'Membagi daftar nama ke dalam beberapa kelompok secara acak',
    explanation: 'Bisa. Bagi peserta ke dalam beberapa kelompok secara adil dan acak.'
  }
];

function normalizeQuery(str: string): string {
  return str
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function analyzeIntentOffline(query: string): IntentResult {
  const normalized = normalizeQuery(query);

  if (!normalized) {
    return {
      rawQuery: query,
      matchedGoal: 'Tidak Diketahui',
      confidence: 0,
      provider: 'local-rules',
      recommendedToolId: undefined,
      explanation: 'Aku belum yakin kamu mau ngapain. Coba tulis kebutuhanmu atau pilih kategori di bawah.',
      privacyNotice: '🔒 Mode Privat aktif — file dan teks tetap di browser kamu.'
    };
  }

  // Check for multi-step workflow query (e.g. mentions multiple actions like photo + compress/resize + zip)
  const isMultiStepQuery =
    (normalized.includes('foto') || normalized.includes('gambar') || normalized.includes('file')) &&
    (normalized.includes('zip') || normalized.includes('semua') || normalized.includes('banyak') || normalized.includes('wa') || normalized.includes('email')) &&
    (normalized.includes('kecil') || normalized.includes('kompres') || normalized.includes('resize') || normalized.includes('disamain'));

  if (isMultiStepQuery) {
    const wfRule = RULES[0]; // Multi-step rule
    const workflow = wfRule.generateWorkflow ? wfRule.generateWorkflow(query) : undefined;
    if (workflow) {
      return {
        rawQuery: query,
        matchedGoal: wfRule.goal,
        confidence: 0.95,
        provider: 'local-rules',
        recommendedToolId: wfRule.toolId,
        workflow,
        explanation: wfRule.explanation,
        privacyNotice: '🔒 Diproses langsung di browser menggunakan rule engine lokal.'
      };
    }
  }

  let bestMatch: IntentRule | null = null;
  let maxScore = 0;

  for (const rule of RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      const normKw = normalizeQuery(kw);
      if (normalized === normKw) {
        score += 30;
      } else if (normalized.includes(normKw)) {
        score += normKw.length * 2;
      } else {
        const kwWords = normKw.split(' ');
        const matchedWords = kwWords.filter((w) => normalized.includes(w));
        if (matchedWords.length === kwWords.length && kwWords.length > 1) {
          score += normKw.length * 1.5;
        }
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = rule;
    }
  }

  // Threshold: Only recommend if confidence score is genuinely positive
  if (bestMatch && maxScore >= 6) {
    const workflow = bestMatch.generateWorkflow ? bestMatch.generateWorkflow(query) : undefined;
    const confidence = Math.min(0.98, 0.65 + Math.min(maxScore, 30) / 100);

    return {
      rawQuery: query,
      matchedGoal: bestMatch.goal,
      confidence,
      provider: 'local-rules',
      recommendedToolId: bestMatch.toolId,
      workflow,
      explanation: bestMatch.explanation,
      privacyNotice: '🔒 Diproses langsung di browser menggunakan rule engine lokal.'
    };
  }

  // Safe fallback when intent is truly unrecognized (NO FAKE RECOMMENDATIONS)
  return {
    rawQuery: query,
    matchedGoal: 'Tidak Ditemukan',
    confidence: 0,
    provider: 'local-rules',
    recommendedToolId: undefined,
    explanation: 'Aku belum yakin kamu mau ngapain. Coba pilih salah satu kategori tool di bawah atau cari langsung nama fungsinya.',
    privacyNotice: '🔒 Privasi aman — file dan teks tetap di browser kamu.'
  };
}
