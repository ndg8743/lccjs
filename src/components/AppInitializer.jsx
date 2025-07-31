import React, { useEffect } from 'react';
import { useApp } from '../store/AppStore';

/**
 * Component that handles application initialization
 * Loads a1test.a on startup
 */
function AppInitializer() {
  const { initializeWithDemo, openFiles } = useApp();

  useEffect(() => {
    // Only initialize if no files are loaded
    if (openFiles.length === 0) {
      initializeWithDemo();
    }
  }, [initializeWithDemo, openFiles.length]);

  return null; // This component doesn't render anything
}

export default AppInitializer; 