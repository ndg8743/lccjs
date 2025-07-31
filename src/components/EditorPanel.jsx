import React, { useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { hoverTooltip } from '@codemirror/view';
import { StateField, StateEffect } from '@codemirror/state';
import { useApp } from '../store/AppStore';
import { createLccMode } from '../editor/lcc-mode';

/**
 * Assembly instruction information for tooltips
 */
const assemblyInfo = {
  "add": {
    descriptive_name: "Add",
    description: "dr = sr1 + sr2",
    syntax: "add dr, sr1, sr2",
    explanation: "Performs addition operation on two source registers and stores result in destination register.",
    flags_set: "nzcv",
    binary_format: "0001 dr sr1 000 sr2"
  },
  "sub": {
    descriptive_name: "Subtract",
    description: "dr = sr1 - sr2", 
    syntax: "sub dr, sr1, sr2",
    explanation: "Performs subtraction operation and stores result in destination register.",
    flags_set: "nzcv",
    binary_format: "1011 dr sr1 000 sr2"
  },
  "mul": {
    descriptive_name: "Multiply",
    description: "dr = dr * sr",
    syntax: "mul dr, sr",
    explanation: "Multiplies destination register by source register.",
    flags_set: "nz",
    binary_format: "1010 dr sr 0 00111"
  },
  "div": {
    descriptive_name: "Divide", 
    description: "dr = dr / sr",
    syntax: "div dr, sr",
    explanation: "Divides destination register by source register.",
    flags_set: "nz",
    binary_format: "1010 dr sr 0 01000"
  },
  "and": {
    descriptive_name: "Bitwise AND",
    description: "dr = sr1 & sr2",
    syntax: "and dr, sr1, sr2",
    explanation: "Performs bitwise AND operation on two source registers.",
    flags_set: "nz",
    binary_format: "0101 dr sr1 000 sr2"
  },
  "or": {
    descriptive_name: "Bitwise OR",
    description: "dr = sr1 | sr2", 
    syntax: "or dr, sr1, sr2",
    explanation: "Performs bitwise OR operation on two source registers.",
    flags_set: "nz",
    binary_format: "1010 dr sr1 000 sr2"
  },
  "not": {
    descriptive_name: "Bitwise NOT",
    description: "dr = ~sr1",
    syntax: "not dr, sr1",
    explanation: "Performs bitwise NOT operation on source register.",
    flags_set: "nz", 
    binary_format: "1001 dr sr1 000000"
  },
  "ld": {
    descriptive_name: "Load",
    description: "dr = mem[PC + offset]",
    syntax: "ld dr, label",
    explanation: "Loads data from memory using PC-relative addressing.",
    flags_set: "",
    binary_format: "0010 dr pcoffset9"
  },
  "st": {
    descriptive_name: "Store", 
    description: "mem[PC + offset] = sr",
    syntax: "st sr, label",
    explanation: "Stores data to memory using PC-relative addressing.",
    flags_set: "",
    binary_format: "0011 sr pcoffset9"
  },
  "ldr": {
    descriptive_name: "Load Register",
    description: "dr = mem[baser + offset]",
    syntax: "ldr dr, baser, offset",
    explanation: "Loads data from memory using base register plus offset.",
    flags_set: "",
    binary_format: "0110 dr baser offset6"
  },
  "str": {
    descriptive_name: "Store Register",
    description: "mem[baser + offset] = sr", 
    syntax: "str sr, baser, offset",
    explanation: "Stores data to memory using base register plus offset.",
    flags_set: "",
    binary_format: "0111 sr baser offset6"
  },
  "lea": {
    descriptive_name: "Load Effective Address",
    description: "dr = PC + offset",
    syntax: "lea dr, label",
    explanation: "Loads the effective address (PC + offset) into destination register.",
    flags_set: "",
    binary_format: "1110 dr pcoffset9"
  },
  "br": {
    descriptive_name: "Branch",
    description: "PC = PC + offset",
    syntax: "br label",
    explanation: "Unconditional branch to label.",
    flags_set: "",
    binary_format: "0000 000 pcoffset9"
  },
  "brz": {
    descriptive_name: "Branch if Zero",
    description: "if (Z) PC = PC + offset",
    syntax: "brz label",
    explanation: "Branch if zero flag is set.",
    flags_set: "",
    binary_format: "0000 001 pcoffset9"
  },
  "brn": {
    descriptive_name: "Branch if Negative",
    description: "if (N) PC = PC + offset",
    syntax: "brn label",
    explanation: "Branch if negative flag is set.",
    flags_set: "",
    binary_format: "0000 010 pcoffset9"
  },
  "brp": {
    descriptive_name: "Branch if Positive",
    description: "if (P) PC = PC + offset",
    syntax: "brp label",
    explanation: "Branch if positive flag is set.",
    flags_set: "",
    binary_format: "0000 011 pcoffset9"
  },
  "halt": {
    descriptive_name: "Halt",
    description: "Stop execution",
    syntax: "halt",
    explanation: "Stops program execution.",
    flags_set: "",
    binary_format: "1111 0000 00000000"
  },
  "dout": {
    descriptive_name: "Display Output",
    description: "Display value in register",
    syntax: "dout sr",
    explanation: "Displays the value in source register.",
    flags_set: "",
    binary_format: "1111 0001 sr 000000"
  },
  "sout": {
    descriptive_name: "String Output",
    description: "Display string",
    syntax: "sout string",
    explanation: "Displays a string literal.",
    flags_set: "",
    binary_format: "1111 0010 string"
  },
  "din": {
    descriptive_name: "Display Input",
    description: "Get input from user",
    syntax: "din dr",
    explanation: "Gets input from user and stores in destination register.",
    flags_set: "",
    binary_format: "1111 0011 dr 000000"
  },
  "mov": {
    descriptive_name: "Move",
    description: "dr = sr",
    syntax: "mov dr, sr",
    explanation: "Copies value from source register to destination register.",
    flags_set: "",
    binary_format: "0000 dr sr 000000"
  },
  "cmp": {
    descriptive_name: "Compare",
    description: "Compare sr1 and sr2",
    syntax: "cmp sr1, sr2",
    explanation: "Compares two source registers and sets flags based on result.",
    flags_set: "nzcv",
    binary_format: "0000 sr1 sr2 000000"
  },
  "jmp": {
    descriptive_name: "Jump",
    description: "PC = sr",
    syntax: "jmp sr",
    explanation: "Unconditional jump to address in source register.",
    flags_set: "",
    binary_format: "1100 000 sr 000000"
  },
  "jsr": {
    descriptive_name: "Jump to Subroutine",
    description: "R7 = PC; PC = sr",
    syntax: "jsr sr",
    explanation: "Jumps to subroutine and saves return address in R7.",
    flags_set: "",
    binary_format: "0100 1 sr pcoffset11"
  },
  "ret": {
    descriptive_name: "Return",
    description: "PC = R7",
    syntax: "ret",
    explanation: "Returns from subroutine using address in R7.",
    flags_set: "",
    binary_format: "1100 000 111 000000"
  },
  "bl": {
    descriptive_name: "Branch and Link",
    description: "R7 = PC; PC = PC + offset",
    syntax: "bl label",
    explanation: "Branches to label and saves return address in R7.",
    flags_set: "",
    binary_format: "0100 0 111 pcoffset11"
  },
  "blr": {
    descriptive_name: "Branch and Link Register",
    description: "R7 = PC; PC = sr",
    syntax: "blr sr",
    explanation: "Branches to address in source register and saves return address in R7.",
    flags_set: "",
    binary_format: "1100 000 sr 000000"
  },
  "push": {
    descriptive_name: "Push",
    description: "SP = SP - 1; mem[SP] = sr",
    syntax: "push sr",
    explanation: "Pushes value from source register onto stack.",
    flags_set: "",
    binary_format: "1000 sr 111 000000"
  },
  "pop": {
    descriptive_name: "Pop",
    description: "dr = mem[SP]; SP = SP + 1",
    syntax: "pop dr",
    explanation: "Pops value from stack into destination register.",
    flags_set: "",
    binary_format: "1001 dr 111 000000"
  },
  "sll": {
    descriptive_name: "Shift Left Logical",
    description: "dr = sr << amount",
    syntax: "sll dr, sr, amount",
    explanation: "Shifts source register left by specified amount.",
    flags_set: "nz",
    binary_format: "1010 dr sr amount4"
  },
  "srl": {
    descriptive_name: "Shift Right Logical",
    description: "dr = sr >> amount",
    syntax: "srl dr, sr, amount",
    explanation: "Shifts source register right logically by specified amount.",
    flags_set: "nz",
    binary_format: "1010 dr sr amount4"
  },
  "sra": {
    descriptive_name: "Shift Right Arithmetic",
    description: "dr = sr >> amount (arithmetic)",
    syntax: "sra dr, sr, amount",
    explanation: "Shifts source register right arithmetically by specified amount.",
    flags_set: "nz",
    binary_format: "1010 dr sr amount4"
  },
  "rol": {
    descriptive_name: "Rotate Left",
    description: "dr = sr <<< amount",
    syntax: "rol dr, sr, amount",
    explanation: "Rotates source register left by specified amount.",
    flags_set: "nz",
    binary_format: "1010 dr sr amount4"
  },
  "ror": {
    descriptive_name: "Rotate Right",
    description: "dr = sr >>> amount",
    syntax: "ror dr, sr, amount",
    explanation: "Rotates source register right by specified amount.",
    flags_set: "nz",
    binary_format: "1010 dr sr amount4"
  },
  "mvr": {
    descriptive_name: "Move Register",
    description: "dr = sr",
    syntax: "mvr dr, sr",
    explanation: "Moves value from source register to destination register.",
    flags_set: "",
    binary_format: "0000 dr sr 000000"
  },
  "sext": {
    descriptive_name: "Sign Extend",
    description: "dr = sign_extend(sr)",
    syntax: "sext dr, sr",
    explanation: "Sign extends source register to destination register.",
    flags_set: "nz",
    binary_format: "1010 dr sr 000000"
  },
  "mvi": {
    descriptive_name: "Move Immediate",
    description: "dr = immediate",
    syntax: "mvi dr, #value",
    explanation: "Moves immediate value into destination register.",
    flags_set: "",
    binary_format: "0010 dr immediate9"
  },
  "nl": {
    descriptive_name: "New Line",
    description: "Print newline",
    syntax: "nl",
    explanation: "Prints a newline character.",
    flags_set: "",
    binary_format: "1111 0000 00000000"
  },
  "udout": {
    descriptive_name: "Unsigned Display Output",
    description: "Display unsigned value",
    syntax: "udout sr",
    explanation: "Displays unsigned value from source register.",
    flags_set: "",
    binary_format: "1111 0001 sr 000000"
  },
  "hout": {
    descriptive_name: "Hex Output",
    description: "Display hex value",
    syntax: "hout sr",
    explanation: "Displays value from source register in hexadecimal.",
    flags_set: "",
    binary_format: "1111 0001 sr 000000"
  },
  "aout": {
    descriptive_name: "ASCII Output",
    description: "Display ASCII character",
    syntax: "aout sr",
    explanation: "Displays ASCII character from source register.",
    flags_set: "",
    binary_format: "1111 0001 sr 000000"
  },
  "hin": {
    descriptive_name: "Hex Input",
    description: "Get hex input",
    syntax: "hin dr",
    explanation: "Gets hexadecimal input from user.",
    flags_set: "",
    binary_format: "1111 0011 dr 000000"
  },
  "ain": {
    descriptive_name: "ASCII Input",
    description: "Get ASCII character",
    syntax: "ain dr",
    explanation: "Gets ASCII character input from user.",
    flags_set: "",
    binary_format: "1111 0011 dr 000000"
  },
  "sin": {
    descriptive_name: "String Input",
    description: "Get string input",
    syntax: "sin dr",
    explanation: "Gets string input from user.",
    flags_set: "",
    binary_format: "1111 0011 dr 000000"
  },
  "clear": {
    descriptive_name: "Clear Screen",
    description: "Clear terminal screen",
    syntax: "clear",
    explanation: "Clears the terminal screen.",
    flags_set: "",
    binary_format: "1111 0000 00000000"
  },
  "sleep": {
    descriptive_name: "Sleep",
    description: "Sleep for milliseconds",
    syntax: "sleep ms",
    explanation: "Sleeps for specified milliseconds.",
    flags_set: "",
    binary_format: "1111 0000 ms16"
  },
  "nbain": {
    descriptive_name: "Non-blocking ASCII Input",
    description: "Get non-blocking ASCII input",
    syntax: "nbain dr",
    explanation: "Gets ASCII input without blocking.",
    flags_set: "",
    binary_format: "1111 0011 dr 000000"
  },
  "cursor": {
    descriptive_name: "Set Cursor",
    description: "Set cursor position",
    syntax: "cursor x, y",
    explanation: "Sets cursor position to specified coordinates.",
    flags_set: "",
    binary_format: "1111 0000 x8 y8"
  },
  "srand": {
    descriptive_name: "Seed Random",
    description: "Seed random number generator",
    syntax: "srand sr",
    explanation: "Seeds the random number generator with source register value.",
    flags_set: "",
    binary_format: "1111 0000 sr 000000"
  },
  "rand": {
    descriptive_name: "Random",
    description: "Generate random number",
    syntax: "rand dr",
    explanation: "Generates random number and stores in destination register.",
    flags_set: "",
    binary_format: "1111 0000 dr 000000"
  },
  "millis": {
    descriptive_name: "Milliseconds",
    description: "Get current milliseconds",
    syntax: "millis dr",
    explanation: "Gets current time in milliseconds and stores in destination register.",
    flags_set: "",
    binary_format: "1111 0000 dr 000000"
  },
  "resetc": {
    descriptive_name: "Reset Counter",
    description: "Reset counter",
    syntax: "resetc",
    explanation: "Resets the counter.",
    flags_set: "",
    binary_format: "1111 0000 00000000"
  },
  "m": {
    descriptive_name: "Memory",
    description: "Memory reference",
    syntax: "m address",
    explanation: "References memory at specified address.",
    flags_set: "",
    binary_format: "address16"
  },
  "r": {
    descriptive_name: "Register",
    description: "Register reference",
    syntax: "r number",
    explanation: "References register by number.",
    flags_set: "",
    binary_format: "number3"
  },
  "s": {
    descriptive_name: "String",
    description: "String literal",
    syntax: "s \"string\"",
    explanation: "Defines a string literal.",
    flags_set: "",
    binary_format: "string"
  },
  "bp": {
    descriptive_name: "Breakpoint",
    description: "Set breakpoint",
    syntax: "bp",
    explanation: "Sets a breakpoint for debugging.",
    flags_set: "",
    binary_format: "1111 0000 00000000"
  }
};

/**
 * Creates a tooltip for assembly instructions
 */
function createTooltip(info) {
  const dom = document.createElement('div');
  dom.className = 'lcc-tooltip';
  dom.innerHTML = `
    <div class="hover-title">${info.descriptive_name}</div>
    <div class="hover-syntax"><code>${info.syntax}</code></div>
    <div class="hover-description">${info.description}</div>
    <div class="hover-explanation">${info.explanation}</div>
    ${info.flags_set ? `<div class="hover-flags"><strong>Flags set:</strong> ${info.flags_set.toUpperCase()}</div>` : ''}
    <div class="hover-binary"><strong>Binary format:</strong> <code>${info.binary_format}</code></div>
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
  
  // Get the coordinates for positioning the tooltip
  const coords = view.coordsAtPos(from + wordStart);
  if (!coords) {
    return null;
  }
  
  return {
    pos: from + wordStart,
    end: from + wordEnd,
    above: false,
    create: () => {
      const tooltip = createTooltip(info);
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
      '.cm-tooltip': {
        backgroundColor: '#1e293b !important',
        border: '1px solid #38bdf8 !important',
        padding: '0 !important',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.8) !important',
        position: 'absolute !important',
        zIndex: '10000 !important',
      },
      '.cm-tooltip.cm-tooltip-section': {
        backgroundColor: '#1e293b !important',
        border: '1px solid #38bdf8 !important',
        padding: '0 !important',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.8) !important',
        position: 'absolute !important',
        zIndex: '10000 !important',
      },
      '.cm-tooltip .cm-tooltip-section': {
        backgroundColor: '#1e293b !important',
        border: '1px solid #38bdf8 !important',
        padding: '0 !important',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.8) !important',
        position: 'absolute !important',
        zIndex: '10000 !important',
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