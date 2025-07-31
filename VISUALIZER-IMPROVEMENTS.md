# LCC Stack Visualizer Improvements

## Overview

The LCC Stack Visualizer has been significantly enhanced with draggable/resizable components, value change highlighting, and improved stack movement visualization.

## Key Features Implemented

### 1. Draggable and Resizable Components

All major components are now draggable and resizable using the `react-rnd` library:

- **Code Editor**: Move and resize to see more code
- **Console Output**: Adjust height for viewing program output
- **Stack Visualization**: Resize to see more stack frames
- **Register Panel**: Position anywhere on screen
- **Memory Panel**: Expand to view more memory addresses
- **Execution Controls**: Draggable control panel

**Usage:**
- Drag components by their title bars
- Resize from corners and edges
- Components are bounded within the viewport

### 2. Value Change Highlighting

The visualizer now clearly shows what changed between steps:

#### Stack Changes:
- **Green background + underline**: New stack entries
- **Yellow background**: Modified values
- **Red strikethrough → Green underline**: Shows old value transitioning to new value
- SP and FP pointers are clearly marked

#### Register Changes:
- **Yellow background**: Register that changed
- **Red strikethrough → Green underline**: Old value to new value
- Flags animate when they change state

#### Memory Changes:
- **Yellow background**: Memory addresses that changed
- **Red strikethrough → Green underline**: Previous value to current value
- **Red highlight**: Current Program Counter location
- **Blue highlight**: Current Stack Pointer location

### 3. Enhanced Stack Movement Visualization

Stack operations are now animated and clearly visible:

- **Push operations**: New entries slide in from the left with green highlighting
- **Pop operations**: Entries fade out to the right
- **Stack growth**: Clearly shows downward growth with arrow indicator
- **Empty slots**: Visible as grayed-out entries
- **Stack metrics**: Shows current SP, FP, and stack size

### 4. Improved Layout

#### Desktop Layout:
- Components have sensible default positions
- No overlapping at 100% zoom
- All components visible on standard displays
- Proper spacing and padding

#### Mobile Layout:
- Responsive grid layout
- Components stack vertically
- Touch-friendly controls
- Fixed control bar at bottom

### 5. Display Options

#### Registers:
- **Hex/Decimal toggle**: Switch between hexadecimal and decimal display
- Grouped by type (General, Special, Flags)

#### Memory:
- **Hex/Decimal/ASCII modes**: Three viewing options
- Address navigation input
- Auto-follows Program Counter

## Technical Implementation

### Dependencies Added:
```json
{
  "react-rnd": "^10.4.1"
}
```

### Component Changes:

1. **StackToolPage.jsx**:
   - Added `previousRegisters`, `previousMemory`, `previousStack` state
   - Implemented proper state tracking before each instruction
   - Added Rnd wrappers for draggable components
   - Fixed layout calculations

2. **StackVisualizer.jsx**:
   - Added change detection logic
   - Implemented AnimatePresence for smooth transitions
   - Shows previous values with strikethrough
   - Added color-coded legend

3. **RegisterPanel.jsx**:
   - Added change highlighting with animations
   - Hex/Decimal display toggle
   - Proper flag visualization

4. **MemoryPanel.jsx**:
   - Three display modes (Hex/Dec/ASCII)
   - Change tracking with highlighting
   - PC and SP position indicators

## Usage Guide

### For Students:

1. **Arrange Your Workspace**:
   - Drag components to preferred positions
   - Resize to see more content
   - Save screen space by minimizing unused panels

2. **Track Changes**:
   - Green = New values
   - Yellow = Changed values
   - Red strikethrough = Previous values
   - Watch the stack grow and shrink

3. **Step Through Code**:
   - Use Step Forward to execute one instruction
   - Watch registers, memory, and stack update
   - See old values crossed out and new values highlighted

### For Instructors:

1. **Demonstration Mode**:
   - Enlarge stack visualizer for class viewing
   - Position registers prominently
   - Use change highlighting to explain operations

2. **Focus Areas**:
   - Drag relevant components to center
   - Minimize others for clarity
   - Use animations to show data flow

## Future Enhancements

1. **Layout Persistence**: Save and restore component positions
2. **Breakpoints**: Visual breakpoint indicators in code
3. **Variable Watching**: Track specific memory locations
4. **Execution History**: Step backward through previous states
5. **Export Options**: Save visualization state as image/video