import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { apiRouter } from './routes/api.routes.js';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

// Collect configured origins from environment variables
const configuredOrigins = [
  process.env.FRONTEND_ORIGIN,
  process.env.ALLOWED_ORIGINS,
]
  .filter(Boolean)
  .flatMap((val) => (val as string).split(','))
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

// Development origins
const devOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

// Helper to determine if an origin is permitted
function isOriginAllowed(origin: string | undefined): boolean {
  // Allow requests with no origin (such as mobile apps, curl, server-to-server, or health monitors)
  if (!origin) return true;

  const normalized = origin.trim().replace(/\/+$/, '');

  // Check explicit configured origins
  if (configuredOrigins.includes(normalized)) return true;

  // Check local development origins
  if (
    normalized.startsWith('http://localhost:') ||
    normalized.startsWith('http://127.0.0.1:') ||
    devOrigins.includes(normalized)
  ) {
    return true;
  }

  // Check Vercel production and preview domains (syllaborn and any .vercel.app deployment)
  try {
    const url = new URL(normalized);
    if (url.protocol === 'https:' && url.hostname.endsWith('.vercel.app')) {
      return true;
    }
  } catch {
    // Malformed origin
  }

  return false;
}

// CORS configuration - allow Vercel production/preview domains, configured origins, and local development
app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Request blocked from origin: ${origin}`);
        callback(null, false);
      }
    },
    methods: ['GET', 'POST', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    credentials: true,
  })
);

// Body parsing with safe size limit
app.use(express.json({ limit: '5mb' }));

// Rate limiting to protect the AI backend
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // Limit each IP to 60 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please wait a few minutes before submitting another syllabus.',
  },
});

app.use('/api/', apiLimiter);
app.use('/api', apiRouter);
// Support rewrites that strip or keep the /api prefix
app.use(apiRouter);

// Health check alias for cloud host platforms (Render, AWS, etc.)
app.get('/health', (_req, res) => {
  res.redirect('/api/health');
});

// Root fallback route
app.get('/', (_req, res) => {
  res.json({
    name: 'Syllaborn AI Backend',
    version: '1.0.0',
    description: 'Secure AI extraction service for university syllabi',
    health: '/api/health',
  });
});

if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🧙 Syllaborn AI Backend listening on port ${PORT}`);
    console.log(`🌐 Allowed origins: ${configuredOrigins.length > 0 ? configuredOrigins.join(', ') : 'localhost + *.vercel.app'}`);
    console.log(`🔍 Health endpoint: http://localhost:${PORT}/api/health`);
  });
}

export default app;
