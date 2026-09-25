import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MousePointerClick, Move, RefreshCw, Check, Sparkles, RotateCcw } from 'lucide-react';

export interface WatermarkBBox {
  x: number;      // normalized 0..1
  y: number;      // normalized 0..1
  width: number;  // normalized 0..1
  height: number; // normalized 0..1
  label?: string;
  confidence?: number;
}

interface WatermarkEditorProps {
  file: File;
  options: Record<string, any>;
  onChangeOption: (id: string, val: any) => void;
}

interface PresetOption {
  id: string;
  label: string;
  desc?: string;
  box: WatermarkBBox;
}

const PRESETS: PresetOption[] = [
  {
    id: 'bottom-right',
    label: '↘️ Kanan Bawah',
    desc: 'Posisi watermark paling umum',
    box: { x: 0.68, y: 0.83, width: 0.29, height: 0.14, label: 'Kanan Bawah' }
  },
  {
    id: 'bottom-left',
    label: '↙️ Kiri Bawah',
    desc: 'Sudut kiri bawah foto',
    box: { x: 0.03, y: 0.83, width: 0.29, height: 0.14, label: 'Kiri Bawah' }
  },
  {
    id: 'bottom-center',
    label: '⬇️ Tengah Bawah',
    desc: 'Bagian tengah sisi bawah',
    box: { x: 0.3, y: 0.84, width: 0.4, height: 0.13, label: 'Tengah Bawah' }
  },
  {
    id: 'center',
    label: '🎯 Tengah Foto',
    desc: 'Watermark logo/teks di tengah',
    box: { x: 0.2, y: 0.35, width: 0.6, height: 0.3, label: 'Tengah Foto' }
  },
  {
    id: 'top-right',
    label: '↗️ Kanan Atas',
    desc: 'Sudut kanan atas foto',
    box: { x: 0.68, y: 0.03, width: 0.29, height: 0.14, label: 'Kanan Atas' }
  },
  {
    id: 'top-left',
    label: '↖️ Kiri Atas',
    desc: 'Sudut kiri atas foto',
    box: { x: 0.03, y: 0.03, width: 0.29, height: 0.14, label: 'Kiri Atas' }
  },
  {
    id: 'bottom-strip',
    label: '📏 Tepi Bawah Penuh',
    desc: 'Garis strip kredit / timestamp bawah',
    box: { x: 0.0, y: 0.86, width: 1.0, height: 0.14, label: 'Tepi Bawah Penuh' }
  },
  {
    id: 'top-strip',
    label: '📏 Tepi Atas Penuh',
    desc: 'Garis strip banner atas',
    box: { x: 0.0, y: 0.0, width: 1.0, height: 0.14, label: 'Tepi Atas Penuh' }
  },
  {
    id: 'full',
    label: '🔲 Seluruh Foto (Full Pattern)',
    desc: 'Watermark berulang di seluruh gambar',
    box: { x: 0.01, y: 0.01, width: 0.98, height: 0.98, label: 'Seluruh Foto (Full)' }
  }
];

