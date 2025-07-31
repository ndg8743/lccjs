import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from './store/AppStore';
import ResourcesPage from './pages/ResourcesPage';
import './styles.css';

/**
 * Resources application entry point
 */
function ResourcesApp() {
  console.log('ResourcesApp: Rendering component');
  return (
    <AppProvider>
      <ResourcesPage />
    </AppProvider>
  );
}

// Initialize the Resources application
console.log('ResourcesApp: Starting initialization');
const container = document.getElementById('resources-root');
console.log('ResourcesApp: Container found:', container);

if (container) {
  try {
    const root = createRoot(container);
    console.log('ResourcesApp: Root created, rendering...');
    root.render(<ResourcesApp />);
    console.log('ResourcesApp: Render complete');
  } catch (error) {
    console.error('ResourcesApp: Error during render:', error);
  }
} else {
  console.error('ResourcesApp: Resources root element not found');
}

export default ResourcesApp;