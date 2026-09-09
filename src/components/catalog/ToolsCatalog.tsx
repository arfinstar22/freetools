import React, { useState, useMemo } from 'react';
import { ALL_TOOLS, CATEGORIES } from '../../engine/registry';
import { ToolCategory } from '../../types/tool';
import { IconRenderer } from '../common/IconRenderer';
import { Search, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

interface ToolsCatalogProps {
  onSelectTool: (toolId: string) => void;
}

export const ToolsCatalog: React.FC<ToolsCatalogProps> = ({ onSelectTool }) => {
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = useMemo(() => {
    return ALL_TOOLS.filter((tool) => {
      const matchCategory = selectedCategory === 'all' || tool.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        tool.name.toLowerCase().includes(q) ||
        tool.shortDescription.toLowerCase().includes(q) ||
        tool.keywords.some((k) => k.toLowerCase().includes(q));

      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-5 sm:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-2 sm:space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-700 dark:text-brand-400 border border-brand-500/20">
          <Sparkles className="w-3.5 h-3.5" /> Direktori Utilitas
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Semua Tools ({ALL_TOOLS.length})</h1>
        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
          Seluruh koleksi alat gratis siap pakai. Pilih kategori atau gunakan pencarian untuk menemukan tool yang kamu butuhkan.
        </p>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex min-w-0 flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 sm:gap-4">
        {/* Search Bar */}
        <div className="relative w-full min-w-0 md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari tool (misal: PDF, kompres, diff, invoice)..."
            aria-label="Cari tool"
            className="w-full pl-10 pr-4 py-2.5 bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500/80 focus:ring-1 focus:ring-brand-500/20 transition shadow-[0_6px_18px_rgba(15,23,42,0.04)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
          />
        </div>

        {/* Categories Tabs */}
        <div className="-mx-3 flex min-w-0 items-center gap-2 overflow-x-auto px-3 pb-2 md:mx-0 md:px-0 md:pb-0 scrollbar-none" aria-label="Filter kategori tools">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex-shrink-0 focus:outline-none ${
              selectedCategory === 'all'
                ? 'bg-brand-500 text-slate-950 shadow-sm dark:shadow-glow'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-white/80 dark:border-slate-700/60 shadow-sm'
            }`}
          >
            Semua ({ALL_TOOLS.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = ALL_TOOLS.filter((t) => t.category === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex-shrink-0 flex items-center gap-1.5 focus:outline-none ${
                  selectedCategory === cat.id
                    ? 'bg-brand-500 text-slate-950 shadow-sm dark:shadow-glow'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-white/80 dark:border-slate-700/60 shadow-sm'
                }`}
              >
                <span>{cat.label}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tools Grid */}
      {filteredTools.length > 0 ? (
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => onSelectTool(tool.id)}
              className="group min-w-0 p-4 sm:p-5 rounded-2xl surface-card hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-brand-500/40 text-left transition-all duration-200 sm:hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-glow flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              <div>
                <div className="flex min-w-0 items-start justify-between gap-3 mb-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 flex items-center justify-center group-hover:scale-105 group-hover:bg-brand-500 group-hover:text-slate-950 transition-all shadow-sm">
                    <IconRenderer name={tool.icon} className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="max-w-[55%] break-words text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
                    {tool.category}
                  </span>
                </div>

                <h3 className="min-w-0 break-words font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-colors mb-1">
                  {tool.name}
                </h3>
                <p className="break-words text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {tool.shortDescription}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex min-w-0 items-center justify-between gap-3 text-xs text-slate-400">
                <span className="min-w-0 break-words flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                  <ShieldCheck className="w-3 h-3" /> Diproses di browser
                </span>
                <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 text-slate-400 group-hover:text-brand-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-14 sm:py-16 bg-white/95 dark:bg-slate-900/85 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">Tidak ada tool yang cocok</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Coba gunakan kata kunci pencarian lain atau pilih kategori Semua.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition"
          >
            Reset Pencarian
          </button>
        </div>
      )}
    </div>
  );
};
