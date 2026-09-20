/**
 * Pure client-side zero-dependency image encoders.
 * Provides support for BMP, ICO (Favicon), TIFF, SVG, and AVIF.
 */

/**
 * Encodes an HTMLCanvasElement into a standard 24-bit uncompressed Windows BMP Blob.
 */
export function encodeBmp(canvas: HTMLCanvasElement): Blob {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Context canvas 2D tidak tersedia');

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Row size in BMP must be a multiple of 4 bytes
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelDataSize = rowSize * height;
  const fileSize = 54 + pixelDataSize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // BITMAPFILEHEADER (14 bytes)
  view.setUint16(0, 0x424d, false); // 'BM'
  view.setUint32(2, fileSize, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, 0, true);
  view.setUint32(10, 54, true); // offset to pixel data

  // BITMAPINFOHEADER (40 bytes)
  view.setUint32(14, 40, true); // biSize
  view.setInt32(18, width, true); // biWidth
  view.setInt32(22, height, true); // biHeight (bottom-up)
  view.setUint16(26, 1, true); // biPlanes
  view.setUint16(28, 24, true); // biBitCount (24-bit RGB)
  view.setUint32(30, 0, true); // biCompression (BI_RGB)
  view.setUint32(34, pixelDataSize, true); // biSizeImage
  view.setInt32(38, 2835, true); // biXPelsPerMeter (~72 DPI)
  view.setInt32(42, 2835, true); // biYPelsPerMeter (~72 DPI)
  view.setUint32(46, 0, true); // biClrUsed
  view.setUint32(50, 0, true); // biClrImportant

  // BMP pixels are stored bottom-up: bottom row first, in B-G-R order
  let offset = 54;
  for (let y = height - 1; y >= 0; y--) {
    const rowStart = y * width * 4;
    let col = 0;
    for (let x = 0; x < width; x++) {
      const idx = rowStart + x * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      view.setUint8(offset++, b);
      view.setUint8(offset++, g);
      view.setUint8(offset++, r);
      col += 3;
    }
    // Pad row to 4-byte boundary
    while (col < rowSize) {
      view.setUint8(offset++, 0);
      col++;
    }
  }

  return new Blob([buffer], { type: 'image/bmp' });
}

/**
 * Encodes an HTMLCanvasElement into a standard Windows ICO / Favicon Blob.
 * Supports optional downscaling to common standard icon sizes (16, 32, 48, 64, 128, 256).
 */
export async function encodeIco(canvas: HTMLCanvasElement, targetSize?: number): Promise<Blob> {
  let sourceCanvas = canvas;

  if (targetSize && targetSize > 0 && (canvas.width !== targetSize || canvas.height !== targetSize)) {
    const offscreen = document.createElement('canvas');
    offscreen.width = targetSize;
    offscreen.height = targetSize;
    const offCtx = offscreen.getContext('2d');
    if (offCtx) {
      offCtx.imageSmoothingEnabled = true;
      offCtx.imageSmoothingQuality = 'high';
      offCtx.drawImage(canvas, 0, 0, targetSize, targetSize);
      sourceCanvas = offscreen;
    }
  }

  // Modern ICO files encapsulate PNG streams
  const pngBlob = await new Promise<Blob>((resolve, reject) => {
    sourceCanvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Gagal merender stream PNG untuk ICO'));
    }, 'image/png');
  });

  const pngBytes = await pngBlob.arrayBuffer();
  const pngLength = pngBytes.byteLength;

  const w = sourceCanvas.width;
  const h = sourceCanvas.height;
  const iconW = w >= 256 ? 0 : w;
  const iconH = h >= 256 ? 0 : h;

  const headerSize = 6;
  const dirEntrySize = 16;
  const totalSize = headerSize + dirEntrySize + pngLength;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // ICONHEADER (6 bytes)
  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // type 1 = ICO
  view.setUint16(4, 1, true); // 1 image

  // ICONDIRENTRY (16 bytes)
  view.setUint8(6, iconW);
  view.setUint8(7, iconH);
  view.setUint8(8, 0); // color palette (0 = >= 8bpp)
  view.setUint8(9, 0); // reserved
  view.setUint16(10, 1, true); // color planes
  view.setUint16(12, 32, true); // bits per pixel
  view.setUint32(14, pngLength, true); // size of image data
  view.setUint32(18, headerSize + dirEntrySize, true); // offset of image data (22)

  // Copy PNG image payload
  const u8 = new Uint8Array(buffer);
  u8.set(new Uint8Array(pngBytes), 22);

  return new Blob([buffer], { type: 'image/x-icon' });
}

/**
 * Encodes an HTMLCanvasElement into a baseline uncompressed RGB TIFF Blob.
 */
