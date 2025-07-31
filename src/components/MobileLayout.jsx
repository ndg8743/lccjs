import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../store/AppStore';
import Header from './Header';
import EditorPanel from './EditorPanel';
import TerminalPanel from './TerminalPanel';
import FileExplorer from './FileExplorer';
import Button from './ui/Button';

/**
 * Mobile-optimized layout component with tabbed interface
 * @returns {JSX.Element} Mobile layout with tabs
 */
function MobileLayout() {
  const [activeTab, setActiveTab] = useState('editor');
  const { openFiles } = useApp();

  const tabs = [
    {
      id: 'files',
      label: 'Files',
      icon: 'fas fa-folder',
      component: FileExplorer,
      badge: openFiles.length > 0 ? openFiles.length : null
    },
    {
      id: 'editor',
      label: 'Editor',
      icon: 'fas fa-code',
      component: EditorPanel
    },
    {
      id: 'terminal',
      label: 'Terminal',
      icon: 'fas fa-terminal',
      component: TerminalPanel
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || EditorPanel;

  return (
    <div className="flex flex-col h-screen bg-secondary-900">
      {/* Header */}
      <Header />
      
      {/* Tab Navigation */}
      <div className="flex bg-secondary-800 border-b border-secondary-700 px-2">
        {tabs.map(tab => (
          <motion.button
            key={tab.id}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-primary-400 bg-secondary-700'
                : 'text-secondary-300 hover:text-secondary-100 hover:bg-secondary-750'
            }`}
            onClick={() => setActiveTab(tab.id)}
            whileTap={{ scale: 0.95 }}
          >
            <i className={tab.icon} />
            <span>{tab.label}</span>
            {tab.badge && (
              <motion.span
                className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {tab.badge}
              </motion.span>
            )}
            {activeTab === tab.id && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-400"
                layoutId="activeTab"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            className="h-full"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <ActiveComponent />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Quick Action FAB */}
      <motion.div
        className="fixed bottom-4 right-4 z-30"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
      >
        <Button
          variant="primary"
          size="lg"
          icon="fas fa-play"
          className="rounded-full w-14 h-14 shadow-lg"
          title="Run Program"
          onClick={() => {
            // TODO: Implement run functionality
            console.log('Run button clicked');
          }}
        />
      </motion.div>
    </div>
  );
}

export default MobileLayout;