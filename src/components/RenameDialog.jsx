import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../store/AppStore';

/**
 * Dialog component for renaming files
 */
function RenameDialog() {
  const { isRenaming, currentFileName, renameFile, setIsRenaming } = useApp();
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (isRenaming && currentFileName) {
      setNewName(currentFileName);
    }
  }, [isRenaming, currentFileName]);

  const handleSave = () => {
    if (newName && newName.trim() && newName !== currentFileName) {
      renameFile(currentFileName, newName.trim());
    }
    setIsRenaming(false);
  };

  const handleCancel = () => {
    setIsRenaming(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isRenaming) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-secondary-800 border border-secondary-600 rounded-lg p-6 w-96 max-w-full mx-4"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <h3 className="text-lg font-semibold text-secondary-100 mb-4">
            Rename File
          </h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-secondary-300 mb-2">
              New Name:
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 bg-secondary-700 border border-secondary-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-secondary-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Save
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default RenameDialog; 