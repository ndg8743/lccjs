import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../store/AppStore';
import Header from './Header';
import EditorPanel from './EditorPanel';
import TerminalPanel from './TerminalPanel';
import FileExplorer from './FileExplorer';
import CommandPalette from './CommandPalette';
import HamburgerMenu from './HamburgerMenu';
import MobileLayout from './MobileLayout';

/**
 * Main layout component that organizes the application structure
 * Responsive design that switches between desktop and mobile layouts
 * @returns {JSX.Element} The main layout with header, panels, and modals
 */
function Layout() {
  const { isDarkMode, isCommandPaletteOpen } = useApp();
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.className = isDarkMode ? 'dark' : '';
    document.body.className = isDarkMode 
      ? 'bg-secondary-900 text-secondary-100 min-h-screen'
      : 'bg-gray-50 text-gray-900 min-h-screen';
  }, [isDarkMode]);

  // Use mobile layout for small screens
  if (isMobile) {
    return (
      <>
        <MobileLayout />
        {isCommandPaletteOpen && <CommandPalette />}
      </>
    );
  }

  // Desktop layout
  return (
    <motion.div 
      className="flex flex-col h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <Header />
      
      {/* Main content area */}
      <main className="flex-1 flex overflow-hidden">
        {/* File Explorer - Resizable sidebar */}
        <motion.div 
          className="border-r border-secondary-700 bg-secondary-800 flex-shrink-0"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 'auto', opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          <FileExplorer />
        </motion.div>
        
        {/* Editor and Terminal */}
        <div className="flex-1 flex flex-col xl:flex-row overflow-hidden">
          {/* Editor Panel */}
          <motion.div 
            className="flex-1 flex flex-col min-h-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <EditorPanel />
          </motion.div>
          
          {/* Terminal Panel */}
          <motion.div 
            className="flex-1 flex flex-col min-h-0 xl:max-w-md xl:border-l xl:border-secondary-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <TerminalPanel />
          </motion.div>
        </div>
      </main>
      
      {/* Modals and Overlays */}
      <HamburgerMenu />
      
      {/* Command Palette */}
      {isCommandPaletteOpen && <CommandPalette />}
    </motion.div>
  );
}

export default Layout;