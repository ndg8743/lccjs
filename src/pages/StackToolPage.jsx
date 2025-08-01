import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../store/AppStore';
import StackVisualizer from '../components/visualizer/StackVisualizer';
import RegisterPanel from '../components/visualizer/RegisterPanel';
import MemoryPanel from '../components/visualizer/MemoryPanel';
import CodeEditor from '../components/visualizer/CodeEditor';
import ExecutionControls from '../components/visualizer/ExecutionControls';
import InstructionReference from '../components/visualizer/InstructionReference';
import FileSelector from '../components/visualizer/FileSelector';
import Button from '../components/ui/Button';

/**
 * LCC Stack Visualizer Tool Page
 * Provides step-through execution visualization for LCC assembly programs
 */
function StackToolPage() {
  const { isDarkMode, toggleDarkMode } = useApp();
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [selectedFile, setSelectedFile] = useState('a1test.a');
  
  // Visualizer state with proper change tracking
  const [code, setCode] = useState('');
  const [currentLine, setCurrentLine] = useState(-1);
  const [output, setOutput] = useState([]);
  
  // Current state
  const [registers, setRegisters] = useState({
    r0: 0, r1: 0, r2: 0, r3: 0, r4: 0, r5: 0, r6: 0, r7: 0,
    pc: 0x3000, sp: 0xFFF0, fp: 0xFFF0, lr: 0, ir: 0,
    n: false, z: false, c: false, v: false
  });
  
  // Previous state for change highlighting
  const [previousRegisters, setPreviousRegisters] = useState({});
  const [previousMemory, setPreviousMemory] = useState(new Uint16Array(65536));
  const [previousStack, setPreviousStack] = useState([]);
  
  const [memory, setMemory] = useState(new Uint16Array(65536));
  const [stack, setStack] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [executionSpeed, setExecutionSpeed] = useState(1000);
  const [error, setError] = useState(null);
  const [showReference, setShowReference] = useState(false);

  // Core state
  const [program, setProgram] = useState([]);
  const [symbols, setSymbols] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [runInterval, setRunInterval] = useState(null);

  // Set dark mode on mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.body.className = isDarkMode
      ? 'bg-gray-900 text-white overflow-hidden'
      : 'bg-gray-50 text-gray-900 overflow-hidden';
  }, [isDarkMode]);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      const isMobileNow = window.innerWidth < 768;
      setIsMobile(isMobileNow);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (runInterval) {
        clearInterval(runInterval);
      }
    };
  }, [runInterval]);

  // Load demo file
  useEffect(() => {
    fetch('/demos/a1test.a')
      .then(res => res.text())
      .then(content => {
        setCode(content);
        setSelectedFile('a1test.a');
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error loading demo:', err);
        setCode('; Error loading demo\nhalt');
        setIsLoading(false);
      });
  }, []);

  // Handle file selection
  const handleFileSelect = (fileName) => {
    const { fileTree } = useApp.getState();
    const fileContent = fileTree[fileName];
    if (fileContent) {
      setCode(fileContent);
      setSelectedFile(fileName);
      setCurrentLine(0);
      setOutput([]);
      // Reset LCC state
      const newRegisters = {
        r0: 0, r1: 0, r2: 0, r3: 0, r4: 0, r5: 0, r6: 0, r7: 0,
        pc: 0x3000, sp: 0xFFF0, fp: 0xFFF0, lr: 0, ir: 0,
        n: false, z: false, c: false, v: false
      };
      setRegisters(newRegisters);
      setPreviousRegisters({});
      setMemory(new Uint16Array(65536));
      setPreviousMemory(new Uint16Array(65536));
      setStack([]);
      setPreviousStack([]);
      setCurrentStep(0);
    }
  };

  // Simple assembler - parse the code into executable steps
  const assembleCode = useCallback((sourceCode) => {
    try {
      const lines = sourceCode.split('\n');
      const newSymbols = {};
      const newProgram = [];
      let address = 0x3000;
      
      // First pass - collect labels
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(';')) return;
        
        const labelMatch = trimmed.match(/^(\w+):/);
        if (labelMatch) {
          newSymbols[labelMatch[1]] = address;
        }
        
        // Count instruction
        if (trimmed && !trimmed.startsWith('.')) {
          address++;
        }
      });
      
      // Second pass - create program
      address = 0x3000;
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(';')) return;
        
        // Skip label
        const cleanLine = trimmed.replace(/^\w+:\s*/, '');
        if (!cleanLine) return;
        
        const parts = cleanLine.split(/\s+/);
        const opcode = parts[0].toLowerCase();
        const operands = parts.slice(1).join(' ').split(',').map(op => op.trim());
        
        newProgram.push({
          line: index,
          address: address,
          opcode: opcode,
          operands: operands,
          original: line,
          executed: false
        });
        
        address++;
      });
      
      setProgram(newProgram);
      setSymbols(newSymbols);
      setError(null);
      return true;
    } catch (err) {
      setError(`Assembly error: ${err.message}`);
      return false;
    }
  }, []);

  // Execute a single instruction step
  const executeStep = useCallback((stepIndex, currentRegisters, currentMemory, currentStack, currentSymbols) => {
    if (stepIndex >= program.length) return false;
    
    const step = program[stepIndex];
    
    // Save previous state for highlighting
    setPreviousRegisters({ ...currentRegisters });
    setPreviousMemory(new Uint16Array(currentMemory));
    setPreviousStack([...currentStack]);
    
    const newRegisters = { ...currentRegisters };
    const newMemory = new Uint16Array(currentMemory);
    const newStack = [...currentStack];
    
    // Update current line and IR
    setCurrentLine(step.line);
    newRegisters.ir = step.address;
    
    // Execute based on opcode
    switch (step.opcode) {
      case 'halt':
        setOutput(prev => [...prev, 'Program halted']);
        return false;
        
      case 'nl':
        setOutput(prev => [...prev, '']);
        break;
        
      case 'dout':
        const doutReg = step.operands[0] ? step.operands[0].replace(/r/i, '') : '0';
        const value = toSigned16(newRegisters[`r${doutReg}`]);
        setOutput(prev => [...prev, value.toString()]);
        break;
        
      case 'lea':
        const leaReg = step.operands[0].replace(/r/i, '');
        const leaLabel = step.operands[1];
        if (currentSymbols[leaLabel] !== undefined) {
          newRegisters[`r${leaReg}`] = currentSymbols[leaLabel];
          setFlags(newRegisters, newRegisters[`r${leaReg}`]);
        }
        break;
        
      case 'add':
        const addReg = step.operands[0].replace(/r/i, '');
        const addSrc1 = step.operands[1].replace(/r/i, '');
        const addSrc2 = step.operands[2];
        
        let addResult;
        if (addSrc2.match(/^r\d$/i)) {
          const addSrc2Reg = addSrc2.replace(/r/i, '');
          addResult = toSigned16(newRegisters[`r${addSrc1}`]) + toSigned16(newRegisters[`r${addSrc2Reg}`]);
        } else {
          const imm = parseInt(addSrc2);
          addResult = toSigned16(newRegisters[`r${addSrc1}`]) + imm;
        }
        
        newRegisters[`r${addReg}`] = addResult & 0xFFFF;
        setFlags(newRegisters, newRegisters[`r${addReg}`]);
        break;
        
      case 'and':
        const andReg = step.operands[0].replace(/r/i, '');
        const andSrc1 = step.operands[1].replace(/r/i, '');
        const andSrc2 = step.operands[2];
        
        let andResult;
        if (andSrc2.match(/^r\d$/i)) {
          const andSrc2Reg = andSrc2.replace(/r/i, '');
          andResult = newRegisters[`r${andSrc1}`] & newRegisters[`r${andSrc2Reg}`];
        } else {
          const imm = parseInt(andSrc2);
          andResult = newRegisters[`r${andSrc1}`] & imm;
        }
        
        newRegisters[`r${andReg}`] = andResult & 0xFFFF;
        setFlags(newRegisters, newRegisters[`r${andReg}`]);
        break;
        
      case 'ld':
        const ldReg = step.operands[0].replace(/r/i, '');
        const ldLabel = step.operands[1];
        if (currentSymbols[ldLabel] !== undefined) {
          newRegisters[`r${ldReg}`] = newMemory[currentSymbols[ldLabel]];
          setFlags(newRegisters, newRegisters[`r${ldReg}`]);
        }
        break;
        
      case 'st':
        const stReg = step.operands[0].replace(/r/i, '');
        const stLabel = step.operands[1];
        if (currentSymbols[stLabel] !== undefined) {
          newMemory[currentSymbols[stLabel]] = newRegisters[`r${stReg}`];
        }
        break;
        
      case 'not':
        const notReg = step.operands[0].replace(/r/i, '');
        const notSrc = step.operands[1].replace(/r/i, '');
        newRegisters[`r${notReg}`] = (~newRegisters[`r${notSrc}`]) & 0xFFFF;
        setFlags(newRegisters, newRegisters[`r${notReg}`]);
        break;
        
      case 'br':
        const brLabel = step.operands[0];
        if (currentSymbols[brLabel] !== undefined) {
          const targetStep = program.find(p => p.address === currentSymbols[brLabel]);
          if (targetStep) {
            setCurrentStep(program.indexOf(targetStep));
            setRegisters(newRegisters);
            setMemory(newMemory);
            setStack(newStack);
            return true;
          }
        }
        break;
        
      case 'brz':
        const brzLabel = step.operands[0];
        if (newRegisters.z && currentSymbols[brzLabel] !== undefined) {
          const targetStep = program.find(p => p.address === currentSymbols[brzLabel]);
          if (targetStep) {
            setCurrentStep(program.indexOf(targetStep));
            setRegisters(newRegisters);
            setMemory(newMemory);
            setStack(newStack);
            return true;
          }
        }
        break;
        
      case 'brp':
        const brpLabel = step.operands[0];
        if (!newRegisters.n && !newRegisters.z && currentSymbols[brpLabel] !== undefined) {
          const targetStep = program.find(p => p.address === currentSymbols[brpLabel]);
          if (targetStep) {
            setCurrentStep(program.indexOf(targetStep));
            setRegisters(newRegisters);
            setMemory(newMemory);
            setStack(newStack);
            return true;
          }
        }
        break;
        
      case 'brn':
        const brnLabel = step.operands[0];
        if (newRegisters.n && currentSymbols[brnLabel] !== undefined) {
          const targetStep = program.find(p => p.address === currentSymbols[brnLabel]);
          if (targetStep) {
            setCurrentStep(program.indexOf(targetStep));
            setRegisters(newRegisters);
            setMemory(newMemory);
            setStack(newStack);
            return true;
          }
        }
        break;
        
      case 'jmp':
        const jmpReg = step.operands[0].replace(/r/i, '');
        const jmpAddr = newRegisters[`r${jmpReg}`];
        const targetStep = program.find(p => p.address === jmpAddr);
        if (targetStep) {
          setCurrentStep(program.indexOf(targetStep));
          setRegisters(newRegisters);
          setMemory(newMemory);
          setStack(newStack);
          return true;
        }
        break;
        
      case 'bl':
        const blLabel = step.operands[0];
        if (currentSymbols[blLabel] !== undefined) {
          newRegisters.r7 = newRegisters.pc + 1;
          newRegisters.lr = newRegisters.r7;
          const targetStep = program.find(p => p.address === currentSymbols[blLabel]);
          if (targetStep) {
            setCurrentStep(program.indexOf(targetStep));
            setRegisters(newRegisters);
            setMemory(newMemory);
            setStack(newStack);
            return true;
          }
        }
        break;
        
      case 'blr':
        const blrReg = step.operands[0].replace(/r/i, '');
        newRegisters.r7 = newRegisters.pc + 1;
        newRegisters.lr = newRegisters.r7;
        const blrAddr = newRegisters[`r${blrReg}`];
        const blrTargetStep = program.find(p => p.address === blrAddr);
        if (blrTargetStep) {
          setCurrentStep(program.indexOf(blrTargetStep));
          setRegisters(newRegisters);
          setMemory(newMemory);
          setStack(newStack);
          return true;
        }
        break;
        
      case 'ret':
        const retAddr = newRegisters.r7;
        const retTargetStep = program.find(p => p.address === retAddr);
        if (retTargetStep) {
          setCurrentStep(program.indexOf(retTargetStep));
          setRegisters(newRegisters);
          setMemory(newMemory);
          setStack(newStack);
          return true;
        }
        break;
        
      case 'ldr':
        const ldrReg = step.operands[0].replace(/r/i, '');
        const ldrBase = step.operands[1].replace(/r/i, '');
        const ldrOffset = parseInt(step.operands[2]) || 0;
        const ldrAddr = (newRegisters[`r${ldrBase}`] + ldrOffset) & 0xFFFF;
        newRegisters[`r${ldrReg}`] = newMemory[ldrAddr];
        setFlags(newRegisters, newRegisters[`r${ldrReg}`]);
        break;
        
      case 'str':
        const strReg = step.operands[0].replace(/r/i, '');
        const strBase = step.operands[1].replace(/r/i, '');
        const strOffset = parseInt(step.operands[2]) || 0;
        const strAddr = (newRegisters[`r${strBase}`] + strOffset) & 0xFFFF;
        newMemory[strAddr] = newRegisters[`r${strReg}`];
        break;
    }
    
    // Update PC
    newRegisters.pc = step.address + 1;
    
    // Update special registers
    newRegisters.sp = newRegisters.r6;
    newRegisters.fp = newRegisters.r5;
    newRegisters.lr = newRegisters.r7;
    
    // Mark step as executed
    const updatedProgram = [...program];
    updatedProgram[stepIndex] = { ...step, executed: true };
    setProgram(updatedProgram);
    
    // Update state
    setRegisters(newRegisters);
    setMemory(newMemory);
    setStack(newStack);
    
    return true;
  }, [program]);

  // Helper functions
  const toSigned16 = (value) => {
    value = value & 0xFFFF;
    if (value & 0x8000) {
      return value - 0x10000;
    }
    return value;
  };

  const setFlags = (regs, value) => {
    regs.n = (value & 0x8000) !== 0;
    regs.z = (value & 0xFFFF) === 0;
  };

  // Step handler
  const handleStep = useCallback((steps) => {
    if (!program.length) {
      if (!assembleCode(code)) return;
    }
    
    // Handle stop command
    if (steps === 'stop') {
      if (runInterval) {
        clearInterval(runInterval);
        setRunInterval(null);
        setIsRunning(false);
      }
      return;
    }
    
    // Stop any running execution for new commands
    if (runInterval) {
      clearInterval(runInterval);
      setRunInterval(null);
      setIsRunning(false);
    }
    
    if (steps === 'run' || steps >= 100) {
      // Start continuous execution
      setIsRunning(true);
      const interval = setInterval(() => {
        if (currentStep >= program.length) {
          clearInterval(interval);
          setRunInterval(null);
          setIsRunning(false);
          return;
        }
        
        const canContinue = executeStep(currentStep, registers, memory, stack, symbols);
        if (canContinue) {
          setCurrentStep(prev => prev + 1);
        } else {
          clearInterval(interval);
          setRunInterval(null);
          setIsRunning(false);
        }
      }, 500);
      setRunInterval(interval);
    } else if (steps > 0) {
      // Step forward
      for (let i = 0; i < steps && currentStep < program.length; i++) {
        if (!executeStep(currentStep, registers, memory, stack, symbols)) break;
        setCurrentStep(prev => prev + 1);
      }
    } else if (steps < 0) {
      // Step backward - go to previous step instead of resetting
      if (currentStep > 0) {
        setCurrentStep(prev => prev - 1);
        // TODO: Implement proper step-back with state restoration
      }
    }
  }, [program, code, assembleCode, executeStep, currentStep, runInterval, registers, memory, stack, symbols]);

  // Reset handler
  const handleReset = useCallback(() => {
    // Clear any running interval
    if (runInterval) {
      clearInterval(runInterval);
      setRunInterval(null);
    }
    
    const newRegisters = {
      r0: 0, r1: 0, r2: 0, r3: 0, r4: 0, r5: 0, r6: 0, r7: 0,
      pc: 0x3000, sp: 0xFFF0, fp: 0xFFF0, lr: 0, ir: 0,
      n: false, z: false, c: false, v: false
    };
    
    setRegisters(newRegisters);
    setPreviousRegisters({});
    setMemory(new Uint16Array(65536));
    setPreviousMemory(new Uint16Array(65536));
    setStack([]);
    setPreviousStack([]);
    setCurrentLine(0);
    setOutput([]);
    setCurrentStep(0);
    setIsRunning(false);
    setError(null);
    
    // Re-assemble
    if (code) {
      assembleCode(code);
    }
  }, [code, assembleCode, runInterval]);

  // Auto-assemble when code changes
  useEffect(() => {
    if (code && !isLoading) {
      assembleCode(code);
    }
  }, [code, isLoading, assembleCode]);

  // Mobile layout
  if (isMobile) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="h-screen flex flex-col p-2">
          <div className="mb-2">
            <h1 className="text-xl font-bold text-primary-500">LCC Stack Visualizer</h1>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-center">
                <i className="fas fa-spinner fa-spin text-4xl text-primary-500 mb-4"></i>
                <p className="text-gray-600 dark:text-gray-400">Loading...</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col space-y-2 overflow-hidden">
              {/* Code Editor */}
              <div className="h-1/3 bg-gray-800 rounded-lg overflow-hidden">
                <div className="bg-gray-700 px-2 py-1 text-xs font-semibold">CODE</div>
                <div className="h-full overflow-hidden">
                  <CodeEditor 
                    code={code}
                    setCode={setCode}
                    currentLine={currentLine}
                    error={error}
                    isDarkMode={isDarkMode}
                  />
                </div>
              </div>

              {/* Stack & Registers */}
              <div className="h-1/3 flex space-x-2">
                <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden">
                  <div className="bg-gray-700 px-2 py-1 text-xs font-semibold">STACK</div>
                  <div className="h-full p-2 overflow-auto">
                    <StackVisualizer
                      stack={stack}
                      previousStack={previousStack}
                      sp={registers.sp}
                      fp={registers.fp}
                      isDarkMode={isDarkMode}
                    />
                  </div>
                </div>
                
                <div className="flex-1">
                  <RegisterPanel
                    registers={registers}
                    previousRegisters={previousRegisters}
                    isDarkMode={isDarkMode}
                  />
                </div>
              </div>

              {/* Console & Memory */}
              <div className="h-1/3 flex space-x-2">
                <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden">
                  <div className="bg-gray-700 px-2 py-1 text-xs font-semibold">CONSOLE</div>
                  <div className="h-full p-2 font-mono text-xs overflow-y-auto">
                    {output.map((line, i) => (
                      <div key={i} className="text-green-400">{line}</div>
                    ))}
                  </div>
                </div>
                
                <div className="flex-1">
                  <MemoryPanel
                    memory={memory}
                    previousMemory={previousMemory}
                    pc={registers.pc}
                    sp={registers.sp}
                    isDarkMode={isDarkMode}
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="bg-gray-800 rounded-lg p-2">
                <ExecutionControls
                  onStep={handleStep}
                  onReset={handleReset}
                  isRunning={isRunning}
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop layout - Simplified and stable
  return (
    <div className={`h-screen flex flex-col ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} overflow-hidden`}>
      {/* Header */}
      <div className={`h-12 px-4 flex items-center justify-between flex-shrink-0 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'
      } border-b`}>
        <div className="flex items-center space-x-4">
          <h1 className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            LCC Stack Visualizer
          </h1>
          {selectedFile && (
            <div className={`text-sm px-2 py-1 rounded ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
              <i className="fas fa-file-code mr-1"></i>
              {selectedFile}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={() => setShowFileSelector(true)}
            className={`px-2 sm:px-3 py-1 rounded-md transition-colors ${
              isDarkMode
                ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
            title="Select File"
          >
            <i className="fas fa-folder-open mr-1 sm:mr-2"></i>
            <span className="hidden sm:inline">Files</span>
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className={`px-2 sm:px-3 py-1 rounded-md transition-colors ${
              isDarkMode
                ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            <i className="fas fa-arrow-left mr-1 sm:mr-2"></i>
            <span className="hidden sm:inline">Back</span>
          </button>
          <Button
            variant="secondary"
            onClick={toggleDarkMode}
            icon={isDarkMode ? "fas fa-sun" : "fas fa-moon"}
            className="hidden sm:inline"
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-primary-500 mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-12 grid-rows-6 gap-4 p-4 overflow-hidden">
          {/* Code Editor - Top Left */}
          <div className="col-span-4 row-span-3 bg-gray-800 rounded-lg overflow-hidden shadow-xl">
            <div className="h-full flex flex-col">
              <div className={`px-4 py-2 text-sm font-semibold ${
                isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-200 text-gray-800'
              }`}>
                CODE EDITOR
              </div>
              <div className="flex-1 overflow-hidden">
                <CodeEditor 
                  code={code}
                  setCode={setCode}
                  currentLine={currentLine}
                  error={error}
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>
          </div>

          {/* Console Output - Bottom Left */}
          <div className="col-span-4 row-span-2 bg-gray-800 rounded-lg overflow-hidden shadow-xl">
            <div className="h-full flex flex-col">
              <div className="bg-gray-700 px-4 py-2 text-sm font-semibold">
                CONSOLE OUTPUT
              </div>
              <div className="flex-1 p-4 font-mono text-sm overflow-y-auto">
                {output.map((line, i) => (
                  <motion.div 
                    key={i} 
                    className="text-green-400"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {line}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Controls - Bottom Left */}
          <div className="col-span-4 row-span-1 bg-gray-800 rounded-lg shadow-xl">
            <div className="h-full flex flex-col">
              <div className="bg-gray-700 px-4 py-2 text-sm font-semibold">
                EXECUTION CONTROLS
              </div>
              <div className="flex-1 p-4">
                <ExecutionControls
                  onStep={handleStep}
                  onReset={handleReset}
                  isRunning={isRunning}
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>
          </div>

          {/* Stack Visualizer - Top Right */}
          <div className="col-span-4 row-span-3 bg-gray-800 rounded-lg overflow-hidden shadow-xl">
            <div className="h-full flex flex-col">
              <div className="bg-gray-700 px-4 py-2 text-sm font-semibold">
                STACK VISUALIZATION
              </div>
              <div className="flex-1 p-4 overflow-hidden">
                <StackVisualizer
                  stack={stack}
                  previousStack={previousStack}
                  sp={registers.sp}
                  fp={registers.fp}
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>
          </div>

          {/* Registers - Middle Right */}
          <div className="col-span-4 row-span-2 bg-gray-800 rounded-lg shadow-xl">
            <RegisterPanel
              registers={registers}
              previousRegisters={previousRegisters}
              isDarkMode={isDarkMode}
            />
          </div>

          {/* Memory - Bottom Right */}
          <div className="col-span-4 row-span-1 bg-gray-800 rounded-lg shadow-xl">
            <MemoryPanel
              memory={memory}
              previousMemory={previousMemory}
              pc={registers.pc}
              sp={registers.sp}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      )}

      {/* Reference Toggle */}
      <motion.button
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg ${
          isDarkMode ? 'bg-primary-600 hover:bg-primary-700' : 'bg-primary-500 hover:bg-primary-600'
        } text-white transition-colors z-50`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowReference(!showReference)}
      >
        <i className="fas fa-book text-xl"></i>
      </motion.button>

      {/* File Selector */}
      <FileSelector
        isVisible={showFileSelector}
        onClose={() => setShowFileSelector(false)}
        onFileSelect={handleFileSelect}
      />

      {/* Instruction Reference */}
      <AnimatePresence>
        {showReference && (
          <InstructionReference
            isDarkMode={isDarkMode}
            onClose={() => setShowReference(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default StackToolPage;

