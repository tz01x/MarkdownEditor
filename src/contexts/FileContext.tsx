"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { indexedDBService, FileRecord } from "@/lib/indexedDB";
import {
  downloadFile,
  downloadMultipleFiles,
  generateSafeFilename,
} from "@/lib/downloadUtils";
import { generateAndDownloadPDF, PDFOptions } from "@/lib/pdfUtils";
import {
  BackgroundPDFGenerator,
  PDFGenerationProgress,
} from "@/lib/html2pdfGenerator";
import { ToastProps } from "@/components/ui/Toast";

export interface FileItem {
  id: string;
  name: string;
  content: string;
  lastModified: Date;
  isDirty: boolean;
}

interface FileContextType {
  files: FileItem[];
  currentFileId: string | null;
  currentFile: FileItem | null;
  isLoading: boolean;
  isExportingPDF: boolean;
  pdfProgress: PDFGenerationProgress | null;
  toasts: ToastProps[];
  createFile: (name?: string) => void;
  updateFile: (id: string, content: string) => void;
  selectFile: (id: string) => void;
  deleteFile: (id: string) => void;
  renameFile: (id: string, newName: string) => void;
  saveFile: (id: string) => void;
  saveAllFiles: () => void;
  importFile: (file: File) => Promise<void>;
  importMultipleFiles: (files: File[]) => Promise<void>;
  exportFile: (id: string) => Promise<void>;
  exportAllFiles: () => Promise<void>;
  exportToPDF: (id: string, options?: Partial<PDFOptions>) => Promise<void>;
  createBackup: () => Promise<string>;
  getBackups: () => Promise<
    Array<{ id: string; timestamp: number; version: string }>
  >;
  restoreBackup: (backupId: string) => Promise<void>;
  exportData: () => Promise<{ files: FileItem[]; preferences: any }>;
  importData: (data: { files: FileItem[]; preferences: any }) => Promise<void>;
  clearAllData: () => Promise<void>;
  addToast: (toast: Omit<ToastProps, "id">) => void;
  removeToast: (id: string) => void;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export function FileProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<PDFGenerationProgress | null>(
    null
  );
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const [pdfGenerator, setPdfGenerator] =
    useState<BackgroundPDFGenerator | null>(null);

  const currentFile = files.find(file => file.id === currentFileId) || null;

  // Debounced auto-save for current file
  const debouncedContent = useDebounce(currentFile?.content || "", 2000);

