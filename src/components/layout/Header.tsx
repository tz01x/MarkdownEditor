'use client';

import { Moon, Sun, FileText, Download, Save, HardDrive, Pencil, FileDown } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProgressIndicator from '@/components/ui/ProgressIndicator';
import { PDFGenerationProgress } from '@/lib/pdfGenerator';

interface HeaderProps {
  onNewFile: () => void;
  onSave: () => void;
  onDownload: () => void;
  onDownloadPDF: () => void;
  onBackup: () => void;
  fileName?: string;
  onRename?: () => void;
  isExportingPDF?: boolean;
  pdfProgress?: PDFGenerationProgress | null;
}

export default function Header({ onNewFile, onSave, onDownload, onDownloadPDF, onBackup, fileName, onRename, isExportingPDF = false, pdfProgress }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left side - Logo and file info */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-semibold">Markdown Editor</h1>
          </div>
          {fileName && (
            <div className="hidden sm:block">
              <span className="text-sm text-muted-foreground">Editing:</span>
              <span className="ml-1 text-sm font-medium">{fileName}</span>
            </div>
          )}
        </div>

        {/* Right side - Actions and theme toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onNewFile}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3"
          >
            <FileText className="mr-2 h-4 w-4" />
            New
          </button>

          {fileName && onRename && (
            <button
              onClick={onRename}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Rename
            </button>
          )}
          
          <button
            onClick={onSave}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3"
          >
            <Save className="mr-2 h-4 w-4" />
            Save
          </button>
          
          <button
            onClick={onDownload}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3"
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </button>
          
          <button
            onClick={onDownloadPDF}
            disabled={isExportingPDF}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3"
          >
            {isExportingPDF ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Generating...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                PDF
              </>
            )}
          </button>
          
          <button
            onClick={onBackup}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3"
          >
            <HardDrive className="mr-2 h-4 w-4" />
            Backup
          </button>

          <div className="h-6 w-px bg-border mx-2" />

          <button
            onClick={toggleTheme}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      
      {/* PDF Progress Indicator */}
      {isExportingPDF && pdfProgress && (
        <div className="absolute top-14 left-0 right-0 bg-background/95 backdrop-blur border-b p-4 z-50">
          <ProgressIndicator progress={pdfProgress} />
        </div>
      )}
    </header>
  );
}
