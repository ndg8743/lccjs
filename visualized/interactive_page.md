# LCC Stack Visualizer Tool

## Project Overview

The LCC Stack Visualizer Tool is an interactive web-based application designed to help students deeply understand the execution of LCC assembly code through step-by-step visualization of the stack, registers, memory, and instruction execution flow. Integrated into the existing `lccjs` project, this tool provides dynamic and animated visual explanations, reinforcing core assembly programming concepts.

---

## Features

* **Stack Visualization**: Dynamically display stack frames, parameter passing, return addresses, and local variables.
* **Step-by-Step Execution**: Allow stepping forward and backward through code execution, showing real-time updates to the stack, registers, and memory.
* **Register & Memory Panels**: Display register and memory values, including special-purpose registers (`sp`, `fp`, `lr`), with dynamic animations.
* **Interactive Code Editor**: Students can edit assembly code and see immediate visual feedback during execution.
* **Syntax Highlighting**: Clear, color-coded display of assembly instructions for readability.
* **Instruction Reference**: Integrated quick-reference sidebar for all LCC instructions and directives.
* **Error Feedback**: Provide clear, informative error messages for assembly or execution errors.
* **Console Logging**: For now, outputs are printed to the console, and user input is handled via the console as well.
* **Execution Stepping**: Users must input a number (positive or negative) at runtime to control how many steps forward or backward to execute.
* **Responsive Design**: Modern, clean, responsive UI optimized for desktops and tablets.
* **Listing Data**: Each line of LCC assembly generates a simple listing entry object in Pass 2. These are collected in an array and can be sorted or processed for detailed visualization. Each listing entry contains the line number, location counter, source line, and decoded components such as code words, label, mnemonic, operands, and comments.

---

## Tech Stack

* **Frontend**: React.js, JavaScript, HTML5, Tailwind CSS
* **Animation & Visuals**: Framer Motion, Three.js or P5.js or GSAP for advanced user interaction and stack animations
* **Backend Integration**: Existing LCC interpreter backend

---

## Project Structure

```
lccjs/
├── public/
├── src/
│   ├── components/
│   │   ├── StackVisualizer.jsx
│   │   ├── RegisterPanel.jsx
│   │   ├── MemoryPanel.jsx
│   │   ├── CodeEditor.jsx
│   │   └── InstructionReference.jsx
│   ├── pages/
│   │   └── StackToolPage.jsx
│   ├── App.jsx
│   ├── index.js
│   └── context/
│       └── ExecutionContext.js
├── backend/
│   └── interpreter.js
└── README.md
```

---

## AI Agent Prompt

You are tasked with generating the frontend code for the LCC Stack Visualizer Tool, integrated within the existing `lccjs` architecture using React and Tailwind CSS. Follow these steps carefully:

1. **StackVisualizer Component**:

   * Create a visual representation of the stack with clear animations for pushing/popping stack frames.
   * Use Three.js, P5.js, or GSAP to provide advanced 2D/3D or timeline-based animations for stack transitions and highlighting.
   * Highlight stack frame contents including parameters, local variables, and saved registers.

2. **RegisterPanel Component**:

   * Dynamically update and animate the display of general-purpose and special-purpose registers (`sp`, `fp`, `lr`).

3. **MemoryPanel Component**:

   * Visualize memory contents relevant to executed code.
   * Clearly animate and highlight memory access patterns.

4. **CodeEditor Component**:

   * Provide an editable code editor with real-time syntax highlighting.
   * Integrate execution controls: step forward, step backward, run, and reset.

5. **InstructionReference Component**:

   * Create a quick-access sidebar with detailed explanations for each LCC instruction and directive.

6. **Integration**:

   * Ensure seamless integration with existing React components and state/context management within `lccjs`.
   * Utilize existing backend APIs provided by the LCC interpreter for code execution and data retrieval.
   * Note: The current interpreter logs output to the console and accepts user step input through the console (as a signed number indicating steps to take).
   * Each instruction processed during Pass 2 creates a listing object with fields like `lineNum`, `locCtr`, `sourceLine`, `codeWords`, `label`, `mnemonic`, `operands`, and `comment`, stored in a list and ready for sorting and display.

7. **Animation & UX**:

   * Use Framer Motion for basic interface transitions.
   * Use Three.js, P5.js, or GSAP for animating stack frames, register/memory updates, and user interactions.
   * Ensure the UI is modern, intuitive, and responsive using Tailwind CSS.

8. **Error Handling**:

   * Implement clear and informative error feedback for invalid operations or assembly errors.

---

## Output

Your deliverable should be clean, maintainable, and well-documented React components (`.jsx` files), ensuring compatibility with existing `lccjs` standards and using Tailwind CSS for styling and GSAP/Three.js/P5.js for interactive animations.
