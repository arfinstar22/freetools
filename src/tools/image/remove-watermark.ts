import { ToolDefinition, ProcessContext, ProcessResult, ProcessedItem } from '../../types/tool';
import { teleaInpaint } from '../../utils/inpaint-telea';

const MAX_CANVAS_DIM = 16384;

/**
 * Remove Watermark tool.
 *
 * Two modes:
 * 1. Basic (Telea) — pure JS inpainting, fully offline, no model needed
 * 2. AI (LaMa ONNX) — downloads ~20-50MB model once, cached for offline use
 *
 * UX flow: User uploads image, draws mask over watermark area using options,
 * then the tool inpaints the masked region.
 *
 * Since ToolRunner doesn't support custom canvas editors, we use an automatic
 * watermark detection approach based on color/transparency analysis, combined
 * with a configurable mask area (top/bottom/corner position selectors).
 */
export const removeWatermarkTool: ToolDefinition = {
  id: 'remove-watermark',
  name: 'Hapus Watermark Foto',
  shortDescription: 'Hapus watermark, logo, atau teks dari foto dengan AI inpainting',
  description: 'Hapus watermark, logo overlay, atau teks yang menempel di foto menggunakan algoritma inpainting canggih. Mode Basic (offline penuh) menggunakan Telea FMM Algorithm. Mode AI menggunakan LaMa neural network untuk kualitas terbaik. Pilih posisi watermark atau biarkan auto-detect.',
  category: 'image',
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp', '.jpg', '.jpeg', '.png', '.webp'],
  inputMode: 'file',
  icon: 'Eraser',
  popular: true,
  localProcessing: true,
  supportsBatch: false,
  supportsWorkflow: false,
  keywords: [
    'remove watermark', 'hapus watermark', 'hapus logo', 'hapus teks foto',
    'watermark remover', 'hilangkan watermark', 'hapus tulisan foto', 'bersihkan watermark',
    'foto tanpa watermark', 'inpainting', 'watermark eraser', 'remove text from photo'
  ],
  optionSchemas: [
    {
      id: 'mode',
      label: 'Mode Penghapusan',
      type: 'select',
      defaultValue: 'basic',
      description: 'Basic = offline penuh (cepat, tanpa download). AI = kualitas lebih tinggi (download model sekali ~20MB).',
      options: [
        { label: '⚡ Basic (Telea Algorithm — Offline, Cepat)', value: 'basic' },
        { label: '🧠 AI (LaMa Inpainting — Kualitas Terbaik)', value: 'ai' }
      ]
    },
    {
      id: 'watermarkPosition',
      label: 'Posisi Watermark',
      type: 'select',
      defaultValue: 'bottom-right',
      description: 'Pilih area di mana watermark berada. Auto-detect akan mencoba mendeteksi otomatis.',
      options: [
        { label: 'Auto-Detect (Deteksi Otomatis)', value: 'auto' },
        { label: 'Kanan Bawah', value: 'bottom-right' },
        { label: 'Kiri Bawah', value: 'bottom-left' },
        { label: 'Tengah Bawah', value: 'bottom-center' },
        { label: 'Kanan Atas', value: 'top-right' },
        { label: 'Kiri Atas', value: 'top-left' },
        { label: 'Tengah (Full Center)', value: 'center' },
        { label: 'Seluruh Tepi Bawah (Strip)', value: 'bottom-strip' }
      ]
    },
    {
      id: 'maskSize',
      label: 'Ukuran Area Mask (%)',
      description: 'Seberapa besar area watermark yang dicakup. Perbesar jika watermark tidak sepenuhnya terhapus.',
      type: 'range',
      defaultValue: 15,
      min: 5,
      max: 40,
      step: 1,
      unit: '%'
    },
    {
      id: 'inpaintRadius',
      label: 'Radius Inpainting',
      description: 'Radius area referensi untuk mengisi piksel. Lebih besar = lebih smooth tapi lebih lambat.',
      type: 'range',
      defaultValue: 7,
      min: 3,
      max: 15,
      step: 1,
      unit: 'px'
    }
  ],
  process: async (context: ProcessContext): Promise<ProcessResult> => {
    const startTime = performance.now();
    const files = context.files || [];

    if (files.length === 0) {
      throw new Error('Pilih 1 gambar yang ingin dihapus watermarknya.');
    }

    const file = files[0];
    if (file.type && !file.type.startsWith('image/')) {
      throw new Error('File harus berupa gambar (JPG, PNG, WEBP).');
    }

    const mode = context.options?.mode || 'basic';
    const position = context.options?.watermarkPosition || 'bottom-right';
    const maskSizePct = Math.max(5, Math.min(40, Number(context.options?.maskSize) || 15)) / 100;
    const inpaintRadius = Math.max(3, Math.min(15, Number(context.options?.inpaintRadius) || 7));

    context.onProgress?.({
      current: 0,
      total: 1,
      message: 'Memuat gambar...',
      percentage: 5
    });

    // Load image to canvas
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    try {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Timeout memuat gambar.')), 8000);
        img.onload = () => { clearTimeout(timer); resolve(); };
        img.onerror = () => { clearTimeout(timer); reject(new Error('Gagal memuat gambar.')); };
        img.src = objectUrl;
      });

      let w = Math.min(MAX_CANVAS_DIM, Math.max(1, img.naturalWidth || img.width));
      let h = Math.min(MAX_CANVAS_DIM, Math.max(1, img.naturalHeight || img.height));

      // For AI mode, limit resolution to prevent memory issues
      const maxAIDim = mode === 'ai' ? 2048 : MAX_CANVAS_DIM;
      if (w > maxAIDim || h > maxAIDim) {
        if (w > h) {
          h = Math.round((h * maxAIDim) / w);
          w = maxAIDim;
        } else {
          w = Math.round((w * maxAIDim) / h);
          h = maxAIDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Canvas context tidak tersedia.');

      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);

      context.onProgress?.({
        current: 0,
        total: 1,
        message: 'Membuat mask area watermark...',
        percentage: 15
      });

      // Generate mask based on position
      const maskData = generatePositionMask(w, h, position, maskSizePct, imageData);

      context.onProgress?.({
        current: 0,
        total: 1,
        message: mode === 'ai'
          ? 'Menjalankan AI LaMa inpainting... (memuat model, pertama kali perlu download ~20MB)'
          : 'Menjalankan Telea inpainting...',
        percentage: 30
      });

      let resultImageData: ImageData;

      if (mode === 'ai') {
        resultImageData = await runLamaInpainting(canvas, maskData, w, h, context);
      } else {
        // Basic Telea inpainting
        resultImageData = teleaInpaint(
          { width: w, height: h, data: imageData.data },
          { width: w, height: h, data: maskData.data },
          inpaintRadius
        );
      }

      context.onProgress?.({
        current: 0,
        total: 1,
        message: 'Merender hasil akhir...',
        percentage: 90
      });

      // Render result
      const resultCanvas = document.createElement('canvas');
      resultCanvas.width = w;
      resultCanvas.height = h;
      const resultCtx = resultCanvas.getContext('2d');
      if (!resultCtx) throw new Error('Canvas context tidak tersedia.');

      resultCtx.putImageData(resultImageData, 0, 0);

      const outputMime = 'image/jpeg';
      const blob = await new Promise<Blob>((resolve, reject) => {
        resultCanvas.toBlob(
          (b) => { if (b) resolve(b); else reject(new Error('Gagal merender hasil.')); },
          outputMime,
          0.92
        );
      });

      const dataUrl = resultCanvas.toDataURL(outputMime, 0.92);
      const cleanBase = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const finalName = `${cleanBase}_no_watermark.jpg`;
      const modeLabel = mode === 'ai' ? 'AI LaMa' : 'Telea Basic';

      return {
        success: true,
        message: `Watermark berhasil dihapus menggunakan ${modeLabel}! Posisi: ${position}, Area: ${Math.round(maskSizePct * 100)}%.`,
        downloadName: finalName,
        items: [{
          id: 'wm_removed',
          name: finalName,
          size: blob.size,
          originalSize: file.size,
          type: outputMime,
          blob,
          dataUrl
        }],
        stats: {
          originalTotalSize: file.size,
          processedTotalSize: blob.size,
          count: 1,
          timeTakenMs: Math.round(performance.now() - startTime)
        }
      };
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }
};

