import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../store/AppStore';
import Button from './ui/Button';
import RenameDialog from './RenameDialog';

/**
 * Shared file sidebar component for all pages
 * @param {Object} props - Component props
 * @param {boolean} props.isDarkMode - Dark mode state
 * @param {Function} props.onFileSelect - Callback when file is selected
 * @returns {JSX.Element} The file sidebar panel
 */
function FileSidebar({ isDarkMode, onFileSelect }) {
  const { 
    fileTree,
    openFiles, 
    activeFileIndex,
    setActiveFile,
    addFile,
    removeFile,
    currentFileName,
    addTerminalOutput,
    setIsRenaming,
    downloadFile
  } = useApp();
  
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = useCallback((fileName, index) => {
    setActiveFile(index);
    if (onFileSelect) {
      onFileSelect(fileName);
    }
  }, [setActiveFile, onFileSelect]);

  // Handle file name editing
  const handleFileNameEdit = useCallback(() => {
    setIsRenaming(true);
  }, [setIsRenaming]);

  // Handle file upload
  const handleFileUpload = useCallback(async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of files) {
      try {
        const content = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = (e) => reject(new Error('Failed to read file'));
          reader.readAsText(file);
        });

        // Generate unique name if needed
        let fileName = file.name;
        let counter = 1;
        while (openFiles.includes(fileName)) {
          const [name, ext] = file.name.split('.');
          fileName = `${name}_${counter}.${ext}`;
          counter++;
        }

        addFile(fileName, content);
        addTerminalOutput(`Loaded: ${fileName}`, 'text-green-400');
      } catch (error) {
        addTerminalOutput(`Error loading ${file.name}: ${error.message}`, 'text-red-400');
      }
    }

    event.target.value = ''; // Reset input
  }, [addFile, openFiles, addTerminalOutput]);

  // Create new file
  const handleNewFile = useCallback(() => {
    let fileName = 'untitled.a';
    let counter = 1;
    while (openFiles.includes(fileName)) {
      fileName = `untitled${counter}.a`;
      counter++;
    }
    addFile(fileName, '; New LCC Assembly File\n');
  }, [addFile, openFiles]);

  // Close file
  const handleCloseFile = useCallback((fileName, event) => {
    event.stopPropagation();
    removeFile(fileName);
  }, [removeFile]);

  return (
    <div className={`h-full flex flex-col ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-100'
    }`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b ${
        isDarkMode ? 'border-gray-700' : 'border-gray-300'
      }`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Files ({openFiles.length})
          </h3>
          <div className="flex gap-1">
            {/* New File */}
            <Button
              onClick={handleNewFile}
              variant="ghost"
              size="sm"
              className="p-1"
              title="New File"
            >
              <i className="fas fa-plus text-xs"></i>
            </Button>
            
            {/* Upload File */}
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="ghost"
              size="sm"
              className="p-1"
              title="Upload Files"
            >
              <i className="fas fa-upload text-xs"></i>
            </Button>
            
            {/* Download Menu */}
            <div className="relative">
              <Button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                variant="ghost"
                size="sm"
                className="p-1"
                title="Download"
              >
                <i className="fas fa-download text-xs"></i>
              </Button>
              
              {showDownloadMenu && (
                <div className={`absolute right-0 mt-1 w-48 rounded-lg shadow-lg ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                } ring-1 ring-black ring-opacity-5 z-50`}>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        downloadFile(currentFileName, '.a');
                        setShowDownloadMenu(false);
                      }}
                      className={`block px-4 py-2 text-sm w-full text-left ${
                        isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      Download Current (.a)
                    </button>
                    <button
                      onClick={() => {
                        downloadFile(currentFileName, '.txt');
                        setShowDownloadMenu(false);
                      }}
                      className={`block px-4 py-2 text-sm w-full text-left ${
                        isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      Download as Text (.txt)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto">
        {openFiles.length === 0 ? (
          <div className={`p-4 text-center text-sm ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            No files open
          </div>
        ) : (
          <div className="py-1">
            {openFiles.map((fileName, index) => (
              <motion.div
                key={fileName}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <div
                  onClick={() => handleFileSelect(fileName, index)}
                  onDoubleClick={handleFileNameEdit}
                  className={`group px-4 py-2 cursor-pointer flex items-center justify-between ${
                    activeFileIndex === index
                      ? isDarkMode 
                        ? 'bg-blue-900 text-blue-100' 
                        : 'bg-blue-100 text-blue-900'
                      : isDarkMode
                        ? 'hover:bg-gray-800 text-gray-300'
                        : 'hover:bg-gray-200 text-gray-700'
                  } transition-colors`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <i className={`fas fa-${fileName.endsWith('.a') ? 'file-code' : 'file'} text-xs`}></i>
                    <span className="text-sm truncate">{fileName}</span>
                  </div>
                  
                  {/* Close button */}
                  <button
                    onClick={(e) => handleCloseFile(fileName, e)}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${
                      isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-300'
                    }`}
                  >
                    <i className="fas fa-times text-xs"></i>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".a,.asm,.txt"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      {/* Rename Dialog */}
      <RenameDialog />
    </div>
  );
}

export default FileSidebar;