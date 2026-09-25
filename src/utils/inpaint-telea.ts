/**
 * Telea inpainting algorithm — pure JS implementation.
 * Based on Alexandru Telea's "An Image Inpainting Technique Based on the Fast Marching Method" (2004).
 *
 * Works entirely offline, no model download, no dependencies.
 * Good for small-to-medium watermarks on smooth/gradient backgrounds.
 */

interface PixelData {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

// Fast Marching Method states
const KNOWN = 0;
const BAND = 1;
const INSIDE = 2;

/**
 * Inpaint the masked region using Telea's FMM-based algorithm.
 * @param image - Source image pixel data (RGBA)
 * @param mask - Binary mask where non-zero alpha pixels = inpaint region
 * @param radius - Inpainting neighborhood radius (default 5)
 */
export function teleaInpaint(
  image: PixelData,
  mask: PixelData,
  radius: number = 5
): ImageData {
  const { width: w, height: h } = image;
  const src = new Float32Array(w * h * 3);
  const result = new Uint8ClampedArray(w * h * 4);

  // Convert to float RGB working copy
  for (let i = 0; i < w * h; i++) {
    src[i * 3] = image.data[i * 4];
    src[i * 3 + 1] = image.data[i * 4 + 1];
    src[i * 3 + 2] = image.data[i * 4 + 2];
  }

  // Build flag and distance arrays from mask
  const flags = new Uint8Array(w * h);
  const dist = new Float32Array(w * h);
  dist.fill(Infinity);

  // Mark mask pixels as INSIDE, rest as KNOWN
  for (let i = 0; i < w * h; i++) {
    // Mask pixel: any pixel with alpha > 128 or any non-zero RGB on the mask
    const mi = i * 4;
    const isMasked = mask.data[mi + 3] > 128 ||
      (mask.data[mi] > 128 || mask.data[mi + 1] > 128 || mask.data[mi + 2] > 128);

    if (isMasked) {
      flags[i] = INSIDE;
      dist[i] = Infinity;
    } else {
      flags[i] = KNOWN;
      dist[i] = 0;
    }
  }

  // Find initial band: KNOWN pixels adjacent to INSIDE pixels
  // Simple min-heap for FMM
  const heap: number[] = [];

  const pushHeap = (idx: number) => {
    heap.push(idx);
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (dist[heap[parent]] > dist[heap[i]]) {
        [heap[parent], heap[i]] = [heap[i], heap[parent]];
        i = parent;
      } else break;
    }
  };

  const popHeap = (): number => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      while (true) {
        let smallest = i;
        const l = 2 * i + 1;
        const r = 2 * i + 2;
        if (l < heap.length && dist[heap[l]] < dist[heap[smallest]]) smallest = l;
        if (r < heap.length && dist[heap[r]] < dist[heap[smallest]]) smallest = r;
        if (smallest !== i) {
          [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
          i = smallest;
        } else break;
      }
    }
    return top;
  };

  // Initialize band from boundary pixels
  const dx = [-1, 1, 0, 0];
  const dy = [0, 0, -1, 1];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (flags[idx] !== KNOWN) continue;

      for (let d = 0; d < 4; d++) {
        const nx = x + dx[d];
        const ny = y + dy[d];
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
        const nIdx = ny * w + nx;
        if (flags[nIdx] === INSIDE) {
          // This KNOWN pixel borders an INSIDE pixel — promote it to BAND
          if (flags[idx] === KNOWN) {
            flags[idx] = BAND;
            dist[idx] = 0;
            pushHeap(idx);
          }
          break;
        }
      }
    }
  }

  // Fast Marching: propagate from band into INSIDE region
  while (heap.length > 0) {
    const idx = popHeap();
    flags[idx] = KNOWN;

    const cx = idx % w;
    const cy = (idx - cx) / w;

    // For each neighbor that is INSIDE, compute its value and add to band
    for (let d = 0; d < 4; d++) {
      const nx = cx + dx[d];
      const ny = cy + dy[d];
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      const nIdx = ny * w + nx;

      if (flags[nIdx] !== INSIDE) continue;

      // Compute distance using eikonal equation (simplified)
      dist[nIdx] = dist[idx] + 1;
      flags[nIdx] = BAND;

      // Inpaint this pixel using weighted average of known neighbors within radius
      inpaintPixel(src, flags, dist, w, h, nx, ny, radius);

      pushHeap(nIdx);
    }
  }

  // Copy result back to RGBA
  for (let i = 0; i < w * h; i++) {
    result[i * 4] = Math.max(0, Math.min(255, Math.round(src[i * 3])));
    result[i * 4 + 1] = Math.max(0, Math.min(255, Math.round(src[i * 3 + 1])));
    result[i * 4 + 2] = Math.max(0, Math.min(255, Math.round(src[i * 3 + 2])));
    result[i * 4 + 3] = 255;
  }

  return new ImageData(result, w, h);
}

function inpaintPixel(
  src: Float32Array,
  flags: Uint8Array,
  dist: Float32Array,
  w: number,
  h: number,
  px: number,
  py: number,
  radius: number
): void {
  let sumR = 0, sumG = 0, sumB = 0, sumW = 0;

  const r2 = radius * radius;

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const nx = px + dx;
      const ny = py + dy;
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;

      const nIdx = ny * w + nx;
      if (flags[nIdx] !== KNOWN) continue;

      const d2 = dx * dx + dy * dy;
      if (d2 > r2 || d2 === 0) continue;

      // Weight: inverse distance squared * direction consistency
      const distWeight = 1.0 / (d2 + 1e-6);

      // Geometric weight: prefer pixels along the gradient direction
      const levelSetDist = 1.0 / (1.0 + Math.abs(dist[nIdx]));

      const weight = distWeight * levelSetDist;

      const si = nIdx * 3;
      sumR += src[si] * weight;
      sumG += src[si + 1] * weight;
      sumB += src[si + 2] * weight;
      sumW += weight;
    }
  }

  if (sumW > 0) {
    const pi = (py * w + px) * 3;
    src[pi] = sumR / sumW;
    src[pi + 1] = sumG / sumW;
    src[pi + 2] = sumB / sumW;
  }
}
