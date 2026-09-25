# FreeTools — Workspace Utilitas Gratis & Privacy-First

> **"Tinggal bilang mau ngapain, lalu FreeTools membantu menemukan cara tercepat untuk menyelesaikannya."**

FreeTools adalah web utility workspace gratis dan *privacy-first* untuk mengolah PDF, gambar, teks, data developer, dan keperluan kantor langsung di browser tanpa perlu registrasi/login, tanpa watermark, dan tanpa mengunggah file ke server.

---

## 🌟 Fitur Utama

- **🔒 Local-First Processing**: 100% file diproses langsung di browser menggunakan WebAssembly, Canvas 2D, dan JavaScript memory lokal. Dokumen Anda tidak pernah dikirim ke server.
- **⚡ "Mau Ngapain?" Intent Bar**: Cukup tuliskan kebutuhan harian Anda dalam Bahasa Indonesia (contoh: *"kecilin PDF ini biar bisa dikirim lewat WA"*), FreeTools akan otomatis menemukan tool atau workflow yang paling sesuai.
- **📁 File-First Assistant**: Drop file apapun (PDF, foto, teks, tabel), sistem otomatis mengklasifikasikan tipe file dan memberikan rekomendasi tindakan yang relevan.
- **🔄 Workflow Automation**: Menjalankan alur kerja berantai (misal: *Resize Foto → Kompres → Hapus Metadata EXIF → Kemas ZIP*) dalam satu klik tanpa upload-download berulang.
- **🛡️ Mode Privat (Zero-Network)**: Mode khusus untuk mematikan semua integrasi AI dan hanya menggunakan rule engine lokal offline 100%.
- **📱 PWA & Offline Support**: Dapat di-install sebagai aplikasi desktop/mobile dan tetap berfungsi saat tidak ada koneksi internet.

---

## 🛠️ Daftar Tools (29 Utilitas Siap Pakai)

### 📄 PDF (5 Tools)
- **Kompres PDF**: Kecilkan ukuran file PDF agar mudah dikirim via WhatsApp/Email.
- **Gabungkan PDF**: Satukan beberapa file PDF menjadi 1 dokumen berurutan.
- **Pisahkan PDF**: Ekstrak halaman tertentu atau pecah per lembar.
- **Gambar ke PDF**: Konversi foto (JPG/PNG/WEBP) menjadi dokumen PDF siap cetak.
- **PDF ke Gambar**: Render setiap halaman PDF menjadi gambar kualitas tinggi.

### 🖼️ Gambar & Foto (7 Tools)
- **Kompres Gambar**: Kecilkan ukuran JPG/PNG/WEBP dengan menjaga transparansi dan ketajaman.
- **Ubah Ukuran (Resize)**: Atur dimensi pixel atau persentase skala foto.
- **Ubah Format**: Konversi antar format WEBP, JPG, dan PNG.
- **Hapus Metadata (EXIF)**: Bersihkan koordinat GPS dan identitas kamera untuk privasi.
- **Proses Gambar Massal**: Resize, kompres, dan rename puluhan foto sekaligus menjadi 1 arsip ZIP.
- **Hapus Background Foto**: Hapus latar belakang foto otomatis dengan AI (ISNet) — gratis, model di-cache untuk offline.
- **Hapus Watermark Foto**: Hapus watermark/logo dari foto dengan dual-mode: Basic (Telea offline) & AI (LaMa inpainting).

### ✍️ Teks & Penulisan (6 Tools)
- **Penghitung Kata**: Analisis jumlah kata, karakter, paragraf, dan estimasi waktu baca.
- **Pembersih Teks**: Hapus spasi ganda, baris kosong, dan tag HTML dalam 1 klik.
- **Diff Checker**: Bandingkan perbedaan dua versi teks/kode secara visual.
- **Konversi Huruf**: Ubah teks ke UPPERCASE, lowercase, Title Case, camelCase, snake_case.
- **Hapus Baris Duplikat**: Bersihkan daftar email/kata yang kembar secara otomatis.
- **Cari & Ganti**: Cari dan ganti kata serentak dengan dukungan Regex.

### 💻 Developer Tools (6 Tools)
- **JSON Formatter & Minifier**: Format indentasi rapi atau kecilkan payload JSON.
- **Base64 Encoder / Decoder**: Konversi teks UTF-8 ke Base64 dan sebaliknya.
- **UUID Generator**: Hasilkan UUID v4 unik RFC 4122 secara massal.
- **JWT Decoder**: Bongkar header dan payload token JWT serta cek status expired.
- **Timestamp Converter**: Konversi Unix Epoch timestamp ke tanggal waktu lokal Indonesia.
- **Regex Tester**: Uji pola Regular Expression dengan proteksi keamanan ReDoS.

