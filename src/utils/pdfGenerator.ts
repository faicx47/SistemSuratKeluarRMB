import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface GeneratedPdfResult {
  blob: Blob;
  file: File;
  dataUrl: string;
  fileName: string;
}

/**
 * Generate a clean official A4 PDF from a DOM element using html2canvas & jsPDF
 */
export async function generateLetterPdf(
  element: HTMLElement,
  rawFileName: string
): Promise<GeneratedPdfResult> {
  const cleanFileName = rawFileName.endsWith('.pdf') ? rawFileName : `${rawFileName}.pdf`;

  // Render element to high-res canvas
  const canvas = await html2canvas(element, {
    scale: 2, // 2x retina clarity for crystal clear text, stamps, and signatures
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 1200,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.98);

  // A4 dimensions: 210mm x 297mm
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = 210;
  const pdfHeight = 297;

  // Fit into page
  pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

  const blob = pdf.output('blob');
  const file = new File([blob], cleanFileName, { type: 'application/pdf' });
  const dataUrl = URL.createObjectURL(blob);

  return {
    blob,
    file,
    dataUrl,
    fileName: cleanFileName,
  };
}

/**
 * Trigger browser file download for a blob or dataUrl
 */
export function triggerFileDownload(blobOrUrl: Blob | string, fileName: string) {
  const url = typeof blobOrUrl === 'string' ? blobOrUrl : URL.createObjectURL(blobOrUrl);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (typeof blobOrUrl !== 'string') {
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}

/**
 * Check if browser supports sharing PDF files via native Web Share API
 */
export function canSharePdfFile(file: File): boolean {
  if (typeof navigator !== 'undefined' && navigator.canShare) {
    try {
      return navigator.canShare({ files: [file] });
    } catch (e) {
      return false;
    }
  }
  return false;
}

/**
 * Share PDF file using native Web Share Sheet (attaches directly to WA, Gmail, etc.)
 */
export async function sharePdfFile(
  file: File,
  title: string,
  text: string
): Promise<boolean> {
  if (canSharePdfFile(file)) {
    try {
      await navigator.share({
        title,
        text,
        files: [file],
      });
      return true;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User cancelled share dialog
        return true;
      }
      console.warn('Web Share failed, falling back:', err);
      return false;
    }
  }
  return false;
}