/**
 * Generate a binary mask ImageData based on the watermark position preset.
 * White (255) pixels = area to inpaint.
 */
function generatePositionMask(
  w: number,
  h: number,
  position: string,
  sizePct: number,
  imageData: ImageData
): ImageData {
  const maskArr = new Uint8ClampedArray(w * h * 4);

  // For auto-detect, analyze the image edges for semi-transparent or repeated patterns
  if (position === 'auto') {
    return autoDetectWatermarkMask(w, h, imageData);
  }

  const mw = Math.round(w * sizePct); // mask width
  const mh = Math.round(h * sizePct); // mask height

  let startX = 0;
  let startY = 0;

  switch (position) {
    case 'bottom-right':
      startX = w - mw;
      startY = h - mh;
      break;
    case 'bottom-left':
      startX = 0;
      startY = h - mh;
      break;
    case 'bottom-center':
      startX = Math.round((w - mw) / 2);
      startY = h - mh;
      break;
    case 'top-right':
      startX = w - mw;
      startY = 0;
      break;
    case 'top-left':
      startX = 0;
      startY = 0;
      break;
    case 'center':
      startX = Math.round((w - mw) / 2);
      startY = Math.round((h - mh) / 2);
      break;
    case 'bottom-strip':
      startX = 0;
      startY = h - Math.round(h * sizePct * 0.6);
      // Full width strip
      for (let y = startY; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          maskArr[idx] = 255;
          maskArr[idx + 1] = 255;
          maskArr[idx + 2] = 255;
          maskArr[idx + 3] = 255;
        }
      }
      return new ImageData(maskArr, w, h);
  }

  // Fill rectangular mask region
  for (let y = startY; y < Math.min(h, startY + mh); y++) {
    for (let x = startX; x < Math.min(w, startX + mw); x++) {
      const idx = (y * w + x) * 4;
      maskArr[idx] = 255;
      maskArr[idx + 1] = 255;
      maskArr[idx + 2] = 255;
      maskArr[idx + 3] = 255;
    }
  }

  return new ImageData(maskArr, w, h);
}

