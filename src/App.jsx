import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from './store/AppStore';
import Layout from './components/Layout';
import './styles.css';

/**
 * Main application component that serves as the entry point for the React app
 * @returns {JSX.Element} The main application layout wrapped in providers
 */
function App() {
  return (
    <AppProvider>
      <Layout />
    </AppProvider>
  );
}

// Initialize the React application
const container = document.getElementById('react-root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
} else {
  console.error('React root element not found');
}

export default App;