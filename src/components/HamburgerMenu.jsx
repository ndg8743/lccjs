import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../store/AppStore';
import Button from './ui/Button';

/**
 * Hamburger menu component for mobile and additional actions
 * @returns {JSX.Element} The hamburger menu overlay
 */
function HamburgerMenu() {
  const { 
    isHamburgerMenuOpen, 
    toggleHamburgerMenu,
    isProcessing,
    runProgram,
    loadDemoFile,
    addFile,
    currentFileName,
    addTerminalOutput,
    openFiles
  } = useApp();

  const handleRun = async () => {
    await runProgram();
    toggleHamburgerMenu();
  };

  const handleLoadDemo = async () => {
    await loadDemoFile('a1test.a');
    toggleHamburgerMenu();
  };

  const handleNewFile = () => {
    const fileName = prompt('Enter file name (e.g., program.a):');
    if (fileName && fileName.trim()) {
      addFile(fileName.trim(), '');
      addTerminalOutput(`Created new file: ${fileName.trim()}`, 'text-green-400');
    }
    toggleHamburgerMenu();
  };

  const handleOpenFile = () => {
    addTerminalOutput('File picker not implemented yet. Use the upload button in the file explorer.', 'text-yellow-400');
    toggleHamburgerMenu();
  };

  const handleSaveFile = () => {
    addTerminalOutput('File saved automatically as you type.', 'text-blue-400');
    toggleHamburgerMenu();
  };

  const handleDownloadAll = () => {
    // Use the global downloadAllAsTxt function from main.js
    console.log('Available window functions:', {
      downloadFile: typeof window.downloadFile,
      downloadAllAsTxt: typeof window.downloadAllAsTxt
    });
    
    if (window.downloadAllAsTxt) {
      console.log('Calling downloadAllAsTxt');
      window.downloadAllAsTxt();
    } else {
      console.error('downloadAllAsTxt function not found on window object');
      addTerminalOutput('Download all function not available. Please refresh the page and try again.', 'text-red-400');
    }
    toggleHamburgerMenu();
  };

  const handleDownload = (extension) => {
    // Use the global downloadFile function from main.js instead of the store version
    console.log('Available window functions:', {
      downloadFile: typeof window.downloadFile,
      downloadAllAsTxt: typeof window.downloadAllAsTxt
    });
    
    if (window.downloadFile) {
      console.log('Calling downloadFile with extension:', extension.replace('.', ''));
      window.downloadFile(extension.replace('.', ''));
    } else {
      console.error('downloadFile function not found on window object');
      addTerminalOutput('Download function not available. Please refresh the page and try again.', 'text-red-400');
    }
    toggleHamburgerMenu();
  };

  const handleOptions = () => {
    addTerminalOutput('Options panel coming soon! For now, use the menu below for file operations.', 'text-blue-400');
    toggleHamburgerMenu();
  };

  const menuItems = [
    {
      label: 'Run Program',
      icon: 'fas fa-play',
      onClick: handleRun,
      disabled: isProcessing,
      variant: 'primary'
    },
    {
      label: 'Load Demo',
      icon: 'fas fa-file-code',
      onClick: handleLoadDemo,
    },
    { type: 'divider' },
    {
      label: 'Options',
      icon: 'fas fa-cog',
      onClick: handleOptions,
    },
    { type: 'divider' },
    {
      label: 'New File',
      icon: 'fas fa-file-plus',
      onClick: handleNewFile,
    },
    {
      label: 'Open File',
      icon: 'fas fa-folder-open',
      onClick: handleOpenFile,
    },
    {
      label: 'Save File',
      icon: 'fas fa-save',
      onClick: handleSaveFile,
    },
    { type: 'divider' },
    {
      label: 'Download .a',
      icon: 'fas fa-download',
      onClick: () => handleDownload('.a'),
    },
    {
      label: 'Download .lst',
      icon: 'fas fa-download',
      onClick: () => handleDownload('.lst'),
    },
    {
      label: 'Download .bst',
      icon: 'fas fa-download',
      onClick: () => handleDownload('.bst'),
    },
    {
      label: 'Download .e',
      icon: 'fas fa-download',
      onClick: () => handleDownload('.e'),
    },
    {
      label: 'Download All',
      icon: 'fas fa-download',
      onClick: handleDownloadAll,
      disabled: openFiles.length === 0
    },
  ];

  return (
    <AnimatePresence>
      {isHamburgerMenuOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleHamburgerMenu}
          />
          
          {/* Menu panel */}
          <motion.div
            className="fixed top-0 right-0 h-full w-80 max-w-full bg-secondary-800 shadow-2xl z-50 border-l border-secondary-700"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-secondary-700">
              <h2 className="text-xl font-semibold text-secondary-100">Menu</h2>
              <Button
                variant="ghost"
                size="md"
                onClick={toggleHamburgerMenu}
                icon="fas fa-times"
                title="Close Menu"
                className="p-2"
              />
            </div>
            
            {/* Menu items */}
            <div className="flex flex-col p-6 space-y-3">
              {menuItems.map((item, index) => {
                if (item.type === 'divider') {
                  return (
                    <motion.div
                      key={`divider-${index}`}
                      className="border-t border-secondary-700 my-4"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: index * 0.05 }}
                    />
                  );
                }
                
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Button
                      variant={item.variant || 'ghost'}
                      size="lg"
                      onClick={item.onClick}
                      disabled={item.disabled}
                      icon={item.icon}
                      className="w-full justify-start px-6 py-4 text-left"
                    >
                      {item.label}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
            
            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-secondary-700">
              <div className="text-center text-sm text-secondary-400">
                LCC.js - Educational Assembly IDE
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default HamburgerMenu;