import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from './store/AppStore';
import ResourcesPage from './pages/ResourcesPage';
import './styles.css';

/**
 * Resources application entry point
 */
function ResourcesApp() {
  return (
    <AppProvider>
      <ResourcesPage />
    </AppProvider>
  );
}

// Initialize the Resources application
const container = document.getElementById('resources-root');
if (container) {
  const root = createRoot(container);
  root.render(<ResourcesApp />);
} else {
  console.error('Resources root element not found');
}

export default ResourcesApp;