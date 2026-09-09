import React from 'react';
import { ShieldCheck, Lock, EyeOff, HardDrive, Cpu, CheckCircle2, ArrowLeft } from 'lucide-react';

interface PrivacyPageProps {
  onBackHome: () => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBackHome }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:py-16 space-y-12 animate-fade-in">
      {/* Back Button */}
      <button
        onClick={onBackHome}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Beranda
      </button>

      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
          <ShieldCheck className="w-4 h-4" /> Local-First Privacy Architecture
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Privasi & Keamanan Data
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg leading-relaxed">
          Di FreeTools, privasi bukan sekadar jargon pemasaran. Arsitektur kami dibangun dengan prinsip <strong>Local-first</strong>, yang artinya pemrosesan file terjadi langsung di perangkat kamu.
        </p>
      </div>

      {/* Q&A Section with Indonesian Casual Tone */}
      <div className="space-y-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-white/85 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-3 text-brand-700 dark:text-brand-400 font-bold text-lg">
            <HardDrive className="w-5 h-5 flex-shrink-0" />
            <h3>File kamu diproses di mana?</h3>
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
            Untuk seluruh tool pengolah PDF, gambar, teks, dan data developer di FreeTools, <strong>file diproses langsung di dalam browser kamu</strong> (menggunakan WebAssembly, Canvas, dan JavaScript engine lokal). File tidak diunggah ke server kami ataupun server pihak ketiga.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-white/85 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-3 text-brand-700 dark:text-brand-400 font-bold text-lg">
            <EyeOff className="w-5 h-5 flex-shrink-0" />
            <h3>Apakah saya harus login atau daftar akun?</h3>
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
            <strong>Nggak perlu.</strong> FreeTools dirancang supaya seluruh fitur inti bisa langsung dipakai tanpa perlu membuat akun, tanpa mengisi email, dan tanpa verifikasi nomor telepon. Kami tidak mengumpulkan profil pengguna.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-white/85 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-3 text-brand-700 dark:text-brand-400 font-bold text-lg">
            <Cpu className="w-5 h-5 flex-shrink-0" />
            <h3>Apakah AI membaca atau menerima isi dokumen saya?</h3>
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
            <strong>Tidak.</strong> AI hanya bertindak sebagai interpreter teks pencarian (misalnya ketika kamu menulis kalimat <em>"kecilin PDF ini"</em>). AI tidak pernah menerima, membaca, atau menyimpan isi file dokumen maupun foto kamu. Selain itu, kamu bisa mengaktifkan <strong>Mode Privat</strong> kapan saja untuk mematikan semua request AI dan hanya menggunakan rule-engine lokal.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-white/85 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-3 text-brand-700 dark:text-brand-400 font-bold text-lg">
            <Lock className="w-5 h-5 flex-shrink-0" />
            <h3>Bagaimana dengan dokumen rahasia (KTP, Ijazah, Kontrak Kerja)?</h3>
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
            Karena data kamu tidak meninggalkan memori RAM browser pada perangkatmu, mengolah dokumen identitas atau berkas kantor penting di FreeTools jauh lebih aman daripada mengunggahnya ke website converter tradisional yang menyimpan file di server cloud mereka.
          </p>
        </div>
      </div>

      {/* Summary Checklist */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-brand-500/20 space-y-4">
        <h3 className="font-bold text-white text-base">Jaminan Bebas Resiko:</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Tanpa Watermark pada hasil</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Tanpa pelacak iklan invasif</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Tanpa batasan kuota berbayar</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Bisa di-install sebagai PWA Offline</span>
          </div>
        </div>
      </div>
    </div>
  );
};
