import React, { useState, useEffect } from 'react';
import { Shield, ShieldCheck, Search, Menu, X, Sun, Moon } from 'lucide-react';
import { ALL_TOOLS } from '../../engine/registry';

interface NavbarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  privateMode: boolean;
  setPrivateMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  onSelectTool: (toolId: string) => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  privateMode,
  setPrivateMode,
  onSelectTool,
  theme = 'dark',
  onToggleTheme
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Keyboard shortcuts: Ctrl+K / Cmd+K to open search, Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  const filteredTools = searchQuery.trim()
    ? ALL_TOOLS.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 6)
    : [];

  const logoSrc = theme === 'light' ? '/logo/freetools-logo-light.png' : '/logo/freetools-logo-dark.png';

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-emerald-500/15 bg-white/85 dark:bg-[#05080f]/85 backdrop-blur-xl shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <button
            type="button"
            onClick={() => {
              setActiveView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 group text-left focus:outline-none"
          >
            <img
              src={logoSrc}
              alt="FreeTools"
              className="h-10 md:h-11 w-auto object-contain transition group-hover:scale-105"
            />
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 ml-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Local-First
            </span>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveView('home')}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                activeView === 'home'
                  ? 'text-brand-600 dark:text-brand-400 bg-brand-500/10 border border-brand-500/20 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              Mau Ngapain?
            </button>
            <button
              type="button"
              onClick={() => setActiveView('tools')}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                activeView === 'tools'
                  ? 'text-brand-600 dark:text-brand-400 bg-brand-500/10 border border-brand-500/20 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              Semua Tools ({ALL_TOOLS.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveView('privacy')}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                activeView === 'privacy'
                  ? 'text-brand-600 dark:text-brand-400 bg-brand-500/10 border border-brand-500/20 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              Privasi & Keamanan
            </button>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Quick Search Trigger */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Cari Tool (Ctrl+K)"
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-700"
              title="Cari Tool (Ctrl+K)"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Dark / Light Mode Toggle */}
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label={theme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 transition focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-600 transition-transform rotate-0 hover:-rotate-12" />
                )}
              </button>
            )}

            {/* Mode Privat Toggle */}
            <button
              type="button"
              onClick={() => setPrivateMode((prev) => !prev)}
              aria-label={privateMode ? 'Mode Privat Aktif' : 'Aktifkan Mode Privat'}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                privateMode
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/40 shadow-glow'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title={privateMode ? 'Mode Privat Aktif (100% Offline / Rule-based)' : 'Klik untuk Mengaktifkan Mode Privat'}
            >
              {privateMode ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span className="text-[11px] sm:text-xs">Privat Aktif</span>
                </>
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                  <span className="hidden sm:inline text-xs">Mode Privat</span>
                </>
              )}
            </button>

            {/* Mobile Hamburger Menu */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu navigasi"
              className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 pt-2 pb-4 space-y-1 animate-fade-in shadow-lg">
            <button
              type="button"
              onClick={() => {
                setActiveView('home');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium ${
                activeView === 'home' ? 'text-brand-600 dark:text-brand-400 bg-brand-500/10' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              Mau Ngapain?
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveView('tools');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium ${
                activeView === 'tools' ? 'text-brand-600 dark:text-brand-400 bg-brand-500/10' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              Semua Tools ({ALL_TOOLS.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveView('privacy');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium ${
                activeView === 'privacy' ? 'text-brand-600 dark:text-brand-400 bg-brand-500/10' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              Privasi & Keamanan
            </button>
          </div>
        )}
      </header>

      {/* Quick Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama tool (misal: PDF, kompres, diff, invoice)..."
                aria-label="Cari nama tool"
                className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none text-sm sm:text-base"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg focus:outline-none"
              >
                ESC
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredTools.length > 0 ? (
                filteredTools.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => {
                      onSelectTool(tool.id);
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="w-full text-left p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between group transition focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {tool.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{tool.shortDescription}</div>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 uppercase font-semibold">
                      {tool.category}
                    </span>
                  </button>
                ))
              ) : searchQuery.trim() ? (
                <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  Tidak ada tool yang cocok dengan "{searchQuery}".
                </div>
              ) : (
                <div className="p-4 text-xs text-slate-500 space-y-2">
                  <div className="font-semibold text-slate-700 dark:text-slate-400">Saran Cepat:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_TOOLS.slice(0, 6).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          onSelectTool(t.id);
                          setSearchOpen(false);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs transition focus:outline-none"
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