  // Load files from IndexedDB on mount
  useEffect(() => {
    const loadFiles = async () => {
      try {
        await indexedDBService.init();
        const savedFiles = await indexedDBService.getAllFiles();
        const convertedFiles = savedFiles.map(file => ({
          ...file,
          lastModified: new Date(file.lastModified),
        }));
        setFiles(convertedFiles);
      } catch (error) {
        console.error("Failed to load files from IndexedDB:", error);
        // Fallback to localStorage
        const fallbackFiles = localStorage.getItem("markdown-editor-files");
        if (fallbackFiles) {
          try {
            const parsedFiles = JSON.parse(fallbackFiles).map((file: any) => ({
              ...file,
              lastModified: new Date(file.lastModified),
            }));
            setFiles(parsedFiles);
          } catch (e) {
            console.error("Failed to parse fallback files:", e);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadFiles();
  }, []);

  // Save files to IndexedDB whenever files change
  useEffect(() => {
    if (!isLoading && files.length > 0) {
      const saveFiles = async () => {
        try {
          const fileRecords: FileRecord[] = files.map(file => ({
            id: file.id,
            name: file.name,
            content: file.content,
            lastModified: file.lastModified.getTime(),
            createdAt: file.lastModified.getTime(), // We don't track creation time separately yet
            isDirty: file.isDirty,
          }));

          for (const fileRecord of fileRecords) {
            await indexedDBService.saveFile(fileRecord);
          }
        } catch (error) {
          console.error("Failed to save files to IndexedDB:", error);
          // Fallback to localStorage
          localStorage.setItem("markdown-editor-files", JSON.stringify(files));
        }
      };

      saveFiles();
    }
  }, [files, isLoading]);

  // Auto-save effect - mark file as saved when content stabilizes
  useEffect(() => {
    if (currentFileId && debouncedContent !== undefined) {
      setFiles(prev =>
        prev.map(file =>
          file.id === currentFileId
            ? { ...file, isDirty: false, lastModified: new Date() }
            : file
        )
      );
    }
  }, [debouncedContent, currentFileId]);

  const createFile = (name?: string) => {
    const newFile: FileItem = {
      id: Date.now().toString(),
      name: name || `Untitled-${files.length + 1}.md`,
      content: "",
      lastModified: new Date(),
      isDirty: false,
    };
    setFiles(prev => [...prev, newFile]);
    setCurrentFileId(newFile.id);
  };

  const updateFile = useCallback((id: string, content: string) => {
    setFiles(prev =>
      prev.map(file =>
        file.id === id && file.content !== content
          ? { ...file, content, lastModified: new Date(), isDirty: true }
          : file
      )
    );
  }, []);

  const selectFile = (id: string) => {
    setCurrentFileId(id);
  };

  const deleteFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
    if (currentFileId === id) {
      const remainingFiles = files.filter(file => file.id !== id);
      setCurrentFileId(remainingFiles.length > 0 ? remainingFiles[0].id : null);
    }
  };

  const renameFile = (id: string, newName: string) => {
    setFiles(prev =>
      prev.map(file =>
        file.id === id
          ? { ...file, name: newName, lastModified: new Date() }
          : file
      )
    );
  };

  const saveFile = (id: string) => {
    setFiles(prev =>
      prev.map(file =>
        file.id === id
          ? { ...file, isDirty: false, lastModified: new Date() }
          : file
      )
    );
  };

  const saveAllFiles = () => {
    setFiles(prev => prev.map(file => ({ ...file, isDirty: false })));
  };

  const importFile = async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const content = e.target?.result as string;
          const newFile: FileItem = {
            id: Date.now().toString(),
            name: file.name,
            content,
            lastModified: new Date(),
            isDirty: false,
          };
          setFiles(prev => [...prev, newFile]);
          setCurrentFileId(newFile.id);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  const importMultipleFiles = async (files: File[]): Promise<void> => {
    const importPromises = files.map(file => {
      return new Promise<FileItem>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => {
          try {
            const content = e.target?.result as string;
            const newFile: FileItem = {
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: file.name,
              content,
              lastModified: new Date(),
              isDirty: false,
            };
            resolve(newFile);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () =>
          reject(new Error(`Failed to read file: ${file.name}`));
        reader.readAsText(file);
      });
    });

    try {
      const newFiles = await Promise.all(importPromises);
      setFiles(prev => [...prev, ...newFiles]);
      // Select the first imported file
      if (newFiles.length > 0) {
        setCurrentFileId(newFiles[0].id);
      }
      addToast({
        type: "success",
        title: "Files Imported",
        description: `Successfully imported ${newFiles.length} file${newFiles.length !== 1 ? "s" : ""}`,
      });
    } catch (error) {
      console.error("Failed to import files:", error);
      addToast({
        type: "error",
        title: "Import Failed",
        description: "Failed to import some files",
      });
      throw error;
    }
  };

  const exportFile = async (id: string) => {
    const file = files.find(f => f.id === id);
    if (!file) {
      console.error("File not found for export:", id);
      return;
    }

    const result = await downloadFile({
      filename: file.name,
      content: file.content,
      mimeType: "text/markdown",
      charset: "utf-8",
    });

    if (!result.success) {
      console.error("Failed to export file:", result.error);
      // You could add user notification here in the future
    }
  };

  const exportAllFiles = async () => {
    if (files.length === 0) {
      console.warn("No files to export");
      return;
    }

    const downloadOptions = files.map(file => ({
      filename: file.name,
      content: file.content,
      mimeType: "text/markdown" as const,
      charset: "utf-8" as const,
    }));

    const results = await downloadMultipleFiles(downloadOptions);

    // Log any failures
    const failures = results.filter(result => !result.success);
    if (failures.length > 0) {
      console.error("Some files failed to download:", failures);
    }
  };

  const exportToPDF = async (id: string, options: Partial<PDFOptions> = {}) => {
    console.log("Exporting to PDF:", id, options);
    const file = files.find(f => f.id === id);
    if (!file) {
      console.error("File not found for PDF export:", id);
      return;
    }

    // Cancel any existing PDF generation
    if (pdfGenerator) {
      pdfGenerator.cancel();
    }

    setIsExportingPDF(true);
    setPdfProgress({
      stage: "preparing",
      progress: 0,
      message: "Starting PDF generation...",
    });

    try {
      // Generate sanitized HTML content directly
      const MarkdownIt = (await import("markdown-it")).default;
      const DOMPurify = (await import("dompurify")).default;

      const md = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
        breaks: true,
      });

      const htmlContent = md.render(file.content);
      const sanitizedContent = DOMPurify.sanitize(htmlContent, {
        ALLOWED_TAGS: [
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "p",
          "br",
          "strong",
          "em",
          "u",
          "s",
          "del",
          "ul",
          "ol",
          "li",
          "blockquote",
          "pre",
          "code",
          "a",
          "img",
          "table",
          "thead",
          "tbody",
          "tr",
          "th",
          "td",
          "hr",
          "div",
          "span",
          "mark",
          "sub",
          "sup",
        ],
        ALLOWED_ATTR: [
          "href",
          "title",
          "alt",
          "src",
          "width",
          "height",
          "class",
          "id",
          "target",
          "rel",
        ],
        ALLOW_DATA_ATTR: false,
      });

      // Create background PDF generator
      const generator = new BackgroundPDFGenerator(progress => {
        setPdfProgress(progress);
      });
      setPdfGenerator(generator);

      // Default PDF options
      const pdfOptions = {
        filename: file.name.replace(/\.md$/, ""),
        title: file.name.replace(/\.md$/, ""),
        author: "Markdown Editor",
        subject: "Generated from Markdown",
        keywords: "markdown, pdf, export",
        pageSize: "a4" as const,
        orientation: "portrait" as const,
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
        quality: 0.98,
        scale: 1,
        ...options,
      };
      console.log(sanitizedContent);

      // Generate PDF in background using sanitized content
      const result = await generator.generatePDF(sanitizedContent, pdfOptions);

      if (!result.success) {
        console.error("Failed to export PDF:", result.error);
        addToast({
          type: "error",
          title: "PDF Export Failed",
          description:
            result.error || "Failed to generate PDF. Please try again.",
          duration: 5000,
        });
      } else if (result.blob) {
        // Download the PDF
        const url = URL.createObjectURL(result.blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${pdfOptions.filename}.pdf`;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        addToast({
          type: "success",
          title: "PDF Exported Successfully",
          description: `PDF "${file.name.replace(/\.md$/, "")}" has been downloaded.`,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("PDF export failed:", error);
      addToast({
        type: "error",
        title: "PDF Export Failed",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
        duration: 5000,
      });
    } finally {
      setIsExportingPDF(false);
      setPdfProgress(null);
      setPdfGenerator(null);
    }
  };

  const createBackup = async (): Promise<string> => {
    const fileRecords: FileRecord[] = files.map(file => ({
      id: file.id,
      name: file.name,
      content: file.content,
      lastModified: file.lastModified.getTime(),
      createdAt: file.lastModified.getTime(),
      isDirty: file.isDirty,
    }));
    return await indexedDBService.createBackup(fileRecords);
  };

  const getBackups = async (): Promise<
    Array<{ id: string; timestamp: number; version: string }>
  > => {
    return await indexedDBService.getBackups();
  };

  const restoreBackup = async (backupId: string): Promise<void> => {
    const backupFiles = await indexedDBService.restoreBackup(backupId);
    const convertedFiles = backupFiles.map(file => ({
      ...file,
      lastModified: new Date(file.lastModified),
    }));
    setFiles(convertedFiles);
  };

  const exportData = async (): Promise<{
    files: FileItem[];
    preferences: any;
  }> => {
    const data = await indexedDBService.exportData();
    return {
      files: data.files.map(file => ({
        ...file,
        lastModified: new Date(file.lastModified),
      })),
      preferences: data.preferences,
    };
  };

  const importData = async (data: {
    files: FileItem[];
    preferences: any;
  }): Promise<void> => {
    const fileRecords: FileRecord[] = data.files.map(file => ({
      id: file.id,
      name: file.name,
      content: file.content,
      lastModified: file.lastModified.getTime(),
      createdAt: file.lastModified.getTime(),
      isDirty: file.isDirty,
    }));

    await indexedDBService.importData({
      files: fileRecords,
      preferences: data.preferences,
    });

    setFiles(data.files);
  };

  const clearAllData = async (): Promise<void> => {
    await indexedDBService.clearAllData();
    setFiles([]);
    setCurrentFileId(null);
  };

  const addToast = useCallback((toast: Omit<ToastProps, "id">) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <FileContext.Provider
      value={{
        files,
        currentFileId,
        currentFile,
        isLoading,
        isExportingPDF,
        pdfProgress,
        toasts,
        createFile,
        updateFile,
        selectFile,
        deleteFile,
        renameFile,
        saveFile,
        saveAllFiles,
        importFile,
        importMultipleFiles,
        exportFile,
        exportAllFiles,
        exportToPDF,
        createBackup,
        getBackups,
        restoreBackup,
        exportData,
        importData,
        clearAllData,
        addToast,
        removeToast,
      }}
    >
      {children}
    </FileContext.Provider>
  );
}

export function useFiles() {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error("useFiles must be used within a FileProvider");
  }
  return context;
}
