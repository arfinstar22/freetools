import React, { useState, useRef, useEffect, useCallback } from 'react';
import { UploadCloud, AlertCircle } from 'lucide-react';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  acceptedTypes?: string[];
  multiple?: boolean;
  maxFiles?: number;
  className?: string;
  label?: string;
  sublabel?: string;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onFilesSelected,
  acceptedTypes,
  multiple = true,
  maxFiles = 100,
  className = '',
  label = 'Drop file di sini',
  sublabel = 'atau pilih file dari device'
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((incomingFiles: File[]) => {
    setErrorMessage(null);
    if (!incomingFiles || incomingFiles.length === 0) return;

    let validFiles = incomingFiles;

    // Filter by accepted types if specified
    if (acceptedTypes && acceptedTypes.length > 0) {
      validFiles = incomingFiles.filter((file) => {
        const ext = `.${(file.name.split('.').pop() || '').toLowerCase()}`;
        const mime = file.type.toLowerCase();
        return acceptedTypes.some((type) => {
          if (type.startsWith('.')) return ext === type.toLowerCase();
          if (type.endsWith('/*')) {
            const prefix = type.replace('/*', '');
            return mime.startsWith(prefix);
          }
          return mime === type.toLowerCase();
        });
      });

      if (validFiles.length === 0) {
        setErrorMessage(`Tipe file tidak didukung. Format yang diterima: ${acceptedTypes.join(', ')}`);
        return;
      }
    }

    if (!multiple && validFiles.length > 1) {
      validFiles = [validFiles[0]];
    }

    if (validFiles.length > maxFiles) {
      validFiles = validFiles.slice(0, maxFiles);
    }

    onFilesSelected(validFiles);
  }, [acceptedTypes, multiple, maxFiles, onFilesSelected]);

  // Support clipboard paste (e.g. screenshot pasted directly)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        const files = Array.from(e.clipboardData.files);
        handleFiles(files);
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleFiles]);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        role="button"
        tabIndex={0}
        aria-label={`${label} - ${sublabel}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={onKeyDown}
        className={`relative group cursor-pointer rounded-3xl border-2 border-dashed transition-all duration-200 p-6 sm:p-10 text-center flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-emerald-500/40 backdrop-blur-sm shadow-sm ${
          isDragOver
            ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01] shadow-glow'
            : 'border-slate-300 dark:border-slate-800 bg-gradient-to-b from-white/90 to-slate-50/70 dark:from-slate-900/60 dark:to-slate-950/80 hover:border-emerald-500/50 dark:hover:border-emerald-500/40 hover:bg-white dark:hover:bg-slate-900/80'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes ? acceptedTypes.join(',') : undefined}
          onChange={onInputChange}
          className="hidden"
          aria-hidden="true"
        />

        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-900 border border-emerald-200 dark:border-slate-700/80 flex items-center justify-center mb-3.5 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 group-hover:border-emerald-500/40 transition-all shadow-sm">
          <UploadCloud className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>

        <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
          {label}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">{sublabel}</p>

        <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="px-2.5 py-0.5 rounded-full bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm">
            {multiple ? 'Bisa Banyak File Sekaligus' : 'Pilih 1 File'}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm hidden sm:inline-block">
            Bisa paste langsung (Ctrl+V)
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-fade-in shadow-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
