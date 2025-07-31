import React, { useState, useEffect, useRef } from 'react';

/**
 * Memory panel component with change highlighting
 */
function MemoryPanel({ memory, previousMemory = [], pc, sp, isDarkMode, draggable = false }) {
  const [displayMode, setDisplayMode] = useState('hex'); // 'hex', 'decimal', or 'ascii'
  const [baseAddress, setBaseAddress] = useState(0x3000);
  const scrollRef = useRef(null);
  const ROWS_TO_SHOW = 16;

  // Track changed memory addresses
  const changedAddresses = new Set();
  if (previousMemory.length === memory.length) {
    for (let i = 0; i < memory.length; i++) {
      if (memory[i] !== previousMemory[i]) {
        changedAddresses.add(i);
      }
    }
  }

  // Auto-follow PC
  useEffect(() => {
    if (pc !== undefined) {
      const newBase = Math.max(0, pc - 8) & 0xFFF0; // Align to 16
      setBaseAddress(newBase);
    }
  }, [pc]);

  const formatValue = (value, mode) => {
    if (mode === 'hex') {
      return value.toString(16).toUpperCase().padStart(4, '0');
    } else if (mode === 'decimal') {
      return value.toString().padStart(5, ' ');
    } else if (mode === 'ascii') {
      if (value >= 32 && value <= 126) {
        return String.fromCharCode(value).padEnd(2, ' ');
      }
      return '..';
    }
  };

  const handleAddressChange = (e) => {
    const value = parseInt(e.target.value, 16);
    if (!isNaN(value) && value >= 0 && value < memory.length) {
      setBaseAddress(value & 0xFFF0); // Align to 16
    }
  };

  const renderMemoryCell = (address, value) => {
    const hasChanged = changedAddresses.has(address);
    const isProgramCounter = address === pc;
    const isStackPointer = address === sp;
    const previousValue = previousMemory[address];
    
    return (
      <div
        key={address}
        className={`px-1 py-0.5 text-center font-mono text-xs transition-all ${
          isProgramCounter ? 'bg-red-900/50 ring-1 ring-red-500' :
          isStackPointer ? 'bg-blue-900/50 ring-1 ring-blue-500' :
          hasChanged ? 'bg-yellow-900/30' :
          ''
        }`}
      >
        {hasChanged && previousValue !== undefined && (
          <div className="text-red-500 line-through text-xs">
            {formatValue(previousValue, displayMode)}
          </div>
        )}
        <div className={hasChanged ? 'text-green-400 underline' : ''}>
          {formatValue(value, displayMode)}
        </div>
      </div>
    );
  };

  return (
    <div className={`h-full bg-gray-800 rounded-lg overflow-hidden ${
      draggable ? '' : 'shadow-lg'
    }`}>
      <div className={`bg-gray-700 px-4 py-2 text-sm font-semibold ${
        draggable ? 'cursor-move' : ''
      }`}>
        <div className="flex justify-between items-center">
          <span>MEMORY</span>
          <div className="flex items-center space-x-2">
            {/* Display Mode Buttons */}
            <div className="flex space-x-1">
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
              <button
                onClick={() => setDisplayMode('ascii')}
                className={`px-2 py-1 rounded text-xs ${
                  displayMode === 'ascii' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                ASCII
              </button>
            </div>
            
            {/* Address Input */}
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-400">Addr:</span>
              <input
                type="text"
                value={baseAddress.toString(16).toUpperCase()}
                onChange={handleAddressChange}
                className="w-16 px-1 py-0.5 text-xs bg-gray-600 rounded text-white font-mono"
                placeholder="0000"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-2 h-[calc(100%-3rem)] overflow-hidden">
        <div ref={scrollRef} className="h-full overflow-y-auto">
          {/* Memory Grid */}
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-xs text-gray-400 font-normal pb-1">Addr</th>
                {[...Array(16)].map((_, i) => (
                  <th key={i} className="text-center text-xs text-gray-400 font-normal pb-1">
                    +{i.toString(16).toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(ROWS_TO_SHOW)].map((_, row) => {
                const rowAddr = baseAddress + row * 16;
                if (rowAddr >= memory.length) return null;
                
                return (
                  <tr key={rowAddr}>
                    <td className="text-xs text-gray-400 font-mono pr-2">
                      {rowAddr.toString(16).toUpperCase().padStart(4, '0')}
                    </td>
                    {[...Array(16)].map((_, col) => {
                      const addr = rowAddr + col;
                      if (addr >= memory.length) return <td key={col}></td>;
                      
                      return (
                        <td key={col}>
                          {renderMemoryCell(addr, memory[addr])}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Legend */}
          <div className="mt-4 pt-2 border-t border-gray-700 text-xs text-gray-400">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-900/50 ring-1 ring-red-500 rounded mr-1"></div>
                <span>PC (Program Counter)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-900/50 ring-1 ring-blue-500 rounded mr-1"></div>
                <span>SP (Stack Pointer)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-900/30 rounded mr-1"></div>
                <span>Changed</span>
              </div>
              <div className="flex items-center">
                <span className="text-red-500 line-through mr-1">old</span>
                <span>→</span>
                <span className="text-green-400 underline ml-1">new</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MemoryPanel;