/**
 * Auto-detect watermark regions by analyzing contrast variance in edge regions.
 * Looks for areas with unusual luminance patterns typical of overlay watermarks.
 */
function autoDetectWatermarkMask(
  w: number,
  h: number,
  imageData: ImageData
): ImageData {
  const maskArr = new Uint8ClampedArray(w * h * 4);
  const data = imageData.data;

  // Analyze luminance in a grid of blocks
  const blockSize = Math.max(8, Math.round(Math.min(w, h) / 40));
  const blocksX = Math.ceil(w / blockSize);
  const blocksY = Math.ceil(h / blockSize);

  // Compute per-block average luminance and variance
  const blockLum: number[] = new Array(blocksX * blocksY).fill(0);
  const blockVar: number[] = new Array(blocksX * blocksY).fill(0);
  const blockCount: number[] = new Array(blocksX * blocksY).fill(0);

  for (let by = 0; by < blocksY; by++) {
    for (let bx = 0; bx < blocksX; bx++) {
      const bi = by * blocksX + bx;
      let sum = 0;
      let sumSq = 0;
      let count = 0;

      for (let dy = 0; dy < blockSize && by * blockSize + dy < h; dy++) {
        for (let dx = 0; dx < blockSize && bx * blockSize + dx < w; dx++) {
          const px = bx * blockSize + dx;
          const py = by * blockSize + dy;
          const idx = (py * w + px) * 4;
          const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          sum += lum;
          sumSq += lum * lum;
          count++;
        }
      }

      if (count > 0) {
        blockLum[bi] = sum / count;
        blockVar[bi] = (sumSq / count) - (sum / count) ** 2;
        blockCount[bi] = count;
      }
    }
  }

  // Global stats
  let globalMeanLum = 0;
  let totalBlocks = 0;
  for (let i = 0; i < blockLum.length; i++) {
    if (blockCount[i] > 0) {
      globalMeanLum += blockLum[i];
      totalBlocks++;
    }
  }
  globalMeanLum /= totalBlocks || 1;

  // Mark blocks in border regions (bottom 25%, right 25%) that have high contrast variance
  // as potential watermark areas — watermarks tend to be in corners with text-like high variance
  const borderYStart = Math.round(blocksY * 0.7);

  for (let by = borderYStart; by < blocksY; by++) {
    for (let bx = 0; bx < blocksX; bx++) {
      const bi = by * blocksX + bx;

      // High local variance relative to neighbors suggests text/logo overlay
      const variance = blockVar[bi];
      const lumDiff = Math.abs(blockLum[bi] - globalMeanLum);

      // Heuristic: high variance + luminance anomaly = likely watermark
      if (variance > 200 || lumDiff > 60) {
        // Mark this block in the mask
        for (let dy = 0; dy < blockSize && by * blockSize + dy < h; dy++) {
          for (let dx = 0; dx < blockSize && bx * blockSize + dx < w; dx++) {
            const px = bx * blockSize + dx;
            const py = by * blockSize + dy;
            const idx = (py * w + px) * 4;
            maskArr[idx] = 255;
            maskArr[idx + 1] = 255;
            maskArr[idx + 2] = 255;
            maskArr[idx + 3] = 255;
          }
        }
      }
    }
  }

  // If auto-detect found nothing, fallback to bottom-right 15%
  let maskPixelCount = 0;
  for (let i = 3; i < maskArr.length; i += 4) {
    if (maskArr[i] > 0) maskPixelCount++;
  }

  if (maskPixelCount < (w * h * 0.005)) {
    // Fallback: bottom-right corner
    const mw = Math.round(w * 0.15);
    const mh = Math.round(h * 0.15);
    for (let y = h - mh; y < h; y++) {
      for (let x = w - mw; x < w; x++) {
        const idx = (y * w + x) * 4;
        maskArr[idx] = 255;
        maskArr[idx + 1] = 255;
        maskArr[idx + 2] = 255;
        maskArr[idx + 3] = 255;
      }
    }
  }

  // Dilate mask slightly to cover edges
  return dilateMask(new ImageData(maskArr, w, h), 3);
}

