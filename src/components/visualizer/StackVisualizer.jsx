import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Stack visualization component with change highlighting
 * Stack grows upward (visually) - newer items appear at the top
 */
function StackVisualizer({ stack, previousStack = [], sp, fp, isDarkMode }) {
  const scrollRef = useRef(null);
  
  // Create a map of previous values for comparison
  const previousValues = {};
  previousStack.forEach(item => {
    previousValues[item.address] = item.value;
  });

  // Generate stack entries from current SP up to initial SP (0xFFF0)
  const stackEntries = [];
  const initialSP = 0xFFF0;
  const currentSP = sp;
  
  // Show at least 10 slots or actual stack size
  const minSlotsToShow = 10;
  const slotsNeeded = Math.max(minSlotsToShow, initialSP - currentSP + 1);
  const bottomAddress = Math.max(currentSP - 5, initialSP - slotsNeeded);
  
  // Build stack from bottom to top (higher addresses at bottom, lower at top)
  for (let addr = initialSP; addr >= bottomAddress; addr--) {
    const currentItem = stack.find(item => item.address === addr);
    const wasInPreviousStack = previousStack.some(item => item.address === addr);
    const previousValue = previousValues[addr];
    
    stackEntries.push({
      address: addr,
      value: currentItem?.value || 0,
      label: currentItem?.label || '',
      isNew: currentItem && !wasInPreviousStack,
      hasChanged: currentItem && wasInPreviousStack && previousValue !== currentItem?.value,
      previousValue: previousValue,
      isEmpty: !currentItem
    });
  }
  
  // Auto-scroll to top (where new items appear) when stack changes
  useEffect(() => {
    if (scrollRef.current && stack.length > previousStack.length) {
      scrollRef.current.scrollTop = 0;
    }
  }, [stack.length, previousStack.length]);

  return (
    <div className="h-full flex flex-col">
      {/* Stack Header */}
      <div className="mb-2 text-sm text-gray-400 flex items-center justify-between">
        <span>Stack grows upward ↑</span>
        <span className="text-xs">Lower addresses at top</span>
      </div>

      {/* Stack Visualization */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="space-y-1">
          <AnimatePresence mode="popLayout">
            {stackEntries.reverse().map((entry) => (
              <motion.div
                key={entry.address}
                initial={entry.isNew ? { opacity: 0, y: -20 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className={`flex items-center p-2 rounded font-mono text-sm border ${
                  entry.isEmpty 
                    ? 'border-gray-700 bg-gray-800/50' 
                    : entry.isNew 
                      ? 'border-green-500 bg-green-900/20 shadow-lg shadow-green-500/20'
                      : entry.hasChanged
                        ? 'border-yellow-500 bg-yellow-900/20 shadow-md shadow-yellow-500/20'
                        : 'border-gray-600 bg-gray-800'
                }`}
              >
                {/* Address */}
                <div className="w-20 text-gray-400">
                  0x{entry.address.toString(16).toUpperCase().padStart(4, '0')}
                </div>

                {/* SP/FP Indicators */}
                <div className="w-16 text-center flex items-center justify-center">
                  {entry.address === sp && (
                    <motion.span 
                      className="text-primary-500 font-bold"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      SP→
                    </motion.span>
                  )}
                  {entry.address === fp && (
                    <motion.span 
                      className="text-blue-500 font-bold"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      FP→
                    </motion.span>
                  )}
                </div>

                {/* Value */}
                <div className="flex-1 text-center">
                  {entry.isEmpty ? (
                    <span className="text-gray-600 italic">empty</span>
                  ) : (
                    <>
                      {entry.hasChanged && entry.previousValue !== undefined && (
                        <span className="text-red-500 line-through mr-2">
                          {entry.previousValue}
                        </span>
                      )}
                      <motion.span 
                        className={
                          entry.isNew ? 'text-green-400 underline font-bold' :
                          entry.hasChanged ? 'text-green-400 underline font-bold' :
                          'text-white'
                        }
                        initial={entry.isNew || entry.hasChanged ? { scale: 1.5 } : false}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {entry.value}
                      </motion.span>
                    </>
                  )}
                </div>

                {/* Label */}
                <div className="w-20 text-right text-gray-400">
                  {entry.label && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {entry.label}
                    </motion.span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Stack base indicator */}
          <div className="mt-2 pt-2 border-t-2 border-gray-600 text-center text-xs text-gray-500">
            Stack Base (0xFFF0)
          </div>
        </div>
      </div>

      {/* Stack Info */}
      <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-400">
        <div className="grid grid-cols-2 gap-2">
          <div>Stack Pointer (SP): 0x{sp.toString(16).toUpperCase()}</div>
          <div>Frame Pointer (FP): 0x{fp.toString(16).toUpperCase()}</div>
          <div>Stack Size: {initialSP - sp} words</div>
          <div>Free Space: {sp - 0x3000} words</div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-2 pt-2 border-t border-gray-700 text-xs">
        <div className="flex items-center justify-around">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
            <span className="text-gray-400">New</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded mr-1"></div>
            <span className="text-gray-400">Changed</span>
          </div>
          <div className="flex items-center">
            <span className="text-red-500 line-through mr-1">old</span>
            <span className="text-gray-400">→</span>
            <span className="text-green-400 underline ml-1">new</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StackVisualizer;