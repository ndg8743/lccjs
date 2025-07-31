# LCC.js Backend Architecture Documentation

## Overview

The LCC.js backend consists of a Node.js/Express server for serving static files and a Web Worker-based compilation/execution system that runs entirely in the browser.

## Architecture Components

### 1. Express Server (`server.js`)

Simple static file server with API endpoints:

```javascript
// Main routes
app.get('/', (req, res) => res.sendFile('index-react.html'))
app.get('/visualizer', (req, res) => res.sendFile('visualizer.html'))
app.get('/demos/:filename', (req, res) => res.sendFile(demos/filename))
```

Features:
- Serves React application
- Provides demo files endpoint
- CORS enabled for cross-origin access
- Static file serving for assets

### 2. Web Worker (`worker.js`)

Browser-based compilation and execution environment:

```javascript
// Message handling
self.onmessage = function(e) {
  switch(e.data.type) {
    case 'run':      // Compile and execute code
    case 'stdin':    // Handle user input
    case 'getStorage': // Sync file system
  }
}
```

Key responsibilities:
- Receives assembly code from main thread
- Compiles using LCC assembler
- Executes in isolated environment
- Streams output back to UI
- Manages virtual file system

### 3. LCC Core Components

#### Assembler (`src/core/assembler.js`)
- Two-pass assembly process
- Symbol table management
- Instruction encoding
- Error reporting with line numbers

#### Interpreter (`src/core/interpreter.js`)
- 16-bit virtual machine
- Register simulation (r0-r7, sp, fp, lr, pc)
- Memory management (65,536 words)
- Instruction execution
- I/O handling

#### Linker (`src/core/linker.js`)
- Symbol resolution
- External references
- Module combination
- Relocation

### 4. Virtual Machine Architecture

#### Registers
```javascript
{
  r0-r7: General purpose registers
  sp (r6): Stack pointer
  fp (r5): Frame pointer  
  lr (r7): Link register
  pc: Program counter
  flags: {
    n: Negative
    z: Zero
    c: Carry
    v: Overflow
  }
}
```

#### Memory Layout
```
0x0000 - 0x0FFF: Reserved/System
0x1000 - 0xEFFF: Program/Data
0xF000 - 0xFFFF: Stack
```

#### Instruction Set Categories

1. **Arithmetic**: ADD, SUB, MUL, DIV, REM
2. **Logical**: AND, OR, XOR, NOT
3. **Data Movement**: MOV, LD, ST, LEA, LDR, STR, PUSH, POP
4. **Control Flow**: BR, JMP, JSR, RET, BL, BLR
5. **I/O (TRAP)**: DOUT, DIN, SOUT, SIN, HALT
6. **Debug**: m, r, s, bp

### 5. File System Wrapper (`src/utils/fsWrapper.js`)

In-browser file system simulation:

```javascript
{
  storage: {
    'file.a': 'assembly code',
    'file.lst': 'listing output',
    'file.bst': 'binary output',
    'file.e': 'executable'
  }
}
```

Features:
- Memory-based file storage
- Synchronization with worker
- File type detection
- Path normalization

## Data Flow

### Compilation & Execution Pipeline

```
1. User writes code in editor
2. Click "Run" → main thread saves file
3. Create worker → postMessage({type: 'run', code})
4. Worker receives message:
   - Write code to virtual FS
   - Run assembler (creates .lst, .bst)
   - Run interpreter on .bst
   - Stream output back
5. Main thread receives output:
   - Display in terminal
   - Update file tree with generated files
   - Handle errors
```

### Message Protocol

#### Main → Worker
```javascript
// Run program
{
  type: 'run',
  payload: {
    code: string,
    filePath: string,
    name: string
  }
}

// User input
{
  type: 'stdin',
  payload: string
}

// Request storage
{
  type: 'getStorage'
}
```

#### Worker → Main
```javascript
// Standard output
{
  type: 'stdout',
  payload: string
}

// Error output
{
  type: 'stderr', 
  payload: string
}

// Program exit
{
  type: 'exit',
  payload: number // exit code
}

// Storage update
{
  type: 'storage',
  payload: object // file system state
}
```

## Error Handling

### Compilation Errors
- Line number tracking
- Symbol resolution errors
- Syntax errors
- Range checking

### Runtime Errors
- Invalid memory access
- Stack overflow/underflow
- Invalid instructions
- Division by zero

### Worker Errors
- Timeout handling (30s default)
- Crash recovery
- State cleanup

## Performance Considerations

1. **Worker Isolation**: Heavy computation off main thread
2. **Streaming Output**: Real-time feedback
3. **Memory Management**: 16-bit address space limits
4. **File Caching**: In-memory storage

## Security Model

1. **Sandboxed Execution**: Web Worker isolation
2. **No File System Access**: Virtual FS only
3. **Resource Limits**: Memory and execution time caps
4. **Input Validation**: Assembly syntax checking

## LCC Assembly Language

### Instruction Format

```assembly
label: mnemonic operand1, operand2, operand3  ; comment
```

### Example Program
```assembly
.start main
main:   lea r0, msg     ; Load message address
        sout r0         ; Output string
        halt            ; Stop execution
msg:    .stringz "Hello, World!"
```

### Addressing Modes
- **Immediate**: `#value` or direct number
- **Register**: `r0-r7`
- **Direct**: `label`
- **Indirect**: `[register]`
- **Indexed**: `offset(register)`

## Backend Integration with Visualizer

The Stack Visualizer page (`StackToolPage.jsx`) includes its own assembly interpreter:

1. **Two-pass assembly**: Label collection and instruction assembly
2. **Step execution**: Instruction-by-instruction execution
3. **State tracking**: Full CPU/memory state per step
4. **History management**: Step backward capability

This allows educational visualization without full compilation overhead.

## Configuration

### Build-time Constants
```javascript
MEMORY_SIZE: 65536      // 64K words
STACK_BASE: 0xFFFF      // Top of memory
HEAP_START: 0x1000      // After system area
MAX_EXECUTION_TIME: 30000 // 30 seconds
```

### Runtime Options
- Debug mode enable/disable
- Execution speed control
- Memory dump formats
- I/O redirection

## Testing Considerations

1. **Unit Tests**: Individual instruction testing
2. **Integration Tests**: Full program execution
3. **Edge Cases**: Boundary conditions, overflow
4. **Performance Tests**: Large program handling

## Future Enhancements

1. **Debugging Support**: Breakpoints, watchpoints
2. **Optimization**: Basic compiler optimizations
3. **Extended Instructions**: Floating point, SIMD
4. **Multi-module Support**: Better linking
5. **Source Maps**: Enhanced error reporting