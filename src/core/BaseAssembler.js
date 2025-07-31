#!/usr/bin/env node

/**
 * BaseAssembler.js
 * Base class for LCC.js Assembler with common functionality
 * Extended by both standard Assembler and AssemblerPlus
 */

import fs from "fs";
import path from "path";
import { generateBSTLSTContent } from '../utils/genStats.js';
import nameHandler from '../utils/name.js';

const isTestMode = (typeof global.it === 'function');

/**
 * Handles fatal errors in a test-safe way
 * @param {string} message - Error message
 * @param {number} code - Exit code
 */
function fatalExit(message, code = 1) {
  if (isTestMode || self?.isWebWorker) {
    throw new Error(message);
  } else {
    process.exit(code);
  }
}

/**
 * Base assembler class containing common functionality
 * for both standard and plus versions
 */
class BaseAssembler {
  constructor() {
    // Symbol table: symbol to address mapping
    this.symbolTable = {};
    
    // Location counter
    this.locCtr = 0;
    
    // Line number
    this.lineNum = 0;
    
    // Array of source code lines
    this.sourceLines = [];
    
    // Error flag
    this.errorFlag = false;
    
    // Current pass (1 or 2)
    this.pass = 1;
    
    // Set of labels to detect duplicates
    this.labels = new Set();
    
    // Collect errors
    this.errors = [];
    
    // Buffer to hold machine code words
    this.outputBuffer = [];
    
    // Input file name
    this.inputFileName = '';
    
    // Output file name
    this.outputFileName = '';
    
    // Output file handle
    this.outFile = null;
    
    // Listing information for each line
    this.listing = [];
    
    // Load point
    this.loadPoint = 0;
    
    // Program size
    this.programSize = 0;
    
    // Label specified in .start directive
    this.startLabel = null;
    
    // Resolved address of the start label
    this.startAddress = null;
    
    // Flag to indicate if the code is to be made into a .o object file
    this.isObjectModule = false;
    
    // Set of global labels to be exported
    this.globalLabels = new Set();
    
    // Set of external labels to be imported
    this.externLabels = new Set();
    
    // Array to store external references
    this.externalReferences = [];
    
    // Array to store adjustment entries
    this.adjustmentEntries = [];
  }

  /**
   * Adds the given address to the adjustmentEntries array if not already included
   * @param {number} address - The address to be added
   */
  handleAdjustmentEntry(address) {
    if (!this.adjustmentEntries.includes(address)) {
      this.adjustmentEntries.push(address);
    }
  }

  /**
   * Main entry point for the assembler
   * @param {string[]} args - Command line arguments
   */
  main(args) {
    args = args || process.argv.slice(2);

    // Check if inputFileName is already set
    if (!this.inputFileName) {
      if (args.length !== 1) {
        console.error('Usage: assembler.js <input filename>');
        fatalExit('Usage: assembler.js <input filename>', 1);
      }
      this.inputFileName = args[0];
    }

    // Read the source code from the input file
    this.readSourceFile();
    
    // Determine file type and process accordingly
    const extension = path.extname(this.inputFileName).toLowerCase();
    this.processFileByType(extension);
  }

  /**
   * Reads the source file and splits into lines
   */
  readSourceFile() {
    try {
      const sourceCode = fs.readFileSync(this.inputFileName, 'utf-8');
      this.sourceLines = sourceCode.split('\n');
    } catch (err) {
      console.error(`Cannot open input file ${this.inputFileName}`);
      fatalExit(`Cannot open input file ${this.inputFileName}`, 1);
    }
  }

  /**
   * Processes file based on its extension
   * @param {string} extension - File extension
   */
  processFileByType(extension) {
    if (extension === '.bin') {
      console.log(`Assembling ${this.inputFileName}`);
      this.parseBinFile();
      this.outputFileName = this.constructOutputFileName(this.inputFileName, '.e');
      this.writeOutputFile();
    } else if (extension === '.hex') {
      console.log(`Assembling ${this.inputFileName}`);
      this.parseHexFile();
      this.outputFileName = this.constructOutputFileName(this.inputFileName, '.e');
      this.writeOutputFile();
    } else if (this.isValidAssemblyFile(extension)) {
      this.performTwoPassAssembly();
    } else {
      console.error(`Unsupported file type: ${extension}`);
      fatalExit(`Unsupported file type: ${extension}`, 1);
    }
  }

  /**
   * Checks if the file extension is valid for assembly
   * @param {string} extension - File extension
   * @returns {boolean} True if valid assembly file
   */
  isValidAssemblyFile(extension) {
    return extension === '.a';
  }

