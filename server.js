const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// MongoDB connection
const connectDB = require('./config/db');

// Routes
const routes = require('./routes');

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

// Development environment check
const isDevelopment = process.env.NODE_ENV !== 'production';

// Allowed domains
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5500', // VS Code Live Server
  'http://127.0.0.1:5500', // VS Code Live Server
  'https://ecommerce-rag.vercel.app',
];

// CORS settings - Optimized
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow in development environment or if no origin
      if (isDevelopment || !origin) {
        return callback(null, true);
      }
      // Allow if origin is in the allowed origins list
      if (allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
        return callback(null, true);
      }
      callback(new Error('CORS policy violation: Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Origin/Referrer check middleware
app.use((req, res, next) => {
  // Skip check in development environment
  if (isDevelopment) {
    return next();
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;

  // Origin check for API requests
  if (req.path.startsWith('/api/')) {
    // If no origin and no referer (direct API call)
    if (!origin && !referer) {
      return res.status(403).json({ error: 'Unauthorized: Direct API access not allowed' });
    }

    // Check if origin or referer is from allowed domains
    const isAllowed = origin
      ? allowedOrigins.some((allowed) => origin.startsWith(allowed))
      : allowedOrigins.some((allowed) => referer && referer.startsWith(allowed));

    if (!isAllowed) {
      return res.status(403).json({ error: 'Unauthorized: Domain not allowed' });
    }
  }

  next();
});

// Middlewares
app.use(express.json());

// Set MIME types for serving static files
app.use(
  express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, path) => {
      if (path.endsWith('.css')) {
        res.set('Content-Type', 'text/css');
      }
      if (path.endsWith('.js')) {
        res.set('Content-Type', 'application/javascript');
      }
    },
  })
);

// API routes
app.use(routes);

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
