const express = require('express');
const cors = require('cors');
const courseRoutes = require('./src/routes/courses');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());           // allow frontend (Bolt) to call this API
app.use(express.json());   // parse JSON request bodies

// Routes
app.use('/api/courses', courseRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'CodeCraftHub API is running!', version: '1.0.0' });
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

app.listen(PORT, () => {
  console.log(`CodeCraftHub API running at http://localhost:${PORT}`);
});
