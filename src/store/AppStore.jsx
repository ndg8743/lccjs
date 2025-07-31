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
      currentFileName: 'program.a',
      isFileModified: false,
      
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
      openFiles: ['program.a'],
      activeFileIndex: 0,
      
      // Worker state
      isProcessing: false,
      worker: null,
      
      // Actions
      setEditorContent: (content) => set({ editorContent: content, isFileModified: true }),
      
      setCurrentFileName: (fileName) => set({ currentFileName: fileName }),
      
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
      
      setActiveFile: (index) => set({ activeFileIndex: index }),
      
      setProcessing: (isProcessing) => set({ isProcessing }),
      
      setWorker: (worker) => set({ worker }),
      
      // File operations
      saveFile: (fileName, content) => 
        set((state) => ({
          fileTree: { ...state.fileTree, [fileName]: content },
          isFileModified: false
        })),
      
      loadFile: (fileName, content) => 
        set({
          currentFileName: fileName,
          editorContent: content,
          isFileModified: false
        }),
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