import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../store/AppStore';
import Button from './ui/Button';

/**
 * Header component containing the main navigation and action buttons
 * @returns {JSX.Element} The application header
 */
function Header() {
  const { 
    isDarkMode, 
    toggleDarkMode, 
    toggleHamburgerMenu,
    isProcessing,
    currentFileName,
    loadDemoFile,
    runProgram
  } = useApp();

  const handleRun = async () => {
    await runProgram();
  };

  const handleLoadDemo = async () => {
    await loadDemoFile('a1test.a');
  };

  return (
    <motion.header 
      className="bg-secondary-800 shadow-lg border-b border-secondary-700"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="container mx-auto px-8 py-6 flex justify-between items-center min-w-0">
        {/* Left side - Logo and main actions */}
        <div className="flex items-center space-x-8 min-w-0 flex-1">
          <motion.h1 
            className="text-3xl font-bold text-primary-400 flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            LCC.js
          </motion.h1>
          
          {/* Current file indicator - responsive */}
          <motion.div 
            className="hidden sm:block text-lg text-secondary-300 truncate min-w-0 flex-1 px-6 py-3 bg-secondary-700 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            title={currentFileName}
          >
            <i className="fas fa-file-code mr-2 text-primary-400" />
            {currentFileName}
          </motion.div>
          
          {/* Desktop action buttons */}
          <div className="hidden md:flex space-x-4 flex-shrink-0">
            <Button
              variant="primary"
              size="lg"
              onClick={handleRun}
              disabled={isProcessing}
              icon="fas fa-play"
              className="px-8"
            >
              {isProcessing ? 'Running...' : 'Run Program'}
            </Button>
            
            <Button
              variant="secondary"
              size="lg"
              onClick={handleLoadDemo}
              icon="fas fa-file-code"
              className="px-8"
            >
              Load Demo
            </Button>
          </div>
        </div>

        {/* Right side - Theme toggle and menu */}
        <div className="flex items-center space-x-4 flex-shrink-0">
          {/* Theme toggle button */}
          <Button
            variant="secondary"
            size="lg"
            onClick={toggleDarkMode}
            icon={isDarkMode ? "fas fa-sun" : "fas fa-moon"}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="transition-transform hover:scale-110 px-6"
          />
          
          {/* Hamburger menu button */}
          <Button
            variant="secondary"
            size="lg"
            onClick={toggleHamburgerMenu}
            icon="fas fa-bars"
            title="Menu"
            className="transition-transform hover:scale-110 px-4"
          />
        </div>
      </div>
    </motion.header>
  );
}

export default Header;