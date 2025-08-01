import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../store/AppStore';
import LCCAssembler from '../visualizer/LCCAssembler';
import LCCSimulator from '../visualizer/LCCSimulator';
import StackVisualizer from '../components/visualizer/StackVisualizer';
import RegisterPanel from '../components/visualizer/RegisterPanel';
import MemoryPanel from '../components/visualizer/MemoryPanel';
import CodeEditor from '../components/visualizer/CodeEditor';
import ExecutionControls from '../components/visualizer/ExecutionControls';
import InstructionReference from '../components/visualizer/InstructionReference';
import FileSelector from '../components/visualizer/FileSelector';
import FileSidebar from '../components/FileSidebar';
import Button from '../components/ui/Button';
import Panel from '../components/ui/Panel';
import Header from '../components/Header';

/**
 * LCC Stack Visualizer Tool Page
 * Provides step-through execution visualization for LCC assembly programs
 * Now using the real LCC assembler and interpreter
 */
function StackToolPage() {
  const { isDarkMode, toggleDarkMode } = useApp();
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [selectedFile, setSelectedFile] = useState('a1test.a');
  const [showFileSidebar, setShowFileSidebar] = useState(false);
  
  // LCC Components
  const assemblerRef = useRef(null);
  const simulatorRef = useRef(null);
  
  // Visualizer state
  const [code, setCode] = useState('');
  const [currentLine, setCurrentLine] = useState(-1);
  const [output, setOutput] = useState([]);
  const [error, setError] = useState(null);
  
  // Machine state
  const [registers, setRegisters] = useState({
    r0: 0, r1: 0, r2: 0, r3: 0, r4: 0, r5: 0, r6: 0, r7: 0,
    pc: 0x3000, sp: 0xFFF0, fp: 0xFFF0, lr: 0, ir: 0
  });
  
  const [flags, setFlags] = useState({
    n: false, z: false, c: false, v: false
  });
  
  const [memory, setMemory] = useState({});
  const [stack, setStack] = useState([]);
  
  // Previous state for change highlighting
  const [previousRegisters, setPreviousRegisters] = useState({});
  const [previousMemory, setPreviousMemory] = useState({});
  const [previousStack, setPreviousStack] = useState([]);
  
  // Execution control
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [executionSpeed, setExecutionSpeed] = useState(500);
  const [runInterval, setRunInterval] = useState(null);
  const [showReference, setShowReference] = useState(false);
  
  // Symbols and program info
  const [symbols, setSymbols] = useState({});
  const [programInfo, setProgramInfo] = useState({});

  // Error boundary
  useEffect(() => {
    const handleError = (event) => {
      console.error('Visualizer error:', event.error);
      setHasError(true);
      setError(event.error.message);
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Set dark mode on mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.body.className = isDarkMode
      ? 'bg-gray-900 text-white overflow-hidden'
      : 'bg-gray-50 text-gray-900 overflow-hidden';
  }, [isDarkMode]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
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
    const { fileTree } = useApp();
    const fileContent = fileTree[fileName];
    if (fileContent) {
      setCode(fileContent);
      setSelectedFile(fileName);
      setShowFileSelector(false);
      handleReset();
    }
  };

  // Assemble code using LCC assembler
  const assembleCode = useCallback(async (sourceCode) => {
    try {
      // Create new assembler instance
      assemblerRef.current = new LCCAssembler();
      
      // Assemble the code
      const result = assemblerRef.current.assemble(sourceCode);
      
      if (!result.success) {
        setError(`Assembly errors:\n${result.errors.join('\n')}`);
        return false;
      }
      
      // Store symbols and program info
      setSymbols(result.symbols);
      setProgramInfo({
        loadAddress: result.loadAddress,
        programSize: result.machineCode.length
      });
      
      // Create and initialize simulator
      simulatorRef.current = new LCCSimulator();
      simulatorRef.current.loadProgram(result.machineCode, result.loadAddress);
      simulatorRef.current.symbols = result.symbols;
      simulatorRef.current.sourceMap = result.sourceMap;
      
      // Get initial state
      const initialState = simulatorRef.current.getState();
      updateState(initialState);
      
      setError(null);
      return true;
    } catch (err) {
      setError(`Assembly error: ${err.message}`);
      return false;
    }
  }, []);

  // Update visualizer state from bridge state
  const updateState = useCallback((state) => {
    setRegisters(state.registers || {});
    setFlags(state.flags || { n: false, z: false, c: false, v: false });
    setMemory(state.memory || {});
    setStack(state.stack || []);
    
    // Handle output properly - split by newlines and filter empty lines
    if (state.output) {
      const outputLines = state.output.split('\n').filter(line => line.trim() !== '');
      setOutput(outputLines);
    } else {
      setOutput([]);
    }
  }, []);

  // Execute single step
  const executeStep = useCallback(() => {
    if (!simulatorRef.current) return false;
    
    // Save previous state
    const prevState = simulatorRef.current.getState();
    setPreviousRegisters(prevState.registers);
    setPreviousMemory(prevState.memory);
    setPreviousStack(prevState.stack);
    
    // Execute one instruction
    const result = simulatorRef.current.step();
    
    if (!result.success) {
      if (result.halted) {
        setOutput(prev => [...prev, 'Program halted']);
        setIsRunning(false);
      } else if (result.error) {
        setError(result.error);
        setIsRunning(false);
      }
      return false;
    }
    
    // Get new state
    const newState = simulatorRef.current.getState();
    updateState(newState);
    
    // Update current line from source map
    const sourceLine = simulatorRef.current.sourceMap.get(result.pc);
    if (sourceLine !== undefined) {
      setCurrentLine(sourceLine);
    }
    
    return true;
  }, [updateState]);

  // Run to completion with correct output
  const runToCompletion = useCallback(async () => {
    if (!assembleCode(code)) {
      return;
    }
    
    setIsRunning(true);
    setCurrentLine(-1);
    
    // Get correct output from worker
    try {
      const { runProgram, terminalOutput } = useApp.getState();
      const initialOutputLength = terminalOutput.length;
      
      // Set the current file content in the store
      const { setEditorContent, setCurrentFileName } = useApp.getState();
      setEditorContent(code);
      setCurrentFileName(selectedFile || 'program.a');
      
      await runProgram(); // This will generate the correct output
      
      // Extract the program output from terminal
      const newOutput = terminalOutput.slice(initialOutputLength);
      const programOutput = newOutput
        .filter(line => !line.includes('Running program') && !line.includes('✓') && !line.includes('✗'))
        .join('\n');
      
      if (programOutput) {
        setOutput(programOutput.split('\n').filter(line => line.trim() !== ''));
      }
    } catch (error) {
      console.warn('Worker execution failed:', error);
    }
    
    // Also run the simulator to completion (for visualization state)
    try {
      while (simulatorRef.current && simulatorRef.current.running && simulatorRef.current.instructionsExecuted < 10000) {
        if (!executeStep()) {
          break;
        }
      }
    } catch (error) {
      setError(`Runtime error: ${error.message}`);
    }
    
    setIsRunning(false);
  }, [code, assembleCode, executeStep, selectedFile, updateState, setError]);

  // Step handler
  const handleStep = useCallback((steps = 1) => {
    if (steps === 'run') {
      // Run to completion
      runToCompletion();
    } else if (steps === 'step-run') {
      // Run continuously with steps
      setIsRunning(true);
      const interval = setInterval(() => {
        if (!executeStep()) {
          clearInterval(interval);
          setRunInterval(null);
          setIsRunning(false);
        }
      }, executionSpeed);
      setRunInterval(interval);
    } else if (steps === 'stop') {
      // Stop running
      if (runInterval) {
        clearInterval(runInterval);
        setRunInterval(null);
      }
      setIsRunning(false);
    } else if (typeof steps === 'number') {
      // Clear any running interval
      if (runInterval) {
        clearInterval(runInterval);
        setRunInterval(null);
      }
      
      if (steps > 0) {
        // Single step forward
        if (!simulatorRef.current) {
          assembleCode(code);
        } else {
          executeStep();
        }
      } else if (steps < 0) {
        // Step backward
        if (!simulatorRef.current) {
          setError('Please assemble the code first');
          return;
        }
        
        // Use the new stepBy method
        simulatorRef.current.stepBy(steps);
        
        // Update state to reflect the restored position
        const state = simulatorRef.current.getState();
        updateState(state);
        
        // Update current line
        if (state.currentIteration > 0) {
          const listing = simulatorRef.current.getCurrentListing();
          if (listing && listing.lineNum !== undefined) {
            setCurrentLine(listing.lineNum - 1); // Convert to 0-based
          }
        } else {
          setCurrentLine(-1);
        }
      }
    }
  }, [code, assembleCode, executeStep, runInterval, executionSpeed, updateState, setError]);

  // Reset handler
  const handleReset = useCallback(() => {
    // Clear any running interval
    if (runInterval) {
      clearInterval(runInterval);
      setRunInterval(null);
    }
    
    // Reset visualizer state
    setRegisters({
      r0: 0, r1: 0, r2: 0, r3: 0, r4: 0, r5: 0, r6: 0, r7: 0,
      pc: 0x3000, sp: 0xFFF0, fp: 0xFFF0, lr: 0, ir: 0
    });
    setFlags({ n: false, z: false, c: false, v: false });
    setPreviousRegisters({});
    setMemory({});
    setPreviousMemory({});
    setStack([]);
    setPreviousStack([]);
    setCurrentLine(-1);
    setOutput([]);
    setIsRunning(false);
    setError(null);
    
    // Reset simulator
    assemblerRef.current = null;
    simulatorRef.current = null;
    
    // Re-assemble if we have code
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

  // Error recovery
  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center p-8">
          <h1 className="text-3xl font-bold mb-4">Visualizer Error</h1>
          <p className="text-red-400 mb-4">{error || 'An unexpected error occurred'}</p>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading visualizer...</p>
        </div>
      </div>
    );
  }

  // Mobile layout
  if (isMobile) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">LCC Stack Visualizer</h1>
          <p className="text-yellow-400 mb-4">
            ⚠️ The visualizer is optimized for desktop viewing. 
            Please use a larger screen for the best experience.
          </p>
          <Button onClick={() => window.location.href = '/'}>
            Return to Main App
          </Button>
        </div>
      </div>
    );
  }

  // Main desktop layout
  return (
    <div className={`h-screen flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <Header 
        showFileSidebar={showFileSidebar}
        onToggleFileSidebar={() => setShowFileSidebar(!showFileSidebar)}
        showReference={showReference}
        onToggleReference={() => setShowReference(!showReference)}
      />
      
      {/* Visualizer Sub-Header */}
      <div className="bg-gray-800 text-white px-6 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold">Stack Visualizer</h2>
          <span className="text-sm text-gray-400">
            {selectedFile || 'No file selected'}
          </span>
        </div>
        
        <Button 
          size="sm" 
          variant="ghost"
          onClick={() => window.location.href = '/'}
          className="text-gray-300 hover:text-white"
        >
          ← Back to IDE
        </Button>
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Sidebar - Always visible */}
        <motion.div 
          className="w-80 border-r border-gray-700 bg-gray-800 flex-shrink-0"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: showFileSidebar ? 320 : 0, opacity: showFileSidebar ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {showFileSidebar && (
            <FileSidebar
              isDarkMode={isDarkMode}
              isOpen={true}
              onToggle={() => setShowFileSidebar(false)}
              onFileSelect={handleFileSelect}
            />
          )}
        </motion.div>

        {/* Main Visualizer Content */}
        <div className="flex-1 overflow-hidden">
          {/* Main Content - CSS Grid Layout */}
          <div className="h-full p-4 overflow-hidden">
            <div className="h-full grid grid-cols-12 grid-rows-6 gap-4">
          {/* Code Editor - Left Side */}
          <div className="col-span-4 row-span-4 bg-gray-800 rounded-lg shadow-xl overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="bg-gray-700 px-4 py-2 text-sm font-semibold">
                ASSEMBLY CODE
              </div>
              <div className="flex-1 overflow-hidden">
                <CodeEditor
                  code={code}
                  onChange={setCode}
                  currentLine={currentLine}
                  isDarkMode={isDarkMode}
                  readOnly={isRunning}
                />
              </div>
            </div>
          </div>

          {/* Stack Visualizer - Middle Bottom */}
          <div className="col-span-4 row-span-5 bg-gray-800 rounded-lg overflow-hidden shadow-xl">
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
          <div className="col-span-4 row-span-3 bg-gray-800 rounded-lg shadow-xl">
            <RegisterPanel
              registers={{ ...registers, ...flags }}
              previousRegisters={{ ...previousRegisters }}
              isDarkMode={isDarkMode}
            />
          </div>

          {/* Memory - Bottom Right */}
          <div className="col-span-4 row-span-3 bg-gray-800 rounded-lg shadow-xl">
            <MemoryPanel
              memory={memory}
              previousMemory={previousMemory}
              pc={registers.pc}
              sp={registers.sp}
              isDarkMode={isDarkMode}
            />
          </div>

          {/* Output - Middle Top */}
          <div className="col-span-4 row-span-2">
            <Panel 
              title="OUTPUT" 
              isDarkMode={isDarkMode}
              headerActions={
                <button
                  onClick={() => setOutput([])}
                  className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1"
                >
                  Clear
                </button>
              }
            >
              <div className="font-mono text-sm">
                {output.map((line, idx) => (
                  <div key={idx} className="text-green-400">
                    {line || '\u00A0'}
                  </div>
                ))}
                {error && (
                  <div className="text-red-400 mt-2">
                    Error: {error}
                  </div>
                )}
              </div>
            </Panel>
          </div>

          {/* Controls - Top Right */}
          <div className="col-span-4 row-span-1">
            <Panel title="EXECUTION CONTROLS" isDarkMode={isDarkMode} noPadding>
              <ExecutionControls
                onStep={handleStep}
                onReset={handleReset}
                isRunning={isRunning}
                isDarkMode={isDarkMode}
                compact={true}
              />
            </Panel>
          </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instruction Reference */}
      <AnimatePresence>
        {showReference && (
          <InstructionReference
            onClose={() => setShowReference(false)}
            isDarkMode={isDarkMode}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Error boundary wrapper
class StackToolErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Stack tool error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center p-8">
            <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
            <p className="text-red-400 mb-4">{this.state.error?.message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Export with error boundary
export default function StackToolPageWithErrorBoundary() {
  return (
    <StackToolErrorBoundary>
      <StackToolPage />
    </StackToolErrorBoundary>
  );
}