### 💼 Kantor & Utilitas (5 Tools)
- **Pembuat Invoice PDF**: Buat surat tagihan/faktur formal siap cetak tanpa login.
- **CSV ↔ JSON Converter**: Konversi tabel spreadsheet CSV ke JSON array atau sebaliknya.
- **Expense Splitter**: Hitung patungan bon makanan/liburan dengan verifikasi total tanpa selisih.
- **Acak Kelompok**: Bagi daftar nama tim/peserta ke dalam beberapa grup secara adil.
- **Buat Arsip ZIP**: Kemas kumpulan file menjadi arsip `.zip` langsung di browser.

---

## 🏗️ Arsitektur Sistem

```text
User
  │
  ├── File Detector (MIME + Extension Classification, Object URL Lifecycle)
  │
  ├── Intent Layer
  │     ├── Mode Privat (100% Offline Rule Matching)
  │     ├── Secure AI Gateway (/api/ai-intent — Serverless OpenRouter Proxy)
  │     └── Strict AI Action Validation Gate (Tool Registry Allowlist)
  │
  ├── Tool Registry (Central Schema Manifest)
  │     ├── PDF Engine (pdf-lib, pdfjs-dist)
  │     ├── Image Engine (HTML5 Canvas 2D, Blob, WebP/JPG/PNG)
  │     ├── AI Image Engine (ISNet Background Removal, LaMa ONNX Inpainting, Telea FMM)
  │     ├── Text Engine (diff, regex, formatters)
  │     └── Office Engine (pdf-lib, jszip, csv-parsers)
  │
  └── Workflow Pipeline Engine (Sequential File Transformation & Adaptive Output)
```

---

## 🔒 Model Privasi & Keamanan

1. **Pemrosesan Lokal (Client-Side)**: Seluruh pemrosesan file (PDF, gambar, teks) dieksekusi di memori browser perangkat pengguna. Tidak ada file yang diunggah ke server FreeTools.
2. **AI Gateway Terisolasi**: AI **hanya** menerima teks kalimat kebutuhan pengguna (maks 500 karakter). Isi berkas dokumen/foto **tidak pernah** dikirim ke AI.
3. **Mode Privat**: Saat Mode Privat diaktifkan, frontend melakukan **0 network requests** ke endpoint AI dan sepenuhnya mengandalkan mesin rule lokal.
4. **Secret Protection**: API Key AI tersimpan secara aman di backend serverless environment dan tidak pernah bocor ke client bundle.

---

## 🚀 Memulai Pengembangan Lokal

### Prasyarat
- Node.js >= 18.0.0
- npm >= 9.0.0

### Instalasi & Menjalankan

```bash
# Clone repository
git clone https://github.com/anomalyco/opencode.git
cd projectTools

# Install dependensi
npm install

# Jalankan development server
npm run dev
```

Buka `http://localhost:5173` di browser Anda.

### Menjalankan Testing & Linting

```bash
# Jalankan Unit & Integration Tests (Vitest)
npm run test

# Jalankan Linter (Oxlint)
npm run lint

# Jalankan Production Build (TypeScript + Vite)
npm run build
```

---

## ⚙️ Konfigurasi Environment (Opsional untuk AI Gateway)

Salin file `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Isi variabel berikut jika ingin mengaktifkan integrasi AI OpenRouter:

```env
# Server-side API key (HANYA terbaca di serverless gateway, tidak masuk bundle client)
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free

# Opsional: Custom Proxy URL jika gateway di-deploy terpisah
# VITE_AI_PROXY_URL=/api/ai-intent
```

*Catatan: Jika `OPENROUTER_API_KEY` tidak diisi, FreeTools tetap berfungsi 100% menggunakan rule-based intent engine lokal.*

---

## 📦 Panduan Deployment

FreeTools siap di-deploy ke platform serverless / static hosting modern:

### Vercel
```bash
vercel deploy --prod
```
Pastikan menambahkan `OPENROUTER_API_KEY` di Dashboard Vercel > Settings > Environment Variables.

### Cloudflare Pages / Netlify
Deploy direktori `dist/` hasil `npm run build` dan kaitkan endpoint `/api/ai-intent` ke Cloudflare Worker / Netlify Function.

---

## 📄 Lisensi
Bebas digunakan untuk keperluan personal, edukasi, maupun komersial. Dibuat untuk produktivitas tanpa ribet.
