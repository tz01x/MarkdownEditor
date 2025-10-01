"use client";

import { useMemo } from "react";
import { FileText, Type } from "lucide-react";

interface WordCountProps {
  content: string;
  className?: string;
}

export default function WordCount({ content, className = "" }: WordCountProps) {
  const stats = useMemo(() => {
    // Remove markdown syntax for more accurate word count
    const plainText = content
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, "")
      // Remove inline code
      .replace(/`[^`]+`/g, "")
      // Remove links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Remove images
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
      // Remove headers markers
      .replace(/^#{1,6}\s+/gm, "")
      // Remove bold/italic markers
      .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, "$1")
      // Remove blockquote markers
      .replace(/^\s*>\s+/gm, "")
      // Remove list markers
      .replace(/^\s*[-*+]\s+/gm, "")
      .replace(/^\s*\d+\.\s+/gm, "")
      // Remove horizontal rules
      .replace(/^[-*_]{3,}$/gm, "")
      .trim();

    // Count words (split by whitespace and filter empty strings)
    const words = plainText.split(/\s+/).filter(word => word.length > 0);

    const wordCount = words.length;

    // Count characters (excluding whitespace)
    const charCount = plainText.replace(/\s+/g, "").length;

    // Count characters with spaces
    const charCountWithSpaces = plainText.length;

    // Count lines
    const lineCount = content.split("\n").length;

    return {
      words: wordCount,
      characters: charCount,
      charactersWithSpaces: charCountWithSpaces,
      lines: lineCount,
    };
  }, [content]);

  return (
    <div
      className={`flex items-center space-x-4 text-xs text-muted-foreground ${className}`}
    >
      <div className="flex items-center space-x-1" title="Word count">
        <FileText className="h-3 w-3" />
        <span>{stats.words.toLocaleString()} words</span>
      </div>
      <div className="h-3 w-px bg-border" />
      <div className="flex items-center space-x-1" title="Character count">
        <Type className="h-3 w-3" />
        <span>{stats.characters.toLocaleString()} chars</span>
      </div>
      <div className="h-3 w-px bg-border" />
      <div className="flex items-center space-x-1" title="Lines">
        <span>{stats.lines.toLocaleString()} lines</span>
      </div>
    </div>
  );
}
