/**
 * LCC Assembler for Browser Visualizer
 * A simplified assembler that handles the most common LCC instructions
 * Designed to work in the browser without file system access
 */

class LCCAssembler {
  constructor() {
    this.symbols = {};
    this.instructions = [];
    this.directives = [];
    this.currentAddress = 0x3000;
    this.loadAddress = 0x3000;
    this.errors = [];
    this.sourceMap = new Map();
  }

  /**
   * Assemble source code into machine code
   */
  assemble(sourceCode) {
    this.reset();
    
    const lines = sourceCode.split('\n');
    
    // First pass - collect labels and directives
    this.firstPass(lines);
    
    if (this.errors.length > 0) {
      return { success: false, errors: this.errors };
    }
    
    // Second pass - generate machine code
    const machineCode = this.secondPass(lines);
    
    if (this.errors.length > 0) {
      return { success: false, errors: this.errors };
    }
    
    return {
      success: true,
      machineCode,
      symbols: this.symbols,
      sourceMap: this.sourceMap,
      loadAddress: this.loadAddress
    };
  }

  reset() {
    this.symbols = {};
    this.instructions = [];
    this.directives = [];
    this.currentAddress = 0x3000;
    this.loadAddress = 0x3000;
    this.errors = [];
    this.sourceMap.clear();
  }

  firstPass(lines) {
    let address = this.loadAddress;
    
    lines.forEach((line, lineNum) => {
      const processed = this.processLine(line);
      if (!processed) return;
      
      if (processed.label) {
        if (this.symbols[processed.label]) {
          this.errors.push(`Line ${lineNum + 1}: Duplicate label '${processed.label}'`);
        } else {
          this.symbols[processed.label] = address;
        }
      }
      
      if (processed.directive) {
        this.handleDirective(processed.directive, processed.operands, address, lineNum);
      } else if (processed.instruction) {
        address++;
      }
    });
  }

  secondPass(lines) {
    const machineCode = [];
    let address = this.loadAddress;
    
    lines.forEach((line, lineNum) => {
      const processed = this.processLine(line);
      if (!processed || !processed.instruction) return;
      
      const opcode = this.assembleInstruction(
        processed.instruction, 
        processed.operands, 
        address, 
        lineNum
      );
      
      if (opcode !== null) {
        machineCode.push(opcode);
        this.sourceMap.set(address, lineNum);
        address++;
      }
    });
    
    return machineCode;
  }

  processLine(line) {
    // Remove comments
    const commentIndex = line.indexOf(';');
    if (commentIndex >= 0) {
      line = line.substring(0, commentIndex);
    }
    
    line = line.trim();
    if (!line) return null;
    
    // Check for label
    let label = null;
    const colonIndex = line.indexOf(':');
    if (colonIndex >= 0) {
      label = line.substring(0, colonIndex).trim();
      line = line.substring(colonIndex + 1).trim();
    }
    
    if (!line) return { label };
    
    // Parse instruction/directive
    const parts = line.split(/\s+/);
    const mnemonic = parts[0].toLowerCase();
    
    // Check if it's a directive
    if (mnemonic.startsWith('.')) {
      return {
        label,
        directive: mnemonic,
        operands: parts.slice(1).join(' ')
      };
    }
    
    // Parse operands
    const operandStr = parts.slice(1).join(' ');
    const operands = this.parseOperands(operandStr);
    
    return {
      label,
      instruction: mnemonic,
      operands
    };
  }

