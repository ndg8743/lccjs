import React, { useEffect, useState, useRef } from 'react';
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
  const [isWideScreen, setIsWideScreen] = useState(false);
  const [editorHeight, setEditorHeight] = useState(60); // Percentage for vertical layout
  const [editorWidth, setEditorWidth] = useState(60); // Percentage for horizontal layout
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  // Check for mobile and wide screen sizes
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768); // md breakpoint
      setIsWideScreen(width >= 1280); // xl breakpoint for side-by-side
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.className = isDarkMode ? 'dark' : '';
    document.body.className = isDarkMode 
      ? 'bg-gray-900 text-gray-100 min-h-screen overflow-hidden'
      : 'bg-gray-50 text-gray-900 min-h-screen overflow-hidden';
  }, [isDarkMode]);

  // Handle mouse events for dragging (vertical layout)
  const handleVerticalMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  };

  const handleVerticalMouseMove = (e) => {
    if (!isDragging || !containerRef.current || isWideScreen) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newHeight = ((e.clientY - containerRect.top) / containerRect.height) * 100;
    
    // Constrain to reasonable bounds (20% - 80%)
    const constrainedHeight = Math.max(20, Math.min(80, newHeight));
    setEditorHeight(constrainedHeight);
  };

  // Handle mouse events for dragging (horizontal layout)
  const handleHorizontalMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleHorizontalMouseMove = (e) => {
    if (!isDragging || !containerRef.current || !isWideScreen) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Constrain to reasonable bounds (30% - 70%)
    const constrainedWidth = Math.max(30, Math.min(70, newWidth));
    setEditorWidth(constrainedWidth);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = isWideScreen ? handleHorizontalMouseMove : handleVerticalMouseMove;
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isWideScreen]);

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
      className="flex flex-col h-screen overflow-hidden bg-gray-900"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.1 }}
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
        
        {/* Editor and Terminal Container */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-hidden"
          style={{ cursor: isDragging ? (isWideScreen ? 'col-resize' : 'row-resize') : 'default' }}
        >
          {isWideScreen ? (
            // Horizontal layout (side by side)
            <div className="flex h-full">
              {/* Editor Panel - Fixed width based on drag */}
              <motion.div 
                className="flex flex-col min-h-0"
                style={{ width: `${editorWidth}%` }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <EditorPanel />
              </motion.div>
              
              {/* Vertical Resizable Splitter */}
              <div
                className="w-1 bg-secondary-600 hover:bg-primary-400 cursor-col-resize transition-colors duration-200 relative group"
                onMouseDown={handleHorizontalMouseDown}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-8 w-1 bg-secondary-500 rounded-full group-hover:bg-primary-400 transition-colors duration-200"></div>
                </div>
              </div>
              
              {/* Terminal Panel - Fixed width based on drag */}
              <motion.div 
                className="flex flex-col min-h-0"
                style={{ width: `${100 - editorWidth}%` }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <TerminalPanel />
              </motion.div>
            </div>
          ) : (
            // Vertical layout (stacked)
            <div className="flex flex-col h-full">
              {/* Editor Panel - Fixed height based on drag */}
              <motion.div 
                className="flex flex-col min-h-0"
                style={{ height: `${editorHeight}%` }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <EditorPanel />
              </motion.div>
              
              {/* Horizontal Resizable Splitter */}
              <div
                className="h-1 bg-secondary-600 hover:bg-primary-400 cursor-row-resize transition-colors duration-200 relative group"
                onMouseDown={handleVerticalMouseDown}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-1 bg-secondary-500 rounded-full group-hover:bg-primary-400 transition-colors duration-200"></div>
                </div>
              </div>
              
              {/* Terminal Panel - Fixed height based on drag */}
              <motion.div 
                className="flex flex-col min-h-0"
                style={{ height: `${100 - editorHeight}%` }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <TerminalPanel />
              </motion.div>
            </div>
          )}
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