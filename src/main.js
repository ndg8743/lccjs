// Main application script
import { LccLinter, LccHoverProvider } from './lcc-mode.js';

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Wait for the editor to be initialized
  const checkEditor = setInterval(() => {
    if (window.editor) {
      clearInterval(checkEditor);
      initializeEditor();
      initializeCommandPalette();
      initializeFileOperations();
      initializeDownloadOptions();
      initializeLintingToggles();
      initializeThemeToggle();
      initializeTerminal();
      initializeHamburgerMenu();
      initializeWorkerHandlers();
      initializeRunButton();
    }
  }, 100);
});

// Initialize the CodeMirror editor with LCC mode
function initializeEditor() {
  // Get the editor instance from the global scope
  const editor = window.editor;
  
  if (!editor) {
    console.error('Editor not found');
    return;
  }
  
  // Set the mode to LCC
  editor.setOption('mode', 'lcc');
  
  // Initialize the linter
  const linter = new LccLinter(editor);
  window.lccLinter = linter;
  
  // Initialize the hover provider
  if (window.lccHoverProvider) {
    // Dispose of any existing hover provider
    try {
      window.lccHoverProvider.dispose();
    } catch (error) {
      console.error("Error disposing hover provider:", error);
    }
  }
  
  try {
    const hoverProvider = new LccHoverProvider(editor);
    window.lccHoverProvider = hoverProvider;
    console.log("Hover provider initialized successfully");
  } catch (error) {
    console.error("Error initializing hover provider:", error);
  }
  
  // Run initial lint
  linter.lint();
  
  // Set up change event to trigger linting
  editor.on('change', () => {
    linter.lint();
  });
  
  // Set up editor focus event to refresh hover provider
  editor.on('focus', () => {
    if (window.lccHoverProvider) {
      // Reinitialize hover provider to ensure it works after editor focus
      window.lccHoverProvider.dispose();
      window.lccHoverProvider = new LccHoverProvider(editor);
    }
  });
}

// Initialize the terminal interface
function initializeTerminal() {
  const terminal = document.getElementById('terminal');
  const terminalInput = document.getElementById('terminal-input');
  
  if (!terminal || !terminalInput) {
    console.error('Terminal elements not found');
    return;
  }
  
  // Focus the input when clicking on the terminal
  terminal.addEventListener('click', () => {
    terminalInput.focus();
  });
  
  // Handle input submission
  terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      const input = terminalInput.value;
      terminalInput.value = '';
      
      // Display the input in the terminal
      appendToTerminal(`> ${input}`, 'input');
      
      // Process the input
      processTerminalInput(input);
      
      // Focus the input field again
      setTimeout(() => {
        terminalInput.focus();
      }, 10);
    }
    
    // Basic autocomplete for LCC commands
    if (e.key === 'Tab') {
      e.preventDefault();
      autocompleteCommand(terminalInput);
    }
  });
  
  // Add clear button functionality
  const btnClear = document.getElementById('btn-clear');
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      terminal.innerHTML = '';
      terminalInput.focus();
    });
  }
}

// Simple autocomplete for LCC assembly commands
function autocompleteCommand(input) {
  const commands = [
    'add', 'sub', 'mul', 'div', 'rem', 'and', 'or', 'xor', 'not',
    'mov', 'ld', 'st', 'lea', 'ldr', 'str', 'push', 'pop',
    'br', 'brz', 'brn', 'brp', 'jmp', 'jsr', 'ret', 'bl', 'blr',
    'dout', 'hout', 'aout', 'sout', 'din', 'hin', 'ain', 'sin',
    'halt', 'nl', '.word', '.zero', '.string', '.start', '.global', '.extern'
  ];
  
  const currentValue = input.value;
  const words = currentValue.split(/\s+/);
  const lastWord = words[words.length - 1];
  
  if (lastWord) {
    const matches = commands.filter(cmd => cmd.startsWith(lastWord.toLowerCase()));
    if (matches.length === 1) {
      words[words.length - 1] = matches[0];
      input.value = words.join(' ');
    } else if (matches.length > 1) {
      // Show available completions in terminal
      appendToTerminal(`Available: ${matches.join(', ')}`, 'text-blue-400');
    }
  }
}

