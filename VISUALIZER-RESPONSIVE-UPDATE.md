# Visualizer Responsive Scaling Update

## Overview

The LCC Stack Visualizer has been updated to properly scale all components within the window, ensuring a responsive layout that adapts to different screen sizes and window resizing.

## Key Changes

### 1. Flexbox Layout Structure
- Changed root container to use `flex flex-col` for proper height distribution
- Header is `flex-shrink-0` to maintain fixed height
- Content area uses `flex-1` to fill remaining space

### 2. Percentage-Based Component Sizing
All draggable components now use percentage-based sizing:

```javascript
// Example: Code Editor
codeEditor: { 
  x: vw * 0.01,      // 1% from left
  y: vh * 0.01,      // 1% from top
  width: vw * 0.32,  // 32% of viewport width
  height: vh * 0.52  // 52% of viewport height
}
```

### 3. Component Constraints
Each component has min/max size constraints as percentages:
- **Code Editor**: 20-60% width, 20-80% height
- **Console**: 20-60% width, 10-40% height
- **Stack**: 20-50% width, 30-80% height
- **Registers**: 15-35% width, 20-60% height
- **Memory**: 30-80% width, 20-60% height
- **Controls**: 25-50% width, 8-20% height

### 4. Responsive Benefits

#### Automatic Scaling
- Components maintain proportional sizes across different screen sizes
- Layout adapts from small laptops to large monitors
- No overlap at standard resolutions (1366x768 to 4K)

#### Window Resize Handling
- Debounced resize events (100ms) for performance
- Layouts recalculate on window resize
- Smooth transitions during resizing

#### Bounds Protection
- Components cannot be dragged outside viewport
- CSS constraints prevent components from exceeding 100% width/height

### 5. CSS Enhancements

```css
.visualizer-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.react-draggable {
  max-width: 100% !important;
  max-height: 100% !important;
}
```

### 6. Layout Distribution

The default layout efficiently uses screen space:
- **Left Column (33%)**: Code Editor and Console
- **Center Column (23%)**: Registers and Memory
- **Right Column (42%)**: Stack Visualization
- **Bottom**: Execution Controls

## Usage Tips

1. **Resize Window**: Components automatically adjust to new dimensions
2. **Drag to Rearrange**: Move components to preferred positions
3. **Resize Components**: Drag corners/edges within min/max constraints
4. **Reset Layout**: Refresh page to restore default positions

## Technical Details

- Uses `react-rnd` library for drag and resize functionality
- Viewport calculations exclude header height (48px)
- Percentage-based positioning ensures consistent layouts
- Flexbox container ensures proper content scaling

This update ensures the visualizer works seamlessly across all screen sizes while maintaining a clean, organized layout.