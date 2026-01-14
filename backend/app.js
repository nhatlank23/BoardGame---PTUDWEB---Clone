require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./configs/db');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Backend API is running',
    timestamp: new Date().toISOString()
  });
});

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

const gameRoutes = require('./routes/gameRoutes');
app.use('/api', gameRoutes);


app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
