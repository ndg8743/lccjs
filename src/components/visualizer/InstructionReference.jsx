import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Floating instruction reference panel
 */
function InstructionReference({ isDarkMode, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const instructions = {
    arithmetic: [
      { name: 'ADD', syntax: 'add dr, sr1, sr2/imm5', desc: 'Add two values' },
      { name: 'SUB', syntax: 'sub dr, sr1, sr2/imm5', desc: 'Subtract two values' },
      { name: 'MUL', syntax: 'mul dr, sr', desc: 'Multiply two registers' },
      { name: 'DIV', syntax: 'div dr, sr', desc: 'Divide two registers' },
      { name: 'REM', syntax: 'rem dr, sr', desc: 'Remainder of division' },
    ],
    logical: [
      { name: 'AND', syntax: 'and dr, sr1, sr2/imm5', desc: 'Bitwise AND' },
      { name: 'OR', syntax: 'or dr, sr', desc: 'Bitwise OR' },
      { name: 'XOR', syntax: 'xor dr, sr', desc: 'Bitwise XOR' },
      { name: 'NOT', syntax: 'not dr, sr', desc: 'Bitwise NOT' },
      { name: 'SLL', syntax: 'sll sr, amount', desc: 'Shift left logical' },
      { name: 'SRL', syntax: 'srl sr, amount', desc: 'Shift right logical' },
      { name: 'SRA', syntax: 'sra sr, amount', desc: 'Shift right arithmetic' },
    ],
    memory: [
      { name: 'LD', syntax: 'ld dr, label', desc: 'Load from memory' },
      { name: 'ST', syntax: 'st sr, label', desc: 'Store to memory' },
      { name: 'LDR', syntax: 'ldr dr, baser, offset6', desc: 'Load register relative' },
      { name: 'STR', syntax: 'str sr, baser, offset6', desc: 'Store register relative' },
      { name: 'LEA', syntax: 'lea dr, label', desc: 'Load effective address' },
    ],
    control: [
      { name: 'BR', syntax: 'br label', desc: 'Unconditional branch' },
      { name: 'BRZ', syntax: 'brz label', desc: 'Branch if zero' },
      { name: 'BRN', syntax: 'brn label', desc: 'Branch if negative' },
      { name: 'BRP', syntax: 'brp label', desc: 'Branch if positive' },
      { name: 'BL', syntax: 'bl label', desc: 'Branch and link' },
      { name: 'BLR', syntax: 'blr baser', desc: 'Branch and link register' },
      { name: 'JMP', syntax: 'jmp baser', desc: 'Jump to register' },
      { name: 'RET', syntax: 'ret', desc: 'Return from subroutine' },
    ],
    stack: [
      { name: 'PUSH', syntax: 'push sr', desc: 'Push to stack' },
      { name: 'POP', syntax: 'pop dr', desc: 'Pop from stack' },
    ],
    io: [
      { name: 'DOUT', syntax: 'dout sr', desc: 'Display decimal output' },
      { name: 'DIN', syntax: 'din dr', desc: 'Decimal input' },
      { name: 'SOUT', syntax: 'sout label', desc: 'String output' },
      { name: 'HALT', syntax: 'halt', desc: 'Stop execution' },
    ],
    data: [
      { name: 'MOV', syntax: 'mov dr, sr/imm', desc: 'Move data' },
      { name: 'MVI', syntax: 'mvi dr, imm9', desc: 'Move immediate' },
      { name: 'MVR', syntax: 'mvr dr, sr', desc: 'Move register' },
      { name: 'CMP', syntax: 'cmp sr1, sr2/imm5', desc: 'Compare values' },
    ],
    directives: [
      { name: '.WORD', syntax: '.word value', desc: 'Define word' },
      { name: '.STRINGZ', syntax: '.stringz "text"', desc: 'Define null-terminated string' },
      { name: '.ZERO', syntax: '.zero count', desc: 'Reserve zero-initialized words' },
      { name: '.START', syntax: '.start label', desc: 'Set program start' },
    ]
  };

  const categories = Object.keys(instructions);
  const allInstructions = Object.values(instructions).flat();
  
  const filteredInstructions = (selectedCategory === 'all' ? allInstructions : instructions[selectedCategory])
    .filter(inst => 
      inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.syntax.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.desc.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <motion.div
      className={`fixed inset-y-0 right-0 w-96 shadow-2xl z-50 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}
      initial={{ x: 400 }}
      animate={{ x: 0 }}
      exit={{ x: 400 }}
      transition={{ type: "spring", damping: 20 }}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className={`p-4 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold text-primary-500">
              Instruction Reference
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          {/* Search */}
          <input
            type="text"
            placeholder="Search instructions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-gray-100 border-gray-300'
            }`}
          />
        </div>

        {/* Category Tabs */}
        <div className={`flex flex-wrap gap-2 p-4 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary-500 text-white'
                : isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors capitalize ${
                selectedCategory === cat
                  ? 'bg-primary-500 text-white'
                  : isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Instructions List */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="popLayout">
            {filteredInstructions.map((inst, index) => (
              <motion.div
                key={inst.name}
                className={`mb-3 p-3 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.02 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-mono font-bold text-primary-400">
                    {inst.name}
                  </h4>
                </div>
                <code className={`block text-sm mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {inst.syntax}
                </code>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {inst.desc}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default InstructionReference;