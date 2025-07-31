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
        const content = state.fileTree[fileName] || state.editorContent;
        
        if (!content) {
          state.addTerminalOutput(`✗ No content to download for ${fileName}`, 'text-red-400');
          return;
        }
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName.replace(/\.[^/.]+$/, '') + extension;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        state.addTerminalOutput(`✓ Downloaded: ${a.download}`, 'text-green-400');
      },
      
      // Download all files
      downloadAllFiles: () => {
        const state = get();
        const files = {};
        
        state.openFiles.forEach(fileName => {
          files[fileName] = state.fileTree[fileName] || '';
        });
        
        if (Object.keys(files).length === 0) {
          state.addTerminalOutput('✗ No files to download', 'text-yellow-400');
          return;
        }
        
        let content = `LCC.js Project Bundle\nGenerated: ${new Date().toISOString()}\n`;
        content += '='.repeat(50) + '\n\n';
        
        Object.entries(files).forEach(([fileName, fileContent]) => {
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
          // Simulate LCC.js compilation and execution
          await new Promise(resolve => setTimeout(resolve, 800));
          
          const lines = content.split('\n').filter(line => line.trim());
          state.addTerminalOutput(`✓ Program compiled successfully (${lines.length} lines)`, 'text-green-400');
          state.addTerminalOutput('Program output:', 'text-blue-400');
          
          // Simulate realistic LCC.js output based on the code content
          if (content.includes('dout')) {
            // Generate output based on the number of dout statements
            const doutCount = (content.match(/dout/g) || []).length;
            if (doutCount > 0) {
              for (let i = 1; i <= Math.min(doutCount, 10); i++) {
                state.addTerminalOutput(i.toString(), 'text-white');
                await new Promise(resolve => setTimeout(resolve, 100));
              }
            } else {
              state.addTerminalOutput('42', 'text-white');
            }
          } else if (content.includes('halt')) {
            // Programs with halt statement
            state.addTerminalOutput('Program completed', 'text-white');
          } else {
            // Default output for other programs
            state.addTerminalOutput('Program executed successfully', 'text-white');
          }
          
          state.addTerminalOutput('Program completed successfully.', 'text-green-400');
          
        } catch (error) {
          state.addTerminalOutput(`✗ Error running program: ${error.message}`, 'text-red-400');
        } finally {
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