import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../store/AppStore';

/**
 * File selector component for the visualizer
 * Slides in from the side and allows selecting files to visualize
 */
function FileSelector({ isVisible, onClose, onFileSelect }) {
  const { fileTree, currentFileName } = useApp();
  const [selectedFile, setSelectedFile] = useState(currentFileName);

  const handleFileSelect = (fileName) => {
    setSelectedFile(fileName);
    onFileSelect(fileName);
  };

  const handleClose = () => {
    onClose();
  };

  // Filter for assembly files only
  const assemblyFiles = Object.keys(fileTree).filter(file => 
    file.endsWith('.a') || file.endsWith('.asm')
  );

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-y-0 right-0 w-80 bg-gray-800 border-l border-gray-700 shadow-xl z-50"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Select File</h3>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* File list */}
          <div className="flex-1 overflow-y-auto p-4">
            {assemblyFiles.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <i className="fas fa-folder-open text-3xl mb-4"></i>
                <p>No assembly files found</p>
                <p className="text-sm mt-2">Upload .a or .asm files to visualize them</p>
              </div>
            ) : (
              <div className="space-y-2">
                {assemblyFiles.map((fileName) => (
                  <motion.button
                    key={fileName}
                    onClick={() => handleFileSelect(fileName)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedFile === fileName
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center">
                      <i className="fas fa-file-code mr-3 text-blue-400"></i>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{fileName}</div>
                        <div className="text-xs text-gray-400 truncate">
                          {fileTree[fileName]?.substring(0, 50)}...
                        </div>
                      </div>
                      {selectedFile === fileName && (
                        <i className="fas fa-check text-green-400 ml-2"></i>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default FileSelector; 