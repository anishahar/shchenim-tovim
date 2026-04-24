import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { socketAuthMiddleware } from '../middleware.js';
import { registerChatEvents } from './chatEvents.js';
import { chatsService } from '../modules/chats/chats.service.js';

export function setupSocket(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });
  io.use(socketAuthMiddleware);
  io.on('connection', async (socket) => {
    console.log('User', socket.data.user.id, 'connected:', socket.id);
    console.log(socket.data.user.id);

    const userId = socket.data.user.id;

    socket.join(`user_${userId}`);

    try {
      const chats = await chatsService.getUserChats(userId);

      console.log(chats)
      chats.forEach(chat => {
        socket.join(`chat_${chat.id}`);
      });

      console.log(`User ${userId} joined ${chats.length} chats`);
    } catch (err) {
      console.error('Failed to bootstrap chats:', err);
      socket.emit('error', 'bootstrap_error');
    }

    registerChatEvents(io, socket);
  });


  return io;
}
