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
    <div className="w-full flex flex-col items-center text-center pt-6 pb-10 sm:pt-12 sm:pb-14 max-w-4xl mx-auto px-4 relative">
      {/* Privacy Tag */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] sm:text-xs font-semibold mb-5 shadow-sm">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>File diproses langsung di browser • Privasi aman tanpa akun</span>
      </div>

      {/* Main Headline with sophisticated subtle gradient and ample headroom to prevent any glyph clipping */}
      <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.25] sm:leading-[1.2] py-2 px-1 mb-2 sm:mb-3 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-700 dark:from-white dark:via-slate-100 dark:to-emerald-300 bg-clip-text text-transparent select-none">
        Mau ngapain?
      </h1>

      {/* Subheadline */}
      <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mb-7 sm:mb-8 leading-relaxed px-2 font-normal">
        Tulis aja apa yang kamu butuhin, atau drop file di sini. FreeTools carikan cara tercepat tanpa ribet login.
      </p>

      {/* Natural Language Prompt Search Bar with premium elevation */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl relative mb-4 group"
      >
        <div className="relative flex items-center rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-700/80 shadow-[0_14px_36px_rgba(15,23,42,0.08)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.22)] transition-all duration-200 group-focus-within:border-emerald-500/70 group-focus-within:ring-2 group-focus-within:ring-emerald-500/20 dark:group-focus-within:ring-emerald-400/20">
          <div className="absolute left-3.5 sm:left-4 text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 transition-colors pointer-events-none">
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Contoh: kecilin PDF ini biar bisa dikirim lewat WhatsApp..."
            aria-label="Tulis apa yang kamu butuhkan"
            className="w-full pl-10 sm:pl-12 pr-20 sm:pr-24 py-3.5 sm:py-4 bg-transparent rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs sm:text-sm md:text-base focus:outline-none"
          />

          <button
            type="submit"
            disabled={!query.trim() || isSearching}
            aria-label="Cari"
            className="absolute right-1.5 sm:right-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 active:scale-95 disabled:opacity-40 disabled:hover:from-emerald-500 disabled:hover:to-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-sm hover:shadow-glow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
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

      {/* Suggestion Chips - Interactive Premium Pills */}
      <div className="w-full max-w-2xl flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mb-8">
        <span className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 font-medium">Ide cepat:</span>
        {EXAMPLE_QUERIES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => handlePillClick(example)}
            className="text-[11px] sm:text-xs px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/30 transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 shadow-[0_4px_12px_rgba(15,23,42,0.035)] focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
          >
            {example}
          </button>
        ))}
      </div>

      {/* Or Divider */}
      <div className="flex items-center gap-4 w-full max-w-md mb-6">
        <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-800" />
        <span className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">atau langsung drop file</span>
        <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* Main Drag & Drop Zone */}
      <div className="w-full max-w-2xl">
        <Dropzone
          onFilesSelected={onFilesDropped}
          multiple={true}
          label="📁 Drop file di sini"
          sublabel="atau pilih file dari device (PDF, Gambar, Teks, Dokumen)"
        />
        <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>🔒 File diproses langsung di browser • Tidak diunggah ke server</span>
        </div>
      </div>
    </div>
  );
};
