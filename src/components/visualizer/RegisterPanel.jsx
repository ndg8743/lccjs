import React, { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Register panel component with change highlighting
 */
function RegisterPanel({ registers, previousRegisters = {}, isDarkMode, draggable = false }) {
  const [displayMode, setDisplayMode] = useState('hex'); // 'hex' or 'decimal'
  
  const generalRegs = ['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7'];
  const specialRegs = ['pc', 'sp', 'fp', 'lr', 'ir'];
  const flags = ['n', 'z', 'c', 'v'];

  const formatValue = (value) => {
    if (displayMode === 'hex') {
      return `0x${value.toString(16).toUpperCase().padStart(4, '0')}`;
    } else {
      return value.toString();
    }
  };

  const renderRegister = (name, value) => {
    const previousValue = previousRegisters[name];
    const hasChanged = previousValue !== undefined && previousValue !== value;
    
    return (
      <div 
        key={name}
        className={`flex justify-between p-2 rounded transition-all ${
          hasChanged ? 'bg-yellow-900/30 border border-yellow-600' : ''
        }`}
      >
        <span className="font-semibold uppercase">{name}:</span>
        <span className="font-mono">
          {hasChanged && (
            <span className="text-red-500 line-through mr-2">
              {formatValue(previousValue)}
            </span>
          )}
          <span className={hasChanged ? 'text-green-400 underline' : ''}>
            {formatValue(value)}
          </span>
        </span>
      </div>
    );
  };

  const renderFlag = (name, value) => {
    const previousValue = previousRegisters[name];
    const hasChanged = previousValue !== undefined && previousValue !== value;
    
    return (
      <motion.div 
        key={name}
        className={`flex items-center justify-center w-12 h-12 rounded-lg font-bold text-lg transition-all ${
          value 
            ? hasChanged 
              ? 'bg-green-600 text-white ring-2 ring-green-400' 
              : 'bg-primary-600 text-white'
            : 'bg-gray-700 text-gray-500'
        }`}
        whileHover={{ scale: 1.05 }}
        animate={hasChanged ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        {name.toUpperCase()}
      </motion.div>
    );
  };

  return (
    <div className={`h-full bg-gray-800 rounded-lg overflow-hidden ${
      draggable ? '' : 'shadow-lg'
    }`}>
      <div className={`bg-gray-700 px-4 py-2 text-sm font-semibold flex justify-between items-center ${
        draggable ? 'cursor-move' : ''
      }`}>
        <span>REGISTERS</span>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setDisplayMode('hex')}
            className={`px-2 py-1 rounded text-xs ${
              displayMode === 'hex' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            Hex
          </button>
          <button
            onClick={() => setDisplayMode('decimal')}
            className={`px-2 py-1 rounded text-xs ${
              displayMode === 'decimal' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            Dec
          </button>
        </div>
      </div>
      
      <div className="p-4 space-y-4 h-[calc(100%-3rem)] overflow-y-auto">
        {/* General Purpose Registers */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 mb-2">General Purpose</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {generalRegs.map(reg => renderRegister(reg, registers[reg] || 0))}
          </div>
        </div>

        {/* Special Registers */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 mb-2">Special Registers</h3>
          <div className="space-y-2 text-sm">
            {specialRegs.map(reg => renderRegister(reg, registers[reg] || 0))}
          </div>
        </div>

        {/* Flags */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 mb-2">Condition Flags</h3>
          <div className="flex space-x-2">
            {flags.map(flag => renderFlag(flag, registers[flag] || false))}
          </div>
        </div>

        {/* Legend */}
        <div className="pt-2 border-t border-gray-700 text-xs text-gray-400">
          <div className="space-y-1">
            <div className="flex items-center">
              <span className="text-red-500 line-through mr-1">old</span>
              <span>→</span>
              <span className="text-green-400 underline ml-1">new</span>
              <span className="ml-2">= changed value</span>
            </div>
            <div>N=Negative, Z=Zero, C=Carry, V=Overflow</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPanel;