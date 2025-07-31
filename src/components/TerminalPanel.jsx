import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../store/AppStore';
import Button from './ui/Button';

/**
 * Terminal panel component for displaying output and handling input
 * @returns {JSX.Element} The terminal panel
 */
function TerminalPanel() {
  const { 
    terminalOutput, 
    terminalInput, 
    setTerminalInput,
    clearTerminalOutput,
    addTerminalOutput,
    isWaitingForInput
  } = useApp();
  
  const terminalRef = useRef(null);
  const inputRef = useRef(null);
  const [inputHistory, setInputHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Auto-scroll terminal to bottom when new output is added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  // Focus input when waiting for input
  useEffect(() => {
    if (isWaitingForInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isWaitingForInput]);

  // Handle input submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (terminalInput.trim()) {
      // Add to output as user input
      addTerminalOutput(`> ${terminalInput}`, 'text-green-400');
      
      // Add to history
      setInputHistory(prev => [...prev, terminalInput]);
      setHistoryIndex(-1);
      
      // TODO: Send input to worker
      console.log('Terminal input:', terminalInput);
      
      // Clear input
      setTerminalInput('');
    }
  };

  // Handle input key events (history navigation)
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp' && inputHistory.length > 0) {
      e.preventDefault();
      const newIndex = historyIndex < inputHistory.length - 1 ? historyIndex + 1 : historyIndex;
      setHistoryIndex(newIndex);
      setTerminalInput(inputHistory[inputHistory.length - 1 - newIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setTerminalInput(inputHistory[inputHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setTerminalInput('');
      }
    }
  };

  return (
    <motion.div 
      className="flex flex-col h-full terminal-panel"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      {/* Terminal header */}
      <div className="flex justify-between items-center p-3 bg-secondary-800 border-b border-secondary-700 flex-shrink-0">
        <h2 className="text-base font-semibold text-primary-400 flex items-center">
          <i className="fas fa-terminal mr-2 text-primary-400" />
          Terminal
        </h2>
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={clearTerminalOutput}
            icon="fas fa-trash-alt"
            title="Clear terminal output"
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Terminal content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Output area */}
        <div 
          ref={terminalRef}
          className="flex-1 overflow-y-auto p-3 bg-secondary-900 font-mono text-sm leading-relaxed min-h-0"
        >
          <AnimatePresence>
            {terminalOutput.map((output, index) => (
              <motion.div
                key={`${output.timestamp}-${index}`}
                className={`whitespace-pre-wrap ${output.className || 'text-secondary-100'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {output.text}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Welcome message if terminal is empty */}
          {terminalOutput.length === 0 && (
            <motion.div 
              className="text-secondary-400 italic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Welcome to LCC.js Terminal
              <br />
              Type commands here or use the Run button to execute your code.
            </motion.div>
          )}
        </div>

        {/* Input area */}
        <form 
          onSubmit={handleSubmit}
          className="border-t border-secondary-700 p-2 bg-secondary-800 flex-shrink-0"
        >
          <div className="flex items-center space-x-2">
            <span className="text-primary-400 font-mono text-sm">$</span>
            <input
              ref={inputRef}
              type="text"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isWaitingForInput ? "Program is waiting for input..." : "Type here and press Enter"}
              className="flex-1 bg-transparent text-secondary-100 placeholder-secondary-500 font-mono text-sm focus:outline-none"
              autoComplete="off"
            />
            {isWaitingForInput && (
              <motion.div
                className="w-2 h-4 bg-primary-400 rounded-sm"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </div>
        </form>
      </div>

      {/* Terminal status */}
      <div className="flex justify-between items-center px-3 py-2 bg-secondary-800 border-t border-secondary-700 text-xs text-secondary-400 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <span>Lines: {terminalOutput.length}</span>
          {isWaitingForInput && (
            <span className="text-yellow-400 flex items-center">
              <i className="fas fa-clock mr-1" />
              Waiting for input...
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-green-400">Ready</span>
        </div>
      </div>
    </motion.div>
  );
}

export default TerminalPanel;