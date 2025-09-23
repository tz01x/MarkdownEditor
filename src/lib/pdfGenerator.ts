/**
 * Background PDF Generator
 * Handles PDF generation from HTML elements with reliable rendering
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFGenerationOptions {
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

export interface PDFGenerationProgress {
  stage: 'preparing' | 'rendering' | 'generating' | 'finalizing' | 'complete' | 'cancelled';
  progress: number; // 0-100
  message: string;
}

export class BackgroundPDFGenerator {
  private progressCallback: (progress: PDFGenerationProgress) => void;
  private isCancelled: boolean = false;
  private isGenerating: boolean = false;

  constructor(progressCallback: (progress: PDFGenerationProgress) => void) {
    this.progressCallback = progressCallback;
  }

  cancel() {
    this.isCancelled = true;
    this.isGenerating = false;
    this.updateProgress('cancelled', 0, 'PDF generation cancelled.');
  }

  async generatePDF(element: HTMLElement, options: PDFGenerationOptions): Promise<{ success: boolean; error?: string; blob?: Blob }> {
    if (this.isGenerating) {
      return { success: false, error: 'PDF generation already in progress' };
    }

    this.isGenerating = true;
    this.isCancelled = false;

    try {
      this.updateProgress('preparing', 10, 'Preparing content for PDF generation...');

      // Wait a bit to ensure UI is responsive
      await this.delay(50);

      if (this.isCancelled) {
        return { success: false, error: 'Cancelled' };
      }

      this.updateProgress('rendering', 30, 'Rendering HTML to canvas...');

      // Get page dimensions
      const pageWidth = options.pageSize === 'a4' ? 210 : options.pageSize === 'letter' ? 216 : 216;
      const pageHeight = options.pageSize === 'a4' ? 297 : options.pageSize === 'letter' ? 279 : 356;
      const margin = options.margin || { top: 20, right: 20, bottom: 20, left: 20 };

      // Prepare element for rendering
      const originalStyles = this.prepareElementForRendering(element, pageWidth, margin);

      try {
        // Render element to canvas
        const canvas = await this.renderElementToCanvas(element, options);
        
        if (this.isCancelled) {
          return { success: false, error: 'Cancelled' };
        }

        this.updateProgress('generating', 60, 'Creating PDF document...');

        // Create PDF from canvas
        const pdf = await this.createPDFFromCanvas(canvas, options);
        
        if (this.isCancelled) {
          return { success: false, error: 'Cancelled' };
        }

        this.updateProgress('finalizing', 90, 'Finalizing PDF...');
        
        // Generate the PDF blob
        const pdfBlob = pdf.output('blob');
        
        this.updateProgress('complete', 100, 'PDF generation complete!');
        
        return { success: true, blob: pdfBlob };

      } finally {
        // Restore original styles
        this.restoreElementStyles(element, originalStyles);
      }

    } catch (error: any) {
      console.error('PDF generation failed:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to generate PDF' 
      };
    } finally {
      this.isGenerating = false;
    }
  }

  private prepareElementForRendering(element: HTMLElement, pageWidth: number, margin: { top: number; right: number; bottom: number; left: number }) {
    const contentWidth = pageWidth - margin.left - margin.right;
    
    // Store original styles
    const originalStyles = {
      width: element.style.width,
      height: element.style.height,
      overflow: element.style.overflow,
      position: element.style.position,
      top: element.style.top,
      left: element.style.left,
      zIndex: element.style.zIndex,
      backgroundColor: element.style.backgroundColor,
      color: element.style.color,
      fontFamily: element.style.fontFamily,
      fontSize: element.style.fontSize,
      lineHeight: element.style.lineHeight,
      padding: element.style.padding,
      boxSizing: element.style.boxSizing,
    };

    // Apply PDF-optimized styles
    element.style.width = `${contentWidth}mm`;
    element.style.height = 'auto';
    element.style.overflow = 'visible';
    element.style.position = 'static';
    element.style.backgroundColor = 'white';
    element.style.color = 'black';
    element.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif';
    element.style.fontSize = '14pt';
    element.style.lineHeight = '1.6';
    element.style.padding = '20mm';
    element.style.boxSizing = 'border-box';

    return originalStyles;
  }

  private restoreElementStyles(element: HTMLElement, originalStyles: any) {
    Object.keys(originalStyles).forEach(key => {
      (element.style as any)[key] = originalStyles[key];
    });
  }

  private async renderElementToCanvas(element: HTMLElement, options: PDFGenerationOptions): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      // Use setTimeout to break up the rendering process
      setTimeout(() => {
        html2canvas(element, {
          scale: options.scale || 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: element.scrollWidth,
          height: element.scrollHeight,
          scrollX: 0,
          scrollY: 0,
          onclone: (clonedDoc) => {
            // Ensure proper styling in cloned document
            const clonedElement = clonedDoc.querySelector('.pdf-export-mode') || 
                                 clonedDoc.querySelector('.markdown-preview-container');
            if (clonedElement && clonedElement instanceof HTMLElement) {
              clonedElement.style.width = '170mm';
              clonedElement.style.backgroundColor = 'white';
              clonedElement.style.color = 'black';
              clonedElement.style.padding = '20mm';
              clonedElement.style.fontSize = '14pt';
              clonedElement.style.lineHeight = '1.6';
              clonedElement.style.overflow = 'visible';
            }
          }
        }).then(canvas => {
          console.log('Canvas rendered:', canvas.width, 'x', canvas.height);
          resolve(canvas);
        }).catch(error => {
          console.error('Canvas rendering failed:', error);
          reject(error);
        });
      }, 50); // Small delay to keep UI responsive
    });
  }

  private async createPDFFromCanvas(canvas: HTMLCanvasElement, options: PDFGenerationOptions): Promise<jsPDF> {
    return new Promise((resolve, reject) => {
      // Use setTimeout to break up PDF creation
      setTimeout(() => {
        try {
          const imgData = canvas.toDataURL('image/png', options.quality || 0.98);
          
          // Calculate dimensions
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const pageWidth = options.pageSize === 'a4' ? 210 : options.pageSize === 'letter' ? 216 : 216;
          const pageHeight = options.pageSize === 'a4' ? 297 : options.pageSize === 'letter' ? 279 : 356;
          const margin = options.margin || { top: 20, right: 20, bottom: 20, left: 20 };
          
          const contentWidth = pageWidth - margin.left - margin.right;
          const contentHeight = pageHeight - margin.top - margin.bottom;
          
          // Calculate scale to fit content width properly
          const imgWidthMM = imgWidth * 0.264583;
          const imgHeightMM = imgHeight * 0.264583;
          
          const scaleX = contentWidth / imgWidthMM;
          const finalScale = Math.min(scaleX, 1.2); // Allow slight scaling up for better readability
          
          const finalWidth = imgWidthMM * finalScale;
          const finalHeight = imgHeightMM * finalScale;
          
          // Center content horizontally if smaller than page
          const xPosition = finalWidth < contentWidth 
            ? margin.left + (contentWidth - finalWidth) / 2 
            : margin.left;
          
          // Create PDF
          const pdf = new jsPDF({
            orientation: options.orientation || 'portrait',
            unit: 'mm',
            format: options.pageSize || 'a4',
          });
          
          // Add metadata
          pdf.setProperties({
            title: options.title || 'Document',
            author: options.author || 'Markdown Editor',
            subject: options.subject || 'Generated from Markdown',
            keywords: options.keywords || 'markdown, pdf, export',
            creator: 'Markdown Editor',
          });
          
          // Check if content fits on one page
          if (finalHeight <= contentHeight) {
            // Content fits on one page
            pdf.addImage(
              imgData,
              'PNG',
              xPosition,
              margin.top,
              finalWidth,
              finalHeight,
              undefined,
              'FAST'
            );
          } else {
            // Content needs multiple pages - split the image
            this.addImageToPDF(pdf, imgData, finalWidth, finalHeight, contentHeight, xPosition, margin.top)
              .then(() => resolve(pdf))
              .catch(reject);
            return;
          }
          
          resolve(pdf);
        } catch (error) {
          reject(error);
        }
      }, 50); // Small delay to keep UI responsive
    });
  }

  private async addImageToPDF(
    pdf: jsPDF,
    imgData: string,
    imgWidth: number,
    imgHeight: number,
    pageContentHeight: number,
    xPosition: number,
    yPosition: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Convert page content height from mm to pixels for proper splitting
      const pageContentHeightPx = pageContentHeight / 0.264583;
      const totalPages = Math.ceil(imgHeight / pageContentHeightPx);
      let currentPage = 0;
      
      const addNextPage = () => {
        if (currentPage >= totalPages) {
          resolve();
          return;
        }
        
        // Update progress for page generation
        const pageProgress = 60 + (currentPage / totalPages) * 30; // 60-90% for page generation
        this.updateProgress('generating', pageProgress, `Generating page ${currentPage + 1} of ${totalPages}...`);
        
        if (currentPage > 0) {
          pdf.addPage();
        }
        
        const sourceY = currentPage * pageContentHeightPx;
        const remainingHeight = imgHeight - sourceY;
        const currentPageHeightPx = Math.min(pageContentHeightPx, remainingHeight);
        
        // Create a temporary canvas for this page slice
        const pageCanvas = document.createElement('canvas');
        const pageCtx = pageCanvas.getContext('2d');
        
        if (!pageCtx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Set canvas size for this page
        pageCanvas.width = imgWidth;
        pageCanvas.height = currentPageHeightPx;
        
        // Create an image element to draw the slice
        const img = new Image();
        img.onload = () => {
          try {
            pageCtx.drawImage(
              img,
              0, sourceY, imgWidth, currentPageHeightPx, // Source rectangle
              0, 0, imgWidth, currentPageHeightPx        // Destination rectangle
            );
            
            const pageImgData = pageCanvas.toDataURL('image/png');
            
            // Convert page height back to mm for PDF positioning
            const currentPageHeightMM = currentPageHeightPx * 0.264583;
            
            // Add this page slice to PDF
            pdf.addImage(
              pageImgData,
              'PNG',
              xPosition,
              yPosition,
              imgWidth * 0.264583, // Convert width to mm
              currentPageHeightMM,
              undefined,
              'FAST'
            );
            
            currentPage++;
            
            // Process next page after a small delay to keep UI responsive
            setTimeout(() => {
              addNextPage();
            }, 10);
            
          } catch (error) {
            reject(error);
          }
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image for page splitting'));
        };
        
        img.src = imgData;
      };
      
      addNextPage();
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private updateProgress(stage: PDFGenerationProgress['stage'], progress: number, message: string) {
    if (this.progressCallback) {
      this.progressCallback({ stage, progress, message });
    }
  }
}