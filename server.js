// Simple Express server to serve the application
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;


// Set security headers
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "credentialless"); // Less strict
  next();
})

// Serve index-react.html as the root page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index-react.html'));
});

// Serve visualizer page
app.get('/visualizer', (req, res) => {
  res.sendFile(path.join(__dirname, 'visualizer.html'));
});

// Serve resources page
app.get('/resources', (req, res) => {
  res.sendFile(path.join(__dirname, 'resources.html'));
});

// Serve demo files
app.get('/demos/:filename', (req, res) => {
  const filename = req.params.filename;
  res.sendFile(path.join(__dirname, 'demos', filename));
});

// Serve static files from the current directory
app.use(express.static("."));

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
