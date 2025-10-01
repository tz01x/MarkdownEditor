/**
 * Background PDF Generator using html2pdf.js
 * Handles PDF generation from sanitized HTML content
 */


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

  async generatePDF(sanitizedContent: string, options: PDFGenerationOptions): Promise<{ success: boolean; error?: string; blob?: Blob }> {
    if (typeof window === "undefined") return { success: false, error: 'PDF generation not supported in server environment' }; // prevent server execution
    const html2pdf = (await import("html2pdf.js")).default;



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

      this.updateProgress('rendering', 30, 'Creating HTML document...');

      // Create a temporary container for the content
      const tempContainer = this.createTempContainer(sanitizedContent, options);

      if (this.isCancelled) {
        return { success: false, error: 'Cancelled' };
      }

      this.updateProgress('generating', 60, 'Generating PDF...');

      // Configure html2pdf options
      const pdfOptions = {
        // margin: options.margin?.top || 20,
        filename: `${options.filename}.pdf`,
        // image: { type: 'jpeg', quality: options.quality || 0.98 },
        html2canvas: { 
          scale:  4,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
        },
        jsPDF: { 
          unit: 'mm', 
          format: options.pageSize || 'a4', 
          orientation: options.orientation || 'portrait',
          compress: true,
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      // Generate PDF
      const pdfBlob = await html2pdf().set(pdfOptions).from(tempContainer).outputPdf('blob');

      if (this.isCancelled) {
        return { success: false, error: 'Cancelled' };
      }

      this.updateProgress('finalizing', 90, 'Finalizing PDF...');

      // Clean up temporary container
      document.body.removeChild(tempContainer);

      this.updateProgress('complete', 100, 'PDF generation complete!');

      return { success: true, blob: pdfBlob };

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

  private createTempContainer(content: string, options: PDFGenerationOptions): HTMLElement {
    // Create a temporary container
    const container = document.createElement('div');
    // container.style.position = 'fixed';
    // container.style.top = '-9999px';
    // container.style.left = '-9999px';
    container.style.width = '210mm'; // A4 width
    container.style.backgroundColor = 'white';
    container.style.color = 'black';
    container.style.padding = '20mm';
    container.style.boxSizing = 'border-box';
    container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif';
    container.style.fontSize = '12pt';
    container.style.lineHeight = '1.6';

    // Create the HTML document structure
    const htmlContent = `
      <div class="markdown-content" style="
        width: 100%;
        max-width: none;
        margin: 0;
        padding: 0;
        font-family: inherit;
        font-size: inherit;
        line-height: inherit;
        color: inherit;
      ">
        ${content}
      </div>
    `;

    container.innerHTML = htmlContent;

    // Add CSS styles for better PDF rendering
    const style = document.createElement('style');
    style.textContent = `
      .markdown-content h1, .markdown-content h2, .markdown-content h3, 
      .markdown-content h4, .markdown-content h5, .markdown-content h6 {
        margin-top: 1.5em;
        margin-bottom: 0.5em;
        font-weight: bold;
        page-break-after: avoid;
      }
      
      .markdown-content h1 { font-size: 18pt; }
      .markdown-content h2 { font-size: 16pt; }
      .markdown-content h3 { font-size: 14pt; }
      .markdown-content h4 { font-size: 13pt; }
      .markdown-content h5 { font-size: 12pt; }
      .markdown-content h6 { font-size: 11pt; }
      
      .markdown-content p {
        margin: 0.5em 0;
        text-align: justify;
        orphans: 2;
        widows: 2;
      }
      
      .markdown-content ul, .markdown-content ol {
        margin: 0.5em 0;
        padding-left: 1.5em;
      }
      
      .markdown-content li {
        margin: 0.25em 0;
        page-break-inside: avoid;
      }
      
      .markdown-content code {
        font-family: 'Courier New', Courier, monospace;
        font-size: 10pt;
        background-color: #f5f5f5;
        padding: 0.1em 0.3em;
        border-radius: 3px;
      }
      
      .markdown-content pre {
        font-family: 'Courier New', Courier, monospace;
        font-size: 10pt;
        background-color: #f5f5f5;
        padding: 1em;
        border-radius: 5px;
        overflow-x: auto;
        page-break-inside: avoid;
        margin: 1em 0;
      }
      
      .markdown-content pre code {
        background: none;
        padding: 0;
      }
      
      .markdown-content blockquote {
        margin: 1em 0;
        padding-left: 1em;
        border-left: 3px solid #ddd;
        color: #666;
        page-break-inside: avoid;
      }
      
      .markdown-content table {
        border-collapse: collapse;
        width: 100%;
        margin: 1em 0;
        page-break-inside: avoid;
      }
      
      .markdown-content th, .markdown-content td {
        border: 1px solid #ddd;
        padding: 0.5em;
        text-align: left;
      }
      
      .markdown-content th {
        background-color: #f5f5f5;
        font-weight: bold;
      }
      
      .markdown-content a {
        color: #0066cc;
        text-decoration: none;
      }
      
      .markdown-content a:hover {
        text-decoration: underline;
      }
      
      .markdown-content img {
        max-width: 100%;
        height: auto;
        page-break-inside: avoid;
      }
      
      .markdown-content hr {
        border: none;
        border-top: 1px solid #ddd;
        margin: 2em 0;
        page-break-after: avoid;
      }
      
      .markdown-content h1, .markdown-content h2, .markdown-content h3, 
      .markdown-content h4, .markdown-content h5, .markdown-content h6, 
      .markdown-content blockquote, .markdown-content pre, 
      .markdown-content table, .markdown-content img {
        page-break-inside: avoid;
      }
    `;

    container.appendChild(style);
    document.body.appendChild(container);

    return container;
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
