# LCC Visualizer Components

This folder contains the core components for the LCC Stack Visualizer - a browser-based tool for stepping through LCC assembly code execution with full state visualization.

## Architecture

### LCCSimulator.js
The main interpreter/simulator that executes LCC machine code step-by-step.

**Key Features:**
- Full LCC instruction set implementation
- Step forward/backward execution with complete state history
- Memory, register, and flag tracking
- Stack visualization support
- Output capture
- Support for .bin and .hex file formats
- Debug mode with execution tracking

**Key Methods:**
- `step()` - Execute one instruction forward
- `stepBy(n)` - Step forward (positive n) or backward (negative n)
- `restorePrevState(iteration)` - Restore to a previous state
- `loadProgram(machineCode, address, listing)` - Load assembled code
- `loadBinaryProgram(buffer, isBinary)` - Load .bin/.hex files
- `getState()` - Get current machine state for visualization
- `getCurrentListing()` - Get source line info for current PC

### LCCAssembler.js
Two-pass assembler that converts LCC assembly source code to machine code.

**Key Features:**
- Symbol resolution
- Directive support (.ORIG, .FILL, .BLKW, .STRINGZ, etc.)
- Error reporting with line numbers
- Source map generation for debugging
- Machine code output

**Key Methods:**
- `assemble(sourceCode)` - Main assembly function
- Returns: `{ success, machineCode, symbols, sourceMap, errors }`

## Integration with Visualizer UI

The visualizer components integrate with React components in `/src/components/visualizer/`:
- `StackVisualizer.jsx` - Stack frame visualization
- `RegisterPanel.jsx` - Register display with change highlighting
- `MemoryPanel.jsx` - Memory view with access tracking
- `CodeEditor.jsx` - Assembly code editor with syntax highlighting
- `ExecutionControls.jsx` - Step forward/backward/run controls

## Usage Example

```javascript
import LCCAssembler from './LCCAssembler';
import LCCSimulator from './LCCSimulator';

// Create instances
const assembler = new LCCAssembler();
const simulator = new LCCSimulator();

// Assemble code
const result = assembler.assemble(sourceCode);
if (result.success) {
  // Load into simulator
  simulator.loadProgram(result.machineCode, 0x3000, result.listing);
  
  // Step forward
  simulator.step();
  
  // Step backward
  simulator.stepBy(-1);
  
  // Get current state
  const state = simulator.getState();
}
```

## History and State Management

The simulator maintains a complete history of all state changes in the `snapshot` array. Each snapshot contains:
- PC (before and after)
- Register values (before and after)
- Flag values (before and after)
- Memory changes
- Current instruction
- Output buffer state

This enables seamless forward and backward stepping through program execution.