/**
 * WorkerIntegration.js
 * Handles integration between the React UI and the Web Worker
 * Manages communication for assembly, interpretation, and file operations
 */

class WorkerIntegration {
  constructor(store) {
    this.store = store;
    this.worker = null;
    this.messageHandlers = new Map();
    this.init();
  }

  /**
   * Initialize the worker and set up message handling
   */
  init() {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker('./worker.js');
      this.setupMessageHandling();
      this.store.getState().setWorker(this.worker);
      console.log('Web Worker initialized');
    } else {
      console.error('Web Workers are not supported in this browser');
      this.store.getState().addTerminalOutput(
        'Web Workers not supported - some features may not work',
        'text-yellow-500'
      );
    }
  }

  /**
   * Set up message handling for worker communication
   */
  setupMessageHandling() {
    if (!this.worker) return;

    this.worker.onmessage = (event) => {
      const { type, data } = event.data;
      
      if (this.messageHandlers.has(type)) {
        this.messageHandlers.get(type)(data);
      } else {
        this.handleDefaultMessage(type, data);
      }
    };

    this.worker.onerror = (error) => {
      console.error('Worker error:', error);
      this.store.getState().addTerminalOutput(
        `Worker error: ${error.message}`,
        'text-red-500'
      );
      this.store.getState().setProcessing(false);
    };

    // Register default message handlers
    this.registerHandler('stdout', (data) => {
      this.store.getState().addTerminalOutput(data);
    });

    this.registerHandler('stderr', (data) => {
      this.store.getState().addTerminalOutput(data, 'text-red-500');
    });

    this.registerHandler('exit', (data) => {
      console.log('LCC process exited with code:', data);
      this.store.getState().addTerminalOutput(
        `Process exited with code: ${data}`,
        'text-yellow-500'
      );
      this.store.getState().setProcessing(false);
    });

    this.registerHandler('stdin-request', () => {
      // Handle input request - could trigger UI state change
      console.log('Worker requesting input');
    });

    this.registerHandler('storage', (data) => {
      // Update localStorage with worker data
      localStorage.setItem('fsWrapper', data);
    });
  }

  /**
   * Register a message handler for a specific message type
   * @param {string} type - Message type
   * @param {Function} handler - Handler function
   */
  registerHandler(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Handle default/unknown message types
   * @param {string} type - Message type
   * @param {*} data - Message data
   */
  handleDefaultMessage(type, data) {
    console.log(`Unhandled worker message: ${type}`, data);
  }

  /**
   * Send a message to the worker
   * @param {string} type - Message type
   * @param {*} data - Message data
   */
  sendMessage(type, data) {
    if (!this.worker) {
      console.error('Worker not initialized');
      return;
    }

    this.worker.postMessage({ type, data });
  }

  /**
   * Run assembly program
   * @param {string} code - Assembly code to run
   * @param {string} fileName - File name
   */
  runProgram(code, fileName = 'program.a') {
    const state = this.store.getState();
    
    state.setProcessing(true);
    state.addTerminalOutput(`Running ${fileName}...`, 'text-blue-400');

    // Save the code to the worker's file system
    this.sendMessage('writeFile', {
      path: fileName,
      content: code
    });

    // Execute the program
    this.sendMessage('execute', {
      command: 'lcc',
      args: [fileName]
    });
  }

  /**
   * Assemble code without running
   * @param {string} code - Assembly code
   * @param {string} fileName - File name
   */
  assembleCode(code, fileName = 'program.a') {
    const state = this.store.getState();
    
    state.setProcessing(true);
    state.addTerminalOutput(`Assembling ${fileName}...`, 'text-blue-400');

    this.sendMessage('writeFile', {
      path: fileName,
      content: code
    });

    this.sendMessage('execute', {
      command: 'assembler',
      args: [fileName]
    });
  }

  /**
   * Send input to the worker
   * @param {string} input - User input
   */
  sendInput(input) {
    this.sendMessage('stdin', input);
  }

  /**
   * Load a demo file
   * @param {string} demoName - Demo file name
   */
  loadDemo(demoName) {
    const state = this.store.getState();
    
    state.addTerminalOutput(`Loading demo: ${demoName}`, 'text-blue-400');
    
    this.sendMessage('loadDemo', { name: demoName });
  }

  /**
   * Clean up resources
   */
  dispose() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.messageHandlers.clear();
  }
}

export default WorkerIntegration;