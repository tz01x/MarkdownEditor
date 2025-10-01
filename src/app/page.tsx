"use client";

import { useState, useRef, useEffect } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MainContent from "@/components/layout/MainContent";
import EditorContainer from "@/components/editor/EditorContainer";
import { Card, CardContent } from "@/components/ui/Card";
import BackupRestoreModal from "@/components/ui/BackupRestoreModal";
import FilePreviewModal from "@/components/ui/FilePreviewModal";
import DragDropZone from "@/components/ui/DragDropZone";
import { ToastContainer } from "@/components/ui/Toast";
import { FileProvider, useFiles } from "@/contexts/FileContext";
import { usePreferences } from "@/contexts/PreferencesContext";

function MarkdownEditor() {
  const {
    files,
    currentFileId,
    currentFile,
    createFile,
    updateFile,
    selectFile,
    deleteFile,
    importFile,
    importMultipleFiles,
    saveFile,
    exportFile,
    exportAllFiles,
    exportToPDF,
    renameFile,
    isExportingPDF,
    pdfProgress,
    toasts,
    removeToast,
  } = useFiles();

  const { preferences, updatePreferences } = usePreferences();
  const [viewMode, setViewMode] = useState<"editor" | "preview" | "split">(
    preferences.viewMode
  );
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<
    Array<{ file: File; content: string }>
  >([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update view mode when preferences change
  useEffect(() => {
    setViewMode(preferences.viewMode);
  }, [preferences.viewMode]);

  const handleNewFile = () => {
    createFile();
  };

  const handleFileSelect = (fileId: string) => {
    selectFile(fileId);
  };

  const handleDeleteFile = (fileId: string) => {
    deleteFile(fileId);
  };

  const handleImportFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/markdown") {
      try {
        await importFile(file);
      } catch (error) {
        console.error("Failed to import file:", error);
      }
    }
    // Reset input
    event.target.value = "";
  };

  const handleSave = () => {
    if (currentFileId) {
      saveFile(currentFileId);
    }
  };

  const handleDownload = async () => {
    if (currentFileId) {
      await exportFile(currentFileId);
    }
  };

  const handleDownloadAll = async () => {
    await exportAllFiles();
  };

  const handleDownloadPDF = async () => {
    if (currentFileId) {
      await exportToPDF(currentFileId);
    }
  };

  const handleContentChange = (content: string) => {
    if (currentFileId) {
      updateFile(currentFileId, content);
    }
  };

  const handleViewModeChange = (mode: "editor" | "preview" | "split") => {
    setViewMode(mode);
    updatePreferences({ viewMode: mode });
  };

  const handleRenameCurrent = () => {
    if (!currentFileId || !currentFile) return;
    const newName = prompt("Rename file", currentFile.name)?.trim();
    if (newName && newName !== currentFile.name) {
      renameFile(currentFileId, newName);
    }
  };

  const handleFilesDropped = async (droppedFiles: File[]) => {
    if (droppedFiles.length === 0) return;

    // Read all files
    const filePreviewPromises = droppedFiles.map(file => {
      return new Promise<{ file: File; content: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => {
          const content = e.target?.result as string;
          resolve({ file, content });
        };
        reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
        reader.readAsText(file);
      });
    });

    try {
      const previews = await Promise.all(filePreviewPromises);
      setPreviewFiles(previews);
      setShowFilePreview(true);
    } catch (error) {
      console.error("Failed to read files:", error);
    }
  };

  const handleImportFiles = async (
    filesToImport: Array<{ file: File; content: string }>
  ) => {
    const files = filesToImport.map(fp => fp.file);
    await importMultipleFiles(files);
    setShowFilePreview(false);
    setPreviewFiles([]);
  };

  return (
    <div className="h-screen flex flex-col main-layout">
      {/* Hide header in fullscreen mode */}
      {!isFullscreen && (
        <Header
          onNewFile={handleNewFile}
          onSave={handleSave}
          onDownload={handleDownload}
          onDownloadPDF={handleDownloadPDF}
          onBackup={() => setShowBackupModal(true)}
          fileName={currentFile?.name}
          onRename={handleRenameCurrent}
          isExportingPDF={isExportingPDF}
          pdfProgress={pdfProgress}
        />
      )}

      <div className="flex flex-1 min-h-0 main-content-wrapper">
        {/* Hide sidebar in fullscreen mode */}
        {!isFullscreen && (
          <Sidebar
            files={files}
            currentFileId={currentFileId || undefined}
            onFileSelect={handleFileSelect}
            onNewFile={handleNewFile}
            onDeleteFile={handleDeleteFile}
            onImportFile={handleImportFile}
            onRenameFile={(fileId, newName) => renameFile(fileId, newName)}
            onDownloadAll={handleDownloadAll}
          />
        )}

        <MainContent
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          content={currentFile?.content || ""}
          onFullscreenChange={setIsFullscreen}
        >
          {currentFile ? (
            <EditorContainer
              content={currentFile.content}
              onChange={handleContentChange}
              onSave={handleSave}
              viewMode={viewMode}
              className="h-full"
            />
          ) : (
            <div className="h-full flex items-center justify-center p-8">
              <div className="w-full max-w-3xl space-y-8">
                <Card className="w-full">
                  <CardContent className="p-8 text-center">
                    <h2 className="text-2xl font-bold mb-4">
                      Welcome to Markdown Editor
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      A modern, feature-rich markdown editor with live preview
                      and export capabilities.
                    </p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• Create and edit markdown files</p>
                      <p>• Live preview with syntax highlighting</p>
                      <p>• Export to PDF and markdown formats</p>
                      <p>• Dark and light theme support</p>
                      <p>• Drag & drop file upload</p>
                    </div>
                    <div className="mt-8">
                      <button
                        onClick={handleNewFile}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-8"
                      >
                        Get Started
                      </button>
                    </div>
                  </CardContent>
                </Card>

                <DragDropZone
                  onFilesSelected={handleFilesDropped}
                  multiple={true}
                />
              </div>
            </div>
          )}
        </MainContent>
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Backup/Restore Modal */}
      <BackupRestoreModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
      />

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={showFilePreview}
        onClose={() => {
          setShowFilePreview(false);
          setPreviewFiles([]);
        }}
        files={previewFiles}
        onImport={handleImportFiles}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default function Home() {
  return (
    <FileProvider>
      <MarkdownEditor />
    </FileProvider>
  );
}
