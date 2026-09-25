import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Sparkles, Move, RefreshCw, CheckCircle2, Sliders, Info, Eye } from 'lucide-react';

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

export const WatermarkEditor: React.FC<WatermarkEditorProps> = ({
  file,
  options,
  onChangeOption
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [bbox, setBbox] = useState<WatermarkBBox>(
    options.bbox || { x: 0.72, y: 0.84, width: 0.25, height: 0.12, label: 'Kanan Bawah' }
  );
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionMessage, setDetectionMessage] = useState<string>('Menganalisis watermark...');
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'move' | 'nw' | 'ne' | 'se' | 'sw' | 'draw' | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [initialBox, setInitialBox] = useState<WatermarkBBox | null>(null);

  // Auto-detect watermark algorithm
  const detectWatermark = useCallback((img: HTMLImageElement) => {
    setIsDetecting(true);
    setDetectionMessage('🧠 AI sedang memindai posisi watermark foto...');

    // Run in next tick to allow UI to render spinner
    setTimeout(() => {
      try {
        const scanWidth = Math.min(800, img.naturalWidth || img.width);
        const scanHeight = Math.round(scanWidth * ((img.naturalHeight || img.height) / (img.naturalWidth || img.width)));

        const offCanvas = document.createElement('canvas');
        offCanvas.width = scanWidth;
        offCanvas.height = scanHeight;
        const ctx = offCanvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          applyDefault('bottom-right');
          setIsDetecting(false);
          return;
        }

        ctx.drawImage(img, 0, 0, scanWidth, scanHeight);
        const imgData = ctx.getImageData(0, 0, scanWidth, scanHeight);
        const data = imgData.data;

        // Zones to evaluate: [xStart, yStart, xEnd, yEnd, label, weight]
        const zones: Array<{
          id: string;
          label: string;
          x1: number; y1: number; x2: number; y2: number;
          weight: number;
        }> = [
          { id: 'bottom-right', label: 'Kanan Bawah', x1: 0.65, y1: 0.75, x2: 0.98, y2: 0.98, weight: 1.4 },
          { id: 'bottom-left', label: 'Kiri Bawah', x1: 0.02, y1: 0.75, x2: 0.35, y2: 0.98, weight: 1.3 },
          { id: 'bottom-center', label: 'Tengah Bawah', x1: 0.3, y1: 0.85, x2: 0.7, y2: 0.98, weight: 1.2 },
          { id: 'top-right', label: 'Kanan Atas', x1: 0.65, y1: 0.02, x2: 0.98, y2: 0.25, weight: 1.2 },
          { id: 'top-left', label: 'Kiri Atas', x1: 0.02, y1: 0.02, x2: 0.35, y2: 0.25, weight: 1.1 },
          { id: 'center', label: 'Tengah', x1: 0.25, y1: 0.35, x2: 0.75, y2: 0.65, weight: 1.0 },
        ];

        // Compute gradient energy per zone
        let bestZone = zones[0];
        let maxEnergy = -1;
        let detectedBounds: { minX: number; minY: number; maxX: number; maxY: number } | null = null;

        for (const zone of zones) {
          const zx1 = Math.floor(zone.x1 * scanWidth);
          const zy1 = Math.floor(zone.y1 * scanHeight);
          const zx2 = Math.floor(zone.x2 * scanWidth);
          const zy2 = Math.floor(zone.y2 * scanHeight);

          let totalGrad = 0;
          let highEdgeCount = 0;
          let minX = zx2, minY = zy2, maxX = zx1, maxY = zy1;

          for (let y = zy1 + 1; y < zy2 - 1; y += 2) {
            for (let x = zx1 + 1; x < zx2 - 1; x += 2) {
              const idx = (y * scanWidth + x) * 4;
              const idxL = (y * scanWidth + (x - 1)) * 4;
              const idxR = (y * scanWidth + (x + 1)) * 4;
              const idxU = ((y - 1) * scanWidth + x) * 4;
              const idxD = ((y + 1) * scanWidth + x) * 4;

              const lumL = 0.299 * data[idxL] + 0.587 * data[idxL + 1] + 0.114 * data[idxL + 2];
              const lumR = 0.299 * data[idxR] + 0.587 * data[idxR + 1] + 0.114 * data[idxR + 2];
              const lumU = 0.299 * data[idxU] + 0.587 * data[idxU + 1] + 0.114 * data[idxU + 2];
              const lumD = 0.299 * data[idxD] + 0.587 * data[idxD + 1] + 0.114 * data[idxD + 2];

              const grad = Math.abs(lumR - lumL) + Math.abs(lumD - lumU);
              totalGrad += grad;

              if (grad > 40) {
                highEdgeCount++;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }

          const area = (zx2 - zx1) * (zy2 - zy1);
          const score = (highEdgeCount / (area || 1)) * 1000 * zone.weight;

          if (score > maxEnergy && highEdgeCount > 10) {
            maxEnergy = score;
            bestZone = zone;
            detectedBounds = { minX, minY, maxX, maxY };
          }
        }

        let newBox: WatermarkBBox;

        if (detectedBounds && detectedBounds.maxX > detectedBounds.minX && maxEnergy > 1.5) {
          // Normalize tight bounds with 10% context safety padding
          const padX = (detectedBounds.maxX - detectedBounds.minX) * 0.12;
          const padY = (detectedBounds.maxY - detectedBounds.minY) * 0.15;

          const nX = Math.max(0, (detectedBounds.minX - padX) / scanWidth);
          const nY = Math.max(0, (detectedBounds.minY - padY) / scanHeight);
          const nW = Math.min(1 - nX, (detectedBounds.maxX - detectedBounds.minX + padX * 2) / scanWidth);
          const nH = Math.min(1 - nY, (detectedBounds.maxY - detectedBounds.minY + padY * 2) / scanHeight);

          newBox = {
            x: Math.round(nX * 1000) / 1000,
            y: Math.round(nY * 1000) / 1000,
            width: Math.max(0.08, Math.round(nW * 1000) / 1000),
            height: Math.max(0.04, Math.round(nH * 1000) / 1000),
            label: bestZone.label,
            confidence: Math.min(98, Math.round(75 + maxEnergy * 2))
          };

          setDetectionMessage(`🎯 AI otomatis mendeteksi watermark di ${bestZone.label} (Akurasi ~${newBox.confidence}%)!`);
        } else {
          // Fallback default: bottom-right standard watermark
          newBox = {
            x: 0.72,
            y: 0.85,
            width: 0.25,
            height: 0.12,
            label: 'Kanan Bawah (Standar)',
            confidence: 70
          };
          setDetectionMessage('💡 Watermark diset ke Kanan Bawah. Kamu bisa geser/ubah ukuran kotak merah sesuai watermark.');
        }

        setBbox(newBox);
        onChangeOption('bbox', newBox);
      } catch (err) {
        applyDefault('bottom-right');
      } finally {
        setIsDetecting(false);
      }
    }, 80);
  }, [onChangeOption]);

  const applyDefault = (pos: string) => {
    let box: WatermarkBBox;
    switch (pos) {
      case 'bottom-right':
        box = { x: 0.7, y: 0.84, width: 0.27, height: 0.13, label: 'Kanan Bawah' };
        break;
      case 'bottom-left':
        box = { x: 0.03, y: 0.84, width: 0.27, height: 0.13, label: 'Kiri Bawah' };
        break;
      case 'bottom-center':
        box = { x: 0.35, y: 0.86, width: 0.3, height: 0.11, label: 'Tengah Bawah' };
        break;
      case 'top-right':
        box = { x: 0.7, y: 0.03, width: 0.27, height: 0.13, label: 'Kanan Atas' };
        break;
      case 'top-left':
        box = { x: 0.03, y: 0.03, width: 0.27, height: 0.13, label: 'Kiri Atas' };
        break;
      case 'center':
        box = { x: 0.25, y: 0.4, width: 0.5, height: 0.2, label: 'Tengah' };
        break;
      case 'bottom-strip':
        box = { x: 0.0, y: 0.88, width: 1.0, height: 0.12, label: 'Tepi Bawah Penuh' };
        break;
      default:
        box = { x: 0.7, y: 0.84, width: 0.27, height: 0.13, label: 'Kanan Bawah' };
    }
    setBbox(box);
    onChangeOption('bbox', box);
    setDetectionMessage(`Posisi diatur ke: ${box.label}. Geser atau ubah ukuran bila perlu.`);
  };

  // Load image on file change & trigger detection
  useEffect(() => {
    if (!file) return;

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      setImageObj(img);
      detectWatermark(img);
    };

    img.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file, detectWatermark]);

  // Handle Mouse/Touch Interaction on Canvas Overlay
  const getCanvasCoords = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    return { x, y };
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, mode: 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'draw') => {
    e.preventDefault();
    e.stopPropagation();
    const coords = getCanvasCoords(e);
    setIsDragging(true);
    setDragMode(mode);
    setDragStart(coords);
    setInitialBox({ ...bbox });

    if (mode === 'draw') {
      const newBox: WatermarkBBox = {
        x: coords.x,
        y: coords.y,
        width: 0.01,
        height: 0.01,
        label: 'Area Kustom'
      };
      setBbox(newBox);
    }
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStart || !initialBox || !dragMode) return;
    const coords = getCanvasCoords(e);
    const dx = coords.x - dragStart.x;
    const dy = coords.y - dragStart.y;

    let updated: WatermarkBBox = { ...bbox };

    if (dragMode === 'move') {
      const newX = Math.max(0, Math.min(1 - initialBox.width, initialBox.x + dx));
      const newY = Math.max(0, Math.min(1 - initialBox.height, initialBox.y + dy));
      updated = { ...initialBox, x: newX, y: newY };
    } else if (dragMode === 'draw') {
      const minX = Math.min(dragStart.x, coords.x);
      const minY = Math.min(dragStart.y, coords.y);
      const width = Math.abs(coords.x - dragStart.x);
      const height = Math.abs(coords.y - dragStart.y);
      updated = {
        x: minX,
        y: minY,
        width: Math.max(0.02, width),
        height: Math.max(0.02, height),
        label: 'Area Pilihan Manual'
      };
    } else if (dragMode === 'se') {
      const width = Math.max(0.03, Math.min(1 - initialBox.x, initialBox.width + dx));
      const height = Math.max(0.02, Math.min(1 - initialBox.y, initialBox.height + dy));
      updated = { ...initialBox, width, height };
    } else if (dragMode === 'nw') {
      const newX = Math.min(initialBox.x + initialBox.width - 0.03, Math.max(0, initialBox.x + dx));
      const newY = Math.min(initialBox.y + initialBox.height - 0.02, Math.max(0, initialBox.y + dy));
      const width = initialBox.x + initialBox.width - newX;
      const height = initialBox.y + initialBox.height - newY;
      updated = { ...initialBox, x: newX, y: newY, width, height };
    }

    setBbox(updated);
  };

  const handlePointerUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragMode(null);
      setDragStart(null);
      onChangeOption('bbox', bbox);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm">
      {/* Header & Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              AI Watermark Auto-Detector
              {isDetecting && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 animate-pulse font-medium">
                  Memindai...
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{detectionMessage}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => imageObj && detectWatermark(imageObj)}
          disabled={isDetecting || !imageObj}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition focus:outline-none"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
          Auto-Detect Ulang
        </button>
      </div>

      {/* Interactive Image & Mask Canvas */}
      <div
        ref={containerRef}
        onMouseMove={handlePointerMove}
        onTouchMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchEnd={handlePointerUp}
        onMouseDown={(e) => handlePointerDown(e, 'draw')}
        onTouchStart={(e) => handlePointerDown(e, 'draw')}
        className="relative w-full max-h-[480px] overflow-hidden rounded-xl bg-slate-950 flex items-center justify-center select-none cursor-crosshair border border-slate-800"
        style={{ touchAction: 'none' }}
      >
        {imageObj ? (
          <img
            src={imageObj.src}
            alt="Upload Preview"
            className="w-full h-auto max-h-[480px] object-contain pointer-events-none block"
          />
        ) : (
          <div className="h-64 flex items-center justify-center text-xs text-slate-500">
            Memuat gambar...
          </div>
        )}

        {/* Highlighted Watermark Box Overlay */}
        {imageObj && (
          <div
            onMouseDown={(e) => handlePointerDown(e, 'move')}
            onTouchStart={(e) => handlePointerDown(e, 'move')}
            style={{
              left: `${bbox.x * 100}%`,
              top: `${bbox.y * 100}%`,
              width: `${bbox.width * 100}%`,
              height: `${bbox.height * 100}%`,
            }}
            className="absolute border-2 border-rose-500 bg-rose-500/25 shadow-[0_0_20px_rgba(244,63,94,0.45)] cursor-move transition-shadow"
          >
            {/* Badge label */}
            <div className="absolute -top-6 left-0 px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-extrabold tracking-wide uppercase shadow flex items-center gap-1 pointer-events-none whitespace-nowrap">
              <span>Hapus AI</span>
              {bbox.label && <span>• {bbox.label}</span>}
            </div>

            {/* Corner Resize Handles */}
            <div
              onMouseDown={(e) => handlePointerDown(e, 'nw')}
              onTouchStart={(e) => handlePointerDown(e, 'nw')}
              className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-rose-500 rounded-full cursor-nwse-resize shadow"
            />
            <div
              onMouseDown={(e) => handlePointerDown(e, 'se')}
              onTouchStart={(e) => handlePointerDown(e, 'se')}
              className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-rose-500 rounded-full cursor-nwse-resize shadow"
            />
          </div>
        )}

        {/* Tip floating on bottom */}
        <div className="absolute bottom-2 left-2 right-2 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm text-[11px] text-white/90 flex items-center justify-between pointer-events-none">
          <span className="flex items-center gap-1.5">
            <Move className="w-3 h-3 text-rose-400" />
            Tarik kotak merah untuk geser posisi, atau drag di area kosong untuk buat kotak baru.
          </span>
          <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
            {Math.round(bbox.width * 100)}% x {Math.round(bbox.height * 100)}%
          </span>
        </div>
      </div>

      {/* Preset Position Buttons */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Pilih Posisi Cepat:</span>
          <span>Klik salah satu untuk memindahkan kotak secara instan</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'bottom-right', label: '↘️ Kanan Bawah' },
            { id: 'bottom-left', label: '↙️ Kiri Bawah' },
            { id: 'bottom-center', label: '⬇️ Tengah Bawah' },
            { id: 'center', label: '🎯 Tengah Foto' },
            { id: 'top-right', label: '↗️ Kanan Atas' },
            { id: 'top-left', label: '↖️ Kiri Atas' },
            { id: 'bottom-strip', label: '📏 Tepi Bawah Penuh' }
          ].map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyDefault(preset.id)}
              className="px-2.5 py-1 text-xs rounded-lg font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 border border-slate-200 dark:border-slate-700 transition"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
