import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';

/**
 * Configures PDF.js GlobalWorkerOptions to use the local bundled worker
 * ensuring 100% offline functionality without external CDN dependencies.
 */
export function setupPdfjsWorker(pdfjsLib: any): void {
  if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
    } catch {
      // Fallback in case of unexpected context
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }
  }
}
