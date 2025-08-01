// LCC mode for CodeMirror
// Based on the VS Code extension's syntax highlighting rules

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineMode("lcc", function() {
    // Regular expressions for different token types
    const registers = /^(r[0-7]|fp|sp|lr)\b/;
    const instructions = /^(cea|brn|mov|add|ld|st|bl|call|jsr|blr|jsrr|and|ldr|str|cmp|not|push|pop|srl|sra|sll|rol|ror|mul|div|rem|or|xor|mvr|sext|sub|jmp|ret|mvi|lea|halt|nl|dout|udout|hout|aout|sout|din|hin|ain|sin|brz|bre|brnz|brne|brp|brlt|brgt|brc|brb|br|bral|m|r|s|bp)\b/i;
    const directives = /^(\.(word|zero|blkw|fill|string|asciz|stringz|space|start|global|globl|extern|org|orig))\b/;
    const labels = /^([a-zA-Z_$@][a-zA-Z0-9_$@]*:)/;
    const numbers = /^(0x[0-9a-f]+|0b[01]+|-?[0-9]+)\b/i;
    const comments = /^(;.*)/;

    return {
      startState: function() {
        return {
          context: 0
        };
      },

      token: function(stream, state) {
        if (stream.eatSpace()) return null;

        // Comments
        if (stream.match(comments)) {
          return "comment";
        }

        // Labels
        if (stream.match(labels)) {
          return "def";
        }

        // Instructions
        if (stream.match(instructions)) {
          return "keyword";
        }

        // Directives
        if (stream.match(directives)) {
          return "builtin";
        }

        // Registers
        if (stream.match(registers)) {
          return "variable-2";
        }

        // Numbers (hex, binary, decimal)
        if (stream.match(numbers)) {
          return "number";
        }

        // Strings
        if (stream.match(/^"([^"]|\\")*"/)) {
          return "string";
        }

        // Characters
        if (stream.match(/^'([^']|\\')*'/)) {
          return "string-2";
        }

        // Catch-all for other tokens
        stream.next();
        return null;
      }
    };
  });

  CodeMirror.defineMIME("text/x-lcc", "lcc");
});

// LCC Linter for CodeMirror
class LccLinter {
  constructor(editor) {
    this.editor = editor;
    this.diagnostics = [];
    this.enableErrorChecking = true;
    this.enableWarningChecking = true;
    this.enableInfoChecking = true;
  }

  lint() {
    if (!this.editor) return;
    
    this.clearDiagnostics();
    
    // In a real implementation, we would check the code against rules
    // For now, we'll just clear any existing diagnostics
    this.diagnostics = [];
    
    this.displayDiagnostics();
  }

  clearDiagnostics() {
    this.editor.operation(() => {
      this.editor.getAllMarks().forEach(mark => mark.clear());
    });
  }

  displayDiagnostics() {
    this.editor.operation(() => {
      this.diagnostics.forEach(diagnostic => {
        const marker = this.editor.markText(
          diagnostic.from,
          diagnostic.to,
          {
            className: `diagnostic diagnostic-${diagnostic.severity}`,
            title: diagnostic.message
          }
        );
      });
    });
  }

  toggleErrorChecking() {
    this.enableErrorChecking = !this.enableErrorChecking;
    this.lint();
  }

  toggleWarningChecking() {
    this.enableWarningChecking = !this.enableWarningChecking;
    this.lint();
  }

  toggleInfoChecking() {
    this.enableInfoChecking = !this.enableInfoChecking;
    this.lint();
  }
}

