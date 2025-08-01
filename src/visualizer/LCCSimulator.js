/**
 * LCC Simulator for Browser Visualizer
 * A simplified but accurate LCC interpreter designed for step-by-step visualization
 * Implements the full LCC instruction set
 */

class LCCSimulator {
  constructor() {
    // Machine state
    this.mem = new Uint16Array(65536);
    this.r = new Uint16Array(8);
    this.pc = 0x3000;
    this.ir = 0;
    this.n = 0;
    this.z = 0;
    this.c = 0;
    this.v = 0;
    this.running = true;
    this.output = '';
    
    // Execution tracking
    this.instructionsExecuted = 0;
    this.memoryAccesses = new Set();
    
    // Symbol table from assembly
    this.symbols = {};
    this.sourceMap = new Map(); // PC -> source line
    
    // Initialize SP and FP
    this.r[6] = 0xFFF0; // SP
    this.r[5] = 0xFFF0; // FP
  }

  /**
   * Load machine code into memory
   */
  loadProgram(machineCode, loadAddress = 0x3000) {
    this.pc = loadAddress;
    for (let i = 0; i < machineCode.length; i++) {
      this.mem[loadAddress + i] = machineCode[i];
      this.memoryAccesses.add(loadAddress + i);
    }
  }

  /**
   * Execute one instruction
   */
  step() {
    if (!this.running) return { success: false, halted: true };
    
    // Fetch
    this.ir = this.mem[this.pc];
    this.memoryAccesses.add(this.pc);
    const currentPC = this.pc;
    this.pc = (this.pc + 1) & 0xFFFF;
    
    // Decode
    const opcode = (this.ir >> 12) & 0xF;
    const dr = (this.ir >> 9) & 0x7;
    const sr1 = (this.ir >> 6) & 0x7;
    const sr2 = this.ir & 0x7;
    const bit5 = (this.ir >> 5) & 0x1;
    const bit11 = (this.ir >> 11) & 0x1;
    const imm5 = this.signExtend(this.ir & 0x1F, 5);
    const pcoffset9 = this.signExtend(this.ir & 0x1FF, 9);
    const pcoffset11 = this.signExtend(this.ir & 0x7FF, 11);
    const offset6 = this.signExtend(this.ir & 0x3F, 6);
    const trapvec = this.ir & 0xFF;
    
    // Execute
    try {
      switch (opcode) {
        case 0x0: this.executeBR(dr, pcoffset9); break;
        case 0x1: this.executeADD(dr, sr1, bit5, sr2, imm5); break;
        case 0x2: this.executeLD(dr, pcoffset9); break;
        case 0x3: this.executeST(dr, pcoffset9); break;
        case 0x4: this.executeBL(bit11, pcoffset11, dr, offset6); break;
        case 0x5: this.executeAND(dr, sr1, bit5, sr2, imm5); break;
        case 0x6: this.executeLDR(dr, sr1, offset6); break;
        case 0x7: this.executeSTR(dr, sr1, offset6); break;
        case 0x8: this.executeCMP(sr1, bit5, sr2, imm5); break;
        case 0x9: this.executeNOT(dr, sr1); break;
        case 0xA: this.executeExtended(dr, sr1, sr2, this.ir & 0x3F); break;
        case 0xB: this.executeSUB(dr, sr1, bit5, sr2, imm5); break;
        case 0xC: this.executeJMP(sr1, offset6); break;
        case 0xD: this.executeMVI(dr, pcoffset9); break;
        case 0xE: this.executeLEA(dr, pcoffset9); break;
        case 0xF: this.executeTRAP(dr, trapvec); break;
        default:
          throw new Error(`Unknown opcode: ${opcode.toString(16)}`);
      }
      
      this.instructionsExecuted++;
      
      return {
        success: true,
        instruction: this.decodeInstruction(this.ir),
        pc: currentPC
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // BR - Branch
  executeBR(cc, pcoffset9) {
    let takeBranch = false;
    
    switch (cc) {
      case 0: takeBranch = this.z === 1; break; // BRZ
      case 1: takeBranch = this.z === 0; break; // BRNZ
      case 2: takeBranch = this.n === 1; break; // BRN
      case 3: takeBranch = this.n === 0 && this.z === 0; break; // BRP
      case 4: takeBranch = this.n !== this.v; break; // BRLT
      case 5: takeBranch = this.n === this.v && this.z === 0; break; // BRGT
      case 6: takeBranch = this.c === 1; break; // BRC
      case 7: takeBranch = true; break; // BR (always)
    }
    
    if (takeBranch) {
      this.pc = (this.pc + pcoffset9) & 0xFFFF;
    }
  }

  // ADD
  executeADD(dr, sr1, bit5, sr2, imm5) {
    const val1 = this.r[sr1];
    const val2 = bit5 ? imm5 : this.r[sr2];
    const result = val1 + val2;
    
    this.r[dr] = result & 0xFFFF;
    this.setFlags(result);
    this.setCarryOverflow(val1, val2, result, false);
  }

  // LD - Load
  executeLD(dr, pcoffset9) {
    const addr = (this.pc + pcoffset9) & 0xFFFF;
    this.r[dr] = this.mem[addr];
    this.memoryAccesses.add(addr);
  }

  // ST - Store
  executeST(sr, pcoffset9) {
    const addr = (this.pc + pcoffset9) & 0xFFFF;
    this.mem[addr] = this.r[sr];
    this.memoryAccesses.add(addr);
  }

  // BL/BLR - Branch and Link
  executeBL(bit11, pcoffset11, baser, offset6) {
    this.r[7] = this.pc; // Save return address in LR
    
    if (bit11) {
      // BL - PC-relative
      this.pc = (this.pc + pcoffset11) & 0xFFFF;
    } else {
      // BLR - Register-relative
      this.pc = (this.r[baser] + offset6) & 0xFFFF;
    }
  }

  // AND
  executeAND(dr, sr1, bit5, sr2, imm5) {
    const val1 = this.r[sr1];
    const val2 = bit5 ? imm5 : this.r[sr2];
    const result = val1 & val2;
    
    this.r[dr] = result;
    this.setNZ(result);
  }

  // LDR - Load Register
  executeLDR(dr, baser, offset6) {
    const addr = (this.r[baser] + offset6) & 0xFFFF;
    this.r[dr] = this.mem[addr];
    this.memoryAccesses.add(addr);
  }

  // STR - Store Register
  executeSTR(sr, baser, offset6) {
    const addr = (this.r[baser] + offset6) & 0xFFFF;
    this.mem[addr] = this.r[sr];
    this.memoryAccesses.add(addr);
  }

  // CMP - Compare
  executeCMP(sr1, bit5, sr2, imm5) {
    const val1 = this.r[sr1];
    const val2 = bit5 ? imm5 : this.r[sr2];
    const result = val1 - val2;
    
    this.setFlags(result);
    this.setCarryOverflow(val1, val2, result, true);
  }

  // NOT
  executeNOT(dr, sr) {
    const result = (~this.r[sr]) & 0xFFFF;
    this.r[dr] = result;
    this.setNZ(result);
  }

  // Extended opcodes (MUL, DIV, etc.)
  executeExtended(dr, sr1, sr2, func) {
    switch (func) {
      case 0x07: // MUL
        const mulResult = this.toSigned16(this.r[dr]) * this.toSigned16(this.r[sr1]);
        this.r[dr] = mulResult & 0xFFFF;
        this.setNZ(this.r[dr]);
        break;
      
      case 0x08: // DIV
        const dividend = this.toSigned16(this.r[dr]);
        const divisor = this.toSigned16(this.r[sr1]);
        if (divisor === 0) {
          throw new Error('Division by zero');
        }
        this.r[dr] = Math.trunc(dividend / divisor) & 0xFFFF;
        this.setNZ(this.r[dr]);
        break;
      
      case 0x0C: // OR
        this.r[dr] = (this.r[dr] | this.r[sr1]) & 0xFFFF;
        this.setNZ(this.r[dr]);
        break;
      
      case 0x0D: // XOR
        this.r[dr] = (this.r[dr] ^ this.r[sr1]) & 0xFFFF;
        this.setNZ(this.r[dr]);
        break;
      
      case 0x10: // PUSH
        this.r[6] = (this.r[6] - 1) & 0xFFFF;
        this.mem[this.r[6]] = this.r[sr1];
        this.memoryAccesses.add(this.r[6]);
        break;
      
      case 0x11: // POP
        this.r[dr] = this.mem[this.r[6]];
        this.memoryAccesses.add(this.r[6]);
        this.r[6] = (this.r[6] + 1) & 0xFFFF;
        this.setNZ(this.r[dr]);
        break;
      
      default:
        throw new Error(`Unknown extended opcode: ${func.toString(16)}`);
    }
  }

  // SUB
  executeSUB(dr, sr1, bit5, sr2, imm5) {
    const val1 = this.r[sr1];
    const val2 = bit5 ? imm5 : this.r[sr2];
    const result = val1 - val2;
    
    this.r[dr] = result & 0xFFFF;
    this.setFlags(result);
    this.setCarryOverflow(val1, val2, result, true);
  }

  // JMP/RET
  executeJMP(baser, offset6) {
    this.pc = (this.r[baser] + offset6) & 0xFFFF;
  }

  // MVI - Move Immediate
  executeMVI(dr, imm9) {
    this.r[dr] = imm9 & 0x1FF;
  }

  // LEA - Load Effective Address
  executeLEA(dr, pcoffset9) {
    this.r[dr] = (this.pc + pcoffset9) & 0xFFFF;
  }

  // TRAP instructions
  executeTRAP(dr, trapvec) {
    switch (trapvec) {
      case 0x00: // HALT
        this.running = false;
        break;
      
      case 0x01: // NL
        this.output += '\n';
        break;
      
      case 0x02: // DOUT
        const val = this.toSigned16(this.r[dr]);
        this.output += val.toString();
        break;
      
      case 0x03: // UDOUT
        this.output += this.r[dr].toString();
        break;
      
      case 0x04: // HOUT
        this.output += this.r[dr].toString(16).toUpperCase().padStart(4, '0');
        break;
      
      case 0x05: // AOUT
        this.output += String.fromCharCode(this.r[dr] & 0xFF);
        break;
      
      case 0x06: // SOUT
        let addr = this.r[dr];
        while (this.mem[addr] !== 0 && addr < 0x10000) {
          this.output += String.fromCharCode(this.mem[addr] & 0xFF);
          this.memoryAccesses.add(addr);
          addr++;
        }
        break;
      
      case 0x0B: // M (display memory)
      case 0x0C: // R (display registers)
      case 0x0D: // S (display stack)
      case 0x0E: // BP (breakpoint)
        // These are debugging instructions - handle in visualizer
        break;
      
      default:
        // Input instructions would need special handling
        break;
    }
  }

  // Helper methods
  signExtend(value, bits) {
    const sign = (value >> (bits - 1)) & 1;
    if (sign) {
      return value | (0xFFFF << bits);
    }
    return value;
  }

  toSigned16(value) {
    if (value & 0x8000) {
      return value - 0x10000;
    }
    return value;
  }

  setNZ(result) {
    this.n = (result & 0x8000) ? 1 : 0;
    this.z = (result & 0xFFFF) === 0 ? 1 : 0;
  }

  setFlags(result) {
    this.setNZ(result);
  }

  setCarryOverflow(a, b, result, isSub) {
    // Simplified carry/overflow detection
    if (isSub) {
      this.c = (a < b) ? 1 : 0;
    } else {
      this.c = (result > 0xFFFF) ? 1 : 0;
    }
    
    // Overflow detection
    const signA = (a >> 15) & 1;
    const signB = (b >> 15) & 1;
    const signR = (result >> 15) & 1;
    
    if (isSub) {
      this.v = (signA !== signB && signA !== signR) ? 1 : 0;
    } else {
      this.v = (signA === signB && signA !== signR) ? 1 : 0;
    }
  }

  decodeInstruction(ir) {
    const opcode = (ir >> 12) & 0xF;
    const opcodeNames = [
      'BR', 'ADD', 'LD', 'ST', 'BL', 'AND', 'LDR', 'STR',
      'CMP', 'NOT', 'EXT', 'SUB', 'JMP', 'MVI', 'LEA', 'TRAP'
    ];
    
    return {
      opcode: opcodeNames[opcode] || 'UNKNOWN',
      raw: ir.toString(16).padStart(4, '0').toUpperCase()
    };
  }

  getState() {
    return {
      registers: {
        r0: this.r[0], r1: this.r[1], r2: this.r[2], r3: this.r[3],
        r4: this.r[4], r5: this.r[5], r6: this.r[6], r7: this.r[7],
        pc: this.pc, ir: this.ir,
        sp: this.r[6], fp: this.r[5], lr: this.r[7]
      },
      flags: {
        n: this.n, z: this.z, c: this.c, v: this.v
      },
      memory: this.getVisibleMemory(),
      stack: this.getStack(),
      output: this.output,
      running: this.running,
      instructionsExecuted: this.instructionsExecuted
    };
  }

  getVisibleMemory() {
    const memory = {};
    
    // Include all accessed memory
    for (const addr of this.memoryAccesses) {
      memory[addr] = this.mem[addr];
    }
    
    // Include stack region
    const sp = this.r[6];
    for (let addr = sp; addr < 0xFFF0 && addr < sp + 32; addr++) {
      memory[addr] = this.mem[addr];
    }
    
    return memory;
  }

  getStack() {
    const stack = [];
    const sp = this.r[6];
    
    for (let addr = sp; addr < 0xFFF0; addr++) {
      stack.push({
        address: addr,
        value: this.mem[addr]
      });
    }
    
    return stack;
  }
}

export default LCCSimulator;