/**
 * Morphological dilation on a mask to expand marked regions.
 */
function dilateMask(mask: ImageData, radius: number): ImageData {
  const w = mask.width;
  const h = mask.height;
  const result = new Uint8ClampedArray(w * h * 4);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      let found = false;

      for (let dy = -radius; dy <= radius && !found; dy++) {
        for (let dx = -radius; dx <= radius && !found; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
          if (dx * dx + dy * dy > radius * radius) continue;
          const ni = (ny * w + nx) * 4;
          if (mask.data[ni + 3] > 0) found = true;
        }
      }

      if (found) {
        result[idx] = 255;
        result[idx + 1] = 255;
        result[idx + 2] = 255;
        result[idx + 3] = 255;
      }
    }
  }

  return new ImageData(result, w, h);
}

/**
 * AI mode: LaMa inpainting via ONNX Runtime Web.
 * Downloads the LaMa model (~20MB) once, cached by the browser.
 *
 * ponytail: LaMa ONNX model hosted on HuggingFace CDN (free, no auth).
 * If model unavailable, falls back to enhanced Telea.
 */
async function runLamaInpainting(
  canvas: HTMLCanvasElement,
  maskData: ImageData,
  w: number,
  h: number,
  context: ProcessContext
): Promise<ImageData> {
  try {
    // Try loading ONNX Runtime Web
    const ort = await import('onnxruntime-web');

    context.onProgress?.({
      current: 0,
      total: 1,
      message: 'Mengunduh model LaMa AI... (pertama kali ~20MB, selanjutnya dari cache)',
      percentage: 35
    });

    // ponytail: HuggingFace CDN hosts LaMa ONNX model for free, no API key needed
    const MODEL_URL = 'https://huggingface.co/nicejoysoft/lama-onnx/resolve/main/lama_fp16.onnx';

    const session = await ort.InferenceSession.create(MODEL_URL, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all'
    });

    context.onProgress?.({
      current: 0,
      total: 1,
      message: 'Model AI dimuat! Memproses inpainting...',
      percentage: 55
    });

    // Prepare input tensors: resize to 512x512 for LaMa
    const modelSize = 512;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = modelSize;
    tempCanvas.height = modelSize;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.drawImage(canvas, 0, 0, modelSize, modelSize);

    const resizedImg = tempCtx.getImageData(0, 0, modelSize, modelSize);

    // Resize mask too
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = w;
    maskCanvas.height = h;
    const maskCtx = maskCanvas.getContext('2d')!;
    maskCtx.putImageData(maskData, 0, 0);

    const maskResized = document.createElement('canvas');
    maskResized.width = modelSize;
    maskResized.height = modelSize;
    const maskResizedCtx = maskResized.getContext('2d')!;
    maskResizedCtx.drawImage(maskCanvas, 0, 0, modelSize, modelSize);
    const resizedMask = maskResizedCtx.getImageData(0, 0, modelSize, modelSize);

    // Normalize to float32 tensors [1, 3, 512, 512] for image, [1, 1, 512, 512] for mask
    const imgTensor = new Float32Array(3 * modelSize * modelSize);
    const mskTensor = new Float32Array(1 * modelSize * modelSize);

    for (let i = 0; i < modelSize * modelSize; i++) {
      imgTensor[i] = resizedImg.data[i * 4] / 255.0;                          // R
      imgTensor[modelSize * modelSize + i] = resizedImg.data[i * 4 + 1] / 255.0; // G
      imgTensor[2 * modelSize * modelSize + i] = resizedImg.data[i * 4 + 2] / 255.0; // B
      mskTensor[i] = resizedMask.data[i * 4 + 3] > 128 ? 1.0 : 0.0;
    }

    const imgInput = new ort.Tensor('float32', imgTensor, [1, 3, modelSize, modelSize]);
    const mskInput = new ort.Tensor('float32', mskTensor, [1, 1, modelSize, modelSize]);

    const results = await session.run({ image: imgInput, mask: mskInput });
    const output = results[Object.keys(results)[0]];

    context.onProgress?.({
      current: 0,
      total: 1,
      message: 'AI selesai! Menskala hasil ke ukuran asli...',
      percentage: 80
    });

    // Convert output tensor back to ImageData at model resolution
    const outputData = output.data as Float32Array;
    const resultSmall = new Uint8ClampedArray(modelSize * modelSize * 4);
    for (let i = 0; i < modelSize * modelSize; i++) {
      resultSmall[i * 4] = Math.max(0, Math.min(255, Math.round(outputData[i] * 255)));
      resultSmall[i * 4 + 1] = Math.max(0, Math.min(255, Math.round(outputData[modelSize * modelSize + i] * 255)));
      resultSmall[i * 4 + 2] = Math.max(0, Math.min(255, Math.round(outputData[2 * modelSize * modelSize + i] * 255)));
      resultSmall[i * 4 + 3] = 255;
    }

    // Upscale back to original resolution
    const smallCanvas = document.createElement('canvas');
    smallCanvas.width = modelSize;
    smallCanvas.height = modelSize;
    const smallCtx = smallCanvas.getContext('2d')!;
    smallCtx.putImageData(new ImageData(resultSmall, modelSize, modelSize), 0, 0);

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = w;
    finalCanvas.height = h;
    const finalCtx = finalCanvas.getContext('2d')!;
    finalCtx.imageSmoothingEnabled = true;
    finalCtx.imageSmoothingQuality = 'high';
    finalCtx.drawImage(smallCanvas, 0, 0, w, h);

    session.release();

    return finalCtx.getImageData(0, 0, w, h);
  } catch (err: any) {
    console.warn('LaMa AI fallback to enhanced Telea:', err.message);

    context.onProgress?.({
      current: 0,
      total: 1,
      message: 'Model AI tidak tersedia — fallback ke Enhanced Telea inpainting...',
      percentage: 50
    });

    // Fallback: use Telea with larger radius for better quality
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    const imageData = ctx.getImageData(0, 0, w, h);

    return teleaInpaint(
      { width: w, height: h, data: imageData.data },
      { width: w, height: h, data: maskData.data },
      10 // larger radius for better fallback quality
    );
  }
}
