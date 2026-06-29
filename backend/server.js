const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Parse incoming JSON and urlencoded requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve statically uploaded poster banners
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Log request information (simple middleware)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request to ${req.url}`);
  next();
});

// Register routers
app.use('/api/auth', require('./routes/auth.js'));
app.use('/api/events', require('./routes/events.js'));
app.use('/api/bookings', require('./routes/bookings.js'));
app.use('/api/checkin', require('./routes/checkin.js'));
app.use('/api/analytics', require('./routes/analytics.js'));

// Default API route check
app.get('/api/status', (req, res) => {
  const db = require('./models/db');
  res.json({
    status: 'online',
    database: db.getDbStatus(),
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'An internal server error occurred'
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`Event Management Backend running on port ${PORT}`);
  console.log(`API check endpoint: http://localhost:${PORT}/api/status`);
  console.log(`=================================================`);
});
