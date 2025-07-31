import React, { createContext, useContext } from 'react';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Application state store using Zustand
 * Manages global state for the LCC.js IDE
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
      
      // Download file with different extensions
      downloadFile: (fileName, extension = '.a') => {
        const state = get();
        
        // Handle different download scenarios
        let content = '';
        let downloadFileName = '';
        
        if (extension === '.lst.txt') {
          // Special case: download .lst file as .txt
          const baseName = fileName.replace(/\.[^/.]+$/, '');
          const lstFileName = `${baseName}.lst`;
          content = state.fileTree[lstFileName] || '';
          downloadFileName = `${baseName}.lst.txt`;
        } else if (extension === '.txt') {
          // Download current file as .txt
          content = state.fileTree[fileName] || state.editorContent;
          downloadFileName = fileName.replace(/\.[^/.]+$/, '') + '.txt';
        } else {
          // Download with specific extension
          const baseName = fileName.replace(/\.[^/.]+$/, '');
          const targetFileName = `${baseName}${extension}`;
          content = state.fileTree[targetFileName] || state.fileTree[fileName] || state.editorContent;
          downloadFileName = `${baseName}${extension}`;
        }
        
        if (!content) {
          state.addTerminalOutput(`✗ No content to download for ${downloadFileName}`, 'text-red-400');
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
        
        // Include all files in fileTree (both source and generated)
        Object.keys(state.fileTree).forEach(fileName => {
          files[fileName] = state.fileTree[fileName] || '';
        });
        
        // Also include current editor content if not already in fileTree
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
      
      // Run program
      runProgram: async () => {
        const state = get();
        const content = state.editorContent;
        const fileName = state.currentFileName;
        
        if (!content.trim()) {
          state.addTerminalOutput('✗ No code to run. Please write some assembly code first.', 'text-red-400');
          return;
        }
        
        state.setProcessing(true);
        state.addTerminalOutput('Running program...', 'text-blue-400');
        
        try {
          // Initialize worker if not already done
          if (!state.worker) {
            const worker = new Worker('./worker.js');
            state.setWorker(worker);
            
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
          }
          
          // Send code to worker for compilation and execution
          state.worker.postMessage({
            type: 'run',
            payload: {
              code: content,
              filePath: fileName,
              name: fileName.replace(/\.[^/.]+$/, '')
            }
          });
          
          // Set a timeout to prevent infinite waiting
          setTimeout(() => {
            if (state.isProcessing) {
              state.addTerminalOutput('⚠ Program execution timed out', 'text-yellow-400');
              state.setProcessing(false);
            }
          }, 10000); // 10 second timeout
          
        } catch (error) {
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
  return store;
}

export default useAppStore;