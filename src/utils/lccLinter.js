/**
 * LCC Assembly Linter
 * Provides error, warning, and info diagnostics for LCC assembly code
 */

/**
 * Lint LCC assembly code
 * @param {string} code - The assembly code to lint
 * @returns {Array} Array of diagnostic messages
 */
export function lintLCCCode(code) {
  const diagnostics = [];
  const lines = code.split('\n');
  
  // Track defined labels
  const definedLabels = new Set();
  const usedLabels = new Set();
  const labelLines = new Map();
  
  // First pass: collect all labels
  lines.forEach((line, lineNum) => {
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith(';')) return;
    
    // Check for label definitions
    const labelMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*):$/);
    if (labelMatch) {
      const label = labelMatch[1];
      if (definedLabels.has(label)) {
        diagnostics.push({
          line: lineNum,
          column: 0,
          severity: 'error',
          message: `Duplicate label '${label}'`,
          source: 'lcc'
        });
      } else {
        definedLabels.add(label);
        labelLines.set(label, lineNum);
      }
    }
  });
  
  // Second pass: check instructions and references
  lines.forEach((line, lineNum) => {
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith(';')) return;
    
    // Skip label definitions
    if (trimmed.match(/^[a-zA-Z_][a-zA-Z0-9_]*:$/)) return;
    
    // Check instructions
    const instrMatch = trimmed.match(/^(\w+)(?:\s+(.*))?$/);
    if (instrMatch) {
      const [, instruction, operands] = instrMatch;
      const instr = instruction.toLowerCase();
      
      // Check for valid instructions
      const validInstructions = [
        'add', 'sub', 'mul', 'div', 'rem', 'and', 'or', 'xor', 'not',
        'mov', 'ld', 'st', 'lea', 'ldr', 'str', 'push', 'pop',
        'br', 'brz', 'brn', 'brp', 'brlt', 'brgt', 'brc', 'bral',
        'jmp', 'jsr', 'ret', 'bl', 'blr', 'cmp',
        'srl', 'sra', 'sll', 'rol', 'ror',
        'mvr', 'sext', 'mvi', 'halt', 'nl',
        'dout', 'udout', 'hout', 'aout', 'sout',
        'din', 'hin', 'ain', 'sin',
        'clear', 'sleep', 'nbain', 'cursor',
        'srand', 'rand', 'millis', 'resetc',
        'm', 'r', 's', 'bp'
      ];
      
      const directives = [
        '.word', '.fill', '.string', '.stringz', '.str', '.blkw',
        '.ascii', '.asciiz', '.byte', '.data', '.text',
        '.global', '.extern', '.export', '.import', '.include',
        '.org', '.equ', '.set', '.align', '.space', '.section'
      ];
      
      if (!validInstructions.includes(instr) && !directives.includes(`.${instr}`)) {
        diagnostics.push({
          line: lineNum,
          column: 0,
          severity: 'error',
          message: `Unknown instruction '${instruction}'`,
          source: 'lcc'
        });
      }
      
      // Check operands
      if (operands) {
        // Check for register operands
        const registerPattern = /\b(r[0-7]|sp|fp|lr)\b/gi;
        const registerMatches = operands.match(registerPattern);
        
        if (registerMatches) {
          registerMatches.forEach(reg => {
            const regLower = reg.toLowerCase();
            // Warning for using numbered registers instead of named ones
            if (regLower === 'r5' && operands.includes('r5')) {
              diagnostics.push({
                line: lineNum,
                column: line.indexOf(reg),
                severity: 'info',
                message: `Consider using 'fp' instead of 'r5'`,
                source: 'lcc'
              });
            }
            if (regLower === 'r6' && operands.includes('r6')) {
              diagnostics.push({
                line: lineNum,
                column: line.indexOf(reg),
                severity: 'info',
                message: `Consider using 'sp' instead of 'r6'`,
                source: 'lcc'
              });
            }
            if (regLower === 'r7' && operands.includes('r7')) {
              diagnostics.push({
                line: lineNum,
                column: line.indexOf(reg),
                severity: 'info',
                message: `Consider using 'lr' instead of 'r7'`,
                source: 'lcc'
              });
            }
          });
        }
        
        // Check for label references
        const labelRefPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
        let match;
        while ((match = labelRefPattern.exec(operands)) !== null) {
          const possibleLabel = match[1];
          // Skip if it's a register or instruction
          if (!possibleLabel.match(/^(r[0-7]|sp|fp|lr)$/i) && 
              !validInstructions.includes(possibleLabel.toLowerCase())) {
            usedLabels.add(possibleLabel);
          }
        }
      }
      
      // Check for missing halt
      if (lineNum === lines.length - 1 && !['halt', 'ret', 'br', 'jmp'].includes(instr)) {
        diagnostics.push({
          line: lineNum,
          column: 0,
          severity: 'warning',
          message: `Program may not terminate properly. Consider adding 'halt' instruction`,
          source: 'lcc'
        });
      }
    }
  });
  
  // Check for undefined labels
  usedLabels.forEach(label => {
    if (!definedLabels.has(label)) {
      // Find all uses of this label
      lines.forEach((line, lineNum) => {
        if (line.includes(label) && !line.trim().startsWith(';')) {
          diagnostics.push({
            line: lineNum,
            column: line.indexOf(label),
            severity: 'error',
            message: `Undefined label '${label}'`,
            source: 'lcc'
          });
        }
      });
    }
  });
  
  // Check for unused labels (info)
  definedLabels.forEach(label => {
    if (!usedLabels.has(label) && label !== 'main') {
      const lineNum = labelLines.get(label);
      diagnostics.push({
        line: lineNum,
        column: 0,
        severity: 'info',
        message: `Label '${label}' is defined but never used`,
        source: 'lcc'
      });
    }
  });
  
  return diagnostics;
}

/**
 * Get diagnostic decorations for CodeMirror
 * @param {Array} diagnostics - Array of diagnostic messages
 * @returns {Array} Array of CodeMirror decorations
 */
export function getDiagnosticDecorations(diagnostics) {
  return diagnostics.map(diag => ({
    from: diag.line * 100 + diag.column, // Approximate position
    to: diag.line * 100 + diag.column + 10,
    severity: diag.severity,
    message: diag.message
  }));
}