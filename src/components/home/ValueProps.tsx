import React from 'react';
import { Zap, ShieldCheck, UserX, DollarSign } from 'lucide-react';

export const ValueProps: React.FC = () => {
  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-12 sm:py-16 border-t border-white/70 dark:border-slate-800/70 transition-colors">
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2 sm:mb-3">Kenapa Pakai FreeTools?</h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Dirancang untuk kecepatan, kepraktisan, dan keamanan mutlak tanpa jebakan bayar atau login.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 sm:p-6 rounded-2xl surface-card space-y-2.5 sm:space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">⚡ Super Cepat</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Tidak perlu menunggu upload dan download dari server lambat. Semua diproses langsung oleh prosesor device kamu.
          </p>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl surface-card space-y-2.5 sm:space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">🔒 Privacy-First</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Dokumen rahasia, foto pribadi, dan data sensitif kamu tidak pernah dikirim atau disimpan di server mana pun.
          </p>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl surface-card space-y-2.5 sm:space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <UserX className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">🚫 Nggak Perlu Login</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Buka website, langsung pakai. Tanpa daftar akun, tanpa isi formulir, dan tanpa spam email di masa depan.
          </p>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl surface-card space-y-2.5 sm:space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">💸 100% Gratis</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Tanpa batas kuota harian, tanpa watermark yang merusak dokumen, dan tanpa biaya tersembunyi.
          </p>
        </div>
      </div>

      {/* How it Works Stepper */}
      <div className="mt-12 sm:mt-16 p-6 sm:p-8 rounded-3xl surface-premium">
        <div className="text-center mb-6 sm:mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">Mudah & Sederhana</span>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">Cara Kerja FreeTools</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 relative">
          <div className="space-y-1.5 sm:space-y-2">
            <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/40 text-brand-700 dark:text-brand-400 flex items-center justify-center font-bold text-xs">
              1
            </div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">Pilih File / Tulis</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Drop file kamu atau tulis apa yang ingin kamu selesaikan.
            </p>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/40 text-brand-700 dark:text-brand-400 flex items-center justify-center font-bold text-xs">
              2
            </div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">FreeTools Deteksi</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Sistem mencarikan opsi tindakan atau alur kerja terbaik.
            </p>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/40 text-brand-700 dark:text-brand-400 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">Proses di Browser</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              File diproses seketika di browsermu tanpa upload ke server.
            </p>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/40 text-brand-700 dark:text-brand-400 flex items-center justify-center font-bold text-xs">
              4
            </div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">Download Hasil</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Unduh hasil olahan satu per satu atau dalam format ZIP.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