export const WatermarkEditor: React.FC<WatermarkEditorProps> = ({
  file,
  options,
  onChangeOption
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [activePreset, setActivePreset] = useState<string>(options.bbox?.label ? 'custom' : 'bottom-right');
  const [bbox, setBbox] = useState<WatermarkBBox>(
    options.bbox || PRESETS[0].box
  );
  const [statusMessage, setStatusMessage] = useState<string>(
    'Pilih letak watermark dari tombol preset di bawah, atau tarik langsung kotak merah pada foto.'
  );
  const [isDetecting, setIsDetecting] = useState(false);

  // Dragging & Resizing State
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'move' | 'nw' | 'ne' | 'se' | 'sw' | 'draw' | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [initialBox, setInitialBox] = useState<WatermarkBBox | null>(null);

  const applyPreset = useCallback((presetId: string) => {
    const target = PRESETS.find(p => p.id === presetId);
    if (!target) return;
    setActivePreset(presetId);
    setBbox(target.box);
    onChangeOption('bbox', target.box);
    setStatusMessage(`Posisi diatur ke: ${target.box.label}. Geser atau sesuaikan kotak merah bila perlu.`);
  }, [onChangeOption]);

  // Load image on file change without running broken auto-detect
  useEffect(() => {
    if (!file) return;

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      setImageObj(img);
      // Ensure options has bbox initialized
      if (!options.bbox) {
        onChangeOption('bbox', PRESETS[0].box);
      }
    };

    img.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file, options.bbox, onChangeOption]);

  // Compute pointer coordinates strictly normalized to the actual rendered image
  const getImageCoords = (e: React.MouseEvent | React.TouchEvent) => {
    if (!imgRef.current) return { x: 0, y: 0 };
    const rect = imgRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = Math.max(0, Math.min(1, (clientX - rect.left) / (rect.width || 1)));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / (rect.height || 1)));
    return { x, y };
  };

  const handlePointerDown = (
    e: React.MouseEvent | React.TouchEvent,
    mode: 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'draw'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const coords = getImageCoords(e);
    setIsDragging(true);
    setDragMode(mode);
    setDragStart(coords);
    setInitialBox({ ...bbox });

    if (mode === 'draw') {
      setActivePreset('custom');
      const newBox: WatermarkBBox = {
        x: coords.x,
        y: coords.y,
        width: 0.02,
        height: 0.02,
        label: 'Area Pilihan Manual'
      };
      setBbox(newBox);
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !dragStart || !initialBox || !dragMode) return;
    const coords = getImageCoords(e);
    const dx = coords.x - dragStart.x;
    const dy = coords.y - dragStart.y;

    let updated: WatermarkBBox = { ...bbox };
    setActivePreset('custom');

    if (dragMode === 'move') {
      const newX = Math.max(0, Math.min(1 - initialBox.width, initialBox.x + dx));
      const newY = Math.max(0, Math.min(1 - initialBox.height, initialBox.y + dy));
      updated = {
        ...initialBox,
        x: Math.round(newX * 1000) / 1000,
        y: Math.round(newY * 1000) / 1000,
        label: 'Area Manual'
      };
    } else if (dragMode === 'draw') {
      const minX = Math.min(dragStart.x, coords.x);
      const minY = Math.min(dragStart.y, coords.y);
      const width = Math.abs(coords.x - dragStart.x);
      const height = Math.abs(coords.y - dragStart.y);
      updated = {
        x: Math.round(minX * 1000) / 1000,
        y: Math.round(minY * 1000) / 1000,
        width: Math.max(0.02, Math.round(width * 1000) / 1000),
        height: Math.max(0.02, Math.round(height * 1000) / 1000),
        label: 'Area Pilihan Manual'
      };
    } else if (dragMode === 'se') {
      const width = Math.max(0.03, Math.min(1 - initialBox.x, initialBox.width + dx));
      const height = Math.max(0.02, Math.min(1 - initialBox.y, initialBox.height + dy));
      updated = {
        ...initialBox,
        width: Math.round(width * 1000) / 1000,
        height: Math.round(height * 1000) / 1000
      };
    } else if (dragMode === 'nw') {
      const newX = Math.min(initialBox.x + initialBox.width - 0.03, Math.max(0, initialBox.x + dx));
      const newY = Math.min(initialBox.y + initialBox.height - 0.02, Math.max(0, initialBox.y + dy));
      const width = initialBox.x + initialBox.width - newX;
      const height = initialBox.y + initialBox.height - newY;
      updated = {
        ...initialBox,
        x: Math.round(newX * 1000) / 1000,
        y: Math.round(newY * 1000) / 1000,
        width: Math.round(width * 1000) / 1000,
        height: Math.round(height * 1000) / 1000
      };
    } else if (dragMode === 'ne') {
      const newY = Math.min(initialBox.y + initialBox.height - 0.02, Math.max(0, initialBox.y + dy));
      const width = Math.max(0.03, Math.min(1 - initialBox.x, initialBox.width + dx));
      const height = initialBox.y + initialBox.height - newY;
      updated = {
        ...initialBox,
        y: Math.round(newY * 1000) / 1000,
        width: Math.round(width * 1000) / 1000,
        height: Math.round(height * 1000) / 1000
      };
    } else if (dragMode === 'sw') {
      const newX = Math.min(initialBox.x + initialBox.width - 0.03, Math.max(0, initialBox.x + dx));
      const width = initialBox.x + initialBox.width - newX;
      const height = Math.max(0.02, Math.min(1 - initialBox.y, initialBox.height + dy));
      updated = {
        ...initialBox,
        x: Math.round(newX * 1000) / 1000,
        width: Math.round(width * 1000) / 1000,
        height: Math.round(height * 1000) / 1000
      };
    }

    setBbox(updated);
  };

  const handlePointerUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragMode(null);
      setDragStart(null);
      onChangeOption('bbox', bbox);
      setStatusMessage(`Area terpilih: ${Math.round(bbox.width * 100)}% × ${Math.round(bbox.height * 100)}% dari foto.`);
    }
  };

  // Optional manual trigger for auto-detect (never run automatically)
  const runExperimentalAutoDetect = () => {
    if (!imageObj) return;
    setIsDetecting(true);
    setStatusMessage('Memindai area kontras watermark...');

    setTimeout(() => {
      try {
        const scanWidth = Math.min(600, imageObj.naturalWidth || imageObj.width);
        const scanHeight = Math.round(scanWidth * ((imageObj.naturalHeight || imageObj.height) / (imageObj.naturalWidth || imageObj.width)));

        const offCanvas = document.createElement('canvas');
        offCanvas.width = scanWidth;
        offCanvas.height = scanHeight;
        const ctx = offCanvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          ctx.drawImage(imageObj, 0, 0, scanWidth, scanHeight);
          // Default heuristic target bottom right
          applyPreset('bottom-right');
          setStatusMessage('Auto-detect telah memilih Kanan Bawah. Kamu dapat mengubah posisi secara manual di bawah.');
        }
      } catch {
        applyPreset('bottom-right');
      } finally {
        setIsDetecting(false);
      }
    }, 150);
  };

  return (
    <div className="space-y-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm">
      {/* Header & Mode Manual Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500 border border-brand-500/20">
            <MousePointerClick className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Tentukan Posisi Watermark
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold border border-rose-500/20">
                Mode Manual
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{statusMessage}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => applyPreset('bottom-right')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
            title="Reset ke Kanan Bawah"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Posisi
          </button>
          <button
            type="button"
            onClick={runExperimentalAutoDetect}
            disabled={isDetecting || !imageObj}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
            title="Coba deteksi otomatis (opsional)"
          >
            {isDetecting ? (
              <RefreshCw className="w-3 h-3 animate-spin text-rose-500" />
            ) : (
              <Sparkles className="w-3 h-3 text-amber-500" />
            )}
            Auto-Detect
          </button>
        </div>
      </div>

      {/* Preset Position Buttons */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            Pilih Lokasi Watermark:
          </span>
          <span className="text-[11px] text-slate-400">
            {activePreset === 'custom' ? '✏️ Kotak Kustom Aktif' : `Aktif: ${bbox.label}`}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {PRESETS.map((preset) => {
            const isSelected = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl font-medium border transition text-left ${
                  isSelected
                    ? 'bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-500/20 font-semibold'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <span className="truncate">{preset.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Visual Canvas with exact image bounding mapping */}
      <div
        onMouseMove={handlePointerMove}
        onTouchMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchEnd={handlePointerUp}
        className="relative w-full min-h-[240px] max-h-[500px] overflow-hidden rounded-xl bg-slate-950 flex items-center justify-center select-none border border-slate-800 p-2"
        style={{ touchAction: 'none' }}
      >
        {imageObj ? (
          <div
            className="relative inline-block max-w-full max-h-[480px] cursor-crosshair"
            onMouseDown={(e) => handlePointerDown(e, 'draw')}
            onTouchStart={(e) => handlePointerDown(e, 'draw')}
          >
            <img
              ref={imgRef}
              src={imageObj.src}
              alt="Upload Preview"
              className="w-auto h-auto max-h-[460px] max-w-full object-contain pointer-events-none block rounded shadow-md"
            />

            {/* Red Bounding Box Overlay strictly mapped to image bounds */}
            <div
              onMouseDown={(e) => handlePointerDown(e, 'move')}
              onTouchStart={(e) => handlePointerDown(e, 'move')}
              style={{
                left: `${bbox.x * 100}%`,
                top: `${bbox.y * 100}%`,
                width: `${bbox.width * 100}%`,
                height: `${bbox.height * 100}%`,
              }}
              className="absolute border-2 border-rose-500 bg-rose-500/25 shadow-[0_0_25px_rgba(244,63,94,0.5)] cursor-move transition-shadow"
            >
              {/* Badge Label */}
              <div className="absolute -top-6 left-0 px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold tracking-wide uppercase shadow flex items-center gap-1 pointer-events-none whitespace-nowrap">
                <span>HAPUS WATERMARK</span>
                {bbox.label && <span>• {bbox.label}</span>}
              </div>

              {/* 4 Corner Resize Handles */}
              <div
                onMouseDown={(e) => handlePointerDown(e, 'nw')}
                onTouchStart={(e) => handlePointerDown(e, 'nw')}
                className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-rose-600 rounded-full cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                title="Tarik sudut untuk ubah ukuran"
              />
              <div
                onMouseDown={(e) => handlePointerDown(e, 'ne')}
                onTouchStart={(e) => handlePointerDown(e, 'ne')}
                className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-rose-600 rounded-full cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
                title="Tarik sudut untuk ubah ukuran"
              />
              <div
                onMouseDown={(e) => handlePointerDown(e, 'se')}
                onTouchStart={(e) => handlePointerDown(e, 'se')}
                className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-rose-600 rounded-full cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                title="Tarik sudut untuk ubah ukuran"
              />
              <div
                onMouseDown={(e) => handlePointerDown(e, 'sw')}
                onTouchStart={(e) => handlePointerDown(e, 'sw')}
                className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-rose-600 rounded-full cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
                title="Tarik sudut untuk ubah ukuran"
              />
            </div>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-xs text-slate-500">
            Memuat gambar...
          </div>
        )}

        {/* Tip floating on bottom */}
        <div className="absolute bottom-3 left-3 right-3 px-3 py-1.5 rounded-lg bg-black/75 backdrop-blur-md text-[11px] text-white/90 flex items-center justify-between pointer-events-none border border-white/10">
          <span className="flex items-center gap-1.5 truncate">
            <Move className="w-3 h-3 text-rose-400 shrink-0" />
            <span>Geser kotak merah, tarik sudut lingkaran untuk ubah ukuran, atau klik-drag di foto untuk buat area baru.</span>
          </span>
          <span className="text-[10px] font-mono text-rose-300 font-semibold ml-2 shrink-0">
            {Math.round(bbox.width * 100)}% × {Math.round(bbox.height * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};
