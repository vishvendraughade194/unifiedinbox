// Unified Messaging Dashboard Server
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import services and routes
const platformService = require('./services/platformService');
const messageService = require('./services/messageService');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: { origin: '*' },
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static frontend
app.use(express.static(path.join(__dirname)));

// Import and use routes
const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const platformRoutes = require('./routes/platforms');
const webhookRoutes = require('./routes/webhooks');
const telegramRoutes = require('./routes/telegram');
const aiRoutes = require('./routes/ai');

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/platforms', platformRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    platforms: Array.from(platformService.platforms.keys()),
    uptime: process.uptime()
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Join platform-specific rooms
  socket.on('join-platform', (platform) => {
    socket.join(`platform:${platform}`);
    console.log(`Socket ${socket.id} joined platform: ${platform}`);
  });
  
  // Handle typing indicators
  socket.on('typing', (data) => {
    socket.broadcast.to(`platform:${data.platform}`).emit('user-typing', {
      userId: socket.id,
      platform: data.platform,
      conversationId: data.conversationId
    });
  });
  
  // Handle message composition
  socket.on('compose-start', (data) => {
    socket.broadcast.to(`platform:${data.platform}`).emit('compose-start', {
      userId: socket.id,
      platform: data.platform
    });
  });
  
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Unified Messaging Dashboard running on http://localhost:${PORT}`);
  console.log(`📱 Connected platforms: ${Array.from(platformService.platforms.keys()).join(', ')}`);
  console.log(`🔌 WebSocket server ready for real-time updates`);
});


