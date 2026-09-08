import React from 'react';
import { IntentResult } from '../../types/ai';
import { getToolById, CATEGORIES } from '../../engine/registry';
import { ToolCategory } from '../../types/tool';
import { IconRenderer } from '../common/IconRenderer';
import { Sparkles, Play, ShieldCheck, Layers, HelpCircle } from 'lucide-react';
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
      className={`w-full border rounded-3xl p-5 sm:p-7 lg:p-8 animate-slide-up shadow-lg dark:shadow-2xl ${
        isUnknown
          ? 'bg-slate-900/95 dark:bg-slate-950/95 border-slate-800 dark:border-slate-800'
          : 'bg-gradient-to-br from-slate-900/95 via-slate-950/95 to-emerald-950/20 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950/10 border-emerald-500/30 dark:border-emerald-500/20'
      }`}
    >
      {/* Intent Header */}
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                isUnknown
                  ? 'bg-slate-800 text-slate-300 border-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                  : 'bg-emerald-500/20 text-emerald-300 dark:text-emerald-300 border-emerald-500/40 dark:border-emerald-500/30'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              {isUnknown ? 'Tidak dikenali' : 'AI Merekomendasikan'}
            </span>
            {intent.provider === 'local-rules' && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                Offline / Rule-Based
              </span>
            )}
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white leading-tight">
            {isUnknown ? 'Aku belum yakin kamu mau ngapain' : tool?.name || workflow?.title || 'Saran Tool'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {isUnknown
              ? 'Coba pilih salah satu kategori di bawah atau gunakan kata kunci lain.'
              : intent.explanation || tool?.shortDescription || workflow?.description}
          </p>
        </div>
        <div
          className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center ${
            isUnknown
              ? 'bg-slate-800 dark:bg-slate-800 border border-slate-700 dark:border-slate-700 text-slate-500 dark:text-slate-500'
              : 'bg-emerald-500/20 dark:bg-emerald-500/10 border border-emerald-500/30 dark:border-emerald-500/20 text-emerald-500 dark:text-emerald-400'
          }`}
        >
          {isUnknown ? <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6" /> : <IconRenderer name={tool?.icon || 'FileText'} className="w-5 h-5 sm:w-6 sm:h-6" />}
        </div>
      </div>

      {/* Tool Action Card */}
      {!isUnknown && tool && (
        <button
          type="button"
          onClick={() => onLaunchTool(tool.id)}
          className="w-full group mt-5 p-4 sm:p-5 rounded-2xl bg-white/90 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-emerald-500/50 dark:hover:border-emerald-500/40 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800/60">
                  {tool.category}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <ShieldCheck className="w-3 h-3" /> Diproses di browser
                </span>
              </div>
              <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                {tool.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {tool.shortDescription}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <Play className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
        </button>
      )}

      {/* Workflow Action */}
      {!isUnknown && workflow && (
        <button
          type="button"
          onClick={() => onLaunchWorkflow?.(workflow)}
          className="w-full group mt-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-800 dark:to-slate-950 hover:from-emerald-950 hover:to-slate-900 border border-slate-700 dark:border-slate-700 hover:border-emerald-500/50 dark:hover:border-emerald-500/40 text-left transition-all duration-200 hover:-translate-y-0.5 shadow-lg dark:shadow-xl shadow-slate-900/20 hover:shadow-emerald-900/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
                  {workflow.steps.length} Langkah Otomatis
                </span>
              </div>
              <h4 className="font-bold text-white group-hover:text-emerald-300 transition-colors">
                {workflow.title}
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed">
                {workflow.description || workflow.goal}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-emerald-900/50 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <Play className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
        </button>
      )}

      {/* Categories Suggestions for unknown intents */}
      {isUnknown && (
        <div className="mt-5 pt-5 border-t border-slate-800 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
            Telusuri kategori lain:
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory?.(cat.id)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-800 hover:bg-emerald-900/50 dark:hover:bg-emerald-900/30 text-xs text-slate-400 dark:text-slate-500 hover:text-emerald-400 dark:hover:text-emerald-300 border border-slate-700 dark:border-slate-700 hover:border-emerald-500/40 dark:hover:border-emerald-500/30 transition-all duration-150 hover:-translate-y-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Confidence / Metadata Footer */}
      <div className="mt-4 pt-4 border-t border-slate-800 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-500">
        <span className="font-medium">
          {isUnknown ? 'Confidence: N/A' : `Confidence: ${(intent.confidence * 100).toFixed(0)}%`}
        </span>
        <div className="flex items-center gap-4">
          {intent.provider === 'openrouter' && (
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI-powered
            </span>
          )}
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" /> Privacy-first
          </span>
        </div>
      </div>
    </div>
  );
};