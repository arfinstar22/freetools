import React from 'react';
import { IntentResult } from '../../types/ai';
import { getToolById, CATEGORIES } from '../../engine/registry';
import { ToolCategory } from '../../types/tool';
import { IconRenderer } from '../common/IconRenderer';
import { Sparkles, ArrowRight, Play, ShieldCheck, Layers, HelpCircle } from 'lucide-react';
import { WorkflowPlan } from '../../types/workflow';

interface AIRecommendationCardProps {
  intent: IntentResult;
  onLaunchTool: (toolId: string) => void;
  onLaunchWorkflow?: (workflow: WorkflowPlan) => void;
  onSelectCategory?: (category: ToolCategory) => void;
}

export const AIRecommendationCard: React.FC<AIRecommendationCardProps> = ({
  intent,
  onLaunchTool,
  onLaunchWorkflow,
  onSelectCategory
}) => {
  const tool = intent.recommendedToolId ? getToolById(intent.recommendedToolId) : null;
  const workflow = intent.workflow;
  const isUnknown = !tool && !workflow;

  return (
    <div
      className={`w-full border rounded-3xl p-5 sm:p-7 lg:p-8 animate-slide-up space-y-5 sm:space-y-6 ${
        isUnknown
          ? 'bg-slate-900/90 border-slate-800 shadow-xl'
          : 'bg-gradient-to-b from-brand-950/40 to-slate-900/90 border-brand-500/30 shadow-glow'
      }`}
    >
      {/* Intent Header */}
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                isUnknown
                  ? 'bg-slate-800 text-slate-300 border-slate-700'
                  : 'bg-brand-500/20 text-brand-300 border-brand-500/40'
              }`}
            >
              {isUnknown ? <HelpCircle className="w-3.5 h-3.5 text-amber-400" /> : <Sparkles className="w-3.5 h-3.5 text-brand-400" />}
              {isUnknown ? 'Bantuan Kebutuhan' : 'Saran Cepat'}
            </span>
            {!isUnknown && (
              <span className="text-xs text-slate-400 hidden sm:inline">
                Target: <strong className="text-slate-200">{intent.matchedGoal}</strong>
              </span>
            )}
          </div>
          <p className="text-base sm:text-lg font-bold text-white pt-1">{intent.explanation}</p>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 flex-shrink-0">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Lokal di Browser</span>
        </div>
      </div>

      {/* When Intent is Unknown: Category quick selectors */}
      {isUnknown && (
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Pilih Kategori Kebutuhan:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory && onSelectCategory(cat.id)}
                className="p-3 sm:p-3.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-brand-500/50 text-left transition-all flex flex-col justify-between group focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-brand-400 mb-2 group-hover:scale-105 transition-transform">
                  <IconRenderer name={cat.icon} className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-slate-200 group-hover:text-brand-300 transition-colors">
                  {cat.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Visual Workflow Chain (if workflow available) */}
      {workflow && (
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Alur Kerja Otomatis (Workflow)
              </span>
            </div>
            <span className="text-xs text-slate-400">{workflow.steps.length} Langkah Berurutan</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {workflow.steps.map((step, idx) => {
              const stepTool = getToolById(step.toolId);
              return (
                <div
                  key={step.id}
                  className="relative p-3 sm:p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3 text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-slate-200 truncate">{step.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {stepTool?.shortDescription || 'Proses lokal'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => onLaunchWorkflow && onLaunchWorkflow(workflow)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs sm:text-sm shadow-glow flex items-center justify-center gap-2 transition hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              <Play className="w-4 h-4 fill-slate-950" /> Jalankan Alur Kerja Ini
            </button>
          </div>
        </div>
      )}

      {/* Single Tool Recommendation (if no workflow or tool suggested) */}
      {!workflow && tool && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
              <IconRenderer name={tool.icon} className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm sm:text-base">{tool.name}</div>
              <div className="text-xs text-slate-400">{tool.shortDescription}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onLaunchTool(tool.id)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs sm:text-sm shadow-glow flex items-center justify-center gap-2 transition hover:scale-[1.01] flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            <span>Buka Tool Ini</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
