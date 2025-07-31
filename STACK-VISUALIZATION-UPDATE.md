# Stack Visualization Update

## Overview

The LCC Stack Visualizer has been updated to show the stack growing upward, which is more intuitive for educational purposes and aligns with how most people conceptually think about stacks.

## Key Changes

### Visual Direction
- **Stack grows upward**: New items appear at the top of the visualization
- **Lower addresses at top**: Maintains correct memory layout (stack grows toward lower addresses)
- **Scroll behavior**: Automatically scrolls to show new items when pushed

### Layout Details

```
Lower Addresses (Top of Visual)
┌─────────────────────────────┐
│ 0xFFEB  SP→    5    r3      │ ← Newest item (top of stack)
├─────────────────────────────┤
│ 0xFFEC         10   r2      │
├─────────────────────────────┤
│ 0xFFED         15   r1      │
├─────────────────────────────┤
│ 0xFFEE         empty        │
├─────────────────────────────┤
│ 0xFFEF         empty        │
├─────────────────────────────┤
│ 0xFFF0         empty        │ ← Stack Base
└─────────────────────────────┘
Higher Addresses (Bottom of Visual)
```

### Features

1. **Auto-scroll**: When new items are pushed, the view automatically scrolls to the top to show them
2. **Visual indicators**: 
   - SP (Stack Pointer) shows current top of stack
   - FP (Frame Pointer) for function frames
   - Animated entry for new items sliding in from top
3. **Color coding**:
   - Green highlight with shadow for new items
   - Yellow highlight for changed values
   - Gray for empty stack slots
4. **Stack metrics**:
   - Current stack size in words
   - Free space remaining
   - SP and FP values in hex

### Educational Benefits

1. **Intuitive understanding**: Students naturally think of stacking items on top of each other
2. **Clear growth direction**: Arrow indicator shows stack grows upward
3. **Memory layout preserved**: Still accurately represents how stack grows toward lower addresses
4. **Visual consistency**: Matches common textbook diagrams

### Technical Implementation

- Uses `Array.reverse()` to flip the visual order while maintaining correct memory addresses
- Scroll container with `overflow-y-auto` for large stacks
- Auto-scroll to top on new items using `useEffect` hook
- Smooth animations with Framer Motion for better visual feedback

This update makes the stack visualization more pedagogically sound while maintaining technical accuracy.