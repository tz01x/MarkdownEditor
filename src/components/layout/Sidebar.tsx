"use client";

import {
  FileText,
  Plus,
  Trash2,
  FolderOpen,
  Pencil,
  Download,
} from "lucide-react";
import { useState } from "react";

interface FileItem {
  id: string;
  name: string;
  lastModified: Date;
}

interface SidebarProps {
  files: FileItem[];
  currentFileId?: string;
  onFileSelect: (fileId: string) => void;
  onNewFile: () => void;
  onDeleteFile: (fileId: string) => void;
  onImportFile: () => void;
  onRenameFile: (fileId: string, newName: string) => void;
  onDownloadAll?: () => void;
}

export default function Sidebar({
  files,
  currentFileId,
  onFileSelect,
  onNewFile,
  onDeleteFile,
  onImportFile,
  onRenameFile,
  onDownloadAll,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sortedFiles = [...files].sort(
    (a, b) => b.lastModified.getTime() - a.lastModified.getTime()
  );

  return (
    <aside
      className={`${isCollapsed ? "w-12" : "w-64"} border-r bg-background transition-all duration-300`}
    >
      <div className="flex h-full flex-col">
        {/* Sidebar Header */}
        <div className="flex h-12 items-center justify-between border-b px-4">
          {!isCollapsed && (
            <h2 className="text-sm font-semibold text-muted-foreground">
              Files
            </h2>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8"
          >
            <FolderOpen className="h-4 w-4" />
          </button>
        </div>

        {/* Action Buttons */}
        {!isCollapsed && (
          <div className="space-y-2 p-4">
            <button
              onClick={onNewFile}
              className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3"
            >
              <Plus className="mr-2 h-4 w-4" />
              New File
            </button>
            {files.length > 0 && onDownloadAll && (
              <button
                onClick={onDownloadAll}
                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3"
              >
                <Download className="mr-2 h-4 w-4" />
                Download All
              </button>
            )}
          </div>
        )}

        {/* File List */}
        <div className="flex-1 overflow-y-auto">
          {sortedFiles.length === 0 ? (
            <div className="p-4 text-center">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No files yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create a new file to get started
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {sortedFiles.map(file => (
                <div
                  key={file.id}
                  className={`group flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer ${
                    currentFileId === file.id
                      ? "bg-accent text-accent-foreground"
                      : ""
                  }`}
                  onClick={() => onFileSelect(file.id)}
                >
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <FileText className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </div>
                  {!isCollapsed && (
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          const newName = prompt(
                            "Rename file",
                            file.name
                          )?.trim();
                          if (newName && newName !== file.name) {
                            onRenameFile(file.id, newName);
                          }
                        }}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent h-6 w-6"
                        title="Rename"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onDeleteFile(file.id);
                        }}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-destructive hover:text-destructive-foreground h-6 w-6"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Files */}
        {!isCollapsed && sortedFiles.length > 0 && (
          <div className="border-t p-4">
            <h3 className="text-xs font-semibold text-muted-foreground mb-2">
              Recent Files
            </h3>
            <div className="space-y-1">
              {sortedFiles.slice(0, 3).map(file => (
                <div
                  key={`recent-${file.id}`}
                  className="flex items-center space-x-2 rounded-md px-2 py-1 text-xs hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  onClick={() => onFileSelect(file.id)}
                >
                  <FileText className="h-3 w-3" />
                  <span className="truncate">{file.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
