import React from 'react';
import { ShieldCheck, Heart, Lock, Globe } from 'lucide-react';

interface FooterProps {
  setActiveView: (view: string) => void;
  theme?: 'dark' | 'light';
}

export const Footer: React.FC<FooterProps> = ({ setActiveView, theme = 'dark' }) => {
  const logoSrc = theme === 'light' ? '/logo/freetools-logo-light.png' : '/logo/freetools-logo-dark.png';

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 mt-24 text-slate-600 dark:text-slate-300 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <img
                src={logoSrc}
                alt="FreeTools"
                className="h-7 w-auto object-contain rounded-lg shadow-sm"
              />
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 max-w-sm leading-relaxed">
              Utility workspace gratis & privacy-first. Olah PDF, gambar, teks, dan data langsung di browser tanpa perlu login, tanpa watermark, dan tanpa upload file ke server.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 pt-1">
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% Client-Side Processing
              </span>
              <span>•</span>
              <span>Rp0 Biaya Langganan</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 mb-3">Kategori Tool</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => setActiveView('tools')}
                  className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  PDF Tools (Merge, Split, Compress)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveView('tools')}
                  className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  Image Tools (Resize, Compress, Convert)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveView('tools')}
                  className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  Text & Code Tools (Diff, Cleaner, JSON)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveView('tools')}
                  className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  Office (Invoice, CSV, Split Bill)
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 mb-3">Keamanan & Bantuan</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('privacy');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" /> Kebijakan Privasi
                </button>
              </li>
              <li>
                <a
                  href="https://github.com/anomalyco/opencode/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-1.5"
                >
                  <Globe className="w-3.5 h-3.5" /> Laporkan Masalah / Feedback
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 dark:text-slate-300 gap-4">
          <div>
            © {new Date().getFullYear()} FreeTools. Bebas digunakan untuk personal, edukasi, dan komersial.
          </div>
          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
            <span>Dibuat dengan</span>
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            <span>untuk produktivitas tanpa ribet</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
