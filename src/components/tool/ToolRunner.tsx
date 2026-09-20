import React, { useState } from 'react';
import { ToolDefinition, ProcessResult, ProcessProgress, ProcessedItem } from '../../types/tool';
import { Dropzone } from '../common/Dropzone';
import { formatBytes } from '../../utils/format';
import { triggerDownload, triggerTextDownload } from '../../utils/download';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  ShieldCheck,
  Play,
  Download,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  FileCheck2,
  X,
  FileText,
  RotateCcw
} from 'lucide-react';

interface ToolRunnerProps {
  tool: ToolDefinition;
  initialFiles?: File[];
  onBack: () => void;
  onSelectOtherTool?: (toolId: string) => void;
}

export const ToolRunner: React.FC<ToolRunnerProps> = ({
  tool,
  initialFiles = [],
  onBack
}) => {
  const [files, setFiles] = useState<File[]>(initialFiles);
  const [textInput, setTextInput] = useState('');
  const [options, setOptions] = useState<Record<string, any>>(() => {
    const initialOpts: Record<string, any> = {};
    if (tool.optionSchemas) {
      tool.optionSchemas.forEach((s) => {
        initialOpts[s.id] = s.defaultValue;
      });
    }
    return initialOpts;
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessProgress | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleOptionChange = (id: string, val: any) => {
    setOptions((prev) => ({ ...prev, [id]: val }));
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setResult(null);
  };

  const handleRunProcess = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setResult(null);
    setProgress({ current: 0, total: 1, message: 'Lagi diproses...', percentage: 5 });

    try {
      const res = await tool.process({
        files,
        textInput,
        options,
        onProgress: (p) => setProgress(p)
      });

      setResult(res);

      if (res.success) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ups, proses gagal. Coba cek format file atau data input kamu.');
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  const handleDownloadItem = (item: ProcessedItem) => {
    if (item.blob) {
      triggerDownload(item.blob, item.name);
    } else if (item.textOutput) {
      triggerTextDownload(item.textOutput, item.name);
    }
  };

  const handleDownloadAll = () => {
    if (!result) return;
    if (result.items.length === 1) {
      handleDownloadItem(result.items[0]);
    } else {
      const zipItem = result.items.find((i) => i.type === 'application/zip') || result.items[0];
      handleDownloadItem(zipItem);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setFiles([]);
    setTextInput('');
    setResult(null);
    setErrorMessage(null);
  };

  const isFormValid = () => {
    if (isProcessing) return false;
    if (tool.inputMode === 'file' || tool.inputMode === 'multi-file') {
      return files.length > 0;
    }
    if (tool.inputMode === 'text') {
      return textInput.trim().length > 0;
    }
    return true;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 space-y-6 sm:space-y-8 animate-fade-in">
      {/* Breadcrumb Navigation & Top Header */}
      <div className="space-y-3 border-b border-slate-200 dark:border-slate-800 pb-5 sm:pb-6">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={onBack}
            className="hover:text-brand-300 transition-colors focus:outline-none focus:underline"
          >
            Beranda
          </button>
          <span>/</span>
          <span className="uppercase font-semibold tracking-wider text-slate-500 dark:text-slate-400">{tool.category}</span>
          <span>/</span>
          <span className="text-slate-700 dark:text-slate-200 font-medium truncate">{tool.name}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="flex items-start gap-3.5 sm:gap-4">
            <button
              type="button"
              onClick={onBack}
              aria-label="Kembali ke Beranda"
              className="mt-0.5 p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition focus:outline-none focus:ring-2 focus:ring-slate-700 flex-shrink-0"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-brand-400 px-2.5 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20">
                  {tool.category}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" /> 🔒 Diproses langsung di browser
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">{tool.name}</h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">{tool.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Working Area */}
      <div className="grid grid-cols-1 gap-5 sm:gap-6">
        {/* Input Block: File / Multi-file */}
        {(tool.inputMode === 'file' || tool.inputMode === 'multi-file') && (
          <div className="space-y-4">
            <Dropzone
              onFilesSelected={(newFiles) => {
                if (tool.inputMode === 'file') {
                  setFiles([newFiles[0]]);
                } else {
                  setFiles((prev) => [...prev, ...newFiles]);
                }
                setResult(null);
                setErrorMessage(null);
              }}
              acceptedTypes={tool.acceptedTypes}
              multiple={tool.inputMode === 'multi-file'}
              label={`Pilih ${tool.acceptedTypes?.includes('application/pdf') ? 'file PDF' : 'file'}`}
              sublabel="Tarik & letakkan file di sini atau klik untuk memilih"
            />

            {/* Uploaded File List */}
            {files.length > 0 && (
              <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  <span>File yang dipilih ({files.length}):</span>
                  <span>Total: {formatBytes(files.reduce((a, b) => a + b.size, 0))}</span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-800/40">
                  {files.map((file, idx) => (
                    <div
                      key={`${file.name}_${idx}`}
                      className="flex items-center justify-between py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-800/40 px-2 rounded-lg"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-brand-400 flex-shrink-0" />
                        <span className="truncate font-medium">{file.name}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-slate-500 dark:text-slate-400">{formatBytes(file.size)}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          aria-label={`Hapus ${file.name}`}
                          className="text-slate-500 dark:text-slate-400 hover:text-rose-400 transition p-1 focus:outline-none focus:text-rose-400"
                          title="Hapus"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input Block: Text */}
        {tool.inputMode === 'text' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <label htmlFor="text-input" className="font-semibold text-slate-700 dark:text-slate-300">Masukkan Teks:</label>
              <span>{textInput.length} karakter</span>
            </div>
            <textarea
              id="text-input"
              rows={8}
              value={textInput}
              onChange={(e) => {
                setTextInput(e.target.value);
                setResult(null);
                setErrorMessage(null);
              }}
              placeholder="Ketik atau tempel (paste) teks kamu di sini..."
              className="w-full p-3.5 sm:p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-mono text-xs sm:text-sm focus:outline-none focus:border-brand-500/80 focus:ring-1 focus:ring-brand-500/20 transition"
            />
          </div>
        )}

        {/* Dynamic Tool Options & Form Fields */}
        {tool.optionSchemas && tool.optionSchemas.length > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3.5 sm:space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pengaturan & Input:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              {tool.optionSchemas.map((schema) => {
                const val = options[schema.id] !== undefined ? options[schema.id] : schema.defaultValue;

                if (schema.type === 'range') {
                  const min = schema.min ?? 0;
                  const max = schema.max ?? 100;
                  const step = schema.step ?? 1;
                  const numVal = Number(val ?? schema.defaultValue ?? 50);

                  const presets =
                    schema.id.toLowerCase().includes('percent') ||
                    schema.id.toLowerCase().includes('quality') ||
                    schema.id.toLowerCase().includes('compression')
                      ? [
                          { label: 'Ekstrem', value: 25 },
                          { label: 'Hemat', value: 50 },
                          { label: 'Seimbang', value: 75 },
                          { label: 'Maksimal', value: 90 }
                        ]
                      : [];

                  return (
                    <div
                      key={schema.id}
                      className="sm:col-span-2 space-y-2.5 p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80"
                    >
                      <div className="flex items-center justify-between">
                        <label htmlFor={schema.id} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {schema.label}
                        </label>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-brand-500/15 text-brand-700 dark:text-brand-400 border border-brand-500/30 font-mono shadow-sm">
                          {numVal}{schema.unit || ''}
                        </span>
                      </div>

                      <div className="relative flex items-center gap-3">
                        <span className="text-[11px] font-mono text-slate-400">{min}{schema.unit || ''}</span>
                        <input
                          id={schema.id}
                          type="range"
                          min={min}
                          max={max}
                          step={step}
                          value={numVal}
                          onChange={(e) => handleOptionChange(schema.id, Number(e.target.value))}
                          className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                        />
                        <span className="text-[11px] font-mono text-slate-400">{max}{schema.unit || ''}</span>
                      </div>

                      {presets.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Pilihan cepat:</span>
                          {presets.map((preset) => (
                            <button
                              key={preset.value}
                              type="button"
                              onClick={() => handleOptionChange(schema.id, preset.value)}
                              className={`text-[11px] px-2 py-0.5 rounded-md font-semibold transition ${
                                numVal === preset.value
                                  ? 'bg-brand-500 text-slate-950 shadow-sm'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {preset.value}{schema.unit || ''} ({preset.label})
                            </button>
                          ))}
                        </div>
                      )}

                      {schema.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{schema.description}</p>
                      )}
                    </div>
                  );
                }

                if (schema.type === 'textarea') {
                  return (
                    <div key={schema.id} className="sm:col-span-2 space-y-1.5">
                      <label htmlFor={schema.id} className="text-xs font-semibold text-slate-700 dark:text-slate-300">{schema.label}</label>
                      <textarea
                        id={schema.id}
                        rows={schema.rows || 4}
                        value={val || ''}
                        placeholder={schema.placeholder}
                        onChange={(e) => handleOptionChange(schema.id, e.target.value)}
                        className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500/80 focus:ring-1 focus:ring-brand-500/20"
                      />
                    </div>
                  );
                }

                if (schema.type === 'select') {
                  return (
                    <div key={schema.id} className="space-y-1.5">
                      <label htmlFor={schema.id} className="text-xs font-semibold text-slate-700 dark:text-slate-300">{schema.label}</label>
                      <select
                        id={schema.id}
                        value={val}
                        onChange={(e) => handleOptionChange(schema.id, e.target.value)}
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500/80 focus:ring-1 focus:ring-brand-500/20"
                      >
                        {schema.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {schema.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{schema.description}</p>
                      )}
                    </div>
                  );
                }

                if (schema.type === 'boolean') {
                  return (
                    <div key={schema.id} className="flex items-center gap-3 pt-2">
                      <input
                        type="checkbox"
                        id={schema.id}
                        checked={Boolean(val)}
                        onChange={(e) => handleOptionChange(schema.id, e.target.checked)}
                        className="w-4 h-4 rounded text-brand-500 focus:ring-brand-400 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 cursor-pointer"
                      />
                      <label htmlFor={schema.id} className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                        {schema.label}
                      </label>
                    </div>
                  );
                }

                return (
                  <div key={schema.id} className="space-y-1.5">
                    <label htmlFor={schema.id} className="text-xs font-semibold text-slate-700 dark:text-slate-300">{schema.label}</label>
                    <input
                      id={schema.id}
                      type={schema.type === 'number' ? 'number' : 'text'}
                      value={val !== undefined ? val : ''}
                      placeholder={schema.placeholder}
                      onChange={(e) => handleOptionChange(schema.id, e.target.value)}
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/80 focus:ring-1 focus:ring-brand-500/20"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={handleRunProcess}
            disabled={!isFormValid()}
            className="w-full sm:w-auto min-h-[44px] px-8 py-3 rounded-2xl bg-brand-500 hover:bg-brand-400 disabled:opacity-40 disabled:hover:bg-brand-500 text-slate-950 font-extrabold text-sm shadow-glow flex items-center justify-center gap-2 transition hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Proses Sekarang</span>
              </>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        {isProcessing && progress && (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 animate-fade-in">
            <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
              <span className="font-semibold text-brand-700 dark:text-brand-400">{progress.message || 'Lagi diproses...'}</span>
              <span>{progress.percentage}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-shake">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold text-rose-700 dark:text-rose-300">Terjadi masalah saat memproses file.</div>
                <p className="text-slate-700 dark:text-slate-300">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="self-start sm:self-center px-3.5 py-1.5 rounded-xl bg-rose-900/60 hover:bg-rose-900 text-rose-200 text-xs font-semibold transition flex items-center gap-1.5 focus:outline-none"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Coba Lagi
            </button>
          </div>
        )}

        {/* Result Area */}
        {result && result.success && (
          <div className="p-5 sm:p-7 lg:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-emerald-500/40 shadow-glow space-y-5 sm:space-y-6 animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 sm:pb-5">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <FileCheck2 className="w-4 h-4" /> Berhasil!
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">{result.message || 'File berhasil diproses!'}</h3>
              </div>

              {/* Stats Savings Badge */}
              {result.stats?.savedPercentage !== undefined && result.stats.savedPercentage > 0 && (
                <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-2">
                  <span>
                    {formatBytes(result.stats.originalTotalSize || 0)} → {formatBytes(result.stats.processedTotalSize || 0)}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    Hemat {result.stats.savedPercentage}%
                  </span>
                </div>
              )}
            </div>

            {/* Result Items & Download CTA */}
            <div className="space-y-4">
              {/* Text Output Preview (if tool outputs text) */}
              {result.items[0]?.textOutput && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Hasil Keluaran:</span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(result.items[0].textOutput || '')}
                      className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-semibold focus:outline-none focus:underline"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Tersalin!' : 'Salin ke Clipboard'}</span>
                    </button>
                  </div>
                  <pre className="p-3.5 sm:p-4 rounded-2xl bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-200 text-xs font-mono overflow-x-auto max-h-80 whitespace-pre-wrap">
                    {result.items[0].textOutput}
                  </pre>
                </div>
              )}

              {/* Download Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadAll}
                  className="w-full sm:w-auto min-h-[44px] px-8 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-glow flex items-center justify-center gap-2 transition hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Hasil ({result.downloadName || result.items[0]?.name})</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition text-center focus:outline-none focus:ring-2 focus:ring-slate-600"
                >
                  Mulai dari Awal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
