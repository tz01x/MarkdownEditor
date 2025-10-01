/**
 * Utility functions for file download operations
 * Implements Task 7: Markdown File Download functionality
 */

export interface DownloadOptions {
  filename: string;
  content: string;
  mimeType?: string;
  charset?: string;
}

export interface DownloadResult {
  success: boolean;
  error?: string;
}

/**
 * Downloads a file using the Blob API
 * @param options - Download configuration
 * @returns Promise with download result
 */
export async function downloadFile(
  options: DownloadOptions
): Promise<DownloadResult> {
  try {
    const {
      filename,
      content,
      mimeType = "text/markdown",
      charset = "utf-8",
    } = options;

    // Validate inputs
    if (!filename || typeof filename !== "string") {
      throw new Error("Invalid filename provided");
    }

    if (typeof content !== "string") {
      throw new Error("Content must be a string");
    }

    // Ensure proper file extension
    const fileName = filename.endsWith(".md") ? filename : `${filename}.md`;

    // Create blob with proper encoding
    const fullMimeType = charset ? `${mimeType};charset=${charset}` : mimeType;
    const blob = new Blob([content], { type: fullMimeType });

    // Check if browser supports the download attribute
    if (document.createElement("a").download === undefined) {
      throw new Error("Browser does not support file downloads");
    }

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.style.display = "none";

    // Add to DOM, trigger download, and clean up
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL after a short delay to ensure download starts
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);

    return { success: true };
  } catch (error) {
    console.error("Download failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown download error",
    };
  }
}

/**
 * Downloads multiple files with proper error handling
 * @param files - Array of file download options
 * @returns Promise with download results
 */
export async function downloadMultipleFiles(
  files: DownloadOptions[]
): Promise<DownloadResult[]> {
  const results: DownloadResult[] = [];

  if (files.length === 0) {
    console.warn("No files to download");
    return results;
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const result = await downloadFile(file);
      results.push(result);

      // Add a small delay between downloads to prevent browser issues
      if (i < files.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`Failed to download file ${file.filename}:`, error);
      results.push({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}

/**
 * Validates a filename for download
 * @param filename - The filename to validate
 * @returns Validated filename or throws error
 */
export function validateFilename(filename: string): string {
  if (!filename || typeof filename !== "string") {
    throw new Error("Filename must be a non-empty string");
  }

  // Remove or replace invalid characters
  const sanitized = filename
    .replace(/[<>:"/\\|?*]/g, "_") // Replace invalid characters with underscore
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .trim();

  if (sanitized.length === 0) {
    throw new Error("Filename cannot be empty after sanitization");
  }

  if (sanitized.length > 255) {
    throw new Error("Filename too long (max 255 characters)");
  }

  return sanitized;
}

/**
 * Generates a safe filename with timestamp if needed
 * @param baseName - Base filename
 * @param existingNames - Array of existing filenames to avoid conflicts
 * @returns Safe filename
 */
export function generateSafeFilename(
  baseName: string,
  existingNames: string[] = []
): string {
  const sanitized = validateFilename(baseName);
  const baseWithoutExt = sanitized.replace(/\.md$/, "");

  if (!existingNames.includes(sanitized)) {
    return sanitized;
  }

  // Add timestamp to make it unique
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  return `${baseWithoutExt}_${timestamp}.md`;
}
