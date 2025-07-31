# LCC.js Frontend Architecture Documentation

## Overview

The LCC.js frontend is a modern React-based web IDE for the LCC assembly language. It provides a comprehensive development environment with real-time compilation, execution visualization, and educational tools.

## Technology Stack

- **React 18**: Component-based UI framework
- **Zustand**: Lightweight state management
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **CodeMirror 6**: Advanced code editor
- **Three.js**: 3D graphics (used in visualizer)
- **Web Workers**: Background compilation/execution
- **Webpack 5**: Module bundler

## Architecture

### Component Hierarchy

```
App.jsx
├── AppProvider (Zustand store context)
├── AppInitializer (loads demo on startup)
└── Layout
    ├── Header
    │   ├── Logo
    │   ├── Current File Indicator
    │   └── Action Buttons (Run, Load Demo, etc.)
    ├── MobileLayout (< 768px)
    │   ├── EditorPanel
    │   └── MobileToolbar
    └── DesktopLayout (≥ 768px)
        ├── FileExplorer
        ├── EditorPanel
        ├── TerminalPanel
        └── HamburgerMenu (overlay)

VisualizerApp.jsx (separate entry point)
└── StackToolPage
    ├── CodeEditor
    ├── ExecutionControls
    ├── StackVisualizer
    ├── RegisterPanel
    ├── MemoryPanel
    └── InstructionReference
```

### State Management (Zustand Store)

The application state is centralized in `src/store/AppStore.jsx`:

```javascript
{
  // Editor state
  editorContent: '',           // Current file content
  currentFileName: '',         // Active file name
  isFileModified: false,       // Unsaved changes flag
  isRenaming: false,          // File rename mode
  
  // Terminal state
  terminalOutput: [],         // Console output history
  terminalInput: '',          // Current input line
  isWaitingForInput: false,   // Input prompt active
  
  // UI state
  isDarkMode: true,           // Theme preference
  isHamburgerMenuOpen: false, // Mobile menu state
  isCommandPaletteOpen: false,// Command palette visibility
  
  // File system state
  fileTree: {},              // All files and content
  openFiles: [],             // Currently open file names
  activeFileIndex: 0,        // Selected file tab
  
  // Worker state
  isProcessing: false,       // Compilation/execution active
  worker: null               // Web Worker instance
}
```

### Key Features

#### 1. File Management
- **In-memory file system**: Files stored in `fileTree` object
- **Multi-file support**: Tab-based file switching
- **File operations**: Create, rename, delete, upload
- **Auto-save**: Content saved to state on every edit
- **Download options**: .a, .lst, .bst, .txt formats

#### 2. Code Editor
- **Syntax highlighting**: Custom LCC assembly mode
- **Live error markers**: Compilation errors shown inline
- **Current line tracking**: Execution pointer during debug
- **Hover tooltips**: Instruction documentation
- **Theme support**: Dark/light modes

#### 3. Compilation & Execution
- **Web Worker isolation**: Non-blocking compilation
- **Real-time output**: stdout/stderr streamed to terminal
- **Generated files**: .lst (listing), .bst (binary), .e (executable)
- **Error handling**: Clear error messages with line numbers

#### 4. Terminal Emulator
- **Output streaming**: Real-time program output
- **Input handling**: Interactive programs supported
- **Color coding**: Success (green), error (red), info (blue)
- **Command history**: Preserved during session

#### 5. Responsive Design
- **Mobile layout**: Simplified single-column view
- **Desktop layout**: Multi-panel workspace
- **Touch support**: Swipe gestures for mobile
- **Adaptive UI**: Components resize based on viewport

#### 6. Stack Visualizer (Separate Page)
- **Step-by-step execution**: Forward/backward stepping
- **Real-time visualization**: Stack, registers, memory
- **Assembly simulation**: Interprets LCC instructions
- **Educational focus**: Clear visual feedback

## Data Flow

