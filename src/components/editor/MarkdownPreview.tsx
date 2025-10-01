"use client";

import { useEffect, useRef, useState, forwardRef, useCallback } from "react";
import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";

interface MarkdownPreviewProps {
  content: string;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  scrollTop?: number;
}

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
});

// Add custom renderer for headings to include IDs for TOC navigation
md.renderer.rules.heading_open = (tokens, idx) => {
  const token = tokens[idx];
  const level = token.tag;
  const nextToken = tokens[idx + 1];

  if (nextToken && nextToken.type === "inline" && nextToken.content) {
    // Create slug from heading content
    const slug = nextToken.content
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    return `<${level} id="${slug || "heading"}">`;
  }

  return `<${level}>`;
};

const MarkdownPreview = forwardRef<HTMLDivElement, MarkdownPreviewProps>(
  ({ content, className = "", onScroll, scrollTop }, ref) => {
    // Convert markdown to HTML
    const htmlContent = md.render(content);

    // Sanitize HTML content
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

    // Handle scroll synchronization with improved throttling
    const handleScroll = useCallback(
      (e: React.UIEvent<HTMLDivElement>) => {
        if (onScroll) {
          const scrollTop = e.currentTarget.scrollTop;
          onScroll(scrollTop);
        }
      },
      [onScroll]
    );

    // Update scroll position when scrollTop prop changes with better handling
    useEffect(() => {
      if (
        ref &&
        typeof ref === "object" &&
        ref.current &&
        scrollTop !== undefined
      ) {
        const currentScrollTop = ref.current.scrollTop;
        const difference = Math.abs(currentScrollTop - scrollTop);

        // Only update if difference is significant and not during user scroll
        if (difference > 10) {
          // Use requestAnimationFrame for smoother updates
          requestAnimationFrame(() => {
            if (ref && typeof ref === "object" && ref.current) {
              ref.current.scrollTop = scrollTop;
            }
          });
        }
      }
    }, [scrollTop, ref]);

    return (
      <div
        ref={ref}
        className={`h-full overflow-y-auto p-6 markdown-preview-container ${className}`}
        onScroll={handleScroll}
        style={{
          fontFamily: "var(--font-sans), system-ui, sans-serif",
          lineHeight: "1.6",
          color: "hsl(var(--foreground))",
          backgroundColor: "hsl(var(--background))",
          scrollBehavior: "smooth",
          overscrollBehavior: "contain",
        }}
      >
        <div
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          className="markdown-content"
          style={{
            fontSize: "14px",
          }}
        />

        {/* Empty state */}
        {!content.trim() && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-lg font-medium">
                Start writing to see preview
              </p>
              <p className="text-sm">
                Your markdown will appear here in real-time
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

MarkdownPreview.displayName = "MarkdownPreview";

export default MarkdownPreview;
