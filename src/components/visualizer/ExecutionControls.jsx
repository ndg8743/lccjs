import React from 'react';
import { motion } from 'framer-motion';

/**
 * Execution control panel with step controls
 */
function ExecutionControls({ onStep, onReset, isRunning, isDarkMode }) {
  const handleStep = (direction) => {
    onStep(direction);
  };

  const handleRunStop = () => {
    if (isRunning) {
      onStep('stop');
    } else {
      onStep('run');
    }
  };

  return (
    <motion.div 
      className={`mt-4 rounded-lg p-4 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Step Backward */}
          <motion.button
            onClick={() => handleStep(-1)}
            disabled={isRunning}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isRunning 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
            whileHover={!isRunning ? { scale: 1.05 } : {}}
            whileTap={!isRunning ? { scale: 0.95 } : {}}
          >
            <i className="fas fa-step-backward mr-2"></i>
            Step Back
          </motion.button>

          {/* Step Forward */}
          <motion.button
            onClick={() => handleStep(1)}
            disabled={isRunning}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isRunning 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
            whileHover={!isRunning ? { scale: 1.05 } : {}}
            whileTap={!isRunning ? { scale: 0.95 } : {}}
          >
            <i className="fas fa-step-forward mr-2"></i>
            Step Forward
          </motion.button>

          {/* Run/Stop */}
          <motion.button
            onClick={handleRunStop}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isRunning 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <i className={`fas fa-${isRunning ? 'stop' : 'play'} mr-2`}></i>
            {isRunning ? 'Stop' : 'Run'}
          </motion.button>

          {/* Reset */}
          <motion.button
            onClick={onReset}
            disabled={isRunning}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isRunning 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
            whileHover={!isRunning ? { scale: 1.05 } : {}}
            whileTap={!isRunning ? { scale: 0.95 } : {}}
          >
            <i className="fas fa-redo mr-2"></i>
            Reset
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default ExecutionControls;