// Process terminal input
function processTerminalInput(input) {
  // Send the input to the worker
  if (window.worker) {
    // Try SharedArrayBuffer first, fallback to message passing
    if (window.inputView && window.indexView) {
      try {
        // Encode input string into the shared buffer
        const encoded = new TextEncoder().encode(input + '\n');
        window.inputView.set(encoded, 0);
        Atomics.store(window.indexView, 0, encoded.length);
        
        // Notify Worker of new input
        Atomics.notify(window.indexView, 0);
      } catch (e) {
        console.error("Error sending input via SharedArrayBuffer:", e);
        // Fallback to message passing
        window.worker.postMessage({
          type: "stdin-fallback", 
          payload: { input }
        });
      }
    } else {
      // Fallback to message passing
      window.worker.postMessage({
        type: "stdin-fallback",
        payload: { input }
      });
    }
  }
}

function appendToLastTerminalLine(text) {
  const terminal = document.getElementById('terminal');
  if (!terminal) return;

  // if there are no terminal-lines, create a new one
  if (terminal.childElementCount === 0) {
    terminal.appendChild(createTerminalLine(text));
    return;
  }

  const lastLine = terminal.lastElementChild;
  if (lastLine && lastLine.classList.contains('terminal-line')) {
    lastLine.textContent += text;
  }
}

function createTerminalLine(text, className = '') {
  const line = document.createElement('div');
  line.className = `terminal-line ${className}`;
  line.textContent = text;
  return line;
}

// Append text to the terminal
function appendToTerminal(text, className = '') {
  const terminal = document.getElementById('terminal');
  if (!terminal) return;
  
  if (className === 'input') {
    terminal.appendChild(createTerminalLine(text, className));
  } else if (text.includes('\n')) { 
    const lines = text.split('\n');
    appendToLastTerminalLine(lines.shift());

    lines.forEach(line => {
      terminal.appendChild(createTerminalLine(line, className));
      
    });
  } else {
    appendToLastTerminalLine(text);
  }

  terminal.scrollTop = terminal.scrollHeight;
}

// Initialize hamburger menu
function initializeHamburgerMenu() {
  const hamburgerBtn = document.getElementById('hamburger-menu-btn');
  const hamburgerMenu = document.getElementById('hamburger-menu');
  
  if (!hamburgerBtn || !hamburgerMenu) {
    console.error('Hamburger menu elements not found');
    return;
  }
  
  hamburgerBtn.addEventListener('click', () => {
    hamburgerMenu.classList.toggle('hidden');
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!hamburgerBtn.contains(e.target) && !hamburgerMenu.contains(e.target)) {
      hamburgerMenu.classList.add('hidden');
    }
  });
}

// Initialize the command palette functionality
function initializeCommandPalette() {  const commandPalette = document.getElementById('command-palette');
  const commandPaletteInput = document.getElementById('command-palette-input');
  const commandPaletteResults = document.getElementById('command-palette-results');
  
  if (!commandPalette || !commandPaletteInput || !commandPaletteResults) {
    console.error('Command palette elements not found');
    return;
  }
  
  // Define available commands
  const commands = [
    { id: 'run', name: 'Run Program', action: () => document.getElementById('btn-run').click() },
    { id: 'clear', name: 'Clear Terminal', action: () => document.getElementById('btn-clear').click() },
    { id: 'toggle-error', name: 'Toggle Error Checking', action: () => document.getElementById('btn-toggle-error').click() },
    { id: 'toggle-warning', name: 'Toggle Warning Checking', action: () => document.getElementById('btn-toggle-warning').click() },
    { id: 'toggle-info', name: 'Toggle Info Checking', action: () => document.getElementById('btn-toggle-info').click() },
    { id: 'toggle-theme', name: 'Toggle Dark Mode', action: () => document.getElementById('btn-theme-toggle').click() },
    { id: 'open-file', name: 'Open File', action: () => document.getElementById('btn-open').click() },
    { id: 'save-file', name: 'Save File', action: () => document.getElementById('btn-save').click() },
    { id: 'load-demo', name: 'Load a1test.a', action: () => loadDemo('a1test.a') }
  ];
  
  // Toggle command palette
  function toggleCommandPalette() {
    commandPalette.classList.toggle('hidden');
    if (!commandPalette.classList.contains('hidden')) {
      commandPaletteInput.focus();
      commandPaletteInput.value = '';
      commandPaletteInput.dispatchEvent(new Event('input'));
    }
  }
  
  // Keyboard shortcut for command palette (Ctrl+Shift+P)
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.shiftKey && event.key === 'P') {
      event.preventDefault();
      toggleCommandPalette();
    }
    
    // Escape to close command palette
    if (event.key === 'Escape' && !commandPalette.classList.contains('hidden')) {
      commandPalette.classList.add('hidden');
    }
  });
    // Close command palette when clicking outside
  document.addEventListener('click', (e) => {
    if (!commandPalette.contains(e.target)) {
      commandPalette.classList.add('hidden');
    }
  });
  
  // Handle input in the command palette
  commandPaletteInput.addEventListener('input', () => {
    const query = commandPaletteInput.value.toLowerCase();
    const filteredCommands = commands.filter(cmd => 
      cmd.name.toLowerCase().includes(query)
    );
    
    commandPaletteResults.innerHTML = '';
    
    filteredCommands.forEach((cmd, index) => {
      const item = document.createElement('div');
      item.className = 'command-palette-item';
      if (index === 0) item.classList.add('active'); // Make first item active by default
      item.textContent = cmd.name;
      item.addEventListener('click', () => {
        cmd.action();
        commandPalette.classList.add('hidden');
        commandPaletteInput.value = '';
      });
      commandPaletteResults.appendChild(item);
    });
  });
    // Handle keyboard navigation in the command palette
  commandPaletteInput.addEventListener('keydown', (event) => {
    const items = commandPaletteResults.querySelectorAll('.command-palette-item');
    const activeItem = commandPaletteResults.querySelector('.command-palette-item.active');
    let activeIndex = Array.from(items).indexOf(activeItem);
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (activeIndex < items.length - 1) {
          if (activeItem) activeItem.classList.remove('active');
          items[activeIndex + 1].classList.add('active');
          items[activeIndex + 1].scrollIntoView({ block: 'nearest' });
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (activeIndex > 0) {
          if (activeItem) activeItem.classList.remove('active');
          items[activeIndex - 1].classList.add('active');
          items[activeIndex - 1].scrollIntoView({ block: 'nearest' });
        }
        break;
      case 'Enter':
        event.preventDefault();
        if (activeItem) {
          activeItem.click();
        } else if (items.length > 0) {
          items[0].click();
        }
        break;
      case 'Escape':
        event.preventDefault();
        commandPalette.classList.add('hidden');
        break;
    }
  });
}

// Initialize file operations (open, save)
function initializeFileOperations() {
  const btnNew = document.getElementById('btn-new');
  const btnOpen = document.getElementById('btn-open');
  const btnSave = document.getElementById('btn-save');
  const fileInput = document.getElementById('file-input');
  
  if (!btnNew || !btnOpen || !btnSave || !fileInput) {
    console.error('File operation elements not found');
    return;
  }
  
  // New file button
  btnNew.addEventListener('click', () => {
    if (confirm('Create a new file? Any unsaved changes will be lost.')) {
      window.editor.setValue('');
    }
  });
  
  // Open file button
  btnOpen.addEventListener('click', () => {
    fileInput.click();
  });
  
  // File input change handler
  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        window.editor.setValue(e.target.result);
      };
      reader.readAsText(file);
    }
  });
  
  // Save file button
  btnSave.addEventListener('click', () => {
    downloadFile('a');
  });
    // Mobile buttons
  const btnNewMobile = document.getElementById('btn-load-demo-mobile');
  if (btnNewMobile) {
    btnNewMobile.addEventListener('click', () => {
      loadDemo('a1test.a');
      document.getElementById('hamburger-menu').classList.add('hidden');
    });
  }
}

