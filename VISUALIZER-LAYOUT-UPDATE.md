# Visualizer Layout Update

## Overview

The LCC Stack Visualizer layout has been improved to provide better default positioning that scales with window size and prevents component overlap.

## Layout Improvements

### Dynamic Default Positioning

The visualizer now calculates component positions based on viewport dimensions:

```javascript
const getDefaultLayouts = () => {
  const vw = window.innerWidth;
  const vh = window.innerHeight - 48; // Subtract header height
  
  return {
    codeEditor: { 
      x: 10, 
      y: 10, 
      width: Math.min(vw * 0.35, 450), 
      height: Math.min(vh * 0.55, 450) 
    },
    // ... other components
  };
};
```

### Component Layout

1. **Code Editor** (Top Left)
   - Width: 35% of viewport (max 450px)
   - Height: 55% of viewport (max 450px)
   - Perfect for viewing and editing code

2. **Console Output** (Bottom Left)
   - Below Code Editor
   - Width: Same as Code Editor
   - Height: 25% of viewport (max 200px)
   - Shows program output clearly

3. **Registers Panel** (Center)
   - Width: 25% of viewport (max 320px)
   - Height: 45% of viewport (max 380px)
   - All registers visible without scrolling

4. **Stack Visualization** (Top Right)
   - Width: 35% of viewport (max 450px)
   - Height: 55% of viewport (max 450px)
   - Large enough to see stack operations

5. **Memory Panel** (Bottom Center/Right)
   - Width: 60% of viewport (max 780px)
   - Height: 35% of viewport (max 280px)
   - Wide view for memory inspection

6. **Execution Controls** (Bottom Left)
   - Below Console
   - Fixed height of 80px
   - Easy access to step/run controls

### Responsive Behavior

- Components resize proportionally with window
- Maximum sizes prevent components from becoming too large
- Minimum sizes ensure usability
- Layout recalculates on window resize
- No overlapping components at any standard screen size

### Mobile Layout

On screens < 768px wide:
- Components stack vertically
- Simplified layout for touch devices
- Controls at bottom for easy access

## Resources Page Update

Added 12 new YouTube channels for programming education:

### New YouTube Channels

1. **Low Level Learning** - Systems programming and assembly
2. **Theo (t3.gg)** - Modern web development
3. **ThePrimeagen** - Performance and vim mastery
4. **3Blue1Brown** - Mathematical visualizations
5. **Bro Code** - Comprehensive programming tutorials
6. **Fireship** - Fast-paced modern development
7. **The Coding Sloth** - Practical web projects
8. **NetworkChuck** - Networking and cybersecurity
9. **Professor Messer** - IT fundamentals
10. **Jeff Geerling** - DevOps and infrastructure
11. **Code Bullet** - AI and creative coding
12. **freeCodeCamp.org** - Full-length courses

Each channel includes a detailed description of their content focus and why it's valuable for students learning programming and computer science concepts.

## Technical Details

### CSS Updates

Added styles for draggable components:
```css
.react-draggable-dragging {
  z-index: 1000 !important;
}

.react-resizable-handle {
  z-index: 100;
}
```

### Component Boundaries

All draggable components are bounded within the viewport using:
```javascript
bounds="parent"
```

This prevents users from dragging components off-screen.