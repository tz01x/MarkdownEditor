"use client";

import { useState, useCallback, DragEvent } from "react";
import { Upload, FileText, X } from "lucide-react";

interface DragDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
  disabled?: boolean;
}

export default function DragDropZone({
  onFilesSelected,
  accept = ".md,.markdown,text/markdown",
  multiple = true,
  className = "",
  disabled = false,
}: DragDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const handleDragEnter = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) return;

      setDragCounter(prev => prev + 1);

      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) return;

      setDragCounter(prev => {
        const newCounter = prev - 1;
        if (newCounter === 0) {
          setIsDragging(false);
        }
        return newCounter;
      });
    },
    [disabled]
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) return;

      e.dataTransfer.dropEffect = "copy";
    },
    [disabled]
  );

  const validateFiles = (files: FileList | File[]): File[] => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];

    fileArray.forEach(file => {
      // Check if it's a markdown file
      const isMarkdown =
        file.type === "text/markdown" ||
        file.type === "text/plain" ||
        file.name.endsWith(".md") ||
        file.name.endsWith(".markdown");

      if (isMarkdown) {
        validFiles.push(file);
      } else {
        console.warn(
          `File rejected: ${file.name} (invalid type: ${file.type})`
        );
      }
    });

    return validFiles;
  };

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) return;

      setIsDragging(false);
      setDragCounter(0);

      const droppedFiles = e.dataTransfer.files;

      if (droppedFiles && droppedFiles.length > 0) {
        const validFiles = validateFiles(droppedFiles);

        if (validFiles.length > 0) {
          if (!multiple && validFiles.length > 1) {
            onFilesSelected([validFiles[0]]);
          } else {
            onFilesSelected(validFiles);
          }
        }
      }
    },
    [disabled, multiple, onFilesSelected]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;

      const selectedFiles = e.target.files;

      if (selectedFiles && selectedFiles.length > 0) {
        const validFiles = validateFiles(selectedFiles);

        if (validFiles.length > 0) {
          onFilesSelected(validFiles);
        }
      }

      // Reset input
      e.target.value = "";
    },
    [disabled, onFilesSelected]
  );

  return (
    <div
      className={`relative ${className}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${
            isDragging
              ? "border-primary bg-primary/10 scale-[1.02]"
              : "border-border bg-muted/30 hover:border-muted-foreground/50"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          disabled={disabled}
        />

        <label
          htmlFor="file-upload"
          className={`flex flex-col items-center space-y-4 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
        >
          <div
            className={`rounded-full p-4 ${isDragging ? "bg-primary/20" : "bg-muted"}`}
          >
            {isDragging ? (
              <Upload className="h-8 w-8 text-primary animate-bounce" />
            ) : (
              <FileText className="h-8 w-8 text-muted-foreground" />
            )}
          </div>

          <div className="space-y-2">
            <p className="text-lg font-semibold">
              {isDragging ? "Drop files here" : "Drag & drop markdown files"}
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse {multiple ? "files" : "a file"}
            </p>
            <p className="text-xs text-muted-foreground">
              Supports: .md, .markdown files
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}

export function validateMarkdownFile(file: File): boolean {
  return (
    file.type === "text/markdown" ||
    file.type === "text/plain" ||
    file.name.endsWith(".md") ||
    file.name.endsWith(".markdown")
  );
}
