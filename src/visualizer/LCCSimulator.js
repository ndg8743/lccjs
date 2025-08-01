/**
 * LCC Simulator for Browser Visualizer
 * Enhanced version with step forward/backward capabilities
 * Integrates features from Charlie's interactive_interpreter.js
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
    this.inputBuffer = '';
    
    // Execution tracking
    this.instructionsExecuted = 0;
    this.memoryAccesses = new Set();
    this.maxStackSize = 0;
    this.spInitial = 0;
    this.memMax = 0;
    
    // Symbol table from assembly
    this.symbols = {};
    this.sourceMap = new Map(); // PC -> source line
    this.listing = []; // Array of listing entries from assembler
    
    // Debug and history features from interactive_interpreter.js
    this.debugMode = false;
    this.hasJumped = false;
    this.currentIteration = 0;
    this.snapshot = []; // History of all state changes
    this.memoryChange = { hasChanged: false, address: null, old: [], new: [] };
    
    // Initialize SP and FP
    this.r[6] = 0xFFF0; // SP
    this.r[5] = 0xFFF0; // FP
    this.spInitial = this.r[6];
  }

  /**
   * Load machine code into memory
   */
  loadProgram(machineCode, loadAddress = 0x3000, listing = []) {
    this.pc = loadAddress;
    this.listing = listing;
    for (let i = 0; i < machineCode.length; i++) {
      this.mem[loadAddress + i] = machineCode[i];
      this.memoryAccesses.add(loadAddress + i);
    }
    this.memMax = loadAddress + machineCode.length - 1;
    this.spInitial = this.r[6];
  }

  /**
   * Load from .bin or .hex file format
   */
  loadBinaryProgram(buffer, isBinary = true) {
    let offset = 0;
    
    if (!isBinary) {
      // Convert hex string to binary
      const hexString = buffer.toString().trim();
      const bytes = [];
      for (let i = 0; i < hexString.length; i += 2) {
        bytes.push(parseInt(hexString.substr(i, 2), 16));
      }
      buffer = Buffer.from(bytes);
    }
    
    // Check for 'o' signature
    if (buffer[offset] !== 0x6F) {
      throw new Error('Invalid binary file format');
    }
    offset++;
    
    // Read start address
    const startAddress = buffer.readUInt16LE(offset);
    offset += 2;
    
    // Skip header data until 'C' terminator
    while (offset < buffer.length && buffer[offset] !== 0x43) {
      offset++;
    }
    
    if (buffer[offset] !== 0x43) {
      throw new Error('Header termination character not found');
    }
    offset++;
    
    // Load machine code
    let memIndex = this.pc;
    while (offset + 1 < buffer.length) {
      const instruction = buffer.readUInt16LE(offset);
      offset += 2;
      this.mem[memIndex++] = instruction;
      this.memoryAccesses.add(memIndex - 1);
    }
    
    this.memMax = memIndex - 1;
    this.pc = startAddress;
  }

  /**
   * Execute one instruction and record state changes
   */
  step() {
    if (!this.running) return { success: false, halted: true };
    
    // Save state before execution
    const prevPC = this.pc;
    const prevRegs = this.r.slice();
    const prevFlags = { c: this.c, v: this.v, n: this.n, z: this.z };
    this.memoryChange = { hasChanged: false, address: null, old: [], new: [] };
    this.hasJumped = false;
    
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
      
      // Record state change in snapshot
      const logEntry = {
        pc: { old: prevPC, new: this.pc },
        registers: { old: prevRegs, new: this.r.slice() },
        flags: {
          old: prevFlags,
          new: { c: this.c, v: this.v, n: this.n, z: this.z }
        },
        memory: this.memoryChange,
        ir: this.ir,
        instruction: this.decodeInstruction(this.ir),
        output: this.output
      };
      
      // Update snapshot
      if (this.currentIteration === this.snapshot.length) {
        this.snapshot.push(logEntry);
      } else {
        this.snapshot[this.currentIteration] = logEntry;
      }
      
      this.currentIteration++;
      
      // Update stack size tracking
      const currentStackSize = this.spInitial - this.r[6];
      if (currentStackSize > this.maxStackSize) {
        this.maxStackSize = currentStackSize;
      }
      
      return {
        success: true,
        instruction: this.decodeInstruction(this.ir),
        pc: currentPC,
        hasJumped: this.hasJumped
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        pc: currentPC
      };
    }
  }

  /**
   * Step forward or backward by the specified number of steps
   */
  stepBy(stepNumber) {
    if (stepNumber > 0) {
      // Step forward
      for (let i = 0; i < stepNumber && this.running; i++) {
        this.step();
      }
    } else if (stepNumber < 0) {
      // Step backward
      const newState = Math.max(this.currentIteration + stepNumber, 0);
      this.restorePrevState(newState);
    }
  }

  /**
   * Restore to a previous state
   */
  restorePrevState(targetIteration) {
    if (targetIteration >= this.snapshot.length || targetIteration < 0) {
      return;
    }
    
    const log = this.snapshot[targetIteration];
    
    // Restore PC
    this.pc = log.pc.old;
    
    // Restore flags
    this.c = log.flags.old.c;
    this.v = log.flags.old.v;
    this.n = log.flags.old.n;
    this.z = log.flags.old.z;
    
    // Restore registers
    for (let i = 0; i < 8; i++) {
      this.r[i] = log.registers.old[i];
    }
    
    // Restore memory changes
    for (let i = this.currentIteration - 1; i >= targetIteration; i--) {
      if (this.snapshot[i] && this.snapshot[i].memory.hasChanged) {
        const memChange = this.snapshot[i].memory;
        for (let j = 0; j < memChange.old.length; j++) {
          this.mem[memChange.address + j] = memChange.old[j];
        }
      }
    }
    
    // Restore output to the state at targetIteration
    if (targetIteration > 0) {
      this.output = this.snapshot[targetIteration - 1].output || '';
    } else {
      this.output = '';
    }
    
    this.currentIteration = targetIteration;
    this.instructionsExecuted = targetIteration;
  }

  /**
   * Get current state for visualization
   */
  getState() {
    return {
      registers: Array.from(this.r),
      pc: this.pc,
      ir: this.ir,
      flags: { n: this.n, z: this.z, c: this.c, v: this.v },
      memory: this.getVisibleMemory(),
      output: this.output,
      halted: !this.running,
      instructionsExecuted: this.instructionsExecuted,
      currentIteration: this.currentIteration,
      totalSnapshots: this.snapshot.length,
      maxStackSize: this.maxStackSize
    };
  }

  /**
   * Get memory regions that have been accessed
   */
  getVisibleMemory() {
    const memory = {};
    this.memoryAccesses.forEach(addr => {
      memory[addr] = this.mem[addr];
    });
    return memory;
  }

  // Instruction implementations
  executeBR(nzp, pcoffset9) {
    const conditionMet = 
      ((nzp & 0x4) && this.n) || 
      ((nzp & 0x2) && this.z) || 
      ((nzp & 0x1) && !this.n && !this.z);
    
    if (conditionMet) {
      this.pc = (this.pc + pcoffset9) & 0xFFFF;
      this.hasJumped = true;
    }
  }

  executeADD(dr, sr1, bit5, sr2, imm5) {
    const val1 = this.toSigned16(this.r[sr1]);
    const val2 = bit5 ? imm5 : this.toSigned16(this.r[sr2]);
    const result = val1 + val2;
    
    this.r[dr] = result & 0xFFFF;
    this.setFlags(this.r[dr]);
  }

  executeLD(dr, pcoffset9) {
    const addr = (this.pc + pcoffset9) & 0xFFFF;
    this.r[dr] = this.mem[addr];
    this.memoryAccesses.add(addr);
    this.setFlags(this.r[dr]);
  }

  executeST(sr, pcoffset9) {
    const addr = (this.pc + pcoffset9) & 0xFFFF;
    this.recordMemoryChange(addr, 1);
    this.mem[addr] = this.r[sr];
    this.memoryAccesses.add(addr);
  }

  executeBL(bit11, pcoffset11, dr, offset6) {
    if (bit11) {
      // JSR
      this.r[7] = this.pc;
      this.pc = (this.pc + pcoffset11) & 0xFFFF;
    } else {
      // JSRR
      this.r[7] = this.pc;
      this.pc = (this.r[dr] + offset6) & 0xFFFF;
    }
    this.hasJumped = true;
  }

  executeAND(dr, sr1, bit5, sr2, imm5) {
    const val1 = this.r[sr1];
    const val2 = bit5 ? imm5 & 0x1F : this.r[sr2];
    this.r[dr] = val1 & val2;
    this.setFlags(this.r[dr]);
  }

  executeLDR(dr, sr1, offset6) {
    const addr = (this.toSigned16(this.r[sr1]) + offset6) & 0xFFFF;
    this.r[dr] = this.mem[addr];
    this.memoryAccesses.add(addr);
    this.setFlags(this.r[dr]);
  }

  executeSTR(sr, sr1, offset6) {
    const addr = (this.toSigned16(this.r[sr1]) + offset6) & 0xFFFF;
    this.recordMemoryChange(addr, 1);
    this.mem[addr] = this.r[sr];
    this.memoryAccesses.add(addr);
  }

  executeCMP(sr1, bit5, sr2, imm5) {
    const val1 = this.toSigned16(this.r[sr1]);
    const val2 = bit5 ? imm5 : this.toSigned16(this.r[sr2]);
    const result = val1 - val2;
    
    // Set flags based on comparison
    this.n = result < 0 ? 1 : 0;
    this.z = result === 0 ? 1 : 0;
    this.v = ((val1 >= 0 && val2 < 0 && result < 0) || 
              (val1 < 0 && val2 >= 0 && result >= 0)) ? 1 : 0;
    this.c = (val1 < val2) ? 1 : 0;
  }

  executeNOT(dr, sr) {
    this.r[dr] = (~this.r[sr]) & 0xFFFF;
    this.setFlags(this.r[dr]);
  }

  executeSUB(dr, sr1, bit5, sr2, imm5) {
    const val1 = this.toSigned16(this.r[sr1]);
    const val2 = bit5 ? imm5 : this.toSigned16(this.r[sr2]);
    const result = val1 - val2;
    
    this.r[dr] = result & 0xFFFF;
    this.setFlags(this.r[dr]);
  }

  executeJMP(sr1, offset6) {
    if (sr1 === 0 && offset6 === 0) {
      // RET instruction (JMP R7)
      this.pc = this.r[7];
    } else {
      this.pc = (this.toSigned16(this.r[sr1]) + offset6) & 0xFFFF;
    }
    this.hasJumped = true;
  }

  executeMVI(dr, pcoffset9) {
    const addr = (this.pc + pcoffset9) & 0xFFFF;
    this.r[dr] = this.mem[this.mem[addr]];
    this.memoryAccesses.add(addr);
    this.memoryAccesses.add(this.mem[addr]);
    this.setFlags(this.r[dr]);
  }

  executeLEA(dr, pcoffset9) {
    this.r[dr] = (this.pc + pcoffset9) & 0xFFFF;
    this.setFlags(this.r[dr]);
  }

  executeExtended(dr, sr1, sr2, extop) {
    switch (extop) {
      case 0x00: // MUL
        const mul = this.toSigned16(this.r[sr1]) * this.toSigned16(this.r[sr2]);
        this.r[dr] = mul & 0xFFFF;
        this.setFlags(this.r[dr]);
        break;
      case 0x01: // DIV
        const divisor = this.toSigned16(this.r[sr2]);
        if (divisor === 0) {
          throw new Error("Division by zero");
        }
        const div = Math.floor(this.toSigned16(this.r[sr1]) / divisor);
        this.r[dr] = div & 0xFFFF;
        this.setFlags(this.r[dr]);
        break;
      case 0x02: // MOD
        const modDivisor = this.toSigned16(this.r[sr2]);
        if (modDivisor === 0) {
          throw new Error("Modulo by zero");
        }
        const mod = this.toSigned16(this.r[sr1]) % modDivisor;
        this.r[dr] = mod & 0xFFFF;
        this.setFlags(this.r[dr]);
        break;
      case 0x03: // OR
        this.r[dr] = this.r[sr1] | this.r[sr2];
        this.setFlags(this.r[dr]);
        break;
      case 0x04: // XOR
        this.r[dr] = this.r[sr1] ^ this.r[sr2];
        this.setFlags(this.r[dr]);
        break;
      case 0x05: // SHF (shift)
        const shiftAmount = this.r[sr2] & 0xF;
        const shiftDir = (this.r[sr2] >> 4) & 0x1;
        if (shiftDir) { // Right shift
          this.r[dr] = this.r[sr1] >> shiftAmount;
        } else { // Left shift
          this.r[dr] = (this.r[sr1] << shiftAmount) & 0xFFFF;
        }
        this.setFlags(this.r[dr]);
        break;
      default:
        throw new Error(`Unknown extended opcode: ${extop}`);
    }
  }

  executeTRAP(dr, trapvec) {
    switch (trapvec) {
      case 0x25: // HALT
        this.running = false;
        break;
      case 0x01: // DOUT - decimal output
        this.output += this.toSigned16(this.r[dr]) + '\n';
        break;
      case 0x02: // UDOUT - unsigned decimal output
        this.output += this.r[dr] + '\n';
        break;
      case 0x03: // HOUT - hex output
        this.output += this.r[dr].toString(16).toUpperCase() + '\n';
        break;
      case 0x04: // AOUT - ASCII output
        this.output += String.fromCharCode(this.r[dr] & 0xFF);
        break;
      case 0x05: // SOUT - string output
        let addr = this.r[dr];
        while (this.mem[addr] !== 0) {
          this.output += String.fromCharCode(this.mem[addr] & 0xFF);
          this.memoryAccesses.add(addr);
          addr = (addr + 1) & 0xFFFF;
        }
        break;
      case 0x06: // NL - newline
        this.output += '\n';
        break;
      case 0x08: // DIN - decimal input
      case 0x09: // HIN - hex input
      case 0x0A: // AIN - ASCII input
      case 0x0B: // SIN - string input
        // For visualization, these would need to be handled differently
        // For now, we'll just set a default value
        this.r[dr] = 0;
        break;
      default:
        throw new Error(`Unknown trap vector: ${trapvec}`);
    }
  }

  /**
   * Helper functions
   */
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

  setFlags(value) {
    const signed = this.toSigned16(value);
    this.n = signed < 0 ? 1 : 0;
    this.z = signed === 0 ? 1 : 0;
  }

  /**
   * Decode instruction to human-readable format
   */
  decodeInstruction(instruction) {
    const opcode = (instruction >> 12) & 0xF;
    const opcodeNames = [
      'BR', 'ADD', 'LD', 'ST', 'JSR/JSRR', 'AND', 'LDR', 'STR',
      'CMP', 'NOT', 'EXT', 'SUB', 'JMP', 'MVI', 'LEA', 'TRAP'
    ];
    return opcodeNames[opcode] || 'UNKNOWN';
  }

  /**
   * Record memory changes for undo functionality
   */
  recordMemoryChange(address, length = 1) {
    if (!this.memoryChange.hasChanged) {
      this.memoryChange.hasChanged = true;
      this.memoryChange.address = address;
      this.memoryChange.old = [];
      this.memoryChange.new = [];
    }
    
    for (let i = 0; i < length; i++) {
      this.memoryChange.old.push(this.mem[address + i]);
    }
  }

  /**
   * Get current iteration/step number
   */
  getCurrentIteration() {
    return this.currentIteration;
  }

  /**
   * Get total number of snapshots
   */
  getSnapshotCount() {
    return this.snapshot.length;
  }

  /**
   * Get listing entry for current PC if available
   */
  getCurrentListing() {
    if (this.listing && this.currentIteration > 0) {
      const pc = this.snapshot[this.currentIteration - 1].pc.old;
      return this.listing[pc] || null;
    }
    return null;
  }

  /**
   * Enable/disable debug mode
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  /**
   * Reset the simulator
   */
  reset() {
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
    this.instructionsExecuted = 0;
    this.memoryAccesses = new Set();
    this.r[6] = 0xFFF0; // SP
    this.r[5] = 0xFFF0; // FP
    this.spInitial = this.r[6];
    this.maxStackSize = 0;
    this.currentIteration = 0;
    this.snapshot = [];
    this.hasJumped = false;
    this.debugMode = false;
  }
}

export default LCCSimulator;