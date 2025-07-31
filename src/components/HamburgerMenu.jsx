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
    isProcessing
  } = useApp();

  const handleRun = () => {
    // TODO: Implement run functionality
    console.log('Run button clicked');
    toggleHamburgerMenu();
  };

  const handleLoadDemo = () => {
    // TODO: Implement demo loading
    console.log('Load demo clicked');
    toggleHamburgerMenu();
  };

  const handleNewFile = () => {
    // TODO: Implement new file
    console.log('New file clicked');
    toggleHamburgerMenu();
  };

  const handleOpenFile = () => {
    // TODO: Implement open file
    console.log('Open file clicked');
    toggleHamburgerMenu();
  };

  const handleSaveFile = () => {
    // TODO: Implement save file
    console.log('Save file clicked');
    toggleHamburgerMenu();
  };

  const handleDownloadAll = () => {
    // TODO: Implement download all
    console.log('Download all clicked');
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
      label: 'Download All',
      icon: 'fas fa-download',
      onClick: handleDownloadAll,
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
            className="fixed top-0 right-0 h-full w-80 max-w-full bg-secondary-800 shadow-xl z-50 border-l border-secondary-700"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-secondary-700">
              <h2 className="text-lg font-semibold text-secondary-100">Menu</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleHamburgerMenu}
                icon="fas fa-times"
                title="Close Menu"
              />
            </div>
            
            {/* Menu items */}
            <div className="flex flex-col p-4 space-y-2">
              {menuItems.map((item, index) => {
                if (item.type === 'divider') {
                  return (
                    <motion.div
                      key={`divider-${index}`}
                      className="border-t border-secondary-700 my-2"
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
                      size="md"
                      onClick={item.onClick}
                      disabled={item.disabled}
                      icon={item.icon}
                      className="w-full justify-start"
                    >
                      {item.label}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
            
            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-secondary-700">
              <div className="text-center text-xs text-secondary-400">
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