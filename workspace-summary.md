# Workspace Summary

## Project Overview
LCC.js is a sophisticated web-based assembly language development environment that provides an integrated editor, compiler, and execution environment for assembly language programming. It features a modern UI with theme support, comprehensive code editing capabilities, and robust file management features.

## Recent Updates and Fixes

### 1. Hover Functionality
- Fixed directive token handling, especially for tokens with leading dots
- Added delay mechanism for hover provider reset after theme changes
- Improved tooltip positioning and styling for better user experience

### 2. Theme System
- Implemented comprehensive light mode styles
- Added proper theme variables for consistent appearance
- Fixed button styling in both light and dark modes
- Enhanced hamburger menu styling in light mode

### 3. UI Components
- Removed redundant terminal/command-palette button
- Restored and improved hamburger menu functionality
- Standardized button styling across themes
- Added new "Download All as TXT" feature

## Key Components

### Main Application (`src/main.js`)
- Browser-based editor using CodeMirror
- Terminal emulator for input/output
- Enhanced theme support with smooth transitions
- Expanded file operations (open, save, multiple download formats)
- Improved assembly language linting and hover tooltips

### Project Structure
- `src/` - Core application source code
  - `core/` - Core compiler components
  - `extra/` - Additional tools like disassembler
  - `plus/` - Enhanced versions of core components
  - `utils/` - Utility functions
- `demos/` - Example assembly programs
- `docs/` - Documentation and tutorials
- `plusdemos/` - Advanced demo programs
- `scripts/` - Build and test scripts
- `test/` - Test suites (e2e and integration)

### Key Features
1. Code Editor
   - Enhanced syntax highlighting
   - Real-time error checking
   - Improved hover tooltips with directive support
   - Seamless theme transitions
   - Better token recognition

2. Terminal
   - Command input/output with history
   - Intelligent command autocompletion
   - Clear functionality
   - Success/error feedback for operations

3. File Operations
   - Open/Save files with error handling
   - Multiple download formats (.a, .bst, .lst, .txt)
   - Bulk file download capability
   - Demo file system integration
   - New "Download All as TXT" functionality

4. UI Features
   - Streamlined command interface
   - Smooth dark/light theme toggle
   - Responsive hamburger menu
   - Error/warning/info toggles
   - Modern button styling
   - Improved mobile support

### Development Environment
- OS: Windows
- Default Shell: PowerShell
- Project appears to use:
  - Node.js
  - Webpack
  - Tailwind CSS
  - Web Workers for processing

## Notable Files
- `src/main.js` - Main application logic
- `src/lcc-mode.js` - Editor mode configuration
- `worker.js` - Web Worker implementation
- `index.html` - Main application page

## Documentation
The project includes extensive documentation in the `docs/` folder:
- `assembler.md` - Assembly language specifications
- `interpreter.md` - Runtime environment details
- `lcc.md` - Compiler implementation notes
- Tutorial files for learning assembly
- Example programs with annotations

## Testing
- End-to-end tests in `test/e2e/`
- Integration tests in `test/integration/`
- Test cache system for artifacts
- Manual testing procedures for UI features

## Future Enhancements
1. Performance Optimizations
   - Faster token processing
   - More efficient theme transitions
   - Optimized file operations

2. UI Improvements
   - Enhanced mobile responsiveness
   - More comprehensive theme support
   - Progress indicators for long operations
   - Improved error messages

3. Feature Additions
   - Enhanced error handling
   - Additional download formats
   - More comprehensive testing
   - Extended documentation

## Maintenance Notes
- Theme changes require careful testing across all components
- File operations should include proper error handling
- UI changes should maintain consistency in both themes
- Mobile responsiveness should be verified after changes

Last Updated: July 30, 2023
Workspace Location: `x:\OneDrive - State University of New York at New Paltz\Masters\lccjs-1`
