import { registerPlugin } from '@capacitor/core';

/**
 * Interface for the PDF Generator plugin options
 */
export interface PdfGeneratorOptions {
  /** HTML content to convert to PDF */
  html: string;
  /** Filename for the generated PDF (without extension) */
  fileName: string;
}

/**
 * Interface for the PDF Generator plugin result
 */
export interface PdfGeneratorResult {
  /** File URI of the generated PDF */
  uri: string;
}

/**
 * Interface for the PDF Generator Capacitor plugin
 */
export interface PdfGeneratorPlugin {
  /**
   * Generate a PDF from HTML content
   * @param options - The HTML content and filename
   * @returns Promise resolving to the PDF file URI
   */
  generatePdf(options: PdfGeneratorOptions): Promise<PdfGeneratorResult>;
}

/**
 * PDF Generator plugin instance
 * Registered as a Capacitor plugin that bridges to native iOS code
 */
export const PdfGenerator = registerPlugin<PdfGeneratorPlugin>('PdfGenerator');
