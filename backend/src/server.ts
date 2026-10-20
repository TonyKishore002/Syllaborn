import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { apiRouter } from './routes/api.routes.js';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

// CORS configuration - restricted to the frontend origin
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps or curl) or matching configured frontend origin
      if (!origin || origin === FRONTEND_ORIGIN || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by Syllaborn CORS policy`));
      }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
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

// Root fallback route
app.get('/', (_req, res) => {
  res.json({
    name: 'Syllaborn AI Backend',
    version: '1.0.0',
    description: 'Secure AI extraction service for university syllabi',
    health: '/api/health',
  });
});

app.listen(PORT, () => {
  console.log(`🧙 Syllaborn AI Backend listening on port ${PORT}`);
  console.log(`🌐 Allowed frontend origin: ${FRONTEND_ORIGIN}`);
  console.log(`🔍 Health endpoint: http://localhost:${PORT}/api/health`);
});
