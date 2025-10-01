"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Split, FileText, List } from "lucide-react";
import WordCount from "@/components/ui/WordCount";
import TableOfContents from "@/components/ui/TableOfContents";

type ViewMode = "editor" | "preview" | "split";

interface MainContentProps {
  children: React.ReactNode;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  content?: string;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

export default function MainContent({
  children,
  viewMode,
  onViewModeChange,
  content = "",
  onFullscreenChange,
}: MainContentProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showToc, setShowToc] = useState(false);

  // Check if preview is visible (for TOC functionality)
  const isPreviewVisible = viewMode === "preview" || viewMode === "split";

  // Auto-hide TOC when switching to editor-only mode
  useEffect(() => {
    if (!isPreviewVisible && showToc) {
      setShowToc(false);
    }
  }, [isPreviewVisible, showToc]);

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenState = !!document.fullscreenElement;
      setIsFullscreen(fullscreenState);
      onFullscreenChange?.(fullscreenState);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
    };
  }, [onFullscreenChange]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  };

  return (
    <div
      className={`flex flex-col flex-1 h-full ${isFullscreen ? "fixed inset-0 z-50 bg-background" : ""}`}
    >
      {/* Toolbar */}
      <div
        className={`flex h-10 items-center justify-between border-b px-4 ${isFullscreen ? "bg-background" : "bg-muted/50"}`}
      >
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onViewModeChange("editor")}
            className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 px-3 ${
              viewMode === "editor"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <FileText className="mr-2 h-4 w-4" />
            Editor
          </button>

          <button
            onClick={() => onViewModeChange("preview")}
            className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 px-3 ${
              viewMode === "preview"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </button>

          <button
            onClick={() => onViewModeChange("split")}
            className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 px-3 ${
              viewMode === "split"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <Split className="mr-2 h-4 w-4" />
            Split
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <WordCount content={content} />

          <div className="h-4 w-px bg-border mx-2" />

          <button
            onClick={() => setShowToc(!showToc)}
            disabled={!isPreviewVisible}
            className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 ${
              showToc ? "bg-accent text-accent-foreground" : ""
            }`}
            title={
              isPreviewVisible
                ? "Toggle table of contents"
                : "Table of contents (available in preview mode)"
            }
          >
            <List className="h-4 w-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 min-h-0 main-content">{children}</div>

      {/* Table of Contents Modal */}
      <TableOfContents
        content={content}
        isOpen={showToc && isPreviewVisible}
        onClose={() => setShowToc(false)}
      />
    </div>
  );
}
