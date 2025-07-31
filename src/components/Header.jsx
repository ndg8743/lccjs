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
    currentFileName
  } = useApp();

  const handleRun = () => {
    // TODO: Implement run functionality
    console.log('Run button clicked');
  };

  const handleLoadDemo = () => {
    // TODO: Implement demo loading
    console.log('Load demo clicked');
  };

  return (
    <motion.header 
      className="bg-secondary-800 shadow-md border-b border-secondary-700"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Left side - Logo and main actions */}
        <div className="flex items-center space-x-4">
          <motion.h1 
            className="text-xl font-bold text-primary-400"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            LCC.js
          </motion.h1>
          
          {/* Current file indicator */}
          <motion.div 
            className="hidden sm:block text-sm text-secondary-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {currentFileName}
          </motion.div>
          
          {/* Desktop action buttons */}
          <div className="hidden md:flex space-x-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleRun}
              disabled={isProcessing}
              icon="fas fa-play"
            >
              {isProcessing ? 'Running...' : 'Run'}
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLoadDemo}
              icon="fas fa-file-code"
            >
              Load a1test.a
            </Button>
          </div>
        </div>

        {/* Right side - Theme toggle and menu */}
        <div className="flex items-center space-x-2">
          {/* Theme toggle button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleDarkMode}
            icon={isDarkMode ? "fas fa-sun" : "fas fa-moon"}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="transition-transform hover:scale-110"
          />
          
          {/* Hamburger menu button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleHamburgerMenu}
            icon="fas fa-bars"
            title="Menu"
            className="transition-transform hover:scale-110"
          />
        </div>
      </div>
    </motion.header>
  );
}

export default Header;