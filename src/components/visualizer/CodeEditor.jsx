import React, { useRef, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView, Decoration, DecorationSet, hoverTooltip } from '@codemirror/view';
import { StateField, StateEffect } from '@codemirror/state';
import { createLccMode } from '../../editor/lcc-mode';

// Assembly instruction information for tooltips (same as EditorPanel)
const assemblyInfo = {
  // I/O Instructions
  'dout': {
    descriptive_name: 'Decimal Output',
    syntax: 'dout reg',
    binary_format: '1111 0010 dr 000000',
    description: 'Output decimal value of register to terminal',
    explanation: 'Outputs the signed decimal value in the specified register to the terminal, followed by a newline.',
    flags_set: ''
  },
  'udout': {
    descriptive_name: 'Unsigned Decimal Output',
    syntax: 'udout reg',
    binary_format: '1111 0011 dr 000000',
    description: 'Output unsigned decimal value of register to terminal',
    explanation: 'Outputs the unsigned decimal value in the specified register to the terminal, followed by a newline.',
    flags_set: ''
  },
  'hout': {
    descriptive_name: 'Hexadecimal Output',
    syntax: 'hout reg',
    binary_format: '1111 0100 dr 000000',
    description: 'Output hexadecimal value of register to terminal',
    explanation: 'Outputs the hexadecimal value in the specified register to the terminal, followed by a newline.',
    flags_set: ''
  },
  'aout': {
    descriptive_name: 'ASCII Character Output',
    syntax: 'aout reg',
    binary_format: '1111 0101 dr 000000',
    description: 'Output ASCII character from register to terminal',
    explanation: 'Outputs the ASCII character corresponding to the value in the specified register to the terminal.',
    flags_set: ''
  },
  'sout': {
    descriptive_name: 'String Output',
    syntax: 'sout reg',
    binary_format: '1111 0110 dr 000000',
    description: 'Output null-terminated string from memory to terminal',
    explanation: 'Outputs a null-terminated string starting at the memory address in the specified register to the terminal.',
    flags_set: ''
  },
  'nl': {
    descriptive_name: 'New Line',
    syntax: 'nl',
    binary_format: '1111 0001 000 000000',
    description: 'Output newline character to terminal',
    explanation: 'Outputs a newline character to the terminal.',
    flags_set: ''
  },
  'din': {
    descriptive_name: 'Decimal Input',
    syntax: 'din reg',
    binary_format: '1111 0111 dr 000000',
    description: 'Read decimal value from terminal into register',
    explanation: 'Reads a signed decimal value from the terminal and stores it in the specified register.',
    flags_set: ''
  },
  'hin': {
    descriptive_name: 'Hexadecimal Input',
    syntax: 'hin reg',
    binary_format: '1111 1000 dr 000000',
    description: 'Read hexadecimal value from terminal into register',
    explanation: 'Reads a hexadecimal value from the terminal and stores it in the specified register.',
    flags_set: ''
  },
  'ain': {
    descriptive_name: 'ASCII Character Input',
    syntax: 'ain reg',
    binary_format: '1111 1001 dr 000000',
    description: 'Read ASCII character from terminal into register',
    explanation: 'Reads a single ASCII character from the terminal and stores its value in the specified register.',
    flags_set: ''
  },
  'sin': {
    descriptive_name: 'String Input',
    syntax: 'sin reg',
    binary_format: '1111 1010 dr 000000',
    description: 'Read string from terminal into memory',
    explanation: 'Reads a string from the terminal and stores it as a null-terminated string starting at the address in the specified register.',
    flags_set: ''
  },
  // Control Instructions
  'halt': {
    descriptive_name: 'Halt Program',
    syntax: 'halt',
    binary_format: '1111 0000 000 000000',
    description: 'Stop program execution',
    explanation: 'Terminates the program execution immediately.',
    flags_set: ''
  },
  'br': {
    descriptive_name: 'Branch',
    syntax: 'br label',
    binary_format: '0000 111 pcoffset9',
    description: 'Unconditional branch to label',
    explanation: 'Unconditionally branches to the specified label by adding the PC-relative offset to the program counter.',
    flags_set: ''
  },
  'brz': {
    descriptive_name: 'Branch if Zero',
    syntax: 'brz label',
    binary_format: '0000 010 pcoffset9',
    description: 'Branch to label if zero flag is set',
    explanation: 'Branches to the specified label if the zero flag (Z) is set from the last operation that affected flags.',
    flags_set: ''
  },
  'brn': {
    descriptive_name: 'Branch if Negative',
    syntax: 'brn label',
    binary_format: '0000 100 pcoffset9',
    description: 'Branch to label if negative flag is set',
    explanation: 'Branches to the specified label if the negative flag (N) is set from the last operation that affected flags.',
    flags_set: ''
  },
  'brp': {
    descriptive_name: 'Branch if Positive',
    syntax: 'brp label',
    binary_format: '0000 001 pcoffset9',
    description: 'Branch to label if result is positive',
    explanation: 'Branches to the specified label if the result is positive (neither negative nor zero flags are set).',
    flags_set: ''
  },
  // Arithmetic Instructions
  'add': {
    descriptive_name: 'Addition',
    syntax: 'add dr, sr1, sr2/imm5',
    binary_format: '0001 dr sr1 0 00 sr2 | 0001 dr sr1 1 imm5',
    description: 'Add two values and store result',
    explanation: 'Adds the values in sr1 and sr2 (or sr1 and immediate value) and stores the result in dr.',
    flags_set: 'nzv'
  },
  'sub': {
    descriptive_name: 'Subtraction',
    syntax: 'sub dr, sr1, sr2/imm5',
    binary_format: '1011 dr sr1 0 00 sr2 | 1011 dr sr1 1 imm5',
    description: 'Subtract two values and store result',
    explanation: 'Subtracts sr2 (or immediate value) from sr1 and stores the result in dr.',
    flags_set: 'nzv'
  },
  'mul': {
    descriptive_name: 'Multiplication',
    syntax: 'mul dr, sr1, sr2',
    binary_format: '1010 dr sr1 000111',
    description: 'Multiply two values and store result',
    explanation: 'Multiplies the values in sr1 and sr2 and stores the result in dr.',
    flags_set: 'nz'
  },
  'div': {
    descriptive_name: 'Division',
    syntax: 'div dr, sr1, sr2',
    binary_format: '1010 dr sr1 001000',
    description: 'Divide two values and store result',
    explanation: 'Divides sr1 by sr2 and stores the quotient in dr.',
    flags_set: 'nz'
  },
  // Logical Instructions
  'and': {
    descriptive_name: 'Bitwise AND',
    syntax: 'and dr, sr1, sr2/imm5',
    binary_format: '0101 dr sr1 0 00 sr2 | 0101 dr sr1 1 imm5',
    description: 'Bitwise AND operation',
    explanation: 'Performs bitwise AND between sr1 and sr2 (or immediate value) and stores result in dr.',
    flags_set: 'nz'
  },
  'or': {
    descriptive_name: 'Bitwise OR',
    syntax: 'or dr, sr1, sr2',
    binary_format: '1010 dr sr1 001010',
    description: 'Bitwise OR operation',
    explanation: 'Performs bitwise OR between sr1 and sr2 and stores result in dr.',
    flags_set: 'nz'
  },
  'not': {
    descriptive_name: 'Bitwise NOT',
    syntax: 'not dr, sr',
    binary_format: '1001 dr sr 111111',
    description: 'Bitwise NOT operation',
    explanation: 'Performs bitwise NOT (complement) on sr and stores result in dr.',
    flags_set: 'nz'
  },
  // Memory Instructions
  'ld': {
    descriptive_name: 'Load',
    syntax: 'ld dr, label',
    binary_format: '0010 dr pcoffset9',
    description: 'Load value from memory address',
    explanation: 'Loads a value from memory at PC + offset into the destination register.',
    flags_set: 'nz'
  },
  'st': {
    descriptive_name: 'Store',
    syntax: 'st sr, label',
    binary_format: '0011 sr pcoffset9',
    description: 'Store value to memory address',
    explanation: 'Stores the value in the source register to memory at PC + offset.',
    flags_set: ''
  },
  'ldr': {
    descriptive_name: 'Load Register',
    syntax: 'ldr dr, baser, offset6',
    binary_format: '0110 dr baser offset6',
    description: 'Load value using base + offset addressing',
    explanation: 'Loads a value from memory at base register + offset into the destination register.',
    flags_set: 'nz'
  },
  'str': {
    descriptive_name: 'Store Register',
    syntax: 'str sr, baser, offset6',
    binary_format: '0111 sr baser offset6',
    description: 'Store value using base + offset addressing',
    explanation: 'Stores the value in the source register to memory at base register + offset.',
    flags_set: ''
  },
  'lea': {
    descriptive_name: 'Load Effective Address',
    syntax: 'lea dr, label',
    binary_format: '1110 dr pcoffset9',
    description: 'Load effective address into register',
    explanation: 'Calculates PC + offset and stores the address (not the value at that address) in dr.',
    flags_set: 'nz'
  }
};

