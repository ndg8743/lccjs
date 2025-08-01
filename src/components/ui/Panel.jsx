import React from 'react';
import { motion } from 'framer-motion';

/**
 * Reusable panel component with consistent styling and overflow handling
 * @param {Object} props - Component props
 * @param {string} props.title - Panel title
 * @param {React.ReactNode} props.children - Panel content
 * @param {string} props.className - Additional CSS classes for the panel container
 * @param {boolean} props.isDarkMode - Dark mode state
 * @param {boolean} props.scrollable - Whether the content area should scroll
 * @param {boolean} props.noPadding - Whether to remove padding from content area
 * @param {React.ReactNode} props.headerActions - Additional actions for the header
 * @returns {JSX.Element} The panel component
 */
function Panel({ 
  title, 
  children, 
  className = '', 
  isDarkMode = true,
  scrollable = true,
  noPadding = false,
  headerActions = null
}) {
  return (
    <motion.div 
      className={`
        ${isDarkMode ? 'bg-gray-800' : 'bg-white'} 
        rounded-lg shadow-xl overflow-hidden h-full flex flex-col
        ${className}
      `}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Panel Header */}
      {title && (
        <div className={`
          ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} 
          px-4 py-2 flex items-center justify-between flex-shrink-0
          border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}
        `}>
          <h3 className={`
            text-sm font-semibold uppercase tracking-wider
            ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}
          `}>
            {title}
          </h3>
          {headerActions && (
            <div className="flex items-center space-x-2">
              {headerActions}
            </div>
          )}
        </div>
      )}
      
      {/* Panel Content */}
      <div className={`
        flex-1 min-h-0
        ${scrollable ? 'overflow-auto' : 'overflow-hidden'}
        ${!noPadding ? 'p-4' : ''}
      `}>
        {children}
      </div>
    </motion.div>
  );
}

export default Panel;