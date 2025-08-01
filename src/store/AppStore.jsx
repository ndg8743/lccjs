import React, { createContext, useContext } from 'react';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Application state store using Zustand
 * Manages global state for the LCC.js IDE including:
 * - File management (upload, download, rename)
 * - Code editor state and content
 * - Program execution via Web Workers
 * - Terminal output and input
 * - Theme preferences
 * - UI state (menus, modals, etc.)
 * 
 * @module AppStore
 * @author LCC.js Team
 * @version 2.0.0
 */
const useAppStore = create(
  devtools(
    (set, get) => ({
      // Editor state
      editorContent: '',
      currentFileName: '',
      isFileModified: false,
      isRenaming: false,
      
      // Terminal state
      terminalOutput: [],
      terminalInput: '',
      isWaitingForInput: false,
      
      // UI state
      isDarkMode: true,
      isHamburgerMenuOpen: false,
      isCommandPaletteOpen: false,
      
      // File system state
      fileTree: {},
      openFiles: [],
      activeFileIndex: 0,
      
      // Worker state
      isProcessing: false,
      worker: null,
      
      // Actions
      setEditorContent: (content) => {
        const state = get();
        set({ 
          editorContent: content, 
          isFileModified: true,
          fileTree: { 
            ...state.fileTree, 
            [state.currentFileName]: content 
          }
        });
      },
      
      setCurrentFileName: (fileName) => set({ currentFileName: fileName }),
      
      setIsRenaming: (isRenaming) => set({ isRenaming }),
      
      addTerminalOutput: (output, className = '') => 
        set((state) => ({
          terminalOutput: [
            ...state.terminalOutput,
            { text: output, className, timestamp: Date.now() }
          ]
        })),
      
      clearTerminalOutput: () => set({ terminalOutput: [] }),
      
      setTerminalInput: (input) => set({ terminalInput: input }),
      
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      
      toggleHamburgerMenu: () => 
        set((state) => ({ isHamburgerMenuOpen: !state.isHamburgerMenuOpen })),
      
      toggleCommandPalette: () => 
        set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
      
      setFileTree: (tree) => set({ fileTree: tree }),
      
      addFile: (fileName, content = '') => 
        set((state) => ({
          openFiles: [...state.openFiles, fileName],
          fileTree: { ...state.fileTree, [fileName]: content }
        })),
      
      removeFile: (fileName) => 
        set((state) => ({
          openFiles: state.openFiles.filter(f => f !== fileName),
          fileTree: { ...state.fileTree, [fileName]: undefined }
        })),
      
      // Rename file
      renameFile: (oldName, newName) => {
        const state = get();
        if (!newName || newName.trim() === '' || oldName === newName) {
          return;
        }
        
        const trimmedNewName = newName.trim();
        
        // Check if new name already exists
        if (state.openFiles.includes(trimmedNewName)) {
          state.addTerminalOutput(`✗ File "${trimmedNewName}" already exists`, 'text-red-400');
          return;
        }
        
        // Get the content of the old file
        const content = state.fileTree[oldName] || state.editorContent;
        
        // Update the state
        set((state) => {
          const newOpenFiles = state.openFiles.map(f => f === oldName ? trimmedNewName : f);
          const newFileTree = { ...state.fileTree };
          
          // Remove old file and add new file
          delete newFileTree[oldName];
          newFileTree[trimmedNewName] = content;
          
          return {
            openFiles: newOpenFiles,
            fileTree: newFileTree,
            currentFileName: state.currentFileName === oldName ? trimmedNewName : state.currentFileName,
            editorContent: state.currentFileName === oldName ? content : state.editorContent
          };
        });
        
        state.addTerminalOutput(`✓ Renamed: ${oldName} → ${trimmedNewName}`, 'text-green-400');
      },
      
      setActiveFile: (index) => {
        const state = get();
        const fileName = state.openFiles[index];
        if (fileName) {
          const content = state.fileTree[fileName] || '';
          set({ 
            activeFileIndex: index,
            currentFileName: fileName,
            editorContent: content,
            isFileModified: false
          });
        }
      },
      
      setProcessing: (isProcessing) => set({ isProcessing }),
      
      setWorker: (worker) => set({ worker }),
      
      // File operations
      saveFile: (fileName, content) => 
        set((state) => ({
          fileTree: { ...state.fileTree, [fileName]: content },
          isFileModified: false
        })),
      
      loadFile: (fileName, content) => 
        set((state) => ({
          currentFileName: fileName,
          editorContent: content,
          fileTree: { ...state.fileTree, [fileName]: content },
          isFileModified: false
        })),
      
      // Load demo file
      loadDemoFile: async (fileName) => {
        const state = get();
        state.setProcessing(true);
        state.addTerminalOutput(`Loading demo file: ${fileName}...`, 'text-blue-400');
        
        try {
          const response = await fetch(`/demos/${fileName}`);
          if (!response.ok) {
            throw new Error(`Failed to load ${fileName} (${response.status})`);
          }
          const content = await response.text();
          state.loadFile(fileName, content);
          state.addTerminalOutput(`✓ Loaded demo file: ${fileName}`, 'text-green-400');
        } catch (error) {
          state.addTerminalOutput(`✗ Error loading ${fileName}: ${error.message}`, 'text-red-400');
        } finally {
          state.setProcessing(false);
        }
      },

      // Initialize with a1test.a on startup
      initializeWithDemo: async () => {
        const state = get();
        await state.loadDemoFile('a1test.a');
      },
      
      // Initialize worker
      initializeWorker: async () => {
        const state = get();
        
        if (state.worker) {
          return; // Worker already exists
        }
        
        try {
          const worker = new Worker('./worker.js');
          
          // Set up worker message handling
          worker.onmessage = (event) => {
            const { type, data } = event.data;
            
            switch (type) {
              case 'stdout':
                state.addTerminalOutput(data, 'text-white');
                break;
              case 'stderr':
                state.addTerminalOutput(`Error: ${data}`, 'text-red-400');
                break;
              case 'exit':
                state.addTerminalOutput(`Program exited with code: ${data}`, 'text-yellow-400');
                state.setProcessing(false);
                break;
              case 'storage':
                // Update file tree with generated files
                if (data && typeof data === 'object') {
                  const newFiles = {};
                  Object.keys(data).forEach(key => {
                    if (key.endsWith('.lst') || key.endsWith('.bst') || key.endsWith('.e')) {
                      newFiles[key] = data[key];
                    }
                  });
                  
                  // Update fileTree with new generated files
                  const updatedFileTree = { ...state.fileTree, ...newFiles };
                  state.setFileTree(updatedFileTree);
                  
                  // Add to openFiles if not already there
                  Object.keys(newFiles).forEach(fileName => {
                    if (!state.openFiles.includes(fileName)) {
                      state.openFiles.push(fileName);
                    }
                  });
                  
                  if (Object.keys(newFiles).length > 0) {
                    state.addTerminalOutput(`✓ Generated files: ${Object.keys(newFiles).join(', ')}`, 'text-green-400');
                  }
                }
                break;
            }
          };
          
          worker.onerror = (error) => {
            state.addTerminalOutput(`✗ Worker error: ${error.message}`, 'text-red-400');
            state.setProcessing(false);
          };
          
          // Store the worker in state
          state.setWorker(worker);
          
          // Wait for worker to be ready
          await new Promise(resolve => setTimeout(resolve, 300));
          
          state.addTerminalOutput('✓ Worker initialized successfully', 'text-green-400');
        } catch (error) {
          console.error('Worker initialization error:', error);
          state.addTerminalOutput(`✗ Failed to initialize worker: ${error.message}`, 'text-red-400');
        }
      },
      
      // Download file with different extensions
      downloadFile: (fileName, extension = '.a') => {
        const state = get();
        
        // Handle different download scenarios
        let content = '';
        let downloadFileName = '';
        
        // Helper function to get content from multiple sources
        const getFileContent = (targetFileName) => {
          // First try fileTree
          let content = state.fileTree[targetFileName];
          if (content) return content;
          
          // Then try localStorage (worker storage)
          try {
            const storage = JSON.parse(localStorage.getItem('fsWrapper') || '{}');
            content = storage[targetFileName];
            if (content) return content;
          } catch (error) {
            console.warn('Error reading from localStorage:', error);
          }
          
          // Finally try editor content for source files
          if (targetFileName.endsWith('.a') || targetFileName === fileName) {
            return state.editorContent;
          }
          
          return null;
        };
        
        // Get base name without extension for generated files
        const baseName = fileName.replace(/\.[^/.]+$/, '');
        
        if (extension === '.lst.txt') {
          // Special case: download .lst file as .txt
          const lstFileName = `${baseName}.lst`;
          content = getFileContent(lstFileName);
          downloadFileName = `${baseName}.lst.txt`;
        } else if (extension === '.txt') {
          // Download current file as .txt
          content = getFileContent(fileName) || state.editorContent;
          downloadFileName = fileName.replace(/\.[^/.]+$/, '') + '.txt';
        } else if (extension === '.a') {
          // For source files, use the current editor content
          content = state.editorContent || getFileContent(fileName);
          downloadFileName = fileName.endsWith('.a') ? fileName : `${baseName}.a`;
        } else {
          // For generated files (.lst, .bst, .e), use just the base name
          const targetFileName = `${baseName}${extension}`;
          content = getFileContent(targetFileName);
          downloadFileName = targetFileName;
        }
        
        if (!content) {
          state.addTerminalOutput(`✗ No content to download for ${downloadFileName}`, 'text-red-400');
          state.addTerminalOutput('ℹ Available files: ' + Object.keys({...state.fileTree, ...JSON.parse(localStorage.getItem('fsWrapper') || '{}')}).join(', '), 'text-yellow-400');
          return;
        }
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        state.addTerminalOutput(`✓ Downloaded: ${downloadFileName}`, 'text-green-400');
      },
      
      // Download all files
      downloadAllFiles: () => {
        const state = get();
        const files = {};
        
        // Helper function to get all available files
        const getAllFiles = () => {
          const allFiles = { ...state.fileTree };
          
          // Also check localStorage for worker-generated files
          try {
            const storage = JSON.parse(localStorage.getItem('fsWrapper') || '{}');
            Object.keys(storage).forEach(key => {
              if (!allFiles[key]) {
                allFiles[key] = storage[key];
              }
            });
          } catch (error) {
            console.warn('Error reading from localStorage:', error);
          }
          
          return allFiles;
        };
        
        // Include all files from fileTree and localStorage
        const allFiles = getAllFiles();
        Object.keys(allFiles).forEach(fileName => {
          files[fileName] = allFiles[fileName] || '';
        });
        
        // Also include current editor content if not already in files
        if (state.editorContent && !files[state.currentFileName]) {
          files[state.currentFileName] = state.editorContent;
        }
        
        if (Object.keys(files).length === 0) {
          state.addTerminalOutput('✗ No files to download', 'text-yellow-400');
          return;
        }
        
        let content = `LCC.js Project Bundle\nGenerated: ${new Date().toISOString()}\n`;
        content += '='.repeat(50) + '\n\n';
        
        // Sort files: source files first, then generated files
        const sortedFiles = Object.entries(files).sort(([a], [b]) => {
          const aIsGenerated = a.endsWith('.lst') || a.endsWith('.bst') || a.endsWith('.e');
          const bIsGenerated = b.endsWith('.lst') || b.endsWith('.bst') || b.endsWith('.e');
          if (aIsGenerated && !bIsGenerated) return 1;
          if (!aIsGenerated && bIsGenerated) return -1;
          return a.localeCompare(b);
        });
        
        sortedFiles.forEach(([fileName, fileContent]) => {
          content += `--- ${fileName} ---\n`;
          content += fileContent;
          content += '\n\n' + '='.repeat(50) + '\n\n';
        });
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'lcc-project-bundle.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        state.addTerminalOutput(`✓ Downloaded ${Object.keys(files).length} files as bundle`, 'text-green-400');
      },
      
      // Stop program
      stopProgram: () => {
        const state = get();
        if (state.worker && state.isProcessing) {
          try {
            state.worker.postMessage({ type: 'stop' });
            state.addTerminalOutput('⏹ Program stopped by user', 'text-yellow-400');
          } catch (error) {
            state.addTerminalOutput(`✗ Error stopping program: ${error.message}`, 'text-red-400');
          }
        }
        state.setProcessing(false);
      },
      
      // Run program
      runProgram: async () => {
        const state = get();
        const content = state.editorContent;
        let fileName = state.currentFileName;
        
        // If no filename is set, default to 'program.a'
        if (!fileName) {
          fileName = 'program.a';
          state.setCurrentFileName(fileName);
        }
        
        if (!content.trim()) {
          state.addTerminalOutput('✗ No code to run. Please write some assembly code first.', 'text-red-400');
          return;
        }
        
        // Stop any currently running program first
        if (state.isProcessing && state.worker) {
          try {
            state.worker.postMessage({ type: 'stop' });
          } catch (error) {
            console.warn('Error stopping previous program:', error);
          }
        }
        
        state.setProcessing(true);
        state.addTerminalOutput('Running program...', 'text-blue-400');
        
        try {
          // Initialize worker if not already done
          if (!state.worker) {
            try {
              const worker = new Worker('./worker.js');
              
              // Set up worker message handling
              worker.onmessage = (event) => {
                const { type, data } = event.data;
                
                switch (type) {
                  case 'stdout':
                    state.addTerminalOutput(data, 'text-white');
                    break;
                  case 'stderr':
                    state.addTerminalOutput(`Error: ${data}`, 'text-red-400');
                    break;
                  case 'exit':
                    state.addTerminalOutput(`Program exited with code: ${data}`, 'text-yellow-400');
                    state.setProcessing(false);
                    break;
                  case 'storage':
                    // Update file tree with generated files
                    if (data && typeof data === 'object') {
                      const newFiles = {};
                      Object.keys(data).forEach(key => {
                        if (key.endsWith('.lst') || key.endsWith('.bst') || key.endsWith('.e')) {
                          newFiles[key] = data[key];
                        }
                      });
                      
                      // Update fileTree with new generated files
                      const updatedFileTree = { ...state.fileTree, ...newFiles };
                      state.setFileTree(updatedFileTree);
                      
                      // Add to openFiles if not already there
                      Object.keys(newFiles).forEach(fileName => {
                        if (!state.openFiles.includes(fileName)) {
                          state.openFiles.push(fileName);
                        }
                      });
                      
                      if (Object.keys(newFiles).length > 0) {
                        state.addTerminalOutput(`✓ Generated files: ${Object.keys(newFiles).join(', ')}`, 'text-green-400');
                      }
                    }
                    break;
                }
              };
              
              worker.onerror = (error) => {
                state.addTerminalOutput(`✗ Worker error: ${error.message}`, 'text-red-400');
                state.setProcessing(false);
              };
              
              // Store the worker in state immediately after setup
              state.setWorker(worker);
              
              // Wait a bit longer to ensure worker is fully initialized
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (workerError) {
              console.error('Worker creation error:', workerError);
              throw new Error(`Failed to create worker: ${workerError.message}`);
            }
          }
          
          // Get the current state again to ensure we have the latest worker
          const currentState = get();
          if (!currentState.worker) {
            throw new Error('Worker failed to initialize - please try again');
          }
          
          // Send code to worker for compilation and execution
          currentState.worker.postMessage({
            type: 'run',
            payload: {
              code: content,
              filePath: fileName,
              name: fileName.replace(/\.[^/.]+$/, '')
            }
          });
          
          // Set a timeout to prevent infinite waiting
          setTimeout(() => {
            const timeoutState = get();
            if (timeoutState.isProcessing) {
              timeoutState.addTerminalOutput('⚠ Program execution timed out', 'text-yellow-400');
              timeoutState.setProcessing(false);
            }
          }, 10000); // 10 second timeout
          
        } catch (error) {
          console.error('Program execution error:', error);
          state.addTerminalOutput(`✗ Error running program: ${error.message}`, 'text-red-400');
          state.setProcessing(false);
        }
      },
    }),
    {
      name: 'lcc-app-store',
    }
  )
);

/**
 * Context for providing the app store to components
 */
const AppStoreContext = createContext(null);

/**
 * Provider component for the app store
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Provider component
 */
export function AppProvider({ children }) {
  return (
    <AppStoreContext.Provider value={useAppStore}>
      {children}
    </AppStoreContext.Provider>
  );
}

/**
 * Hook to access the app store
 * @returns {Object} The app store
 */
export function useApp() {
  const store = useContext(AppStoreContext);
  if (!store) {
    throw new Error('useApp must be used within AppProvider');
  }
  return store();
}

export default useAppStore;