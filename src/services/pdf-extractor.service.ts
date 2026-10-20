import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set up worker source locally via Vite asset pipeline
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

export interface PDFExtractionResult {
  success: boolean;
  text: string;
  numPages: number;
  charCount: number;
  wordCount: number;
  isScannedWarning: boolean;
  error?: string;
}

export async function extractTextFromPDF(
  file: File,
  onProgress?: (progressPercent: number) => void
): Promise<PDFExtractionResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
    });

    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;

    if (numPages === 0) {
      return {
        success: false,
        text: '',
        numPages: 0,
        charCount: 0,
        wordCount: 0,
        isScannedWarning: false,
        error: 'PDF file contains 0 pages.',
      };
    }

    const pageTexts: string[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();

      const pageStrings = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .filter((str) => str.trim().length > 0);

      pageTexts.push(`--- PAGE ${pageNum} ---\n` + pageStrings.join(' '));

      if (onProgress) {
        onProgress(Math.round((pageNum / numPages) * 100));
      }
    }

    const fullText = pageTexts.join('\n\n');
    const charCount = fullText.length;
    const wordCount = fullText.split(/\s+/).filter(Boolean).length;

    // Check if the document appears to be a scanned image-only PDF or empty
    const isUnreadable = charCount < 50 || fullText.trim().length === 0;

    if (isUnreadable) {
      return {
        success: false,
        text: '',
        numPages,
        charCount,
        wordCount: 0,
        isScannedWarning: true,
        error:
          'This PDF appears to contain scanned pages or unreadable text. Please upload a text-based PDF or add its content manually.',
      };
    }

    return {
      success: true,
      text: fullText,
      numPages,
      charCount,
      wordCount,
      isScannedWarning: false,
    };
  } catch (err: any) {
    console.error('PDF extraction failed:', err);
    return {
      success: false,
      text: '',
      numPages: 0,
      charCount: 0,
      wordCount: 0,
      isScannedWarning: false,
      error:
        err.name === 'PasswordException'
          ? 'This PDF is password-protected. Please unlock it before uploading.'
          : err.message || 'Failed to read and extract text from the PDF file.',
    };
  }
}
