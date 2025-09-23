'use client';

import { useState } from 'react';
import MonacoEditor from './MonacoEditor';
import MarkdownPreview from './MarkdownPreview';
import { useDebounce } from '@/hooks/useDebounce';

interface EditorContainerProps {
  content: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  viewMode: 'editor' | 'preview' | 'split';
  className?: string;
}

export default function EditorContainer({
  content,
  onChange,
  onSave,
  viewMode,
  className = '',
}: EditorContainerProps) {
  // Note: Auto-save is handled in the FileContext, not here

  // Render based on view mode
  const renderContent = () => {
    switch (viewMode) {
      case 'editor':
        return (
          <div className="h-full flex-1">
            <MonacoEditor
              value={content}
              onChange={onChange}
              onSave={onSave}
              className="h-full"
            />
          </div>
        );
      
      case 'preview':
        return (
          <div className="h-full flex-1">
            <MarkdownPreview
              content={content}
              className="h-full"
            />
          </div>
        );
      
      case 'split':
        return (
          <div className="flex h-full min-h-0 flex-1">
            <div className="flex-1 border-r min-w-0 flex flex-col">
              <MonacoEditor
                value={content}
                onChange={onChange}
                onSave={onSave}
                className="h-full flex-1"
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col">
              <MarkdownPreview
                content={content}
                className="h-full flex-1"
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`h-full min-h-0 editor-container ${className}`}>
      {renderContent()}
    </div>
  );
}