// Hover information provider for LCC
class LccHoverProvider {
  constructor(editor) {
    this.editor = editor;
    this.tooltip = null;
    this.hoverTimeout = null;
    this.hoverDelay = 500; // Delay in milliseconds before showing tooltip
      // Information from the LCC Reference
    this.assemblyInfo = {
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
        explanation: "Loads the effective address of a label into a register.",
        flags_set: "",
        binary_format: "1110 dr pcoffset9"
      },
      "br": {
        descriptive_name: "Branch",
        description: "PC = PC + offset (always)",
        syntax: "br label",
        explanation: "Unconditional branch to the specified label.",
        flags_set: "",
        binary_format: "0000 111 pcoffset9"
      },
      "brz": {
        descriptive_name: "Branch if Zero",
        description: "PC = PC + offset if Z=1",
        syntax: "brz label", 
        explanation: "Branches to label if the zero flag is set.",
        flags_set: "",
        binary_format: "0000 000 pcoffset9"
      },
      "brn": {
        descriptive_name: "Branch if Negative",
        description: "PC = PC + offset if N=1",
        syntax: "brn label",
        explanation: "Branches to label if the negative flag is set.",
        flags_set: "",
        binary_format: "0000 010 pcoffset9"
      },
      "brp": {
        descriptive_name: "Branch if Positive",
        description: "PC = PC + offset if N=Z",
        syntax: "brp label",
        explanation: "Branches to label if the result is positive (N=Z).",
        flags_set: "",
        binary_format: "0000 011 pcoffset9"
      },
      "jmp": {
        descriptive_name: "Jump",
        description: "PC = baser + offset",
        syntax: "jmp baser, offset",
        explanation: "Unconditional jump to address calculated from base register plus offset.",
        flags_set: "",
        binary_format: "1100 000 baser offset6"
      },
      "jsr": {
        descriptive_name: "Jump to Subroutine",
        description: "LR = PC; PC = PC + offset",
        syntax: "jsr label",
        explanation: "Saves return address in link register and jumps to subroutine.",
        flags_set: "",
        binary_format: "0100 1 pcoffset11"
      },
      "ret": {
        descriptive_name: "Return",
        description: "PC = LR + offset",
        syntax: "ret",
        explanation: "Returns from subroutine using link register.",
        flags_set: "",
        binary_format: "1100 000 111 offset6"
      },
      "halt": {
        descriptive_name: "Halt",
        description: "Stop execution",
        syntax: "halt",
        explanation: "Stops program execution and halts the processor.",
        flags_set: "",
        binary_format: "1111 000 0 00000000"
      },
      "nl": {
        descriptive_name: "Newline",
        description: "Output newline character",
        syntax: "nl",
        explanation: "Outputs a newline character to the terminal.",
        flags_set: "",
        binary_format: "1111 000 0 00000001"
      },
      "dout": {
        descriptive_name: "Decimal Output",
        description: "Display signed number (decimal)",
        syntax: "dout sr",
        explanation: "Displays the value in the source register as a signed decimal number.",
        flags_set: "",
        binary_format: "1111 sr 0 00000010"
      },
      "hout": {
        descriptive_name: "Hexadecimal Output", 
        description: "Display number (hex)",
        syntax: "hout sr",
        explanation: "Displays the value in the source register as a hexadecimal number.",
        flags_set: "",
        binary_format: "1111 sr 0 00000100"
      },
      "aout": {
        descriptive_name: "ASCII Output",
        description: "Display ASCII character",
        syntax: "aout sr", 
        explanation: "Displays the value in the source register as an ASCII character.",
        flags_set: "",
        binary_format: "1111 sr 0 00000101"
      },
      "sout": {
        descriptive_name: "String Output",
        description: "Display null-terminated string",
        syntax: "sout sr",
        explanation: "Displays the null-terminated string starting at the address in the source register.",
        flags_set: "",
        binary_format: "1111 sr 0 00000110"
      },
      "din": {
        descriptive_name: "Decimal Input",
        description: "Read decimal into dr",
        syntax: "din dr",
        explanation: "Reads a decimal number from input and stores it in the destination register.",
        flags_set: "",
        binary_format: "1111 dr 0 00000111"
      },
      "sin": {
        descriptive_name: "String Input",
        description: "Read string into buffer",
        syntax: "sin sr",
        explanation: "Reads a string from input into the buffer pointed to by the source register.",
        flags_set: "",
        binary_format: "1111 sr 0 00001010"
      },
      ".word": {
        descriptive_name: "Word Directive",
        description: "Create one word initialized to value",
        syntax: ".word value",
        explanation: "Assembler directive that reserves one word of memory and initializes it to the specified value.",
        flags_set: "",
        binary_format: "N/A - Assembler directive"
      },
      ".zero": {
        descriptive_name: "Zero Directive",
        description: "Block of N words initialized to zero", 
        syntax: ".zero N",
        explanation: "Assembler directive that reserves N words of memory and initializes them to zero.",
        flags_set: "",
        binary_format: "N/A - Assembler directive"
      },
      ".string": {
        descriptive_name: "String Directive",
        description: "Null-terminated ASCII string",
        syntax: ".string \"text\"",
        explanation: "Assembler directive that stores a null-terminated ASCII string in memory.",
        flags_set: "",
        binary_format: "N/A - Assembler directive"
      }
    };
    