/**
 * Creates a tooltip for assembly instructions
 */
function createTooltip(info, line) {
  const dom = document.createElement('div');
  dom.className = 'lcc-tooltip';
  
  // Apply inline styles to ensure visibility
  Object.assign(dom.style, {
    backgroundColor: '#252526',
    color: '#d4d4d4',
    border: '1px solid #454545',
    borderRadius: '4px',
    padding: '12px 16px',
    fontSize: '13px',
    fontFamily: 'Consolas, Monaco, "Lucida Console", "Courier New", monospace',
    lineHeight: '1.5',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)',
    minWidth: '450px',
    maxWidth: '600px',
    zIndex: '10000',
    display: 'block',
    opacity: '1',
    visibility: 'visible',
    position: 'fixed'
  });
  
  // Parse binary format to show bit positions  
  let binaryFormatted = info.binary_format;
  if (info.binary_format && info.binary_format.includes(' ')) {
    const parts = info.binary_format.split(' ');
    binaryFormatted = parts.map((part, index) => {
      if (part === 'dr' || part === 'sr' || part === 'sr1' || part === 'sr2' || part === 'baser') {
        return `${part}(3)`;
      } else if (part.match(/^\d+$/)) {
        return part;
      } else if (part === 'pcoffset9') {
        return 'pcoffset(9)';
      } else if (part === 'offset6') {
        return 'offset(6)';
      }
      return part;
    }).join(' ');
  }
  
  dom.innerHTML = `
    <div style="color: #4fc1ff; font-weight: bold; font-size: 16px; margin-bottom: 8px;">
      ${info.descriptive_name}
    </div>
    
    <div style="color: #dcdcaa; font-family: Consolas, monospace; margin-bottom: 6px;">
      ${info.syntax}
    </div>
    
    <div style="color: #ce9178; font-style: italic; margin-bottom: 6px;">
      ${info.description}
    </div>
    
    <div style="color: #d4d4d4; margin-bottom: 8px; line-height: 1.4;">
      ${info.explanation}
    </div>
    
    <div style="margin-bottom: 6px;">
      <span style="color: #9cdcfe; font-weight: bold;">Binary format:</span>
      <span style="color: #d4d4d4; font-family: Consolas, monospace; margin-left: 8px;">
        <span style="color: #c586c0;">${info.binary_format.split(' ')[0]}</span>
        <span style="color: #dcdcaa;"> ${binaryFormatted.substring(4)}</span>
      </span>
    </div>
    
    ${info.flags_set ? `
    <div>
      <span style="color: #9cdcfe; font-weight: bold;">Flags Affected:</span>
      <span style="color: #ffd700; margin-left: 8px;">
        ${info.flags_set.toUpperCase().split('').join(', ')}
      </span>
    </div>
    ` : ''}
  `;
  return dom;
}

