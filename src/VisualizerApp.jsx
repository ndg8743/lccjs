import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from './store/AppStore';
import StackToolPage from './pages/StackToolPage';
import './styles.css';

/**
 * Visualizer application entry point
 */
function VisualizerApp() {
  return (
    <AppProvider>
      <StackToolPage />
    </AppProvider>
  );
}

// Initialize the Visualizer application
const container = document.getElementById('visualizer-root');
if (container) {
  const root = createRoot(container);
  root.render(<VisualizerApp />);
} else {
  console.error('Visualizer root element not found');
}

export default VisualizerApp;