const express = require('express');
const router = express.Router();

// Import routes
const authRoutes = require('./authRoutes');

// Mount routes
router.use('/auth', authRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;