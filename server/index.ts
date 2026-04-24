import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import { initializeDatabase } from './db.js';
import { errorHandler } from './middleware.js';
import routes from './routes.js';
import { setupSocket } from './socket/socket.js';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Error handler (must be last)
app.use(errorHandler);

// Setup Socket.io
setupSocket(httpServer);

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
