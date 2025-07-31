import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../store/AppStore';

/**
 * Command palette component for quick actions and navigation
 * @returns {JSX.Element} The command palette modal
 */
function CommandPalette() {
  const { 
    isCommandPaletteOpen, 
    toggleCommandPalette,
  } = useApp();
  
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Available commands
  const commands = [
    {
      id: 'run',
      label: 'Run Program',
      description: 'Execute the current assembly program',
      icon: 'fas fa-play',
      action: () => console.log('Run program'),
      keywords: ['run', 'execute', 'start']
    },
    {
      id: 'new',
      label: 'New File',
      description: 'Create a new assembly file',
      icon: 'fas fa-file-plus',
      action: () => console.log('New file'),
      keywords: ['new', 'create', 'file']
    },
    {
      id: 'open',
      label: 'Open File',
      description: 'Open an existing file',
      icon: 'fas fa-folder-open',
      action: () => console.log('Open file'),
      keywords: ['open', 'load', 'file']
    },
    {
      id: 'save',
      label: 'Save File',
      description: 'Save the current file',
      icon: 'fas fa-save',
      action: () => console.log('Save file'),
      keywords: ['save', 'write', 'file']
    },
    {
      id: 'demo',
      label: 'Load Demo',
      description: 'Load the a1test.a demo file',
      icon: 'fas fa-file-code',
      action: () => console.log('Load demo'),
      keywords: ['demo', 'example', 'sample', 'a1test']
    },
    {
      id: 'clear',
      label: 'Clear Terminal',
      description: 'Clear the terminal output',
      icon: 'fas fa-trash-alt',
      action: () => console.log('Clear terminal'),
      keywords: ['clear', 'clean', 'terminal', 'output']
    },
    {
      id: 'theme',
      label: 'Toggle Theme',
      description: 'Switch between light and dark mode',
      icon: 'fas fa-palette',
      action: () => console.log('Toggle theme'),
      keywords: ['theme', 'dark', 'light', 'mode']
    },
    {
      id: 'download',
      label: 'Download All Files',
      description: 'Download all generated files as TXT',
      icon: 'fas fa-download',
      action: () => console.log('Download all'),
      keywords: ['download', 'export', 'all', 'files']
    }
  ];

  // Filter commands based on query
  const filteredCommands = commands.filter(command => {
    const searchText = query.toLowerCase();
    return (
      command.label.toLowerCase().includes(searchText) ||
      command.description.toLowerCase().includes(searchText) ||
      command.keywords.some(keyword => keyword.includes(searchText))
    );
  });

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isCommandPaletteOpen) return;
      
      switch (e.key) {
        case 'Escape':
          toggleCommandPalette();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            toggleCommandPalette();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, filteredCommands, selectedIndex, toggleCommandPalette]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isCommandPaletteOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCommandPaletteOpen]);

  // Reset state when closing
  useEffect(() => {
    if (!isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isCommandPaletteOpen]);

  return (
    <AnimatePresence>
      {isCommandPaletteOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleCommandPalette}
          />
          
          {/* Command palette */}
          <motion.div
            className="fixed top-20 left-1/2 transform -translate-x-1/2 w-full max-w-lg bg-secondary-800 rounded-lg shadow-xl border border-secondary-700 z-50"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Search input */}
            <div className="p-4 border-b border-secondary-700">
              <div className="flex items-center space-x-3">
                <i className="fas fa-search text-secondary-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type a command..."
                  className="flex-1 bg-transparent text-secondary-100 placeholder-secondary-400 focus:outline-none"
                />
                <kbd className="px-2 py-1 text-xs bg-secondary-700 text-secondary-300 rounded">
                  ESC
                </kbd>
              </div>
            </div>
            
            {/* Command list */}
            <div className="max-h-80 overflow-y-auto">
              {filteredCommands.length > 0 ? (
                <div className="py-2">
                  {filteredCommands.map((command, index) => (
                    <motion.div
                      key={command.id}
                      className={`flex items-center space-x-3 px-4 py-3 cursor-pointer transition-colors ${
                        index === selectedIndex
                          ? 'bg-primary-600 text-white'
                          : 'text-secondary-100 hover:bg-secondary-700'
                      }`}
                      onClick={() => {
                        command.action();
                        toggleCommandPalette();
                      }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <i className={`${command.icon} w-4 text-center`} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {command.label}
                        </div>
                        <div className={`text-sm truncate ${
                          index === selectedIndex ? 'text-primary-100' : 'text-secondary-400'
                        }`}>
                          {command.description}
                        </div>
                      </div>
                      <kbd className={`px-2 py-1 text-xs rounded ${
                        index === selectedIndex 
                          ? 'bg-primary-700 text-primary-100' 
                          : 'bg-secondary-700 text-secondary-300'
                      }`}>
                        ↵
                      </kbd>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-secondary-400">
                  <i className="fas fa-search text-2xl mb-2" />
                  <div>No commands found</div>
                  <div className="text-sm">Try a different search term</div>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="px-4 py-3 border-t border-secondary-700 text-xs text-secondary-400 flex justify-between">
              <div className="flex space-x-4">
                <span><kbd className="bg-secondary-700 px-1 rounded">↑↓</kbd> Navigate</span>
                <span><kbd className="bg-secondary-700 px-1 rounded">↵</kbd> Select</span>
              </div>
              <span><kbd className="bg-secondary-700 px-1 rounded">ESC</kbd> Close</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default CommandPalette;