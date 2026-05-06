import { Chat, Message } from "@typesLib";
import { pool } from "../../db.js";
import { GET_CHAT_MESSAGES, GET_UNREAD_MESSAGES_AMOUNT, GET_USER_CHATS_INFO, IS_USER_MEMBER_IN_CHAT, NEW_CHAT, SEND_MESSAGE, UPDATE_CHAT_TIMESTAMP, UPDATE_LAST_READ_TIMESTAMP } from "./chats.db.js";


class ChatsRepository {
    getUserChats = async (userId: number) => {
        const result = await pool.query<Omit<Chat, "unreadMessagesAmount">>(
            GET_USER_CHATS_INFO, [userId]
        );
        return result.rows;
    }

    newChat = async (requestId: number | null, user1Id: number, user2Id: number) => {
        try {
            const result = await pool.query<{ id: number }>
                (
                    NEW_CHAT, [requestId, user1Id, user2Id]
                );

            return result.rows[0];
        } catch (error: any) {
            console.error('error in newChat:', error, 'layer: repository');
            throw error;
        }
    }

    getChatMessages = async (chatId: number) => {
        try {
            const result = await pool.query<Message>
                (
                    GET_CHAT_MESSAGES, [chatId]
                );

            return result.rows;
        } catch (error) {
            console.error('error in getChatMessages:', error, 'layer: repository');
            throw error;
        }
    }

    validateUserInExitsingChat = async (chatId: number, userId: number) => {
        try {
            const result = await pool.query<{ exists: boolean }>
                (
                    IS_USER_MEMBER_IN_CHAT, [chatId, userId]
                );

            return result.rows[0]?.exists ?? false;
        } catch (error) {
            console.error('error in validateUserInExitsingChat:', error, 'layer: repository');
            throw error;
        }
    }

    sendMessage = async (chatId: number, senderId: number, content: string) => {
        try {
            const result = await pool.query<{ createdAt: string }>
                (
                    SEND_MESSAGE, [chatId, senderId, content]
                );

            return result.rows[0];
        } catch (error) {
            console.error('error in sendMessage:', error, 'layer: repository');
            throw error;
        }
    }

    updateChatLastUpdateTime = async (chatId: number, timeOfNewMessage: Date) => {
        try {
            await pool.query
                (
                    UPDATE_CHAT_TIMESTAMP, [chatId, timeOfNewMessage]
                );
        } catch (error) {
            console.error('error in updateChatLastUpdateTime:', error, 'layer: repository');
            throw error;
        }
    }

    updateLastReadTime = async (chatId: number, userId: number) => {
        try {
            await pool.query
                (
                    UPDATE_LAST_READ_TIMESTAMP, [userId, chatId]
                );
        } catch (error) {
            console.error('error in updateLastReadTime:', error, 'layer: repository');
            throw error;
        }
    }

    getUnreadMessagesAmount = async (chatId: number, userId: number) => {
        try {
            const res = await pool.query<{ unreadMessagesAmount: number }>
                (
                    GET_UNREAD_MESSAGES_AMOUNT, [chatId, userId]
                );
            return res.rows[0];
        } catch (error) {
            console.error('error in getUnreadMessagesAmount:', error, 'layer: repository');
            throw error;
        }
    }
};
export const chatsRepository = new ChatsRepository();