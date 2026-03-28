import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

export function setupSocket(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a chat room
    socket.on('join_chat', (chatId: number) => {
      socket.join(`chat_${chatId}`);
      console.log(`User ${socket.id} joined chat ${chatId}`);
    });

    // Send message
    socket.on('send_message', (data: { chatId: number; senderId: number; content: string }) => {
      const { chatId, senderId, content } = data;

      // Broadcast to all users in the chat room
      io.to(`chat_${chatId}`).emit('new_message', {
        chatId,
        senderId,
        content,
        createdAt: new Date(),
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
}
