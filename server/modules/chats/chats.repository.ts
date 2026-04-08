import { pool } from "../../db.js";
import { GET_USER_CHATS_INFO, NEW_CHAT } from "./chats.db.js";
// import { Chat } from "@types";


class ChatsRepository {
    getChats = async (userId: number) => {
        // const result = await pool.query <  Chat[] > (
        //     GET_USER_CHATS_INFO, [userId]
        // );
        // return result.rows[0];
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

    // getChatMessages = async () => {
    //     // TODO: Get chat messages
    // }
};
export const chatsRepository = new ChatsRepository();