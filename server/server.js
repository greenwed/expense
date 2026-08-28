import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import personalRoutes from './routes/personalRoutes.js';
import familyRoutes from './routes/familyRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection middleware for Serverless & Long-running runtimes
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    try {
      await connectDB();
    } catch (err) {
      console.error('Database initialization error:', err);
      return res.status(500).json({
        error: 'Database connection error: ' + err.message + '. Please ensure DATABASE_URL is set in Vercel Environment Variables.'
      });
    }
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/personal', personalRoutes);
app.use('/api/family', familyRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Expense Tracker Web App',
    time: new Date().toISOString()
  });
});

// Serve frontend in production if built
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('/{*splat}', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

async function startServer() {
  await connectDB();
  if (process.env.VERCEL !== '1' && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
    app.listen(PORT, () => {
      console.log(`🚀 Expense Tracker Backend Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
