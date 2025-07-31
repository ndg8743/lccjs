import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../store/AppStore';
import Button from './ui/Button';
import FileManager from '../utils/FileManager';

/**
 * Enhanced file explorer component with folder support and better file management
 * @returns {JSX.Element} The file explorer panel
 */
function FileExplorer() {
  const { 
    fileTree, 
    openFiles, 
    activeFileIndex,
    setActiveFile,
    addFile,
    removeFile,
    loadFile,
    saveFile,
    currentFileName,
    setFileTree,
    addTerminalOutput
  } = useApp();
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const fileManager = useRef(new FileManager()).current;

  // Handle file selection
  const handleFileSelect = useCallback((fileName, index) => {
    setSelectedFile(fileName);
    setActiveFile(index);
    if (fileTree[fileName] !== undefined) {
      loadFile(fileName, fileTree[fileName]);
    }
  }, [setActiveFile, loadFile, fileTree]);

  // Handle single file upload
  const handleFileUpload = useCallback(async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    addTerminalOutput('Uploading files...', 'text-blue-400');

    try {
      const fileResults = await fileManager.readFiles(files, setUploadProgress);
      
      let successCount = 0;
      let errorCount = 0;

      fileResults.forEach(result => {
        if (result.error) {
          addTerminalOutput(`Error loading ${result.name}: ${result.error}`, 'text-red-400');
          errorCount++;
        } else {
          // Validate file content
          const validation = fileManager.validateFileContent(result.content, result.name);
          if (!validation.isValid) {
            addTerminalOutput(`Invalid file ${result.name}: ${validation.error}`, 'text-red-400');
            errorCount++;
            return;
          }

          // Generate unique name if needed
          const existingNames = new Set(openFiles);
          const uniqueName = fileManager.generateUniqueFileName(result.name, existingNames);
          
          addFile(uniqueName, result.content);
          addTerminalOutput(`Loaded: ${uniqueName} (${fileManager.formatFileSize(result.size)})`, 'text-green-400');
          successCount++;
        }
      });

      addTerminalOutput(`Upload complete: ${successCount} files loaded, ${errorCount} errors`, 'text-blue-400');
    } catch (error) {
      addTerminalOutput(`Upload failed: ${error.message}`, 'text-red-400');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      event.target.value = ''; // Reset input
    }
  }, [fileManager, addFile, openFiles, addTerminalOutput]);

  // Handle folder upload
  const handleFolderUpload = useCallback(async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    addTerminalOutput('Uploading folder...', 'text-blue-400');

    try {
      const fileResults = await fileManager.readFiles(files, setUploadProgress);
      const tree = fileManager.createFileTree(fileResults.filter(f => !f.error));
      
      // Add files maintaining folder structure
      let successCount = 0;
      fileResults.forEach(result => {
        if (!result.error) {
          const validation = fileManager.validateFileContent(result.content, result.name);
          if (validation.isValid) {
            addFile(result.path, result.content);
            successCount++;
          }
        }
      });

      setFileTree(tree);
      addTerminalOutput(`Folder uploaded: ${successCount} files loaded`, 'text-green-400');
    } catch (error) {
      addTerminalOutput(`Folder upload failed: ${error.message}`, 'text-red-400');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      event.target.value = ''; // Reset input
    }
  }, [fileManager, addFile, setFileTree, addTerminalOutput]);

  // Create new file with validation
  const handleNewFile = useCallback(() => {
    const fileName = prompt('Enter file name (e.g., program.a):');
    if (!fileName) return;

    const validation = fileManager.validateFileName(fileName);
    if (!validation.isValid) {
      alert(`Invalid file name: ${validation.error}`);
      return;
    }

    const existingNames = new Set(openFiles);
    const uniqueName = fileManager.generateUniqueFileName(fileName, existingNames);
    
    if (uniqueName !== fileName) {
      const useUnique = confirm(`File "${fileName}" already exists. Use "${uniqueName}" instead?`);
      if (!useUnique) return;
    }

    addFile(uniqueName, '');
    addTerminalOutput(`Created new file: ${uniqueName}`, 'text-green-400');
  }, [fileManager, openFiles, addFile, addTerminalOutput]);

  // Delete file with confirmation
  const handleDeleteFile = useCallback((fileName, event) => {
    event.stopPropagation();
    if (confirm(`Delete "${fileName}"? This action cannot be undone.`)) {
      removeFile(fileName);
      addTerminalOutput(`Deleted file: ${fileName}`, 'text-yellow-400');
    }
  }, [removeFile, addTerminalOutput]);

  // Download single file
  const handleDownloadFile = useCallback((fileName, event) => {
    event.stopPropagation();
    const content = fileTree[fileName] || '';
    fileManager.downloadFile(fileName, content);
    addTerminalOutput(`Downloaded: ${fileName}`, 'text-green-400');
  }, [fileTree, fileManager, addTerminalOutput]);

  // Download all files as bundle
  const handleDownloadAll = useCallback(() => {
    const files = {};
    openFiles.forEach(fileName => {
      files[fileName] = fileTree[fileName] || '';
    });
    
    if (Object.keys(files).length === 0) {
      addTerminalOutput('No files to download', 'text-yellow-400');
      return;
    }

    fileManager.downloadFilesAsBundle(files, 'lcc-project-bundle.txt');
    addTerminalOutput(`Downloaded ${Object.keys(files).length} files as bundle`, 'text-green-400');
  }, [openFiles, fileTree, fileManager, addTerminalOutput]);

  // Toggle folder expansion
  const toggleFolder = useCallback((folderName) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderName)) {
        newSet.delete(folderName);
      } else {
        newSet.add(folderName);
      }
      return newSet;
    });
  }, []);

  // Render file tree recursively
  const renderFileTree = useCallback((tree, path = '') => {
    return Object.entries(tree).map(([name, item]) => {
      const fullPath = path ? `${path}/${name}` : name;
      const isFolder = item.type === 'folder';
      const isExpanded = expandedFolders.has(fullPath);

      if (isFolder) {
        return (
          <div key={fullPath}>
            <motion.div
              className="flex items-center p-2 rounded cursor-pointer hover:bg-secondary-700 text-secondary-100"
              onClick={() => toggleFolder(fullPath)}
              whileHover={{ x: 2 }}
            >
              <i className={`fas ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'} mr-2 text-xs`} />
              <i className={fileManager.getFileIcon(name, true)} />
              <span className="text-sm ml-2">{name}</span>
            </motion.div>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  className="ml-4 border-l border-secondary-700 pl-2"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  {renderFileTree(item.children, fullPath)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      } else {
        const fileIndex = openFiles.indexOf(fullPath);
        const isActive = fullPath === currentFileName;
        
        return (
          <motion.div
            key={fullPath}
            className={`group flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
              isActive 
                ? 'bg-primary-600 text-white' 
                : 'hover:bg-secondary-700 text-secondary-100'
            }`}
            onClick={() => handleFileSelect(fullPath, fileIndex)}
            whileHover={{ x: 2 }}
          >
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <i className={fileManager.getFileIcon(name)} />
              <span className="text-sm truncate">{name}</span>
              {item.size && (
                <span className="text-xs text-secondary-400">
                  ({fileManager.formatFileSize(item.size)})
                </span>
              )}
            </div>
            
            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => handleDownloadFile(fullPath, e)}
                className="p-1 hover:bg-secondary-600 rounded text-xs"
                title="Download"
              >
                <i className="fas fa-download" />
              </button>
              <button
                onClick={(e) => handleDeleteFile(fullPath, e)}
                className="p-1 hover:bg-red-600 rounded text-xs"
                title="Delete"
              >
                <i className="fas fa-trash" />
              </button>
            </div>
          </motion.div>
        );
      }
    });
  }, [expandedFolders, openFiles, currentFileName, fileManager, handleFileSelect, handleDownloadFile, handleDeleteFile, toggleFolder]);

  return (
    <motion.div 
      className="flex flex-col h-full bg-secondary-800"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-secondary-700">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            icon={isExpanded ? "fas fa-chevron-down" : "fas fa-chevron-right"}
          />
          <h2 className="text-sm font-semibold text-secondary-100">Files</h2>
          {openFiles.length > 0 && (
            <span className="text-xs text-secondary-400">({openFiles.length})</span>
          )}
        </div>
        
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewFile}
            icon="fas fa-plus"
            title="New File"
            disabled={isUploading}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            icon="fas fa-upload"
            title="Upload Files"
            disabled={isUploading}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => folderInputRef.current?.click()}
            icon="fas fa-folder-open"
            title="Upload Folder"
            disabled={isUploading}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownloadAll}
            icon="fas fa-download"
            title="Download All"
            disabled={openFiles.length === 0}
          />
        </div>
      </div>

      {/* Upload progress */}
      {isUploading && (
        <div className="p-4 border-b border-secondary-700">
          <div className="flex items-center space-x-2 text-sm text-secondary-300">
            <i className="fas fa-spinner fa-spin" />
            <span>Uploading...</span>
          </div>
          <div className="w-full bg-secondary-700 rounded-full h-2 mt-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* File list */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            className="flex-1 overflow-y-auto"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-2 space-y-1">
              {Object.keys(fileTree).length > 0 ? (
                renderFileTree(fileTree)
              ) : openFiles.length > 0 ? (
                // Fallback to flat file list if no tree structure
                openFiles.map((fileName, index) => (
                  <motion.div
                    key={fileName}
                    className={`group flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                      fileName === currentFileName 
                        ? 'bg-primary-600 text-white' 
                        : 'hover:bg-secondary-700 text-secondary-100'
                    }`}
                    onClick={() => handleFileSelect(fileName, index)}
                    whileHover={{ x: 2 }}
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <i className={fileManager.getFileIcon(fileName)} />
                      <span className="text-sm truncate">{fileName}</span>
                    </div>
                    
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleDownloadFile(fileName, e)}
                        className="p-1 hover:bg-secondary-600 rounded text-xs"
                        title="Download"
                      >
                        <i className="fas fa-download" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteFile(fileName, e)}
                        className="p-1 hover:bg-red-600 rounded text-xs"
                        title="Delete"
                      >
                        <i className="fas fa-trash" />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  className="text-center text-secondary-400 text-sm py-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <i className="fas fa-folder-open text-3xl mb-4 text-secondary-600" />
                  <div>No files open</div>
                  <div className="text-xs mt-2">
                    Upload files, create a new one, or drag & drop files here
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".a,.e,.o,.lst,.bst,.txt,.md,.js,.json,.html,.css"
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
    </motion.div>
  );
}

export default FileExplorer;