import React, { useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { useApp } from '../store/AppStore';
import { createLccMode } from '../editor/lcc-mode';

/**
 * Editor panel component containing the code editor
 * @returns {JSX.Element} The editor panel with CodeMirror
 */
function EditorPanel() {
  const { 
    editorContent, 
    setEditorContent, 
    isDarkMode,
    currentFileName
  } = useApp();
  
  const editorRef = useRef(null);

  // Create LCC language mode
  const lccMode = createLccMode();

  // Editor extensions
  const extensions = [
    lccMode,
    EditorView.theme({
      '&': {
        fontSize: '14px',
        height: '100%',
      },
      '.cm-content': {
        padding: '16px',
        minHeight: '100%',
      },
      '.cm-focused': {
        outline: 'none',
      },
      '.cm-editor': {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      },
      '.cm-scroller': {
        fontFamily: '"Fira Code", "JetBrains Mono", "Monaco", "Consolas", monospace',
        flex: 1,
        overflow: 'auto',
      },
    }),
    EditorView.lineWrapping,
  ];

  // Handle editor content changes
  const handleChange = useCallback((value) => {
    setEditorContent(value);
  }, [setEditorContent]);

  // Focus editor on mount
  useEffect(() => {
    // Access the CodeMirror editor instance's view and focus it
    if (editorRef.current && editorRef.current.view) {
      editorRef.current.view.focus();
    }
  }, []);

  return (
    <motion.div 
      className="flex flex-col h-full editor-panel"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      {/* Editor header */}
      <div className="flex justify-between items-center p-3 bg-secondary-800 border-b border-secondary-700 flex-shrink-0">
        <h2 className="text-base font-semibold text-primary-400 flex items-center">
          <i className="fas fa-code mr-2 text-primary-400" />
          Editor
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-secondary-400">
            {currentFileName}
          </span>
        </div>
      </div>

      {/* Editor content */}
      <div className="flex-1 relative min-h-0">
        <CodeMirror
          ref={editorRef}
          value={editorContent}
          onChange={handleChange}
          theme={isDarkMode ? oneDark : undefined}
          extensions={extensions}
          placeholder="// Start typing your LCC assembly code here..."
          className="h-full"
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            highlightSelectionMatches: false,
            searchKeymap: true,
          }}
        />
        
        {/* Editor overlay for drag and drop */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Future: Add drag and drop file overlay */}
        </div>
      </div>

      {/* Editor status bar */}
      <div className="flex justify-between items-center px-3 py-2 bg-secondary-800 border-t border-secondary-700 text-xs text-secondary-400 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <span>Lines: {editorContent.split('\n').length}</span>
          <span>Characters: {editorContent.length}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>LCC Assembly</span>
        </div>
      </div>
    </motion.div>
  );
}

export default EditorPanel;