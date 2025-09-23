/**
 * Utility functions for PDF generation and export
 * Implements Task 8: PDF Export System functionality
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFOptions {
  filename: string;
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  pageSize?: 'a4' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  quality?: number;
  scale?: number;
}

export interface PDFResult {
  success: boolean;
  error?: string;
  pdfBlob?: Blob;
}

/**
 * Generates a PDF from HTML content using html2canvas and jsPDF
 * @param element - HTML element to convert to PDF
 * @param options - PDF generation options
 * @returns Promise with PDF result
 */
export async function generatePDFFromElement(
  element: HTMLElement,
  options: PDFOptions
): Promise<PDFResult> {
  try {
    const {
      filename,
      title = 'Markdown Document',
      author = 'Markdown Editor',
      subject = 'Generated from Markdown',
      keywords = 'markdown, pdf, export',
      pageSize = 'a4',
      orientation = 'portrait',
      margin = { top: 5, right: 5, bottom: 5, left: 5 },
      quality = 0.98,
      scale = 2
    } = options;

    // Validate inputs
    if (!element) {
      throw new Error('Element is required for PDF generation');
    }

    if (!filename || typeof filename !== 'string') {
      throw new Error('Valid filename is required');
    }

    // Ensure proper file extension
    const pdfFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

    // Configure html2canvas options
    const canvasOptions = {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
    };

    // Convert HTML to canvas
    const canvas = await html2canvas(element, canvasOptions);
    const imgData = canvas.toDataURL('image/png', quality);

    // Calculate dimensions
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    // Get page dimensions in mm
    const pageWidth = pageSize === 'a4' ? 210 : pageSize === 'letter' ? 216 : 216;
    const pageHeight = pageSize === 'a4' ? 297 : pageSize === 'letter' ? 279 : 356;
    
    // Calculate scaling to fit content
    const contentWidth = pageWidth - margin.left - margin.right;
    const contentHeight = pageHeight - margin.top - margin.bottom;
    
    const scaleX = contentWidth / (imgWidth * 0.264583); // Convert px to mm
    const scaleY = contentHeight / (imgHeight * 0.264583);
    const finalScale = Math.min(scaleX, scaleY, 1); // Don't scale up

    // Create PDF
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: pageSize,
    });

    // Add metadata
    pdf.setProperties({
      title: title,
      author: author,
      subject: subject,
      keywords: keywords,
      creator: 'Markdown Editor',
      producer: 'jsPDF + html2canvas',
    });

    // Calculate final dimensions
    const finalWidth = imgWidth * finalScale * 0.264583;
    const finalHeight = imgHeight * finalScale * 0.264583;

    // Add image to PDF
    pdf.addImage(
      imgData,
      'PNG',
      margin.left,
      margin.top,
      finalWidth,
      finalHeight,
      undefined,
      'FAST'
    );

    // Generate PDF blob
    const pdfBlob = pdf.output('blob');

    return {
      success: true,
      pdfBlob: pdfBlob
    };

  } catch (error) {
    console.error('PDF generation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown PDF generation error'
    };
  }
}

/**
 * Downloads a PDF blob as a file
 * @param pdfBlob - PDF blob to download
 * @param filename - Name for the downloaded file
 * @returns Promise with download result
 */
export async function downloadPDF(pdfBlob: Blob, filename: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!pdfBlob) {
      throw new Error('PDF blob is required for download');
    }

    if (!filename || typeof filename !== 'string') {
      throw new Error('Valid filename is required');
    }

    // Ensure proper file extension
    const pdfFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

    // Check browser support
    if (document.createElement('a').download === undefined) {
      throw new Error('Browser does not support file downloads');
    }

    // Create download link
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = pdfFilename;
    link.style.display = 'none';

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);

    return { success: true };

  } catch (error) {
    console.error('PDF download failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown download error'
    };
  }
}

/**
 * Generates and downloads a PDF from HTML element
 * @param element - HTML element to convert
 * @param options - PDF generation options
 * @returns Promise with result
 */
export async function generateAndDownloadPDF(
  element: HTMLElement,
  options: PDFOptions
): Promise<PDFResult> {
  try {
    // Generate PDF
    const pdfResult = await generatePDFFromElement(element, options);
    
    if (!pdfResult.success || !pdfResult.pdfBlob) {
      return pdfResult;
    }

    // Download PDF
    const downloadResult = await downloadPDF(pdfResult.pdfBlob, options.filename);
    
    if (!downloadResult.success) {
      return {
        success: false,
        error: downloadResult.error
      };
    }

    return { success: true };

  } catch (error) {
    console.error('PDF generation and download failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Validates PDF options
 * @param options - PDF options to validate
 * @returns Validated options or throws error
 */
export function validatePDFOptions(options: Partial<PDFOptions>): PDFOptions {
  const {
    filename = 'document',
    title = 'Markdown Document',
    author = 'Markdown Editor',
    subject = 'Generated from Markdown',
    keywords = 'markdown, pdf, export',
    pageSize = 'a4',
    orientation = 'portrait',
    margin = { top: 20, right: 20, bottom: 20, left: 20 },
    quality = 0.98,
    scale = 2
  } = options;

  if (!filename || typeof filename !== 'string') {
    throw new Error('Filename must be a non-empty string');
  }

  if (quality < 0.1 || quality > 1) {
    throw new Error('Quality must be between 0.1 and 1');
  }

  if (scale < 0.5 || scale > 5) {
    throw new Error('Scale must be between 0.5 and 5');
  }

  if (!['a4', 'letter', 'legal'].includes(pageSize)) {
    throw new Error('Page size must be a4, letter, or legal');
  }

  if (!['portrait', 'landscape'].includes(orientation)) {
    throw new Error('Orientation must be portrait or landscape');
  }

  return {
    filename,
    title,
    author,
    subject,
    keywords,
    pageSize,
    orientation,
    margin,
    quality,
    scale
  };
}
