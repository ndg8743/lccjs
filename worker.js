// Worker for LCC Compiler
const randomnumber = Math.floor(Math.random() * 100000);
self.importScripts("./dist/bundle.js" + "?v=" + randomnumber); // Load the LCC compiler

// Initialize LCC
let lcc;
try {
  if (typeof LCC !== 'undefined') {
    if (typeof LCC.default === 'function') {
      lcc = new LCC.default();
      console.log("LCC initialized with default export");
    } else if (typeof LCC === 'function') {
      lcc = new LCC();
      console.log("LCC initialized directly");
    } else {
      console.error("LCC is not a constructor", typeof LCC);
    }
  } else {
    console.error("LCC is undefined");
  }
} catch (e) {
  console.error("Error initializing LCC:", e);
}

self.isWebWorker = true;

// Shared Memory Buffers
let inputBuffer;
let inputView;
let inputIndex;
let indexView;

// Blocking function to wait for input
self.waitForInput = function waitForInput() {
    while (true) {
        console.log("Waiting for input...", Atomics.load(indexView, 0));
        
        // Block until new input arrives
        Atomics.wait(indexView, 0, 0);

        let length = Atomics.load(indexView, 0);
        console.log("Input received:", length);
        
        if (length > 0) {
            let inputCopy = new Uint8Array(length);
            inputCopy.set(inputView.subarray(0, length));
            let inputStr = new TextDecoder().decode(inputCopy);
            
            for (let i = 0; i < inputCopy.length; i++) {
                self.inputBuffer.push(inputCopy[i]);
            }

            console.log("Input:", inputStr);
            self.process.stdout.write(inputStr + "\n");

            // Reset index for new input
            Atomics.store(indexView, 0, 0);
            break;
        }
    }
};

self.fsWrapperStorage.subscribe((type, key, value) => {
    console.log("Storage event:", type, key, value);
    if (type === "set") {
        // sync storage to main thread on every change
        self.postMessage({ type: "storage", data: self.fsWrapperStorage.jsonify() });
    }
});

// Handle messages from the main thread
self.onmessage = function(event) {
    try {
        const { type, payload } = event.data;

        if (event.data.inputBuffer && event.data.inputIndex) {
            inputBuffer = event.data.inputBuffer;
            inputView = new Uint8Array(inputBuffer);
            inputIndex = event.data.inputIndex;
            indexView = new Int32Array(inputIndex);
            console.log("Worker received shared buffers.");
        } else if (type === "stdin-fallback") {
            // Handle input from main thread via fallback
            const input = payload.input;
            console.log("Received input via fallback:", input);

            // Convert input to buffer
            const encoded = new TextEncoder().encode(input + '\n');
            inputView.set(encoded);

            // Notify the waiting thread
            Atomics.store(indexView, 0, encoded.length);
            Atomics.notify(indexView, 0);

        } else if (type === "run") {
            const { code, filePath, name } = payload;

            // Extract filename without extension for output files
            const fileName = filePath.split('.').slice(0, -1).join('.');
            const baseFileName = filePath.split('/').pop().split('.')[0]; // Get just the filename part

            console.log("Running:", fileName, "baseFileName:", baseFileName);

            // Clear input buffer
            while(self.inputBuffer.shift());
            
            // Clear previous outputs - but be more specific about filenames
            const outputExtensions = ['.bst', '.lst', '.e'];
            outputExtensions.forEach(ext => {
                delete self.fsWrapperStorage[fileName + ext];
                delete self.fsWrapperStorage[baseFileName + ext];
            });
            
            self.fsWrapperStorage[filePath] = code;
            self.fsWrapperStorage["name.nnn"] = name || "noname";

            console.log("Files before execution:", Object.keys(self.fsWrapperStorage));

            // CRITICAL: Set up stdout/stderr capture BEFORE LCC execution
            console.log("🔧 Setting up process subscribers...");
            if (self.process && self.process.subscribers) {
                // Clear previous subscribers
                if (self.process.subscribers.length > 0) {
                    console.log("🧹 Clearing", self.process.subscribers.length, "previous subscribers");
                    self.process.subscribers = [];
                }
                
                // Set up new subscriber with debugging
                console.log("📝 Registering new subscriber...");
                self.process.subscribe((type, data) => {
                    console.log("🔔 Worker subscriber triggered:", type, data);
                    if (type === "stdout.write") {
                        console.log("📤 Sending stdout to main thread:", data);
                        self.postMessage({ type: "stdout", data });
                    } else if (type === "stderr.write") {
                        console.log("📤 Sending stderr to main thread:", data);
                        self.postMessage({ type: "stderr", data });
                    } else if (type === "exit") {
                        console.log("📤 Sending exit to main thread:", data);
                        self.postMessage({ type: "exit", code: data });
                    } else if (type === "stdin") {
                        console.log("📥 stdin requested");
                        self.waitForInput();
                    }
                });
                console.log("✅ Subscriber registered, total subscribers:", self.process.subscribers.length);
            } else {
                console.error("❌ No process or subscribers available!");
            }

            // Run LCC Compiler
            try {
                console.log("Starting LCC compilation...");
                console.log("Running LCC with filePath:", filePath);
                
                // Create a new LCC instance for each run to ensure clean state
                if (typeof LCC !== 'undefined') {
                    if (typeof LCC.default === 'function') {
                        lcc = new LCC.default();
                    } else if (typeof LCC === 'function') {
                        lcc = new LCC();
                    }
                }
                
                console.log("🚀 Starting LCC execution...");
                lcc.main([filePath]);
                console.log("LCC compilation completed.");
                console.log("Files after execution:", Object.keys(self.fsWrapperStorage));
                
                // Check if expected output files were generated
                const expectedFiles = [`${fileName}.bst`, `${fileName}.lst`, `${fileName}.e`, `${baseFileName}.bst`, `${baseFileName}.lst`, `${baseFileName}.e`];
                expectedFiles.forEach(file => {
                    if (self.fsWrapperStorage[file]) {
                        console.log(`Generated file found: ${file} (${self.fsWrapperStorage[file].length} bytes)`);
                    } else {
                        console.log(`Expected file not found: ${file}`);
                    }
                });
            } catch (e) {
                console.log("LCC compilation error:", e);
                self.postMessage({ type: "stderr", data: e.toString() });
            }
            self.postMessage({ type: "storage", data: self.fsWrapperStorage.jsonify() });
        } else if (type === "getStorage"){
            self.postMessage({ type: "storage", data: self.fsWrapperStorage.jsonify() });
        }
    } catch (e) {
        console.error("Error in worker message handler:", e);
        self.postMessage({ type: "stderr", data: e.toString() });
    }
};