// Initialize download options
function initializeDownloadOptions() {
  // Download format buttons
  document.querySelectorAll('.download-format-btn').forEach(button => {
    button.addEventListener('click', () => {
      const format = button.getAttribute('data-format');
      downloadFile(format);
      document.getElementById('hamburger-menu').classList.add('hidden');
    });
  });
  
  // Download all as TXT button
  const btnDownloadAll = document.getElementById('btn-download-all');
  if (btnDownloadAll) {
    btnDownloadAll.addEventListener('click', () => {
      downloadAllAsTxt();
      document.getElementById('hamburger-menu').classList.add('hidden');
    });
  }
}

// Download file with the specified format
function downloadFile(format) {
  let code;
  const storage = JSON.parse(localStorage['fsWrapper'] || '{}');

  switch (format) {
    case 'a':
      code = storage['program.a'] || window.editor.getValue();
      break;
    case 'bst':
      code = storage['program.bst'] || '';
      break;
    case 'lst':
      code = storage['program.lst'] || '';
      break;
    case 'e':
      code = storage['program.e'] || '';
      break;
    case 'nnn':
      code = storage['name.nnn'] || '';
      break;
    default:
      console.error('Invalid download format:', format);
      return;
  }
  
  if (!code) {
    appendToTerminal(`No ${format.toUpperCase()} file available. Run the program first.`, 'text-yellow-500');
    return;
  }

  const blob = new Blob([code], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `program.${format}`;
  a.click();  URL.revokeObjectURL(url);
}

// Download all files as a single TXT file
function downloadAllAsTxt() {
  const storage = JSON.parse(localStorage['fsWrapper'] || '{}');
  
  // Get current .a file (from editor if not in storage)
  const aCode = storage['program.a'] || window.editor.getValue();
  const lstCode = storage['program.lst'] || '';
  const bstCode = storage['program.bst'] || '';
  
  if (!aCode && !lstCode && !bstCode) {
    appendToTerminal('No files available to download. Run the program first.', 'text-yellow-500');
    return;
  }
  
  // Create combined content
  let combinedContent = '';
  
  if (aCode) {
    combinedContent += '=== ASSEMBLY FILE (.a) ===\n';
    combinedContent += aCode;
    combinedContent += '\n\n';
  }
  
  if (lstCode) {
    combinedContent += '=== LISTING FILE (.lst) ===\n';
    combinedContent += lstCode;
    combinedContent += '\n\n';
  }
  
  if (bstCode) {
    combinedContent += '=== BINARY FILE (.bst) ===\n';
    combinedContent += bstCode;
    combinedContent += '\n\n';
  }
  
  if (combinedContent) {
    combinedContent += `=== GENERATED ON ===\n${new Date().toLocaleString()}\n`;
    
    const blob = new Blob([combinedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lcc_all_files.txt';
    a.click();
    URL.revokeObjectURL(url);
    
    appendToTerminal('All files downloaded as lcc_all_files.txt', 'text-green-500');
  }
}

// Initialize linting toggle buttons
function initializeLintingToggles() {
  const btnToggleError = document.getElementById('btn-toggle-error');
  const btnToggleWarning = document.getElementById('btn-toggle-warning');
  const btnToggleInfo = document.getElementById('btn-toggle-info');
  
  if (!btnToggleError || !btnToggleWarning || !btnToggleInfo) {
    console.error('Linting toggle elements not found');
    return;
  }
  
  btnToggleError.addEventListener('click', function() {
    this.classList.toggle('opacity-50');
    if (window.lccLinter) {
      window.lccLinter.toggleErrorChecking();
    }
  });
  
  btnToggleWarning.addEventListener('click', function() {
    this.classList.toggle('opacity-50');
    if (window.lccLinter) {
      window.lccLinter.toggleWarningChecking();
    }
  });
  
  btnToggleInfo.addEventListener('click', function() {
    this.classList.toggle('opacity-50');
    if (window.lccLinter) {
      window.lccLinter.toggleInfoChecking();
    }
  });
}

// Initialize theme
function initializeTheme() {
  const darkMode = localStorage.getItem('darkMode');
  const shouldBeDark = darkMode === 'true';
  
  // Set initial theme
  if (shouldBeDark) {
    document.documentElement.classList.add('dark');
    document.body.classList.add('bg-secondary-900');
    document.body.classList.add('text-secondary-100');
  } else {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('bg-secondary-900');
    document.body.classList.remove('text-secondary-100');
  }

  // Update theme toggle button if it exists
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  if (btnThemeToggle) {
    btnThemeToggle.innerHTML = shouldBeDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  }

  // Update CodeMirror theme if editor exists
  if (window.editor) {
    window.editor.setOption('theme', shouldBeDark ? 'lcc-dark' : 'lcc-light');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // ...existing initialization code...
  initializeTheme();
});

// Load demo files
function loadDemo(demoFile = 'a1test.a') {
  fetch(`demos/${demoFile}`)
    .then(response => response.text())
    .then(code => {
      window.editor.setValue(code);
    })
    .catch(error => {
      console.error('Error loading demo:', error);
      appendToTerminal(`Error loading demo: ${error.message}`, 'text-red-500');
    });
}

// Initialize demo selector
const btnLoadDemo = document.getElementById('btn-load-demo');
if (btnLoadDemo) {
  btnLoadDemo.addEventListener('click', () => {
    loadDemo('a1test.a');
  });
}

// Utility function to debug and reset hover functionality
function resetHoverProvider() {
  try {
    if (window.lccHoverProvider) {
      window.lccHoverProvider.dispose();
    }
    
    if (window.editor) {
      // Wait a brief moment to ensure DOM is ready
      setTimeout(() => {
        window.lccHoverProvider = new LccHoverProvider(window.editor);
        console.log("Hover provider reset and reinstantiated");
      }, 100);
      return true;
    } else {
      console.error("Editor not found when resetting hover provider");
      return false;
    }
  } catch (error) {
    console.error("Error resetting hover provider:", error);
    return false;
  }
}

// Export functions for global use
window.loadDemo = loadDemo;
window.downloadFile = downloadFile;
window.downloadAllAsTxt = downloadAllAsTxt;
window.appendToTerminal = appendToTerminal;
window.resetHoverProvider = resetHoverProvider;

// Initialize worker message handlers
function initializeWorkerHandlers() {
  if (!window.worker) {
    console.error('Worker not initialized');
    return;
  }
  
  window.worker.onmessage = function(event) {
    const { type, data } = event.data;
    if (type === "stdout") {
      appendToTerminal(data);
    } else if (type === "stderr") {
      appendToTerminal(data, 'text-red-500');
    } else if (type === "exit") {
      console.log("LCC process exited with code:", data);
      appendToTerminal(`Process exited with code: ${data}`, 'text-yellow-500');
    } else if (type === "stdin-request") {
      // Focus the terminal input for user input
      const terminalInput = document.getElementById('terminal-input');
      if (terminalInput) {
        terminalInput.focus();
      }
    } else if (type === "storage") {
      localStorage.setItem("fsWrapper", data);
    }
  };
}

// Initialize run button
function initializeRunButton() {
  const btnRun = document.getElementById('btn-run');
  const btnRunMobile = document.getElementById('btn-run-mobile');
  
  const runHandler = () => {
    // Clear terminal
    const terminal = document.getElementById('terminal');
    if (terminal) {
      terminal.innerHTML = '';
    }
    
    const filePath = "program.a";
    const code = window.editor.getValue();
    const name = "user";
      // Reset input buffer if available
    if (window.inputView && window.indexView) {
      Atomics.store(window.indexView, 0, 0);
    }
    
    // Send code to worker
    window.worker.postMessage({
      type: "run",
      payload: { code, filePath, name }
    });
    
    // Focus the terminal input after running
    setTimeout(() => {
      const terminalInput = document.getElementById('terminal-input');
      if (terminalInput) {
        terminalInput.focus();
      }
    }, 500);
    
    // On mobile, scroll to the terminal section
    if (window.innerWidth < 768) {
      const terminalSection = document.querySelector('.terminal').closest('.flex-1');
      if (terminalSection) {
        setTimeout(() => {
          terminalSection.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  };
  
  if (btnRun) {
    btnRun.addEventListener('click', runHandler);
  } else {
    console.error('Run button not found');
  }
  
  if (btnRunMobile) {
    btnRunMobile.addEventListener('click', runHandler);
  }
}
