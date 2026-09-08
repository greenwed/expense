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
import splitRoutes from './routes/splitRoutes.js';

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
app.use('/api/split', splitRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Expense Tracker Web App',
    time: new Date().toISOString()
  });
});

// APK Download & Metadata Endpoints
const resolveApkFile = () => {
  const candidates = [
    path.join(__dirname, '..', 'public', 'rupeetrack.apk'),
    path.join(__dirname, '..', 'dist', 'rupeetrack.apk'),
    path.join(__dirname, '..', 'ExpenseApp', 'rupeetrack.apk'),
    path.join(__dirname, '..', 'ExpenseApp', 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
};

const handleApkDownload = (req, res) => {
  const apkPath = resolveApkFile();
  if (!apkPath) {
    return res.status(404).json({ error: 'Latest APK not found on server.' });
  }

  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', 'attachment; filename="rupeetrack.apk"');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  const stat = fs.statSync(apkPath);
  res.setHeader('Content-Length', stat.size);

  const stream = fs.createReadStream(apkPath);
  stream.pipe(res);
};

app.get('/rupeetrack.apk', handleApkDownload);
app.get('/download/apk', handleApkDownload);
app.get('/api/app/download-apk', handleApkDownload);

app.get('/api/app/apk-info', (req, res) => {
  const apkPath = resolveApkFile();
  if (!apkPath) {
    return res.json({
      available: false,
      version: '1.0.0',
      message: 'APK not yet compiled.'
    });
  }

  const stat = fs.statSync(apkPath);
  const sizeMB = (stat.size / (1024 * 1024)).toFixed(1);

  res.json({
    available: true,
    version: '1.0.0',
    filename: 'rupeetrack.apk',
    sizeBytes: stat.size,
    sizeFormatted: `${sizeMB} MB`,
    buildTime: new Date(stat.mtime).toISOString(),
    downloadUrl: '/rupeetrack.apk'
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
