import React, { useState } from 'react';
import { Search, ShieldCheck, CornerDownLeft } from 'lucide-react';
import { Dropzone } from '../common/Dropzone';

interface HeroMauNgapainProps {
  onSearchIntent: (query: string) => void;
  onFilesDropped: (files: File[]) => void;
  isSearching?: boolean;
}

const EXAMPLE_QUERIES = [
  'Kecilin PDF biar bisa dikirim lewat WhatsApp',
  'Punya 30 foto mau dikecilin & dijadikan ZIP',
  'Satukan 3 file PDF jadi 1 dokumen',
  'Ubah foto JPG ke PDF dokumen',
  'Rapikan teks & hapus spasi berantakan',
  'Bandingkan perbedaan 2 teks kode',
  'Format & rapikan struktur JSON'
];

export const HeroMauNgapain: React.FC<HeroMauNgapainProps> = ({
  onSearchIntent,
  onFilesDropped,
  isSearching
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearchIntent(query.trim());
    }
  };

  const handlePillClick = (example: string) => {
    setQuery(example);
    onSearchIntent(example);
  };

  return (
    <div className="w-full flex flex-col items-center text-center pt-6 pb-10 sm:pt-12 sm:pb-14 max-w-4xl mx-auto px-4">
      {/* Privacy Tag */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-[11px] sm:text-xs font-semibold mb-5 shadow-glow">
        <ShieldCheck className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
        <span>File diproses langsung di browser • Privasi aman tanpa akun</span>
      </div>

      {/* Main Headline */}
      <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15] mb-3 sm:mb-4">
        Mau ngapain?
      </h1>

      {/* Subheadline */}
      <p className="text-sm sm:text-lg text-slate-400 max-w-2xl mb-7 leading-relaxed px-2">
        Tulis aja apa yang kamu butuhin, atau drop file di sini. FreeTools carikan cara tercepat tanpa ribet login.
      </p>

      {/* Natural Language Prompt Search Bar */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl relative mb-3.5 group"
      >
        <div className="relative flex items-center">
          <div className="absolute left-3.5 sm:left-4 text-slate-500 group-focus-within:text-brand-400 transition pointer-events-none">
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Contoh: kecilin PDF ini biar bisa dikirim lewat WhatsApp..."
            aria-label="Tulis apa yang kamu butuhkan"
            className="w-full pl-10 sm:pl-12 pr-20 sm:pr-24 py-3.5 sm:py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 text-xs sm:text-sm md:text-base shadow-2xl focus:outline-none focus:border-brand-500/80 focus:ring-2 focus:ring-brand-500/20 transition-all"
          />

          <button
            type="submit"
            disabled={!query.trim() || isSearching}
            aria-label="Cari"
            className="absolute right-1.5 sm:right-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-40 disabled:hover:bg-brand-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            {isSearching ? (
              <span>Mencari...</span>
            ) : (
              <>
                <span>Cari</span>
                <CornerDownLeft className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Suggestion Pills */}
      <div className="w-full max-w-2xl flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mb-8">
        <span className="text-[11px] sm:text-xs text-slate-500 font-medium">Ide cepat:</span>
        {EXAMPLE_QUERIES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => handlePillClick(example)}
            className="text-[11px] sm:text-xs px-2.5 py-1 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition focus:outline-none focus:ring-1 focus:ring-brand-500/40"
          >
            {example}
          </button>
        ))}
      </div>

      {/* Or Divider */}
      <div className="flex items-center gap-4 w-full max-w-md mb-6">
        <div className="flex-1 h-[1px] bg-slate-800" />
        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">atau langsung drop file</span>
        <div className="flex-1 h-[1px] bg-slate-800" />
      </div>

      {/* Main Drag & Drop Zone */}
      <div className="w-full max-w-2xl">
        <Dropzone
          onFilesSelected={onFilesDropped}
          multiple={true}
          label="📁 Drop file di sini"
          sublabel="atau pilih file dari device (PDF, Gambar, Teks, Dokumen)"
        />
        <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span>🔒 File diproses langsung di browser • Tidak diunggah ke server</span>
        </div>
      </div>
    </div>
  );
};