  /**
   * Performs the standard two-pass assembly process
   */
  performTwoPassAssembly() {
    this.outputFileName = this.constructOutputFileName(
      this.inputFileName, 
      this.getOutputExtension()
    );

    // Pass 1: Build symbol table
    console.log('Starting assembly pass 1');
    this.pass = 1;
    this.locCtr = 0;
    this.lineNum = 0;
    this.errorFlag = false;
    this.performPass();
    
    if (this.locCtr === 0) {
      console.error('Empty file');
      fatalExit('Empty file', 0);
    }
    
    if (this.errorFlag) {
      fatalExit('Errors encountered during Pass 1', 1);
    }

    // Pass 2: Generate machine code
    console.log('Starting assembly pass 2');
    this.pass = 2;
    this.locCtr = 0;
    this.lineNum = 0;
    this.performPass();
    
    if (this.errorFlag) {
      fatalExit('Errors encountered during Pass 2', 1);
    }

    this.finalizeAssembly();
  }

  /**
   * Gets the appropriate output file extension
   * @returns {string} Output file extension
   */
  getOutputExtension() {
    return '.e';
  }

  /**
   * Finalizes the assembly process
   */
  finalizeAssembly() {
    // Handle start label
    if (this.startLabel !== null) {
      if (this.symbolTable.hasOwnProperty(this.startLabel)) {
        this.startAddress = this.symbolTable[this.startLabel];
      } else {
        this.error('Undefined label');
        fatalExit('Undefined label', 1);
      }
    } else {
      this.startAddress = 0;
    }

    // Write output file
    this.writeOutputFile();
    console.log(`Output file = ${this.outputFileName}`);
  }

  /**
   * Performs a single pass through the source code
   */
  performPass() {
    for (this.lineNum = 0; this.lineNum < this.sourceLines.length; this.lineNum++) {
      const line = this.sourceLines[this.lineNum];
      this.processLine(line);
    }
  }

  /**
   * Processes a single line of source code
   * @param {string} line - Source code line
   */
  processLine(line) {
    // Skip empty lines and comments
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith(';')) {
      return;
    }

    // Parse the line into components
    const { label, mnemonic, operands } = this.parseLine(line);

    // Handle label
    if (label) {
      this.handleLabel(label);
    }