### 1. File Loading
```
User Action → loadDemoFile() → fetch('/demos/file.a') → 
updateFileTree() → setEditorContent() → CodeMirror update
```

### 2. Code Execution
```
Run Button → runProgram() → saveFile() → create Worker →
postMessage({code}) → Worker compiles → onMessage(results) →
updateTerminalOutput() → updateFileTree(generated files)
```

### 3. File Operations
```
File Action → updateFileTree() → persist to state →
UI components re-render → changes reflected
```

## Component Documentation

### Core Components

#### AppStore.jsx
Central state management with actions:
- `setEditorContent(content)`: Update current file
- `addFile(name, content)`: Create new file
- `renameFile(oldName, newName)`: Rename with validation
- `runProgram()`: Compile and execute current file
- `downloadFile(name, extension)`: Export single file
- `downloadAllFiles()`: Bundle all files

#### Layout.jsx
Responsive container that switches between:
- **MobileLayout**: < 768px width
- **DesktopLayout**: ≥ 768px width

#### EditorPanel.jsx
CodeMirror wrapper with:
- Custom LCC syntax mode
- Error highlighting
- Hover tooltips for instructions
- Theme integration

#### FileExplorer.jsx
File management panel:
- File list with icons
- Upload button (file/folder)
- Download dropdown
- Rename dialog
- Active file highlighting

#### TerminalPanel.jsx
Console output display:
- Colored text support
- Auto-scroll to bottom
- Clear button
- Timestamp tracking

### Visualizer Components

#### StackToolPage.jsx
Main visualizer orchestrator:
- Assembly parsing and execution
- State management for CPU/memory
- Step control logic
- Responsive layout

#### StackVisualizer.jsx
Stack memory visualization:
- SP/FP pointer indicators
- Push/pop animations
- Address/value display
- Empty stack message

#### RegisterPanel.jsx
CPU register display:
- General purpose (r0-r7)
- Special (pc, sp, fp, lr, ir)
- Flags (n, z, c, v)
- Hex/Dec toggle

#### MemoryPanel.jsx
Memory viewer:
- Address navigation
- Hex/Dec/ASCII modes
- PC/SP highlighting
- Pagination controls

## Build Configuration

### Webpack Entry Points
```javascript
entry: {
  bundle: './src/index.js',      // Legacy bundle
  main: './src/main.js',         // Main app logic
  app: './src/App.jsx',          // React app
  visualizer: './src/VisualizerApp.jsx' // Visualizer
}
```

### Key Dependencies
- React & React-DOM: UI framework
- Zustand: State management
- Tailwind CSS: Styling
- CodeMirror: Editor
- Framer Motion: Animations
- Three.js: 3D graphics

## API Integration

### Demo Files
- Endpoint: `/demos/:filename`
- Served from: `demos/` directory
- CORS enabled for cross-origin access

### Worker Communication
```javascript
// Main → Worker
{
  type: 'run',
  payload: {
    code: string,
    filePath: string,
    name: string
  }
}

// Worker → Main
{
  type: 'stdout' | 'stderr' | 'exit',
  payload: string | number
}
```

## Performance Considerations

1. **Code Splitting**: Separate bundles for main app and visualizer
2. **Lazy Loading**: Components loaded on demand
3. **Web Workers**: Heavy computation off main thread
4. **Memoization**: React hooks prevent unnecessary re-renders
5. **Virtual Scrolling**: Large file lists handled efficiently

## Security

1. **No server execution**: All code runs client-side
2. **Sandboxed workers**: Isolated execution environment
3. **Input validation**: File names and content sanitized
4. **No external dependencies**: Self-contained application

## Future Enhancements

1. **Collaborative editing**: Multi-user support
2. **Cloud storage**: Save projects online
3. **Extended debugging**: Breakpoints and watches
4. **Plugin system**: Custom extensions
5. **Mobile app**: Native iOS/Android versions