'use client';

import { useMemo } from 'react';
import { List, ChevronRight } from 'lucide-react';

interface TocItem {
  id: string;
  level: number;
  text: string;
  slug: string;
}

interface TableOfContentsProps {
  content: string;
  className?: string;
  onItemClick?: (slug: string) => void;
}

export default function TableOfContents({ 
  content, 
  className = '',
  onItemClick 
}: TableOfContentsProps) {
  const tocItems = useMemo(() => {
    console.log('TOC Content:', content);
    console.log('TOC Content type:', typeof content);
    console.log('TOC Content length:', content?.length);
    
    if (!content) {
      console.log('No content provided to TOC');
      return [];
    }
    
    const items: TocItem[] = [];
    const lines = content.split('\n');
    let idCounter = 0;

    console.log('TOC Lines:', lines);
    console.log('TOC Lines count:', lines.length);

    lines.forEach((line, index) => {
      // Trim the line to remove any leading/trailing whitespace
      const trimmedLine = line.trim();
      
      // Match markdown headings (# to ######)
      // More robust pattern that handles various whitespace
      const match = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
      
      if (match) {
        console.log(`Line ${index}: "${line}" matched as heading`);
        const level = match[1].length;
        const text = match[2].trim();
        
        // Create a slug from the heading text
        const slug = text
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();

        items.push({
          id: `toc-${idCounter++}`,
          level,
          text,
          slug: slug || `heading-${idCounter}`,
        });
      } else {
        console.log(`Line ${index}: "${line}" did NOT match`);
      }
    });
    
    console.log('TOC Items:', items);
    return items;
  }, [content]);

  const handleItemClick = (slug: string) => {
    if (onItemClick) {
      onItemClick(slug);
    } else {
      // Default behavior: scroll to heading in preview
      // Look for the preview container first, then find the heading within it
      const previewContainer = document.querySelector('.markdown-preview-container');
      if (previewContainer) {
        const headingElement = previewContainer.querySelector(`#${slug}`);
        if (headingElement) {
          headingElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          console.warn(`Heading with slug "${slug}" not found in preview`);
        }
      } else {
        console.warn('Preview container not found. TOC navigation requires preview mode.');
      }
    }
  };

  if (tocItems.length === 0) {
    return (
      <div className={`p-4 text-sm text-muted-foreground ${className}`}>
        <div className="flex items-center space-x-2 mb-2">
          <List className="h-4 w-4" />
          <span className="font-semibold">Table of Contents</span>
        </div>
        <p className="text-xs">No headings found in the document.</p>
      </div>
    );
  }

  return (
    <div className={`p-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-3">
        <List className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm">Table of Contents</span>
      </div>
      <nav className="space-y-1">
        {tocItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item.slug)}
            className="w-full text-left text-sm hover:text-primary transition-colors group flex items-start"
            style={{
              paddingLeft: `${(item.level - 1) * 0.75}rem`,
            }}
          >
            <ChevronRight className="h-3 w-3 mt-1 mr-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            <span className="truncate" title={item.text}>
              {item.text}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}

