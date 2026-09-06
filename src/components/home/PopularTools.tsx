import React from 'react';
import { ALL_TOOLS } from '../../engine/registry';
import { IconRenderer } from '../common/IconRenderer';
import { ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface PopularToolsProps {
  onSelectTool: (toolId: string) => void;
  onViewAll: () => void;
}

export const PopularTools: React.FC<PopularToolsProps> = ({ onSelectTool, onViewAll }) => {
  const popular = ALL_TOOLS.filter((t) => t.popular).slice(0, 8);

  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-10 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-brand-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Zap className="w-3.5 h-3.5" /> Paling Sering Digunakan
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Tool Populer</h2>
        </div>

        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 group focus:outline-none focus:underline"
        >
          <span>Lihat Semua {ALL_TOOLS.length} Tool</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {popular.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onSelectTool(tool.id)}
            className="group relative p-4 sm:p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-brand-500/40 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center group-hover:scale-105 group-hover:bg-brand-500 group-hover:text-slate-950 transition-all">
                  <IconRenderer name={tool.icon} className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">
                  {tool.category}
                </span>
              </div>

              <h3 className="font-bold text-sm sm:text-base text-slate-100 group-hover:text-brand-300 transition-colors mb-1">
                {tool.name}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {tool.shortDescription}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                <ShieldCheck className="w-3 h-3" /> Lokal di browser
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
