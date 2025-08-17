const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration for development and production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost ports for development
    const allowedOrigins = [
      'http://localhost:3000',  // React default
      'http://localhost:5173',  // Vite default
      'http://localhost:4173',  // Vite preview
      'http://localhost:8080',  // Alternative dev port
      process.env.FRONTEND_URL   // Production frontend URL
    ].filter(Boolean); // Remove undefined values
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('🚫 CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cors: {
      allowedOrigins: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4173', 'http://localhost:8080'],
      productionUrl: process.env.FRONTEND_URL || 'Not set'
    }
  });
});

// Routes
app.use('/api/summarize', require('./routes/summarize'));
app.use('/api/email', require('./routes/email'));
app.use('/api/upload', require('./routes/upload'));

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`🌐 CORS enabled for: localhost:3000, localhost:5173, localhost:4173, localhost:8080`);
  if (process.env.FRONTEND_URL) {
    console.log(`🌍 Production frontend: ${process.env.FRONTEND_URL}`);
  }
});
