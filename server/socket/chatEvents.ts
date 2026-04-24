import { Server, Socket } from 'socket.io';
import { chatsService } from '../modules/chats/chats.service.js';
import { FirstMessageInChat, FirstMessageInRequestChat, SocketMessage, SocketResponse } from '@typesLib';
import { newChatSchema, newRequesrtChatSchema, sendMessageSchema } from './chatEvents.validation.js';

export const registerChatEvents = (io: Server, socket: Socket) => {
    socket.on('join_chat', async (chatId: number, callback: (response: SocketResponse) => void) => {
        const userId = socket.data.user.id;

        const isMember = await chatsService.validateUserInExitsingChat(chatId, userId);

        if (!isMember) {
            return callback({ ok: false, error: "Not a member" });
        }

        socket.join(`chat_${chatId}`);
        console.log(`User ${socket.id} joined chat ${chatId}`);

        return callback({ ok: true });
    });

    socket.on('send_message', async (payload: SocketMessage, callback: (response: SocketResponse) => void) => {
        const senderId = socket.data.user.id;

        const { data, error } = sendMessageSchema.safeParse(payload)

        if (error) return callback({ ok: false, error: error.issues.map(e => e.message).join(', ') })

        const { chatId, content } = data;

        try {
            const createdAt = await chatsService.sendMessage(
                chatId,
                senderId,
                content,
            )

            io.to(`chat_${chatId}`).emit('new_message', {
                chatId,
                senderId,
                content,
                createdAt,
            });
            return callback({ ok: true });
        } catch (error: any) {
            return callback({ ok: false, error: error.message ?? error });
        }
    });

    socket.on('first_request_message', async (payload: FirstMessageInRequestChat, callback: (response: SocketResponse) => void) => {
        const senderId = socket.data.user.id;

        const { data, error } = newRequesrtChatSchema.safeParse(payload)

        if (error) return callback({ ok: false, error: error.issues.map(e => e.message).join(', ') })

        const { requestId, content } = data;

        try {

            const { chatId, otherUserId } = await chatsService.newRequestChat( //move to send???
                requestId,
                senderId,
            );
            const createdAt = await chatsService.sendMessage(
                chatId,
                senderId,
                content,
            );

            io.in(`user_${otherUserId}`).socketsJoin(`chat_${chatId}`);

            io.to(`chat_${chatId}`).emit('new_message', {
                chatId,
                senderId,
                content,
                createdAt,
            });
            return callback({ ok: true });
        } catch (error: any) {
            return callback({ ok: false, error: error.message ?? error });
        }
    });
    socket.on('first_message', async (payload: FirstMessageInChat, callback: (response: SocketResponse) => void) => {
        const senderId = socket.data.user.id;

        const { data, error } = newChatSchema.safeParse(payload)

        if (error) return callback({ ok: false, error: error.issues.map(e => e.message).join(', ') });

        const { otherUserId, content } = data;

        try {
            const chatId = await chatsService.newChat(
                senderId,
                otherUserId
            );

            const createdAt = await chatsService.sendMessage(
                chatId,
                senderId,
                content,
            );

            io.in(`user_${otherUserId}`).socketsJoin(`chat_${chatId}`);

            io.to(`chat_${chatId}`).emit('new_message', {
                chatId,
                senderId,
                content,
                createdAt,
            });

            return callback({ ok: true });
        } catch (error: any) {
            return callback({ ok: false, error: error.message ?? error });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
}