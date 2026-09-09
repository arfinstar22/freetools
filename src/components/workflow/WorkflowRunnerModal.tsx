import React, { useState, useEffect } from 'react';
import { WorkflowPlan, WorkflowExecutionState } from '../../types/workflow';
import { runWorkflow } from '../../engine/workflow/runner';
import { Dropzone } from '../common/Dropzone';
import { triggerDownload } from '../../utils/download';
import { formatBytes } from '../../utils/format';
import confetti from 'canvas-confetti';
import {
  X,
  Play,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  Layers,
  FileCheck2,
  FileText
} from 'lucide-react';

interface WorkflowRunnerModalProps {
  plan: WorkflowPlan;
  initialFiles?: File[];
  onClose: () => void;
}

export const WorkflowRunnerModal: React.FC<WorkflowRunnerModalProps> = ({
  plan,
  initialFiles = [],
  onClose
}) => {
  const [files, setFiles] = useState<File[]>(initialFiles);
  const [isRunning, setIsRunning] = useState(false);
  const [state, setState] = useState<WorkflowExecutionState | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isRunning) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, onClose]);

  const handleStartWorkflow = async () => {
    if (files.length === 0) return;

    setIsRunning(true);
    try {
      await runWorkflow({
        plan,
        initialFiles: files,
        onStateChange: (s) => setState(s)
      });

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch {
      // Error is captured in state
    } finally {
      setIsRunning(false);
    }
  };

  const handleDownloadFinal = () => {
    if (state?.finalBlob) {
      triggerDownload(state.finalBlob, state.finalFilename || plan.outputZipName || plan.outputFilename || 'hasil_workflow.zip');
    }
  };

  const handleDownloadSingleItem = (item: { name: string; blob: Blob }) => {
    triggerDownload(item.blob, item.name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/55 dark:bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 dark:text-brand-400 bg-brand-500/10 px-2.5 py-0.5 rounded-full border border-brand-500/20">
                <Layers className="w-3.5 h-3.5" /> Alur Kerja Otomatis
              </span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400">Lokal di Browser</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">{plan.title}</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{plan.description}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup alur kerja"
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none focus:ring-2 focus:ring-slate-600 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6">
          {/* File input if not yet selected */}
          {files.length === 0 && (
            <Dropzone
              onFilesSelected={(f) => setFiles(f)}
              multiple={true}
              label="Pilih File untuk Alur Kerja Ini"
              sublabel="Tarik & letakkan foto atau dokumen yang ingin diproses"
            />
          )}

          {/* Files Selected Banner */}
          {files.length > 0 && !state?.finalBlob && (
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <div className="text-slate-300 truncate mr-2">
                <strong>{files.length} file dipilih</strong> ({formatBytes(files.reduce((a, b) => a + b.size, 0))})
              </div>
              {!isRunning && (
                <button
                  type="button"
                  onClick={() => {
                    setFiles([]);
                    setState(null);
                  }}
                  className="text-slate-400 hover:text-rose-400 font-medium flex-shrink-0 focus:outline-none focus:underline"
                >
                  Ganti File
                </button>
              )}
            </div>
          )}

          {/* Steps Stepper View */}
          <div className="space-y-2.5 sm:space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tahapan Alur Kerja:
            </div>

            <div className="space-y-2">
              {plan.steps.map((step, idx) => {
                const status = state?.stepStatus[idx] || 'idle';

                return (
                  <div
                    key={step.id}
                    className={`p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between transition ${
                      status === 'running'
                        ? 'bg-brand-950/40 border-brand-500/50 shadow-glow'
                        : status === 'completed'
                        ? 'bg-slate-950/60 border-emerald-500/40'
                        : status === 'error'
                        ? 'bg-rose-950/40 border-rose-500/50'
                        : 'bg-slate-950/30 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                          status === 'completed'
                            ? 'bg-emerald-500 text-slate-950'
                            : status === 'running'
                            ? 'bg-brand-500 text-slate-950 animate-pulse'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-200 truncate">{step.name}</div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                          {status === 'running' ? 'Sedang memproses...' : 'Siap diproses'}
                        </div>
                      </div>
                    </div>

                    <div className="flex-shrink-0 ml-2">
                      {status === 'running' && (
                        <RefreshCw className="w-4 h-4 text-brand-400 animate-spin" />
                      )}
                      {status === 'completed' && (
                        <span className="text-[11px] text-emerald-400 font-semibold">Selesai ✓</span>
                      )}
                      {status === 'error' && (
                        <span className="text-[11px] text-rose-400 font-semibold">Gagal</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress Bar & Status Text */}
          {state && isRunning && (
            <div className="space-y-2 p-3.5 sm:p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-semibold text-brand-400">{state.currentMessage}</span>
                <span>{state.progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${state.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {state?.error && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          {/* Completed Results List if multiple individual items */}
          {state?.finalItems && state.finalItems.length > 0 && !isRunning && (
            <div className="space-y-3 p-3.5 sm:p-4 rounded-2xl bg-slate-950 border border-emerald-500/30">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <FileCheck2 className="w-4 h-4" /> Hasil Alur Kerja ({state.finalItems.length} file)
                </span>
                <span className="text-slate-400">
                  {formatBytes(state.finalItems.reduce((a, b) => a + b.size, 0))}
                </span>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-800/40">
                {state.finalItems.map((item, idx) => (
                  <div
                    key={`${item.name}_${idx}`}
                    className="flex items-center justify-between py-1.5 text-xs text-slate-300"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                      <span className="truncate font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-slate-400">{formatBytes(item.size)}</span>
                      <button
                        type="button"
                        onClick={() => handleDownloadSingleItem(item)}
                        aria-label={`Download ${item.name}`}
                        className="p-1.5 text-slate-400 hover:text-brand-400 focus:outline-none"
                        title="Download file ini"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer CTA */}
        <div className="p-4 sm:p-6 border-t border-slate-800 flex items-center justify-between bg-slate-950/60 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 sm:px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-600"
          >
            Tutup
          </button>

          {state?.finalBlob ? (
            <button
              type="button"
              onClick={handleDownloadFinal}
              className="min-h-[44px] px-5 sm:px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-glow flex items-center gap-2 transition focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <Download className="w-4 h-4" /> Download Hasil ({state.finalFilename})
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartWorkflow}
              disabled={files.length === 0 || isRunning}
              className="min-h-[44px] px-5 sm:px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-40 text-slate-950 font-bold text-xs sm:text-sm shadow-glow flex items-center gap-2 transition focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Jalankan Semua Langkah</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