export function encodeTiff(canvas: HTMLCanvasElement): Blob {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Context canvas 2D tidak tersedia');

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const numPixels = width * height;
  const imageByteCount = numPixels * 3; // RGB 3 bytes per pixel
  const numTags = 11;

  // Layout:
  // 0..7: Header (8 bytes)
  // 8..imageOffset-1: IFD (2 + 11*12 + 4 = 138 bytes) + extra data (BitsPerSample [6B], Resolution [16B])
  const ifdOffset = 8;
  const ifdSize = 2 + numTags * 12 + 4; // 138 bytes
  const extraDataOffset = ifdOffset + ifdSize; // 146
  // extra: BitsPerSample (3 uint16 = 6 bytes)
  // XResolution rational (8 bytes), YResolution rational (8 bytes)
  const extraSize = 6 + 8 + 8; // 22 bytes
  const imageOffset = extraDataOffset + extraSize; // 168 bytes
  const totalFileSize = imageOffset + imageByteCount;

  const buffer = new ArrayBuffer(totalFileSize);
  const view = new DataView(buffer);

  // TIFF Header (8 bytes, Little Endian 'II')
  view.setUint16(0, 0x4949, false); // 'II'
  view.setUint16(2, 42, true); // 42 magic
  view.setUint32(4, ifdOffset, true); // Offset to 1st IFD

  // IFD (Image File Directory)
  let ifdPos = ifdOffset;
  view.setUint16(ifdPos, numTags, true);
  ifdPos += 2;

  const writeTag = (tag: number, type: number, count: number, valOrOffset: number) => {
    view.setUint16(ifdPos, tag, true);
    view.setUint16(ifdPos + 2, type, true);
    view.setUint32(ifdPos + 4, count, true);
    view.setUint32(ifdPos + 8, valOrOffset, true);
    ifdPos += 12;
  };

  const bitsPerSampleOffset = extraDataOffset;
  const xResOffset = bitsPerSampleOffset + 6;
  const yResOffset = xResOffset + 8;

  // Tags (must be sorted by tag ID ascending according to TIFF spec):
  // 256: ImageWidth (SHORT / LONG)
  writeTag(256, 4, 1, width);
  // 257: ImageLength (SHORT / LONG)
  writeTag(257, 4, 1, height);
  // 258: BitsPerSample (SHORT, count=3) -> points to extraData
  writeTag(258, 3, 3, bitsPerSampleOffset);
  // 259: Compression (1 = uncompressed)
  writeTag(259, 3, 1, 1);
  // 262: PhotometricInterpretation (2 = RGB)
  writeTag(262, 3, 1, 2);
  // 273: StripOffsets (points to image bytes)
  writeTag(273, 4, 1, imageOffset);
  // 277: SamplesPerPixel (3 for RGB)
  writeTag(277, 3, 1, 3);
  // 278: RowsPerStrip (height)
  writeTag(278, 4, 1, height);
  // 279: StripByteCounts (imageByteCount)
  writeTag(279, 4, 1, imageByteCount);
  // 282: XResolution (RATIONAL, count=1)
  writeTag(282, 5, 1, xResOffset);
  // 283: YResolution (RATIONAL, count=1)
  writeTag(283, 5, 1, yResOffset);

  // Next IFD Offset (0 = none)
  view.setUint32(ifdPos, 0, true);

  // Write extra data
  // BitsPerSample: 8, 8, 8
  view.setUint16(bitsPerSampleOffset, 8, true);
  view.setUint16(bitsPerSampleOffset + 2, 8, true);
  view.setUint16(bitsPerSampleOffset + 4, 8, true);

  // XResolution: 72 / 1
  view.setUint32(xResOffset, 72, true);
  view.setUint32(xResOffset + 4, 1, true);

  // YResolution: 72 / 1
  view.setUint32(yResOffset, 72, true);
  view.setUint32(yResOffset + 4, 1, true);

  // Copy RGB pixels
  let pixelPos = imageOffset;
  for (let i = 0; i < numPixels; i++) {
    const srcIdx = i * 4;
    view.setUint8(pixelPos++, data[srcIdx]); // R
    view.setUint8(pixelPos++, data[srcIdx + 1]); // G
    view.setUint8(pixelPos++, data[srcIdx + 2]); // B
  }

  return new Blob([buffer], { type: 'image/tiff' });
}

/**
 * Wraps an image into a crisp SVG container XML Blob.
 */
export function encodeSvg(canvas: HTMLCanvasElement): Blob {
  const w = canvas.width;
  const h = canvas.height;
  const dataUrl = canvas.toDataURL('image/png');

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <title>FreeTools Vector Wrapper</title>
  <image width="${w}" height="${h}" xlink:href="${dataUrl}" />
</svg>`;

  return new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
}

/**
 * Attempts to encode an HTMLCanvasElement into AVIF format with fallback.
 */
export async function encodeAvif(canvas: HTMLCanvasElement, quality = 0.85): Promise<{ blob: Blob; format: string; ext: string }> {
  try {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/avif', quality);
    });

    if (blob && blob.type === 'image/avif') {
      return { blob, format: 'image/avif', ext: 'avif' };
    }
  } catch {
    // Fallback if browser doesn't support canvas toBlob for avif
  }

  // Graceful fallback to modern WEBP
  const webpBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Gagal memproses gambar'));
    }, 'image/webp', quality);
  });

  return { blob: webpBlob, format: 'image/webp', ext: 'webp' };
}
