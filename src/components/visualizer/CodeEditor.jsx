import React, { useRef, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
// import { createLccMode } from '../../editor/lcc-mode';

/**
 * Code editor component with syntax highlighting for LCC assembly
 */
function CodeEditor({ code, setCode, currentLine, error, isDarkMode }) {
  const editorRef = useRef(null);

  // Create LCC language mode
  // const lccMode = createLccMode();

  // Custom theme extensions
  const extensions = [
    // lccMode,
    EditorView.theme({
      '&': {
        fontSize: '14px',
        height: '100%',
      },
      '.cm-content': {
        padding: '16px',
        minHeight: '100%',
      },
      '.cm-line': {
        padding: '0 4px',
      },
      '.cm-activeLine': {
        backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
      },
      '.cm-currentLine': {
        backgroundColor: isDarkMode ? '#3b82f6' : '#60a5fa',
        color: 'white',
      },
    }),
    EditorView.lineWrapping,
  ];

  // Highlight current execution line
  useEffect(() => {
    if (editorRef.current && currentLine >= 0) {
      const view = editorRef.current.view;
      if (view) {
        // Clear previous highlights
        view.dispatch({
          effects: EditorView.decorations.update.of((decorations) => {
            return decorations.filter(() => false);
          })
        });
        
        // Add current line highlight
        const line = view.state.doc.line(currentLine + 1);
        if (line) {
          const decoration = EditorView.decoration.line({
            attributes: { class: 'cm-currentLine' }
          });
          view.dispatch({
            effects: EditorView.decorations.update.of((decorations) => {
              return decorations.update([decoration.range(line.from)]);
            })
          });
        }
      }
    }
  }, [currentLine]);

  try {
    return (
      <CodeMirror
        ref={editorRef}
        value={code}
        onChange={setCode}
        theme={isDarkMode ? oneDark : undefined}
        extensions={extensions}
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
    );
  } catch (error) {
    console.error('CodeEditor error:', error);
    return (
      <div className="h-full p-4 font-mono text-sm">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className={`w-full h-full p-4 font-mono text-sm rounded border-0 outline-none resize-none ${
            isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
          }`}
        />
      </div>
    );
  }
}

export default CodeEditor;