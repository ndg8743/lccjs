/**
 * CodeMirror language mode for LCC assembly
 * Provides syntax highlighting for LCC assembly language
 */

import { StreamLanguage } from '@codemirror/language';

const lccMode = {
  name: 'lcc',
  
  startState: function() {
    return {
      inComment: false,
      inString: false
    };
  },
  
  token: function(stream, state) {
    // Handle comments
    if (!state.inString && stream.match(';')) {
      stream.skipToEnd();
      return 'comment';
    }
    
    // Handle strings
    if (!state.inComment) {
      if (stream.match('"')) {
        state.inString = !state.inString;
        return 'string';
      }
      if (state.inString) {
        stream.next();
        return 'string';
      }
    }
    
    // Skip whitespace
    if (stream.eatSpace()) return null;
    
    // Handle labels
    if (stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*:/)) {
      return 'variable-2';
    }
    
    // Handle directives
    if (stream.match(/^\.[a-zA-Z]+/)) {
      return 'keyword';
    }
    
    // Handle registers
    if (stream.match(/^[rR][0-7]\b/)) {
      return 'variable-3';
    }
    
    // Handle special registers
    if (stream.match(/^(sp|fp|lr|pc)\b/i)) {
      return 'variable-3';
    }
    
    // Handle hex numbers
    if (stream.match(/^0[xX][0-9a-fA-F]+/)) {
      return 'number';
    }
    
    // Handle binary numbers
    if (stream.match(/^0[bB][01]+/)) {
      return 'number';
    }
    
    // Handle decimal numbers
    if (stream.match(/^-?\d+/)) {
      return 'number';
    }
    
    // Handle instructions
    const instructions = [
      // Branch
      'br', 'bral', 'brz', 'bre', 'brnz', 'brne', 'brn', 'brp', 
      'brlt', 'brgt', 'brc', 'brb',
      // Arithmetic
      'add', 'sub', 'mul', 'div', 'rem',
      // Logical
      'and', 'or', 'xor', 'not',
      // Memory
      'ld', 'st', 'ldr', 'str', 'lea',
      // Control
      'jmp', 'bl', 'jsr', 'blr', 'jsrr', 'ret',
      // Stack
      'push', 'pop',
      // Compare
      'cmp',
      // Move
      'mov', 'mvi', 'mvr',
      // Shift/Rotate
      'sll', 'srl', 'sra', 'rol', 'ror',
      // I/O
      'halt', 'nl', 'dout', 'udout', 'hout', 'aout', 'sout',
      'din', 'hin', 'ain', 'sin',
      // Debug
      'm', 'r', 's', 'bp'
    ];
    
    const word = stream.current();
    stream.next();
    
    // Check if word is an instruction
    for (const inst of instructions) {
      if (word.toLowerCase() === inst) {
        return 'builtin';
      }
    }
    
    // Default to variable
    return 'variable';
  },
  
  lineComment: ';'
};

export function createLccMode() {
  return StreamLanguage.define(lccMode);
}