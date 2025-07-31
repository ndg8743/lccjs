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

// Serve static files from the current directory
app.use(express.static("."));

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