    // Set up event listeners
    this.setupEventListeners();
  }
  setupEventListeners() {
    // Get the editor wrapper element
    const wrapper = this.editor.getWrapperElement();
    
    // Store bound handlers for easy removal if needed
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    this.boundHandleMouseOut = this.handleMouseOut.bind(this);
    this.boundHideTooltip = this.hideTooltip.bind(this);
    
    // Add event listeners
    wrapper.addEventListener('mousemove', this.boundHandleMouseMove);
    wrapper.addEventListener('mouseover', this.boundHandleMouseMove);
    wrapper.addEventListener('mouseout', this.boundHandleMouseOut);
    wrapper.addEventListener('mouseleave', this.boundHandleMouseOut);
    
    // Also listen for scroll and resize events to hide tooltip
    wrapper.addEventListener('scroll', this.boundHideTooltip);
    window.addEventListener('resize', this.boundHideTooltip);
    
    // Add event listener to editor's scrollbar
    const scrollElement = wrapper.querySelector('.CodeMirror-vscrollbar');
    if (scrollElement) {
      scrollElement.addEventListener('scroll', this.boundHideTooltip);
    }
    
    // Listen for cursor activity to hide tooltip when typing
    this.editor.on('cursorActivity', this.boundHideTooltip);
  }
    handleMouseMove(event) {
    // Clear any existing timeout
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
    
    // Get the position of the mouse in the editor
    const pos = this.editor.coordsChar({
      left: event.clientX,
      top: event.clientY
    });
    
    // Check if we have a valid position
    if (!pos || pos.line < 0 || typeof pos.ch !== 'number') {
      this.hideTooltip();
      return;
    }
    
    // Store the current position for the timeout
    const currentPos = {line: pos.line, ch: pos.ch};
    
    // Set a timeout to show the tooltip after a delay
    this.hoverTimeout = setTimeout(() => {
      this.showTooltip(currentPos, event);
    }, this.hoverDelay);
  }
  
  handleMouseOut() {
    // Clear any existing timeout
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
    
    // Hide the tooltip
    this.hideTooltip();
  }  showTooltip(pos, event) {
    try {
      // Get the token at the current position
      const token = this.editor.getTokenAt(pos);
      
      // If there's no token, return
      if (!token || !token.string || token.string.trim() === '') {
        this.hideTooltip();
        return;
      }
      
      // Check if the token is a keyword (instruction) or a directive
      const isKeyword = token.type === 'keyword';
      const isDirective = token.type === 'builtin';
      
      if (!isKeyword && !isDirective) {
        this.hideTooltip();
        return;
      }
      
      // Get the instruction from the token
      let instruction = token.string.toLowerCase().trim();
      
      // Handle directives - removing the dot if present
      if (isDirective && instruction.startsWith('.')) {
        instruction = instruction.substring(1);
      }
      
      // If there's no information for this instruction, return
      if (!this.assemblyInfo[instruction]) {
        this.hideTooltip();
        return;
      }
      
      // Get the information for this instruction
      const info = this.assemblyInfo[instruction];
      
      // Create the tooltip content
      const content = `
        <div class="hover-title">${info.descriptive_name}</div>
        <div class="hover-syntax"><code>${info.syntax}</code></div>
        <div class="hover-description">${info.description}</div>
        <div class="hover-explanation">${info.explanation}</div>
        ${info.flags_set ? `<div class="hover-flags"><strong>Flags set:</strong> ${info.flags_set.toUpperCase()}</div>` : ''}
        <div class="hover-binary"><strong>Binary format:</strong> <code>${info.binary_format}</code></div>
      `;
      
      // Create or update the tooltip
      if (!this.tooltip) {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'lcc-tooltip';
        document.body.appendChild(this.tooltip);
      }
      
      // Set the tooltip content
      this.tooltip.innerHTML = content;
      
      // Get accurate coordinates for positioning
      const coords = this.editor.charCoords(pos, 'window');
      
      // Calculate position, making sure tooltip doesn't go off screen
      let top = coords.bottom + 10;
      let left = coords.left;
      
      // Adjust if tooltip would go off the right edge
      if (left + 300 > window.innerWidth) {
        left = window.innerWidth - 320;
      }
      
      // Adjust if tooltip would go off the bottom edge
      if (top + 200 > window.innerHeight) {
        top = coords.top - 210;
      }
      
      // Ensure minimum values to prevent negative positioning
      top = Math.max(10, top);
      left = Math.max(10, left);
      
      this.tooltip.style.top = `${top}px`;
      this.tooltip.style.left = `${left}px`;
        // Show the tooltip with animation
      this.tooltip.style.display = 'block';
      
      // Use requestAnimationFrame for smooth appearance
      requestAnimationFrame(() => {
        // Add the showing class for additional animation
        this.tooltip.classList.add('showing');
        this.tooltip.style.opacity = '1';
        
        // Remove the showing class after animation completes
        setTimeout(() => {
          this.tooltip.classList.remove('showing');
        }, 300);
      });
    } catch (error) {
      console.error("Error showing tooltip:", error);
      this.hideTooltip();
    }
  }  hideTooltip() {
    if (this.tooltip) {
      // Fade out
      this.tooltip.style.opacity = '0';
      
      // Wait for fade out animation to complete before hiding
      setTimeout(() => {
        this.tooltip.style.display = 'none';
      }, 200);
    }
    
    // Clear any pending hover timeout
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
  }
  
  // Clean up event listeners and resources
  dispose() {
    try {
      // Get the editor wrapper element
      const wrapper = this.editor.getWrapperElement();
      
      // Remove event listeners
      if (this.boundHandleMouseMove) {
        wrapper.removeEventListener('mousemove', this.boundHandleMouseMove);
        wrapper.removeEventListener('mouseover', this.boundHandleMouseMove);
      }
      
      if (this.boundHandleMouseOut) {
        wrapper.removeEventListener('mouseout', this.boundHandleMouseOut);
        wrapper.removeEventListener('mouseleave', this.boundHandleMouseOut);
      }
      
      if (this.boundHideTooltip) {
        wrapper.removeEventListener('scroll', this.boundHideTooltip);
        window.removeEventListener('resize', this.boundHideTooltip);
        
        const scrollElement = wrapper.querySelector('.CodeMirror-vscrollbar');
        if (scrollElement) {
          scrollElement.removeEventListener('scroll', this.boundHideTooltip);
        }
        
        this.editor.off('cursorActivity', this.boundHideTooltip);
      }
      
      // Remove tooltip element
      if (this.tooltip && this.tooltip.parentNode) {
        this.tooltip.parentNode.removeChild(this.tooltip);
        this.tooltip = null;
      }
      
      // Clear any pending timeout
      if (this.hoverTimeout) {
        clearTimeout(this.hoverTimeout);
        this.hoverTimeout = null;
      }
    } catch (error) {
      console.error("Error disposing hover provider:", error);
    }
  }
}

// Export the classes for use in main.js
export { LccLinter, LccHoverProvider };