  parseOperands(operandStr) {
    if (!operandStr) return [];
    
    // Split by comma but preserve strings
    const operands = [];
    let current = '';
    let inString = false;
    
    for (let i = 0; i < operandStr.length; i++) {
      const char = operandStr[i];
      
      if (char === '"' || char === "'") {
        inString = !inString;
        current += char;
      } else if (char === ',' && !inString) {
        operands.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    if (current) {
      operands.push(current.trim());
    }
    
    return operands;
  }

  handleDirective(directive, operandStr, address, lineNum) {
    switch (directive) {
      case '.orig':
        const orig = this.parseImmediate(operandStr);
        if (orig !== null) {
          this.loadAddress = orig;
          this.currentAddress = orig;
        }
        break;
      
      case '.word':
      case '.fill':
        // These generate one word of data
        break;
      
      case '.string':
      case '.stringz':
        // String directives - count characters + null terminator
        break;
      
      case '.zero':
      case '.blkw':
        // Reserve space
        const count = this.parseImmediate(operandStr);
        if (count !== null) {
          // Reserve count words
        }
        break;
    }
  }

  assembleInstruction(mnemonic, operands, address, lineNum) {
    try {
      switch (mnemonic) {
        // Branch instructions
        case 'br':
        case 'bral':
          return this.assembleBR(7, operands, address);
        case 'brz':
        case 'bre':
          return this.assembleBR(0, operands, address);
        case 'brnz':
        case 'brne':
          return this.assembleBR(1, operands, address);
        case 'brn':
          return this.assembleBR(2, operands, address);
        case 'brp':
          return this.assembleBR(3, operands, address);
        case 'brlt':
          return this.assembleBR(4, operands, address);
        case 'brgt':
          return this.assembleBR(5, operands, address);
        case 'brc':
        case 'brb':
          return this.assembleBR(6, operands, address);
        
        // Arithmetic
        case 'add':
          return this.assembleADD(operands);
        case 'sub':
          return this.assembleSUB(operands);
        case 'mul':
          return this.assembleMUL(operands);
        case 'div':
          return this.assembleDIV(operands);
        
        // Logical
        case 'and':
          return this.assembleAND(operands);
        case 'or':
          return this.assembleOR(operands);
        case 'xor':
          return this.assembleXOR(operands);
        case 'not':
          return this.assembleNOT(operands);
        
        // Memory
        case 'ld':
          return this.assembleLD(operands, address);
        case 'st':
          return this.assembleST(operands, address);
        case 'ldr':
          return this.assembleLDR(operands);
        case 'str':
          return this.assembleSTR(operands);
        case 'lea':
          return this.assembleLEA(operands, address);
        
        // Control
        case 'jmp':
          return this.assembleJMP(operands);
        case 'bl':
        case 'jsr':
          return this.assembleBL(operands, address);
        case 'blr':
        case 'jsrr':
          return this.assembleBLR(operands);
        case 'ret':
          return this.assembleRET();
        
        // Stack
        case 'push':
          return this.assemblePUSH(operands);
        case 'pop':
          return this.assemblePOP(operands);
        
        // Compare
        case 'cmp':
          return this.assembleCMP(operands);
        
        // I/O
        case 'halt':
          return 0xF000;
        case 'nl':
          return 0xF001;
        case 'dout':
          return 0xF002 | (this.parseRegister(operands[0]) << 9);
        case 'udout':
          return 0xF003 | (this.parseRegister(operands[0]) << 9);
        case 'hout':
          return 0xF004 | (this.parseRegister(operands[0]) << 9);
        case 'aout':
          return 0xF005 | (this.parseRegister(operands[0]) << 9);
        case 'sout':
          return 0xF006 | (this.parseRegister(operands[0]) << 9);
        
        default:
          this.errors.push(`Line ${lineNum + 1}: Unknown instruction '${mnemonic}'`);
          return null;
      }
    } catch (error) {
      this.errors.push(`Line ${lineNum + 1}: ${error.message}`);
      return null;
    }
  }

  // Instruction assemblers
  assembleBR(cc, operands, address) {
    const offset = this.resolveAddress(operands[0], address);
    return 0x0000 | (cc << 9) | (offset & 0x1FF);
  }

  assembleADD(operands) {
    const dr = this.parseRegister(operands[0]);
    const sr1 = this.parseRegister(operands[1]);
    
    if (operands[2].match(/^r\d$/i)) {
      const sr2 = this.parseRegister(operands[2]);
      return 0x1000 | (dr << 9) | (sr1 << 6) | sr2;
    } else {
      const imm5 = this.parseImmediate(operands[2]) & 0x1F;
      return 0x1020 | (dr << 9) | (sr1 << 6) | imm5;
    }
  }

  assembleSUB(operands) {
    const dr = this.parseRegister(operands[0]);
    const sr1 = this.parseRegister(operands[1]);
    
    if (operands[2].match(/^r\d$/i)) {
      const sr2 = this.parseRegister(operands[2]);
      return 0xB000 | (dr << 9) | (sr1 << 6) | sr2;
    } else {
      const imm5 = this.parseImmediate(operands[2]) & 0x1F;
      return 0xB020 | (dr << 9) | (sr1 << 6) | imm5;
    }
  }

  assembleAND(operands) {
    const dr = this.parseRegister(operands[0]);
    const sr1 = this.parseRegister(operands[1]);
    
    if (operands[2].match(/^r\d$/i)) {
      const sr2 = this.parseRegister(operands[2]);
      return 0x5000 | (dr << 9) | (sr1 << 6) | sr2;
    } else {
      const imm5 = this.parseImmediate(operands[2]) & 0x1F;
      return 0x5020 | (dr << 9) | (sr1 << 6) | imm5;
    }
  }

  assembleLD(operands, address) {
    const dr = this.parseRegister(operands[0]);
    const offset = this.resolveAddress(operands[1], address);
    return 0x2000 | (dr << 9) | (offset & 0x1FF);
  }

  assembleST(operands, address) {
    const sr = this.parseRegister(operands[0]);
    const offset = this.resolveAddress(operands[1], address);
    return 0x3000 | (sr << 9) | (offset & 0x1FF);
  }

  assembleLDR(operands) {
    const dr = this.parseRegister(operands[0]);
    const baser = this.parseRegister(operands[1]);
    const offset = operands[2] ? this.parseImmediate(operands[2]) : 0;
    return 0x6000 | (dr << 9) | (baser << 6) | (offset & 0x3F);
  }

  assembleSTR(operands) {
    const sr = this.parseRegister(operands[0]);
    const baser = this.parseRegister(operands[1]);
    const offset = operands[2] ? this.parseImmediate(operands[2]) : 0;
    return 0x7000 | (sr << 9) | (baser << 6) | (offset & 0x3F);
  }

  assembleLEA(operands, address) {
    const dr = this.parseRegister(operands[0]);
    const offset = this.resolveAddress(operands[1], address);
    return 0xE000 | (dr << 9) | (offset & 0x1FF);
  }

  assembleJMP(operands) {
    const baser = this.parseRegister(operands[0]);
    return 0xC000 | (baser << 6);
  }

  assembleBL(operands, address) {
    const offset = this.resolveAddress(operands[0], address);
    return 0x4800 | (offset & 0x7FF);
  }

  assembleBLR(operands) {
    const baser = this.parseRegister(operands[0]);
    const offset = operands[1] ? this.parseImmediate(operands[1]) : 0;
    return 0x4000 | (baser << 6) | (offset & 0x3F);
  }

  assembleRET() {
    return 0xC1C0; // JMP R7
  }

  assemblePUSH(operands) {
    const sr = this.parseRegister(operands[0]);
    return 0xA010 | (sr << 6);
  }

  assemblePOP(operands) {
    const dr = this.parseRegister(operands[0]);
    return 0xA011 | (dr << 9);
  }

  assembleCMP(operands) {
    const sr1 = this.parseRegister(operands[0]);
    
    if (operands[1].match(/^r\d$/i)) {
      const sr2 = this.parseRegister(operands[1]);
      return 0x8000 | (sr1 << 6) | sr2;
    } else {
      const imm5 = this.parseImmediate(operands[1]) & 0x1F;
      return 0x8020 | (sr1 << 6) | imm5;
    }
  }

  assembleMUL(operands) {
    const dr = this.parseRegister(operands[0]);
    const sr = this.parseRegister(operands[1]);
    return 0xA007 | (dr << 9) | (sr << 6);
  }

  assembleDIV(operands) {
    const dr = this.parseRegister(operands[0]);
    const sr = this.parseRegister(operands[1]);
    return 0xA008 | (dr << 9) | (sr << 6);
  }

  assembleOR(operands) {
    const dr = this.parseRegister(operands[0]);
    const sr = this.parseRegister(operands[1]);
    return 0xA00C | (dr << 9) | (sr << 6);
  }

  assembleXOR(operands) {
    const dr = this.parseRegister(operands[0]);
    const sr = this.parseRegister(operands[1]);
    return 0xA00D | (dr << 9) | (sr << 6);
  }

  assembleNOT(operands) {
    const dr = this.parseRegister(operands[0]);
    const sr = this.parseRegister(operands[1]);
    return 0x9000 | (dr << 9) | (sr << 6) | 0x3F;
  }

  // Helper methods
  parseRegister(operand) {
    if (!operand) throw new Error('Missing register operand');
    
    const match = operand.match(/^r(\d)$/i);
    if (!match) throw new Error(`Invalid register: ${operand}`);
    
    const regNum = parseInt(match[1]);
    if (regNum < 0 || regNum > 7) {
      throw new Error(`Register out of range: ${operand}`);
    }
    
    return regNum;
  }

  parseImmediate(operand) {
    if (!operand) return 0;
    
    // Hex number
    if (operand.startsWith('0x') || operand.startsWith('0X')) {
      return parseInt(operand, 16);
    }
    
    // Binary number
    if (operand.startsWith('0b') || operand.startsWith('0B')) {
      return parseInt(operand.substring(2), 2);
    }
    
    // Decimal number
    return parseInt(operand, 10);
  }

  resolveAddress(operand, currentAddress) {
    // Check if it's a label
    if (this.symbols[operand] !== undefined) {
      const targetAddress = this.symbols[operand];
      const offset = targetAddress - (currentAddress + 1);
      return offset;
    }
    
    // Otherwise parse as immediate
    const value = this.parseImmediate(operand);
    if (value === null) {
      throw new Error(`Undefined symbol: ${operand}`);
    }
    
    // If it looks like an address, calculate offset
    if (value >= 0x100) {
      return value - (currentAddress + 1);
    }
    
    return value;
  }
}

export default LCCAssembler;