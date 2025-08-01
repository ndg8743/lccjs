import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../store/AppStore';
import Button from './ui/Button';
import RenameDialog from './RenameDialog';

/**
 * Enhanced file explorer component with better file management
 * @returns {JSX.Element} The file explorer panel
 */
function FileExplorer() {
  const { 
    openFiles, 
    activeFileIndex,
    setActiveFile,
    addFile,
    removeFile,
    loadFile,
    currentFileName,
    addTerminalOutput,
    setIsRenaming,
    downloadFile
  } = useApp();
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = useCallback((fileName, index) => {
    setActiveFile(index);
    addTerminalOutput(`Switched to: ${fileName}`, 'text-blue-400');
  }, [setActiveFile, addTerminalOutput]);

  // Handle file name editing
  const handleFileNameEdit = useCallback(() => {
    setIsRenaming(true);
  }, [setIsRenaming]);



  // Handle file upload
  const handleFileUpload = useCallback(async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    addTerminalOutput('Uploading files...', 'text-blue-400');

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

  // Handle folder upload
  const handleFolderUpload = useCallback(async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    addTerminalOutput('Uploading folder...', 'text-blue-400');

    for (const file of files) {
      try {
        const content = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = (e) => reject(new Error('Failed to read file'));
          reader.readAsText(file);
        });

        // Use the full path from the folder structure
        const fileName = file.webkitRelativePath || file.name;
        
        // Generate unique name if needed
        let finalFileName = fileName;
        let counter = 1;
        while (openFiles.includes(finalFileName)) {
          const [name, ext] = fileName.split('.');
          finalFileName = `${name}_${counter}.${ext}`;
          counter++;
        }

        addFile(finalFileName, content);
        addTerminalOutput(`Loaded: ${finalFileName}`, 'text-green-400');
      } catch (error) {
        addTerminalOutput(`Error loading ${file.name}: ${error.message}`, 'text-red-400');
      }
    }

    event.target.value = ''; // Reset input
  }, [addFile, openFiles, addTerminalOutput]);

  // Handle download with different extensions - use the global functions
  const handleDownload = useCallback((extension) => {
    // Use the store's downloadFile function for all file types
    downloadFile(currentFileName, extension);
    setShowDownloadMenu(false);
  }, [currentFileName, downloadFile]);

  return (
    <motion.div
      className="bg-secondary-900 border-r border-secondary-700 w-80 min-w-64 max-w-96 flex flex-col"
      initial={{ x: -200, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="p-8 border-b border-secondary-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-secondary-200">
            Files ({openFiles.length})
          </h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-secondary-400 hover:text-secondary-200 transition-colors p-2 rounded-md hover:bg-secondary-800"
          >
            <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`} />
          </button>
        </div>
        
        {/* Action buttons - Improved spacing */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              icon="fas fa-plus"
              title="Add File"
              className="w-full"
            >
              Add File
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              icon="fas fa-upload"
              title="Upload File"
              className="w-full"
            >
              Upload
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => folderInputRef.current?.click()}
              icon="fas fa-folder-open"
              title="Upload Folder"
              className="w-full"
            >
              Folder
            </Button>
            <div className="relative">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                icon="fas fa-download"
                title="Download Options"
                className="w-full"
              >
                Download
              </Button>
              <AnimatePresence>
                {showDownloadMenu && (
                  <motion.div
                    className="absolute top-full left-0 mt-2 bg-secondary-800 border border-secondary-600 rounded-lg shadow-xl z-50 min-w-48"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button
                      onClick={() => handleDownload('.a')}
                      className="w-full px-4 py-3 text-left text-sm text-secondary-200 hover:bg-secondary-700 transition-colors border-b border-secondary-700 first:rounded-t-lg last:rounded-b-lg last:border-b-0"
                    >
                      <i className="fas fa-file-code mr-3" />
                      Download .a
                    </button>
                    <button
                      onClick={() => handleDownload('.lst')}
                      className="w-full px-4 py-3 text-left text-sm text-secondary-200 hover:bg-secondary-700 transition-colors border-b border-secondary-700 first:rounded-t-lg last:rounded-b-lg last:border-b-0"
                    >
                      <i className="fas fa-list mr-3" />
                      Download .lst
                    </button>
                                                <button
                              onClick={() => handleDownload('.bst')}
                              className="w-full px-4 py-3 text-left text-sm text-secondary-200 hover:bg-secondary-700 transition-colors border-b border-secondary-700 first:rounded-t-lg last:rounded-b-lg last:border-b-0"
                            >
                              <i className="fas fa-code mr-3" />
                              Download .bst
                            </button>
                            <button
                              onClick={() => handleDownload('.e')}
                              className="w-full px-4 py-3 text-left text-sm text-secondary-200 hover:bg-secondary-700 transition-colors border-b border-secondary-700 first:rounded-t-lg last:rounded-b-lg last:border-b-0"
                            >
                              <i className="fas fa-cog mr-3" />
                              Download .e
                            </button>
                            <button
                              onClick={() => handleDownload('.txt')}
                              className="w-full px-4 py-3 text-left text-sm text-secondary-200 hover:bg-secondary-700 transition-colors border-b border-secondary-700 first:rounded-t-lg last:rounded-b-lg last:border-b-0"
                            >
                              <i className="fas fa-file-text mr-3" />
                              Download as .txt
                            </button>
                            <button
                              onClick={() => handleDownload('.lst.txt')}
                              className="w-full px-4 py-3 text-left text-sm text-secondary-200 hover:bg-secondary-700 transition-colors border-b border-secondary-700 first:rounded-t-lg last:rounded-b-lg last:border-b-0"
                            >
                              <i className="fas fa-list-alt mr-3" />
                              Download .lst as .txt
                            </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* File list */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="flex-1 overflow-y-auto"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-6 space-y-3">
              {openFiles.map((fileName, index) => (
                <motion.div
                  key={fileName}
                  className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                    index === activeFileIndex
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'hover:bg-secondary-700 text-secondary-200 hover:shadow-md'
                  }`}
                  onClick={() => handleFileSelect(fileName, index)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <i className="fas fa-file-code text-xl" />
                    <span 
                      className="text-base truncate flex-1 font-medium cursor-pointer"
                      title={`${fileName} - Double-click to rename`}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleFileNameEdit();
                      }}
                    >
                      {fileName}
                    </span>
                  </div>
                  
                  {index === activeFileIndex && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileNameEdit();
                      }}
                      className="text-sm opacity-70 hover:opacity-100 transition-opacity p-2 rounded hover:bg-white hover:bg-opacity-20"
                      title="Rename file"
                    >
                      <i className="fas fa-edit" />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".a,.lst,.bst,.txt"
        onChange={handleFileUpload}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        webkitdirectory=""
        onChange={handleFolderUpload}
        className="hidden"
      />
      
      {/* Rename Dialog */}
      <RenameDialog />
    </motion.div>
  );
}

export default FileExplorer;