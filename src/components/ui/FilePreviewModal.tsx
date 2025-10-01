"use client";

import { useState } from "react";
import Modal from "./Modal";
import MarkdownPreview from "@/components/editor/MarkdownPreview";
import { FileText, Check, X } from "lucide-react";

interface FilePreview {
  file: File;
  content: string;
}

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: FilePreview[];
  onImport: (filesToImport: FilePreview[]) => void;
}

export default function FilePreviewModal({
  isOpen,
  onClose,
  files,
  onImport,
}: FilePreviewModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(
    new Set(files.map(f => f.file.name))
  );
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  const toggleFileSelection = (fileName: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileName)) {
        newSet.delete(fileName);
      } else {
        newSet.add(fileName);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.file.name)));
    }
  };

  const handleImport = () => {
    const filesToImport = files.filter(f => selectedFiles.has(f.file.name));
    onImport(filesToImport);
    onClose();
  };

  const currentFile = files[currentPreviewIndex];
  const isCurrentFileSelected = currentFile
    ? selectedFiles.has(currentFile.file.name)
    : false;

  if (files.length === 0) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Preview and Import Files">
      <div className="flex flex-col h-[70vh] max-h-[600px]">
        {/* File List */}
        <div className="border-b pb-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">
              {files.length} file{files.length !== 1 ? "s" : ""} ready to import
            </h3>
            <button
              onClick={toggleSelectAll}
              className="text-xs text-primary hover:underline"
            >
              {selectedFiles.size === files.length
                ? "Deselect All"
                : "Select All"}
            </button>
          </div>

          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {files.map((filePreview, index) => {
              const isSelected = selectedFiles.has(filePreview.file.name);
              return (
                <button
                  key={filePreview.file.name}
                  onClick={() => {
                    setCurrentPreviewIndex(index);
                  }}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm transition-all
                    ${
                      currentPreviewIndex === index
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={e => {
                      e.stopPropagation();
                      toggleFileSelection(filePreview.file.name);
                    }}
                    className="h-4 w-4"
                  />
                  <FileText className="h-4 w-4" />
                  <span className="truncate max-w-[200px]">
                    {filePreview.file.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({(filePreview.file.size / 1024).toFixed(1)} KB)
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview Area */}
        {currentFile && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">{currentFile.file.name}</h4>
              </div>

              <div className="flex items-center space-x-2">
                {currentPreviewIndex > 0 && (
                  <button
                    onClick={() => setCurrentPreviewIndex(prev => prev - 1)}
                    className="text-sm px-3 py-1 rounded border hover:bg-accent"
                  >
                    Previous
                  </button>
                )}
                {currentPreviewIndex < files.length - 1 && (
                  <button
                    onClick={() => setCurrentPreviewIndex(prev => prev + 1)}
                    className="text-sm px-3 py-1 rounded border hover:bg-accent"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 border rounded-lg overflow-hidden min-h-0">
              <MarkdownPreview
                content={currentFile.content}
                className="h-full"
              />
            </div>

            {/* File Info */}
            <div className="mt-3 text-xs text-muted-foreground flex items-center justify-between">
              <span>
                Lines: {currentFile.content.split("\n").length} | Size:{" "}
                {(currentFile.file.size / 1024).toFixed(2)} KB
              </span>
              <span>
                {currentPreviewIndex + 1} of {files.length}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 mt-4 border-t">
          <span className="text-sm text-muted-foreground">
            {selectedFiles.size} file{selectedFiles.size !== 1 ? "s" : ""}{" "}
            selected
          </span>

          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={selectedFiles.size === 0}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4"
            >
              <Check className="mr-2 h-4 w-4" />
              Import {selectedFiles.size > 0 ? `(${selectedFiles.size})` : ""}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
