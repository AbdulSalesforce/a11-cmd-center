const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const projectsRouter = require('./src/routes/projects');
const failuresRouter = require('./src/routes/failures');
const scopeRouter = require('./src/routes/scope');
const checklistRouter = require('./src/routes/checklist');
const exportRouter = require('./src/routes/export');

const app = express();
const PORT = process.env.PORT || 3000;

// Security: CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? [process.env.ALLOWED_ORIGIN, 'http://localhost:5173']
  : ['http://localhost:5173'];

app.use(cors({ origin: allowedOrigins }));

// Security: Limit request body size to prevent DoS
app.use(express.json({ limit: '1mb' }));

// Security: Rate limiting - general API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security: Stricter rate limiting for resource-intensive exports
const exportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 exports per windowMs
  message: { error: 'Too many export requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', generalLimiter);
app.use('/api/projects/:projectId/export', exportLimiter);

// API routes
app.use('/api/projects', projectsRouter);
app.use('/api/projects/:projectId/failures', failuresRouter);
app.use('/api/projects/:projectId/scope', scopeRouter);
app.use('/api/projects/:projectId/scope/:scopeItemId/checklist', checklistRouter);
app.use('/api/projects/:projectId/export', exportRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientBuildPath));

  // Serve index.html for all non-API routes (React Router)
  // Express 5 requires explicit regex pattern instead of '*'
  app.get(/^(?!\/api).*$/, (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Global error handler - prevent stack trace leakage in production
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  // In production, never expose internal error details
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({ error: 'Internal server error' });
  }

  // In development, provide more details for debugging
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  console.log(`A11y Audit Tool server running at http://localhost:${PORT}`);
});
