'use client';

import { useMemo } from 'react';
import { List, ChevronRight, X } from 'lucide-react';
import Modal from './Modal';

interface TocItem {
  id: string;
  level: number;
  text: string;
  slug: string;
}

interface TableOfContentsProps {
  content: string;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export default function TableOfContents({ 
  content, 
  isOpen,
  onClose,
  className = '',
}: TableOfContentsProps) {
  const tocItems = useMemo(() => {
    if (!content) {
      return [];
    }
    
    const items: TocItem[] = [];
    const lines = content.split('\n');
    let idCounter = 0;

    lines.forEach((line) => {
      // Trim the line to remove any leading/trailing whitespace
      const trimmedLine = line.trim();
      
      // Match markdown headings (# to ######)
      // More robust pattern that handles various whitespace
      const match = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
      
      if (match) {
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
      }
    });
    
    return items;
  }, [content]);

  const handleItemClick = (slug: string) => {
    // Scroll to heading in preview
    const previewContainer = document.querySelector('.markdown-preview-container');
    if (previewContainer) {
      const headingElement = previewContainer.querySelector(`#${slug}`);
      if (headingElement) {
        headingElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Close the modal after navigation
        onClose();
      } else {
        console.warn(`Heading with slug "${slug}" not found in preview`);
      }
    } else {
      console.warn('Preview container not found. TOC navigation requires preview mode.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Table of Contents">
      <div className={`max-h-[60vh] overflow-y-auto ${className}`}>
        {tocItems.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <List className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No headings found in the document.</p>
            <p className="text-xs mt-1">Add headings using # syntax to see them here.</p>
          </div>
        ) : (
          <nav className="space-y-1 p-2">
            {tocItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.slug)}
                className="w-full text-left text-sm hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2 transition-colors group flex items-start"
                style={{
                  paddingLeft: `${0.75 + (item.level - 1) * 0.75}rem`,
                }}
              >
                <ChevronRight className="h-4 w-4 mt-0.5 mr-2 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                <span className="flex-1 truncate" title={item.text}>
                  {item.text}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  H{item.level}
                </span>
              </button>
            ))}
          </nav>
        )}
      </div>
      
      {tocItems.length > 0 && (
        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground text-center">
          Click any heading to navigate • ESC to close
        </div>
      )}
    </Modal>
  );
}

