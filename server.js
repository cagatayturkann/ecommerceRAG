require('dotenv').config({ quiet: true });

const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin) => allowedOrigins.includes(origin);

// Set TRUST_PROXY (e.g. "1") when running behind a reverse proxy, so the rate limiter sees real client IPs.
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
}

// CORS: any origin in development, exact matches from ALLOWED_ORIGINS in production.
app.use(
  cors({
    origin: (origin, callback) => callback(null, !isProduction || !origin || isAllowedOrigin(origin)),
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  })
);

// In production, API calls must come from an allowed page. Origin and Referer can be forged by
// non-browser clients, so this only stops casual cross-site use; the rate limiter is the real guard.
app.use('/api', (req, res, next) => {
  if (!isProduction) return next();

  let source = req.headers.origin;
  if (!source && req.headers.referer) {
    source = URL.canParse(req.headers.referer) ? new URL(req.headers.referer).origin : null;
  }
  if (!source || !isAllowedOrigin(source)) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  next();
});

// Container health check: up and connected to MongoDB.
app.get('/health', (req, res) => {
  const ok = mongoose.connection.readyState === 1;
  res.status(ok ? 200 : 503).json({ status: ok ? 'ok' : 'unavailable' });
});

app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(routes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Details go to the server log; clients get a generic message.
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    return res.status(err.status).json({ error: 'Invalid request body' });
  }
  console.error(`${req.method} ${req.path} failed:`, err.message);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

connectDB()
  .then(() => {
    const server = app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

    // On deploy the old container gets SIGTERM: finish in-flight chats, then close the database connection.
    process.once('SIGTERM', () => {
      console.log('SIGTERM received, shutting down');
      server.close(() => mongoose.disconnect().finally(() => process.exit(0)));
      setTimeout(() => process.exit(1), 25000).unref();
    });
  })
  .catch((error) => {
    console.error(`Could not connect to MongoDB: ${error.message}`);
    process.exit(1);
  });
