import React from 'react';
import { motion } from 'framer-motion';

/**
 * Execution control panel with responsive step controls
 */
function ExecutionControls({ onStep, onReset, isRunning, isDarkMode, compact = false }) {
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

  // Button configuration for easy customization
  const buttons = [
    {
      label: compact ? '' : 'Step Back',
      icon: 'fas fa-step-backward',
      onClick: () => handleStep(-1),
      disabled: isRunning,
      className: isRunning 
        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
        : 'bg-orange-500 hover:bg-orange-600 text-white',
      title: 'Step Backward'
    },
    {
      label: compact ? '' : 'Step Forward',
      icon: 'fas fa-step-forward',
      onClick: () => handleStep(1),
      disabled: isRunning,
      className: isRunning 
        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
        : 'bg-green-500 hover:bg-green-600 text-white',
      title: 'Step Forward'
    },
    {
      label: compact ? '' : (isRunning ? 'Stop' : 'Run'),
      icon: `fas fa-${isRunning ? 'stop' : 'play'}`,
      onClick: handleRunStop,
      disabled: false,
      className: isRunning 
        ? 'bg-red-500 hover:bg-red-600 text-white' 
        : 'bg-blue-500 hover:bg-blue-600 text-white',
      title: isRunning ? 'Stop Execution' : 'Run Program'
    },
    {
      label: compact ? '' : 'Reset',
      icon: 'fas fa-redo',
      onClick: onReset,
      disabled: isRunning,
      className: isRunning 
        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
        : isDarkMode 
          ? 'bg-gray-700 hover:bg-gray-600 text-white'
          : 'bg-gray-200 hover:bg-gray-300 text-gray-800',
      title: 'Reset Program'
    }
  ];

  return (
    <motion.div 
      className={`h-full flex items-center ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="w-full px-2 overflow-x-auto">
        <div className={`flex items-center ${compact ? 'justify-around' : 'justify-center'} gap-2 min-w-max`}>
          {buttons.map((button, index) => (
            <motion.button
              key={index}
              onClick={button.onClick}
              disabled={button.disabled}
              title={button.title}
              className={`
                ${compact ? 'p-2' : 'px-3 py-2'} 
                rounded-lg font-medium transition-colors flex items-center gap-2
                ${button.className}
                ${compact ? 'text-sm' : 'text-sm'}
              `}
              whileHover={!button.disabled ? { scale: 1.05 } : {}}
              whileTap={!button.disabled ? { scale: 0.95 } : {}}
            >
              <i className={`${button.icon} ${compact ? 'text-base' : 'text-sm'}`}></i>
              {button.label && <span className="whitespace-nowrap">{button.label}</span>}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default ExecutionControls;