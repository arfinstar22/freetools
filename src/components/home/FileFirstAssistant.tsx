import React from 'react';
import { FileGroupAnalysis } from '../../types/file';
import { formatBytes } from '../../utils/format';
import { getToolById } from '../../engine/registry';
import { IconRenderer } from '../common/IconRenderer';
import { X, ArrowRight, FileArchive, Sparkles } from 'lucide-react';
import { createZipFromFiles, triggerDownload } from '../../utils/download';

interface FileFirstAssistantProps {
  analysis: FileGroupAnalysis;
  onSelectAction: (toolId: string, files: File[]) => void;
  onClearFiles: () => void;
  onRemoveFile: (fileId: string) => void;
}

export const FileFirstAssistant: React.FC<FileFirstAssistantProps> = ({
  analysis,
  onSelectAction,
  onClearFiles,
  onRemoveFile
}) => {
  const { totalFiles, totalSize, files, primaryCategory, categories } = analysis;

  const getCategoryTitle = () => {
    if (totalFiles === 1) {
      if (primaryCategory === 'pdf') return '1 file PDF';
      if (primaryCategory === 'image') return '1 file gambar';
      return `1 file (${files[0].name.split('.').pop()?.toUpperCase() || 'dokumen'})`;
    }
    if (categories.image === totalFiles) return `${totalFiles} file gambar`;
    if (categories.pdf === totalFiles) return `${totalFiles} file PDF`;
    return `${totalFiles} file campuran`;
  };

  const handleInstantZip = async () => {
    const rawFiles = files.map((f) => ({ name: f.name, blob: f.file }));
    const zipBlob = await createZipFromFiles(rawFiles, 'freetools_arsip.zip');
    triggerDownload(zipBlob, 'freetools_arsip.zip');
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 lg:p-8 shadow-2xl space-y-5 sm:space-y-6 animate-slide-up">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-800 pb-4 sm:pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Sparkles className="w-3 h-3 mr-1" /> File Terdeteksi
            </span>
            <span className="text-xs text-slate-400">Total: {formatBytes(totalSize)}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
            Kami menemukan <span className="text-brand-400">{getCategoryTitle()}</span>
          </h2>
        </div>

        <button
          onClick={onClearFiles}
          className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-slate-600"
        >
          <X className="w-3.5 h-3.5" /> Ganti / Hapus File
        </button>
      </div>

      {/* Action Choices: "Mau diapain?" */}
      <div>
        <div className="text-xs sm:text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
          <span>Mau diapain?</span>
          <span className="text-[11px] sm:text-xs font-normal text-slate-400">— Pilih tindakan untuk file ini</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {analysis.suggestedActionIds.map((toolId) => {
            const tool = getToolById(toolId);
            if (!tool) return null;

            return (
              <button
                key={tool.id}
                onClick={() => onSelectAction(tool.id, files.map((f) => f.file))}
                className="group p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-brand-500/40 text-left transition flex items-start justify-between shadow-sm hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <IconRenderer name={tool.icon} className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-slate-100 group-hover:text-brand-300 transition-colors">
                      {tool.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{tool.shortDescription}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-brand-400 group-hover:translate-x-1 transition-all ml-2 flex-shrink-0 mt-1" />
              </button>
            );
          })}

          {/* Quick ZIP fallback button */}
          <button
            onClick={handleInstantZip}
            className="group p-4 rounded-2xl bg-slate-800/40 hover:bg-slate-800 border border-dashed border-slate-700 hover:border-slate-600 text-left transition flex items-start justify-between focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <FileArchive className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-slate-200 group-hover:text-blue-300 transition-colors">
                  Buat File ZIP Langsung
                </span>
              </div>
              <p className="text-xs text-slate-400">Kemas semua file ini menjadi 1 arsip .ZIP tanpa modifikasi</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all ml-2 flex-shrink-0 mt-1" />
          </button>
        </div>
      </div>

      {/* File List Preview */}
      <div className="border-t border-slate-800/80 pt-3.5 sm:pt-4">
        <div className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Daftar File ({files.length}):
        </div>
        <div className="max-h-48 overflow-y-auto pr-1 space-y-1.5 divide-y divide-slate-800/40">
          {files.map((cf) => (
            <div
              key={cf.id}
              className="flex items-center justify-between py-1.5 text-xs text-slate-300 hover:bg-slate-800/30 px-2 rounded-lg"
            >
              <div className="flex items-center gap-2.5 truncate">
                {cf.previewUrl ? (
                  <img src={cf.previewUrl} alt="" className="w-6 h-6 rounded object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-[10px]">
                    {cf.extension.toUpperCase() || 'FILE'}
                  </div>
                )}
                <span className="truncate font-medium">{cf.name}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-slate-400">{formatBytes(cf.size)}</span>
                <button
                  type="button"
                  onClick={() => onRemoveFile(cf.id)}
                  aria-label={`Hapus ${cf.name}`}
                  className="text-slate-400 hover:text-rose-400 transition p-1 focus:outline-none focus:text-rose-400"
                  title="Hapus file ini"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
