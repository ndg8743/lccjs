/**
 * FileManager.js
 * Enhanced file management utilities for LCC.js IDE
 * Handles file/folder operations, naming, and tree structure
 */

/**
 * File manager class for handling file operations
 */
class FileManager {
  constructor() {
    this.fileTree = new Map();
    this.watchedFiles = new Set();
    this.maxFileSize = 10 * 1024 * 1024; // 10MB limit
  }

  /**
   * Validates a file name
   * @param {string} fileName - File name to validate
   * @returns {Object} Validation result with isValid and error message
   */
  validateFileName(fileName) {
    if (!fileName || fileName.trim().length === 0) {
      return { isValid: false, error: 'File name cannot be empty' };
    }

    const trimmed = fileName.trim();
    
    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (invalidChars.test(trimmed)) {
      return { isValid: false, error: 'File name contains invalid characters' };
    }

    // Check length
    if (trimmed.length > 255) {
      return { isValid: false, error: 'File name is too long (max 255 characters)' };
    }

    // Check for reserved names (Windows)
    const reserved = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
    if (reserved.test(trimmed)) {
      return { isValid: false, error: 'File name is reserved' };
    }

    return { isValid: true };
  }

  /**
   * Generates a unique file name if conflicts exist
   * @param {string} baseName - Base file name
   * @param {Set} existingNames - Set of existing file names
   * @returns {string} Unique file name
   */
  generateUniqueFileName(baseName, existingNames) {
    if (!existingNames.has(baseName)) {
      return baseName;
    }

    const { name, ext } = this.parseFileName(baseName);
    let counter = 1;
    let uniqueName;

    do {
      uniqueName = `${name} (${counter})${ext}`;
      counter++;
    } while (existingNames.has(uniqueName));

    return uniqueName;
  }

  /**
   * Parses a file name into name and extension
   * @param {string} fileName - File name to parse
   * @returns {Object} Object with name and extension
   */
  parseFileName(fileName) {
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex === -1 || lastDotIndex === 0) {
      return { name: fileName, ext: '' };
    }
    
    return {
      name: fileName.substring(0, lastDotIndex),
      ext: fileName.substring(lastDotIndex)
    };
  }

  /**
   * Reads files from FileList (from input or drag-drop)
   * @param {FileList} fileList - Files to read
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Array>} Array of file objects
   */
  async readFiles(fileList, onProgress = null) {
    const files = Array.from(fileList);
    const results = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file size
      if (file.size > this.maxFileSize) {
        results.push({
          name: file.name,
          error: `File too large (${this.formatFileSize(file.size)} > ${this.formatFileSize(this.maxFileSize)})`
        });
        continue;
      }

      try {
        const content = await this.readFileContent(file);
        results.push({
          name: file.name,
          path: file.webkitRelativePath || file.name,
          content: content,
          size: file.size,
          lastModified: file.lastModified,
          type: file.type
        });
      } catch (error) {
        results.push({
          name: file.name,
          error: error.message
        });
      }

      if (onProgress) {
        onProgress((i + 1) / files.length);
      }
    }

    return results;
  }

  /**
   * Reads content from a File object
   * @param {File} file - File to read
   * @returns {Promise<string>} File content
   */
  readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      // Try to read as text first
      if (file.type.startsWith('text/') || this.isTextFile(file.name)) {
        reader.readAsText(file);
      } else {
        reader.readAsText(file); // Still try as text for assembly files
      }
    });
  }

  /**
   * Checks if a file should be treated as text based on extension
   * @param {string} fileName - File name
   * @returns {boolean} True if text file
   */
  isTextFile(fileName) {
    const textExtensions = [
      '.a', '.e', '.o', '.lst', '.bst', '.txt', '.md', '.js', '.json',
      '.html', '.css', '.xml', '.log', '.cfg', '.ini', '.asm'
    ];
    
    const ext = this.parseFileName(fileName).ext.toLowerCase();
    return textExtensions.includes(ext);
  }

  /**
   * Creates a file tree structure from flat file list
   * @param {Array} files - Array of file objects with path property
   * @returns {Object} Tree structure
   */
  createFileTree(files) {
    const tree = {};
    
    files.forEach(file => {
      const parts = file.path.split('/').filter(part => part.length > 0);
      let current = tree;
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isFile = i === parts.length - 1;
        
        if (isFile) {
          current[part] = {
            type: 'file',
            content: file.content,
            size: file.size,
            lastModified: file.lastModified,
            fullPath: file.path
          };
        } else {
          if (!current[part]) {
            current[part] = { type: 'folder', children: {} };
          }
          current = current[part].children;
        }
      }
    });
    
    return tree;
  }

  /**
   * Downloads a file with the given content
   * @param {string} fileName - File name
   * @param {string} content - File content
   * @param {string} mimeType - MIME type
   */
  downloadFile(fileName, content, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Downloads multiple files as a ZIP (simplified - creates text bundle)
   * @param {Object} files - Object with fileName: content pairs
   * @param {string} zipName - Name for the bundle file
   */
  downloadFilesAsBundle(files, zipName = 'lcc-project.txt') {
    let content = `LCC.js Project Bundle\nGenerated: ${new Date().toISOString()}\n`;
    content += '='.repeat(50) + '\n\n';
    
    Object.entries(files).forEach(([fileName, fileContent]) => {
      content += `--- ${fileName} ---\n`;
      content += fileContent;
      content += '\n\n' + '='.repeat(50) + '\n\n';
    });
    
    this.downloadFile(zipName, content);
  }

  /**
   * Formats file size in human-readable format
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Gets file icon class based on extension
   * @param {string} fileName - File name
   * @param {boolean} isFolder - Whether it's a folder
   * @returns {string} CSS class for icon
   */
  getFileIcon(fileName, isFolder = false) {
    if (isFolder) {
      return 'fas fa-folder text-yellow-500';
    }
    
    const ext = this.parseFileName(fileName).ext.toLowerCase();
    
    const iconMap = {
      '.a': 'fas fa-file-code text-blue-400',
      '.e': 'fas fa-cog text-green-400',
      '.o': 'fas fa-cube text-yellow-400',
      '.lst': 'fas fa-list text-purple-400',
      '.bst': 'fas fa-chart-bar text-orange-400',
      '.txt': 'fas fa-file-alt text-gray-400',
      '.md': 'fab fa-markdown text-blue-300',
      '.json': 'fas fa-brackets-curly text-yellow-300',
      '.js': 'fab fa-js-square text-yellow-400',
      '.html': 'fab fa-html5 text-orange-500',
      '.css': 'fab fa-css3-alt text-blue-500'
    };
    
    return iconMap[ext] || 'fas fa-file text-secondary-400';
  }

  /**
   * Validates file content for security
   * @param {string} content - File content
   * @param {string} fileName - File name
   * @returns {Object} Validation result
   */
  validateFileContent(content, fileName) {
    // Check for potentially dangerous content
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /data:text\/html/i,
      /vbscript:/i
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(content)) {
        return {
          isValid: false,
          error: 'File contains potentially dangerous content'
        };
      }
    }
    
    // Check for binary content in text files
    if (this.isTextFile(fileName)) {
      const nonPrintableChars = content.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g);
      if (nonPrintableChars && nonPrintableChars.length > content.length * 0.1) {
        return {
          isValid: false,
          error: 'File appears to contain binary data'
        };
      }
    }
    
    return { isValid: true };
  }
}

export default FileManager;