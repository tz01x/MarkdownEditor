'use client';

import { useState, useRef, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MainContent from '@/components/layout/MainContent';
import EditorContainer from '@/components/editor/EditorContainer';
import { Card, CardContent } from '@/components/ui/Card';
import BackupRestoreModal from '@/components/ui/BackupRestoreModal';
import { ToastContainer } from '@/components/ui/Toast';
import { FileProvider, useFiles } from '@/contexts/FileContext';
import { usePreferences } from '@/contexts/PreferencesContext';

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
  const [viewMode, setViewMode] = useState<'editor' | 'preview' | 'split'>(preferences.viewMode);
  const [showBackupModal, setShowBackupModal] = useState(false);
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/markdown') {
      try {
        await importFile(file);
      } catch (error) {
        console.error('Failed to import file:', error);
      }
    }
    // Reset input
    event.target.value = '';
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

  const handleViewModeChange = (mode: 'editor' | 'preview' | 'split') => {
    setViewMode(mode);
    updatePreferences({ viewMode: mode });
  };

  const handleRenameCurrent = () => {
    if (!currentFileId || !currentFile) return;
    const newName = prompt('Rename file', currentFile.name)?.trim();
    if (newName && newName !== currentFile.name) {
      renameFile(currentFileId, newName);
    }
  };

  return (
    <div className="h-screen flex flex-col main-layout">
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
      
      <div className="flex flex-1 min-h-0 main-content-wrapper">
        <Sidebar
          files={files}
          currentFileId={currentFileId}
          onFileSelect={handleFileSelect}
          onNewFile={handleNewFile}
          onDeleteFile={handleDeleteFile}
          onImportFile={handleImportFile}
          onRenameFile={(fileId, newName) => renameFile(fileId, newName)}
          onDownloadAll={handleDownloadAll}
        />
        
        <MainContent
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          content={currentFile?.content || ''}
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
              <Card className="w-full max-w-2xl">
                <CardContent className="p-8 text-center">
                  <h2 className="text-2xl font-bold mb-4">Welcome to Markdown Editor</h2>
                  <p className="text-muted-foreground mb-6">
                    A modern, feature-rich markdown editor with live preview and export capabilities.
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Create and edit markdown files</p>
                    <p>• Live preview with syntax highlighting</p>
                    <p>• Export to PDF and markdown formats</p>
                    <p>• Dark and light theme support</p>
                    <p>• Responsive design for all devices</p>
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
      
      {/* Toast Notifications */}
      <ToastContainer
        toasts={toasts}
        onClose={removeToast}
      />
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
