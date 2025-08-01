import React, { useState, useEffect, useRef } from 'react';

/**
 * Memory panel component with change highlighting
 * Now supports object-based memory format from LCC bridge
 */
function MemoryPanel({ memory = {}, previousMemory = {}, pc, sp, isDarkMode }) {
  const [displayMode, setDisplayMode] = useState('hex'); // 'hex', 'decimal', or 'ascii'
  const [baseAddress, setBaseAddress] = useState(0x3000);
  const scrollRef = useRef(null);
  const ROWS_TO_SHOW = 16;

  // Convert memory object to array for display
  const memoryAddresses = Object.keys(memory).map(addr => parseInt(addr)).sort((a, b) => a - b);
  
  // Track changed memory addresses
  const changedAddresses = new Set();
  for (const addr in memory) {
    if (previousMemory[addr] !== memory[addr]) {
      changedAddresses.add(parseInt(addr));
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
    if (value === undefined) return '....';
    
    if (mode === 'hex') {
      return value.toString(16).toUpperCase().padStart(4, '0');
    } else if (mode === 'decimal') {
      // Show as signed 16-bit
      const signed = (value & 0x8000) ? value - 0x10000 : value;
      return signed.toString().padStart(5, ' ');
    } else if (mode === 'ascii') {
      const high = (value >> 8) & 0xFF;
      const low = value & 0xFF;
      let result = '';
      result += (high >= 32 && high <= 126) ? String.fromCharCode(high) : '.';
      result += (low >= 32 && low <= 126) ? String.fromCharCode(low) : '.';
      return result;
    }
  };

  const handleAddressChange = (e) => {
    const value = parseInt(e.target.value, 16);
    if (!isNaN(value) && value >= 0 && value < 0x10000) {
      setBaseAddress(value & 0xFFF0); // Align to 16
    }
  };

  const renderMemoryCell = (address) => {
    const value = memory[address];
    const hasChanged = changedAddresses.has(address);
    const isProgramCounter = address === pc;
    const isStackPointer = address === sp;
    const previousValue = previousMemory[address];
    
    // If no value at this address, show empty cell
    if (value === undefined) {
      return (
        <div
          key={address}
          className={`px-1 py-0.5 text-center font-mono text-xs transition-all ${
            isProgramCounter ? 'bg-red-900/50 ring-1 ring-red-500' :
            isStackPointer ? 'bg-blue-900/50 ring-1 ring-blue-500' :
            'text-gray-600'
          }`}
        >
          {formatValue(undefined, displayMode)}
        </div>
      );
    }
    
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
        <div className={hasChanged ? 'text-green-400' : ''}>
          {formatValue(value, displayMode)}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-gray-700 px-4 py-2 text-sm font-semibold rounded-t-lg">
        <div className="flex justify-between items-center">
          <span>MEMORY</span>
          <div className="flex items-center space-x-2">
            {/* Display Mode Buttons */}
            <div className="flex space-x-1">
              <button
                onClick={() => setDisplayMode('hex')}
                className={`px-2 py-1 rounded text-xs ${
                  displayMode === 'hex' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                Hex
              </button>
              <button
                onClick={() => setDisplayMode('decimal')}
                className={`px-2 py-1 rounded text-xs ${
                  displayMode === 'decimal' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                Dec
              </button>
              <button
                onClick={() => setDisplayMode('ascii')}
                className={`px-2 py-1 rounded text-xs ${
                  displayMode === 'ascii' 
                    ? 'bg-blue-600 text-white' 
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
                value={baseAddress.toString(16).toUpperCase().padStart(4, '0')}
                onChange={handleAddressChange}
                className="w-16 px-1 py-0.5 text-xs bg-gray-600 rounded text-white font-mono"
                placeholder="0000"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-2 overflow-hidden">
        <div ref={scrollRef} className="h-full overflow-y-auto relative">
          {/* Memory Grid */}
          <table className="w-full">
            <thead>
              <tr>
                <th className="sticky top-0 bg-gray-800 z-10 text-left text-xs text-gray-400 font-normal pb-1">Addr</th>
                {[...Array(16)].map((_, i) => (
                  <th key={i} className="sticky top-0 bg-gray-800 z-10 text-center text-xs text-gray-400 font-normal pb-1">
                    +{i.toString(16).toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(ROWS_TO_SHOW)].map((_, row) => {
                const rowAddr = baseAddress + row * 16;
                if (rowAddr >= 0x10000) return null;
                
                return (
                  <tr key={rowAddr}>
                    <td className="text-xs text-gray-400 font-mono pr-2">
                      {rowAddr.toString(16).toUpperCase().padStart(4, '0')}
                    </td>
                    {[...Array(16)].map((_, col) => {
                      const addr = rowAddr + col;
                      if (addr >= 0x10000) return <td key={col}></td>;
                      
                      return (
                        <td key={col}>
                          {renderMemoryCell(addr)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Memory Stats */}
          <div className="mt-4 pt-2 border-t border-gray-700 text-xs text-gray-400">
            <div className="mb-2">
              Memory Usage: {memoryAddresses.length} locations
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-900/50 ring-1 ring-red-500 rounded mr-1"></div>
                <span>PC</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-900/50 ring-1 ring-blue-500 rounded mr-1"></div>
                <span>SP</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-900/30 rounded mr-1"></div>
                <span>Changed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MemoryPanel;