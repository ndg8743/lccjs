import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from './store/AppStore';
import StackToolPage from './pages/StackToolPage';
import './styles.css';

/**
 * Visualizer application entry point
 */
function VisualizerApp() {
  console.log('VisualizerApp: Rendering component');
  return (
    <AppProvider>
      <StackToolPage />
    </AppProvider>
  );
}

// Create root and render the visualizer
console.log('VisualizerApp: Starting initialization');
const container = document.getElementById('visualizer-root');
console.log('VisualizerApp: Container found:', container);

if (container) {
  try {
    const root = createRoot(container);
    console.log('VisualizerApp: Root created, rendering...');
    root.render(<VisualizerApp />);
    console.log('VisualizerApp: Render complete');
  } catch (error) {
    console.error('VisualizerApp: Error during render:', error);
  }
} else {
  console.error('VisualizerApp: Visualizer root element not found');
}

export default VisualizerApp;