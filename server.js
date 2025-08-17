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
console.log('🔍 MongoDB Connection Debug:');
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
if (process.env.MONGODB_URI) {
  // Mask the password for security
  const maskedUri = process.env.MONGODB_URI.replace(/:([^@]+)@/, ':****@');
  console.log('Connection string (masked):', maskedUri);
  
  // Check for common issues
  if (process.env.MONGODB_URI.includes(':27017')) {
    console.log('❌ WARNING: Port number detected in mongodb+srv URI');
    console.log('mongodb+srv URIs should NOT have port numbers');
  }
  if (process.env.MONGODB_URI.startsWith('mongodb://')) {
    console.log('❌ WARNING: Using mongodb:// instead of mongodb+srv://');
    console.log('For Atlas clusters, use mongodb+srv://');
  }
}

try {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // Add TLS/SSL options to fix compatibility issues
    ssl: true,
    sslValidate: true,
    // Force TLS 1.2 for better compatibility
    tls: true,
    tlsAllowInvalidCertificates: false,
    tlsAllowInvalidHostnames: false,
    // Connection timeout and retry options
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    // Retry options
    retryWrites: true,
    retryReads: true,
    // Buffer settings
    bufferMaxEntries: 0,
    bufferCommands: false,
    // Additional options for Atlas
    maxPoolSize: 10,
    minPoolSize: 1,
    maxIdleTimeMS: 30000,
  });
  
  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected successfully');
  });
  
  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err.message);
    if (err.message.includes('SSL') || err.message.includes('TLS')) {
      console.log('🔒 SSL/TLS Error detected. This might be a protocol compatibility issue.');
      console.log('💡 Try updating your MongoDB Atlas cluster or check TLS settings.');
    }
  });
  
  mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected');
  });
  
} catch (error) {
  console.error('❌ Failed to connect to MongoDB:', error.message);
}

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
