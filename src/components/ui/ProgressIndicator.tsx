"use client";

import { cn } from "@/lib/utils";
import { PDFGenerationProgress } from "@/lib/pdfGenerator";

interface ProgressIndicatorProps {
  progress: PDFGenerationProgress;
  className?: string;
}

export default function ProgressIndicator({
  progress,
  className,
}: ProgressIndicatorProps) {
  const getStageIcon = (stage: PDFGenerationProgress["stage"]) => {
    switch (stage) {
      case "preparing":
        return "🔧";
      case "rendering":
        return "🎨";
      case "generating":
        return "📄";
      case "finalizing":
        return "✨";
      case "complete":
        return "✅";
      default:
        return "⏳";
    }
  };

  const getStageColor = (stage: PDFGenerationProgress["stage"]) => {
    switch (stage) {
      case "preparing":
        return "text-blue-600";
      case "rendering":
        return "text-purple-600";
      case "generating":
        return "text-green-600";
      case "finalizing":
        return "text-orange-600";
      case "complete":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getStageIcon(progress.stage)}</span>
          <span
            className={cn("text-sm font-medium", getStageColor(progress.stage))}
          >
            {progress.message}
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          {Math.round(progress.progress)}%
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={cn(
            "h-2 rounded-full transition-all duration-300 ease-out",
            progress.stage === "complete" ? "bg-green-500" : "bg-blue-500"
          )}
          style={{ width: `${progress.progress}%` }}
        />
      </div>

      <div className="mt-2 text-xs text-muted-foreground text-center">
        {progress.stage === "preparing" && "Setting up PDF generation..."}
        {progress.stage === "rendering" && "Converting content to image..."}
        {progress.stage === "generating" && "Creating PDF document..."}
        {progress.stage === "finalizing" && "Finalizing PDF..."}
        {progress.stage === "complete" && "PDF ready for download!"}
      </div>
    </div>
  );
}
