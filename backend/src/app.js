const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { errorHandler } = require('./middlewares/errorHandler');

const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const breakRoutes = require('./routes/breakRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const auditRoutes = require('./routes/auditRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Disable ETags to prevent 304 stale caching on dynamic operational endpoints
app.set('etag', false);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Ensure no-cache headers on all API routes
app.use((req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
  });
  next();
});

// Health Check / Root Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'WorkPulse - Enterprise Attendance & Productivity Management API',
    status: 'ONLINE',
    documentation: 'API endpoints mounted at /api/*',
    health: '/api/health',
    frontend: 'http://localhost:3000',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'WorkPulse Attendance & Productivity API',
    version: '1.0.0',
  });
});

// Route Registrations
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/breaks', breakRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/users', userRoutes);

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
