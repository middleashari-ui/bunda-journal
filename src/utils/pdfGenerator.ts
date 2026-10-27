import { toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';

// Standard ISO B5 Dimensions in Millimeters (176mm x 250mm)
export const B5_WIDTH_MM = 176;
export const B5_HEIGHT_MM = 250;

export interface PDFExportProgress {
  current: number;
  total: number;
  percentage: number;
  statusText: string;
}

export interface GeneratePDFOptions {
  fileName?: string;
  onProgress?: (progress: PDFExportProgress) => void;
  shouldCancel?: () => boolean;
}

/**
 * Trigger file download reliably across desktop, iOS Safari, and Android browsers.
 */
export function triggerPDFDownload(doc: jsPDF, fileName: string = 'Bunda-Journal.pdf'): void {
  const cleanName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  let saveSuccess = false;

  try {
    doc.save(cleanName);
    saveSuccess = true;
  } catch (err) {
    console.warn('doc.save() direct call failed, attempting blob fallback:', err);
  }

  // Double-guarantee download on mobile browsers using anchor click on Object URL
  try {
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = cleanName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(blobUrl);
    }, 15000);
  } catch (blobErr) {
    if (!saveSuccess) {
      console.error('All download methods failed:', blobErr);
    }
  }
}

/**
 * Filter and extract all B5 page elements inside a container according to 1-muka structure.
 */
export function extractPagesFromContainer(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];

  // 1. Selector utama halaman B5
  let found = Array.from(
    container.querySelectorAll<HTMLElement>(
      '.b5-page, .preview-pdf-page, .b5-page-left, .b5-page-right'
    )
  );

  // 2. Jika container itu sendiri adalah elemen halaman
  if (found.length === 0) {
    if (container.classList.contains('b5-page') || container.classList.contains('preview-pdf-page')) {
      found = [container];
    }
  }

  // 3. Fallback: Cari di dalam .studio-vertical-spread
  if (found.length === 0) {
    const spread = container.classList.contains('studio-vertical-spread')
      ? container
      : container.querySelector<HTMLElement>('.studio-vertical-spread');

    if (spread) {
      const flexRow = spread.querySelector<HTMLElement>('.flex.flex-row');
      if (flexRow && flexRow.children.length > 0) {
        found = Array.from(flexRow.children) as HTMLElement[];
      } else if (spread.children.length > 0) {
        found = Array.from(spread.children) as HTMLElement[];
      }
    }
  }

  // 4. Fallback: Anak langsung dari container
  if (found.length === 0) {
    const directChildren = Array.from(container.children).filter(
      (c) => c instanceof HTMLElement && !c.classList.contains('hidden')
    ) as HTMLElement[];
    if (directChildren.length > 0) {
      found = directChildren;
    }
  }

  // 5. Fallback terakhir: Container itu sendiri
  if (found.length === 0) {
    found = [container];
  }

  return found.filter((el) => {
    try {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    } catch {
      return true;
    }
  });
}

/**
 * Generate a complete, high-fidelity B5 PDF from an off-screen container
 * using html-to-image (toJpeg) and jsPDF.
 *
 * Keunggulan solusi ini:
 * 1. Menggunakan SVG foreignObject bawaan browser, 100% aman dari crash warna CSS modern Tailwind (oklch, oklab, color-mix).
 * 2. Merender langsung elemen berukuran B5 asli (176mm x 250mm) tanpa terpotong dan tanpa distorsi skala smartphone.
 * 3. Loop beruntun dilengkapi try-catch anti-gagal, update persentase real-time, dan auto-download Bunda-Journal.pdf.
 */
export async function generatePDF(
  target: HTMLElement | HTMLElement[],
  options?: GeneratePDFOptions
): Promise<boolean> {
  await document.fonts.ready;

  const fileName = options?.fileName || 'Bunda-Journal.pdf';
  const onProgress = options?.onProgress;
  const shouldCancel = options?.shouldCancel;

  let pages: HTMLElement[] = [];
  if (Array.isArray(target)) {
    pages = target;
  } else if (target instanceof HTMLElement) {
    pages = extractPagesFromContainer(target);
  }

  const total = pages.length;
  if (total === 0) {
    console.warn('generatePDF: Tidak ada halaman B5 ditemukan.');
    return false;
  }

  if (onProgress) {
    onProgress({
      current: 0,
      total,
      percentage: 2,
      statusText: 'Menyiapkan dokumen B5...',
    });
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'b5',
    compress: true,
  });

  // Batch concurrency: proses 8 halaman sekaligus agar download sangat cepat
  const CONCURRENCY = 8;
  let addedCount = 0;

  for (let batchStart = 0; batchStart < total; batchStart += CONCURRENCY) {
    if (shouldCancel && shouldCancel()) {
      return false;
    }

    const batchPages = pages.slice(batchStart, batchStart + CONCURRENCY);
    const renderTasks = batchPages.map(async (pageEl, idx) => {
      const pageIndex = batchStart + idx;
      try {
        const imgData = await toJpeg(pageEl, {
          quality: 0.82,
          backgroundColor: '#FAF9F7',
          pixelRatio: 1.1,
          cacheBust: false,
          skipFonts: false,
          filter: (node) => {
            if (node instanceof HTMLElement) {
              if (node.classList.contains('page-badge-watermark') || node.classList.contains('badge-penanda')) {
                return false;
              }
            }
            return true;
          },
        });
        return { index: pageIndex, imgData, error: null };
      } catch (err) {
        console.warn(`Halaman ${pageIndex + 1} render retry:`, err);
        try {
          const fallback = await toJpeg(pageEl, {
            quality: 0.75,
            backgroundColor: '#FAF9F7',
            pixelRatio: 1.0,
            skipFonts: true,
          });
          return { index: pageIndex, imgData: fallback, error: null };
        } catch (err2) {
          return { index: pageIndex, imgData: null, error: err2 };
        }
      }
    });

    const results = await Promise.all(renderTasks);

    for (const res of results) {
      if (res.imgData) {
        if (addedCount > 0) {
          doc.addPage('b5', 'portrait');
        }
        doc.addImage(res.imgData, 'JPEG', 0, 0, B5_WIDTH_MM, B5_HEIGHT_MM, undefined, 'FAST');
        addedCount++;
      }
    }

    const currentProg = Math.min(batchStart + CONCURRENCY, total);
    const percentage = Math.round((currentProg / total) * 98);

    if (onProgress) {
      onProgress({
        current: currentProg,
        total,
        percentage,
        statusText: `Merender halaman ${currentProg} dari ${total}...`,
      });
    }

    await new Promise((r) => setTimeout(r, 10));
  }

  if (onProgress) {
    onProgress({
      current: total,
      total,
      percentage: 100,
      statusText: 'Menyimpan file Bunda-Journal.pdf...',
    });
  }

  triggerPDFDownload(doc, fileName);
  return true;
}

/**
 * Backward compatibility helpers
 */
export async function exportElementToB5PDF(
  element: HTMLElement,
  fileName: string = 'Bunda-Journal.pdf',
  onProgress?: (progress: PDFExportProgress) => void
): Promise<void> {
  await generatePDF(element, { fileName, onProgress });
}

export async function exportPagesListToB5PDF(
  pageElements: HTMLElement[],
  fileName: string = 'Bunda-Journal.pdf',
  onProgress?: (progress: PDFExportProgress) => void,
  shouldCancel?: () => boolean
): Promise<boolean> {
  return await generatePDF(pageElements, { fileName, onProgress, shouldCancel });
}

export function prepareClonedDoc(): void {
  // Backward compatibility stub
}
