'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Editor } from '@monaco-editor/react';
import { useTheme } from '@/contexts/ThemeContext';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  onScroll?: (scrollTop: number) => void;
  className?: string;
  readOnly?: boolean;
}

export default function MonacoEditor({
  value,
  onChange,
  onSave,
  onScroll,
  className = '',
  readOnly = false,
}: MonacoEditorProps) {
  const { theme } = useTheme();
  const editorRef = useRef<any>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    setIsEditorReady(true);

    // Configure markdown language
    monaco.languages.register({ id: 'markdown' });
    
    // Set up markdown language configuration
    monaco.languages.setMonarchTokensProvider('markdown', {
      tokenizer: {
        root: [
          // Headers
          [/^#{1,6}\s+.*$/, 'keyword'],
          // Bold and italic
          [/\*\*([^*]+)\*\*/, 'strong'],
          [/\*([^*]+)\*/, 'emphasis'],
          [/__([^_]+)__/, 'strong'],
          [/_([^_]+)_/, 'emphasis'],
          // Code blocks
          [/```[\s\S]*?```/, 'string'],
          [/`[^`]+`/, 'string'],
          // Links
          [/\[([^\]]+)\]\([^)]+\)/, 'link'],
          // Lists
          [/^\s*[-*+]\s+/, 'keyword'],
          [/^\s*\d+\.\s+/, 'keyword'],
          // Blockquotes
          [/^\s*>\s+/, 'comment'],
          // Horizontal rules
          [/^[-*_]{3,}$/, 'keyword'],
        ],
      },
    });

    // Configure editor options
    editor.updateOptions({
      minimap: { enabled: true },
      lineNumbers: 'on',
      wordWrap: 'on',
      folding: true,
      lineDecorationsWidth: 10,
      lineNumbersMinChars: 3,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      fontSize: 14,
      fontFamily: 'var(--font-mono), "Fira Code", "Cascadia Code", Consolas, monospace',
      fontLigatures: true,
      cursorBlinking: 'blink',
      cursorSmoothCaretAnimation: true,
      smoothScrolling: true,
      contextmenu: true,
      mouseWheelZoom: true,
      quickSuggestions: {
        other: true,
        comments: false,
        strings: false,
      },
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: 'on',
      tabCompletion: 'on',
      wordBasedSuggestions: 'off',
    });

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave?.();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, () => {
      editor.trigger('keyboard', 'undo', null);
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ, () => {
      editor.trigger('keyboard', 'redo', null);
    });

    // Add markdown-specific shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
      const selection = editor.getSelection();
      const selectedText = editor.getModel()?.getValueInRange(selection);
      if (selectedText) {
        editor.executeEdits('bold', [{
          range: selection,
          text: `**${selectedText}**`,
        }]);
      } else {
        editor.executeEdits('bold', [{
          range: selection,
          text: '**bold text**',
        }]);
      }
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
      const selection = editor.getSelection();
      const selectedText = editor.getModel()?.getValueInRange(selection);
      if (selectedText) {
        editor.executeEdits('italic', [{
          range: selection,
          text: `*${selectedText}*`,
        }]);
      } else {
        editor.executeEdits('italic', [{
          range: selection,
          text: '*italic text*',
        }]);
      }
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      const selection = editor.getSelection();
      const selectedText = editor.getModel()?.getValueInRange(selection);
      if (selectedText) {
        editor.executeEdits('link', [{
          range: selection,
          text: `[${selectedText}](url)`,
        }]);
      } else {
        editor.executeEdits('link', [{
          range: selection,
          text: '[link text](url)',
        }]);
      }
    });

    // Add scroll event listener
    if (onScroll) {
      editor.onDidScrollChange((e: any) => {
        const scrollTop = editor.getScrollTop();
        onScroll(scrollTop);
      });
    }
  };

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  }, [onChange]);

  return (
    <div className={`h-full monaco-editor-container ${className}`}>
      <Editor
        height="100%"
        language="markdown"
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        options={{
          readOnly,
          selectOnLineNumbers: true,
          renderLineHighlight: 'line',
          minimap: { enabled: true },
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
        }}
      />
    </div>
  );
}
