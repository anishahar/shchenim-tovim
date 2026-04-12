import { Chat, Message } from "@typesLib";
import { pool } from "../../db.js";
import { GET_CHAT_MESSAGES, GET_USER_CHATS_INFO, NEW_CHAT } from "./chats.db.js";


class ChatsRepository {
    getChats = async (userId: number) => {
        const result = await pool.query<Chat>(
            GET_USER_CHATS_INFO, [userId]
        );
        return result.rows;
    }

    newChat = async (requestId: number | null, user1Id: number, user2Id: number) => {
        try {
            const result = await pool.query<{ id: number }>
                (
                    NEW_CHAT, [requestId, user1Id, user2Id] //check if its null will it workkk
                );

            return result.rows[0];
        } catch (error: any) {
            // if(error.constraint === 'unique_chat_no_request') - 409 error
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
};
export const chatsRepository = new ChatsRepository();