/**
 * Hover tooltip extension for LCC assembly
 */
const lccHoverTooltip = hoverTooltip((view, pos, side) => {
  const { from, to, text } = view.state.doc.lineAt(pos);
  const charPos = pos - from;
  
  // Find the word boundaries around the cursor position
  let wordStart = charPos;
  let wordEnd = charPos;
  
  // Find start of word
  while (wordStart > 0 && /[a-zA-Z0-9_]/.test(text[wordStart - 1])) {
    wordStart--;
  }
  
  // Find end of word
  while (wordEnd < text.length && /[a-zA-Z0-9_]/.test(text[wordEnd])) {
    wordEnd++;
  }
  
  // Extract the word
  const word = text.slice(wordStart, wordEnd);
  
  // Only show tooltip for valid assembly instructions (not labels, registers, etc.)
  const instruction = word.toLowerCase();
  const info = assemblyInfo[instruction];
  
  if (!info) {
    return null;
  }
  
  return {
    pos: from + wordStart,
    end: from + wordEnd,
    above: false,
    create: () => {
      const line = view.state.doc.lineAt(pos).number;
      const tooltip = createTooltip(info, line);
      // Add a class to help with animation
      setTimeout(() => {
        tooltip.classList.add('showing');
      }, 0);
      return { dom: tooltip };
    },
    side: 1
  };
}, { hoverTime: 300 });

/**
 * Code editor component with syntax highlighting for LCC assembly
 */
function CodeEditor({ code, setCode, currentLine, error, isDarkMode }) {
  const editorRef = useRef(null);

  // Create LCC language mode
  const lccMode = createLccMode();

  // Create line highlighting effect
  const highlightLine = StateEffect.define();
  
  // State field for line highlighting
  const lineHighlightField = StateField.define({
    create() {
      return Decoration.none;
    },
    update(highlights, tr) {
      highlights = highlights.map(tr.changes);
      for (let effect of tr.effects) {
        if (effect.is(highlightLine)) {
          const lineNumber = effect.value;
          if (lineNumber >= 0) {
            const line = tr.state.doc.line(lineNumber + 1);
            if (line) {
              const lineDecoration = Decoration.line({
                class: 'cm-currentLine'
              });
              highlights = Decoration.set([lineDecoration.range(line.from)]);
            }
          } else {
            highlights = Decoration.none;
          }
        }
      }
      return highlights;
    },
    provide: f => EditorView.decorations.from(f)
  });

  // Custom theme extensions
  const extensions = [
    lccMode,
    lineHighlightField,
    lccHoverTooltip,
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
        fontWeight: 'bold',
      },
    }),
    EditorView.lineWrapping,
  ];

  // Highlight current execution line
  useEffect(() => {
    if (editorRef.current && currentLine >= 0) {
      const view = editorRef.current.view;
      if (view && view.state) {
        try {
          // Apply line highlighting effect
          view.dispatch({
            effects: highlightLine.of(currentLine)
          });
          
          // Scroll to the line
          const line = view.state.doc.line(currentLine + 1);
          if (line) {
            view.dispatch({
              effects: EditorView.scrollIntoView(line.from, { y: 'center' })
            });
          }
        } catch (error) {
          console.warn('Error highlighting line:', error);
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