    // Handle mnemonic (instruction or directive)
    if (mnemonic) {
      if (mnemonic.startsWith('.')) {
        this.handleDirective(mnemonic, operands);
      } else {
        this.handleInstruction(mnemonic, operands);
      }
    }
  }

  /**
   * Parses a line into label, mnemonic, and operands
   * @param {string} line - Source code line
   * @returns {Object} Parsed components
   */
  parseLine(line) {
    // Remove comments
    const commentIndex = line.indexOf(';');
    if (commentIndex !== -1) {
      line = line.substring(0, commentIndex);
    }

    const parts = line.trim().split(/\s+/);
    let label = null;
    let mnemonic = null;
    let operands = [];

    // Check if first part is a label (ends with colon)
    if (parts[0] && parts[0].endsWith(':')) {
      label = parts[0].slice(0, -1);
      parts.shift();
    }

    // Next part is mnemonic
    if (parts.length > 0) {
      mnemonic = parts[0].toLowerCase();
      operands = parts.slice(1);
    }

    return { label, mnemonic, operands };
  }

  /**
   * Handles a label definition
   * @param {string} label - Label name
   */
  handleLabel(label) {
    if (this.pass === 1) {
      if (this.labels.has(label)) {
        this.error(`Duplicate label: ${label}`);
      } else {
        this.labels.add(label);
        this.symbolTable[label] = this.locCtr;
      }
    }
  }

  /**
   * Handles a directive (subclasses should override for specific directives)
   * @param {string} mnemonic - Directive name
   * @param {string[]} operands - Directive operands
   */
  handleDirective(mnemonic, operands) {
    switch (mnemonic) {
      case '.start':
        if (operands.length > 0) {
          this.startLabel = operands[0];
        }
        break;
      case '.word':
        this.locCtr += 1;
        if (this.pass === 2) {
          const value = this.parseValue(operands[0] || '0');
          this.writeMachineWord(value);
        }
        break;
      case '.zero':
        const count = parseInt(operands[0] || '1');
        this.locCtr += count;
        if (this.pass === 2) {
          for (let i = 0; i < count; i++) {
            this.writeMachineWord(0);
          }
        }
        break;
      default:
        this.error(`Unknown directive: ${mnemonic}`);
    }
  }

  /**
   * Handles an instruction (subclasses should override for specific instructions)
   * @param {string} mnemonic - Instruction mnemonic
   * @param {string[]} operands - Instruction operands
   */
  handleInstruction(mnemonic, operands) {
    if (this.pass === 1) {
      this.locCtr += 1;
      return;
    }

    // Pass 2: Generate machine code
    let machineWord = null;

    switch (mnemonic) {
      case 'halt':
        machineWord = 0xF000;
        break;
      case 'add':
        machineWord = this.assembleArithmetic(0x1000, operands);
        break;
      case 'sub':
        machineWord = this.assembleArithmetic(0xB000, operands);
        break;
      default:
        this.error(`Unknown instruction: ${mnemonic}`);
        return;
    }

    if (machineWord !== null) {
      this.writeMachineWord(machineWord);
      this.locCtr += 1;
    }
  }

  /**
   * Assembles arithmetic instructions
   * @param {number} baseOpcode - Base opcode
   * @param {string[]} operands - Instruction operands
   * @returns {number} Machine word
   */
  assembleArithmetic(baseOpcode, operands) {
    if (operands.length < 3) {
      this.error('Insufficient operands for arithmetic instruction');
      return null;
    }

    const dr = this.getRegister(operands[0]);
    const sr1 = this.getRegister(operands[1]);
    
    if (dr === null || sr1 === null) {
      return null;
    }

    // Check if third operand is immediate or register
    if (operands[2].startsWith('#')) {
      const imm5 = this.parseImmediate(operands[2], 5);
      return baseOpcode | (dr << 9) | (sr1 << 6) | (1 << 5) | (imm5 & 0x1F);
    } else {
      const sr2 = this.getRegister(operands[2]);
      if (sr2 === null) return null;
      return baseOpcode | (dr << 9) | (sr1 << 6) | sr2;
    }
  }

  /**
   * Parses a register operand
   * @param {string} operand - Register operand
   * @returns {number|null} Register number or null if invalid
   */
  getRegister(operand) {
    if (!operand) return null;
    
    const reg = operand.toLowerCase().trim();
    if (reg.match(/^r[0-7]$/)) {
      return parseInt(reg[1]);
    }
    
    // Special register names
    switch (reg) {
      case 'sp': return 6;
      case 'fp': return 5;
      case 'lr': return 7;
      default:
        this.error(`Invalid register: ${operand}`);
        return null;
    }
  }

  /**
   * Parses an immediate value
   * @param {string} operand - Immediate operand
   * @param {number} bits - Number of bits for the immediate
   * @returns {number} Immediate value
   */
  parseImmediate(operand, bits) {
    let value = this.parseValue(operand.substring(1)); // Remove # prefix
    const maxValue = (1 << (bits - 1)) - 1;
    const minValue = -(1 << (bits - 1));
    
    if (value > maxValue || value < minValue) {
      this.error(`Immediate value out of range: ${operand}`);
    }
    
    return value;
  }

  /**
   * Parses a numeric value (decimal, hex, or binary)
   * @param {string} value - String representation of value
   * @returns {number} Parsed value
   */
  parseValue(value) {
    if (!value) return 0;
    
    value = value.trim();
    
    if (value.startsWith('0x') || value.startsWith('0X')) {
      return parseInt(value, 16);
    } else if (value.startsWith('0b') || value.startsWith('0B')) {
      return parseInt(value.substring(2), 2);
    } else {
      return parseInt(value, 10);
    }
  }

  /**
   * Writes a machine word to the output buffer
   * @param {number} word - Machine word to write
   */
  writeMachineWord(word) {
    this.outputBuffer.push(word & 0xFFFF);
  }

  /**
   * Constructs output filename with new extension
   * @param {string} inputFileName - Input file name
   * @param {string} newExtension - New extension
   * @returns {string} Output file name
   */
  constructOutputFileName(inputFileName, newExtension) {
    const baseName = path.basename(inputFileName, path.extname(inputFileName));
    const dirName = path.dirname(inputFileName);
    return path.join(dirName, baseName + newExtension);
  }

  /**
   * Writes the output file
   * @param {string} headerType - Optional header type for plus version
   */
  writeOutputFile(headerType = null) {
    try {
      let content = '';
      
      // Add header if specified
      if (headerType) {
        content += headerType + '\n';
      }
      
      // Add machine code
      for (const word of this.outputBuffer) {
        content += word.toString(16).padStart(4, '0').toUpperCase() + '\n';
      }
      
      fs.writeFileSync(this.outputFileName, content);
    } catch (err) {
      console.error(`Cannot write output file ${this.outputFileName}`);
      fatalExit(`Cannot write output file ${this.outputFileName}`, 1);
    }
  }

  /**
   * Reports an error
   * @param {string} message - Error message
   */
  error(message) {
    console.error(`Line ${this.lineNum + 1}: ${message}`);
    this.errorFlag = true;
    this.errors.push({ line: this.lineNum + 1, message });
  }

  // Placeholder methods for binary/hex file parsing (implement in subclasses if needed)
  parseBinFile() {
    this.error('Binary file parsing not implemented');
  }

  parseHexFile() {
    this.error('Hex file parsing not implemented');
  }
}

export default BaseAssembler;