import { requestsService } from "modules/requests/requests.service.js";
import { chatsRepository } from "./chats.repository.js";


class ChatsService {
    getChats = async (userId: number) => {
        try {
            return await chatsRepository.getChats(userId);
        } catch (error) {
            console.error('error in getChats:', error, 'layer: service');
            throw error;
        }

    }

    newRequestChat = async (requestId: number, helperId: number) => {
        try {
            const requesterId = await requestsService.getRequesterByRequestId(requestId);
            const { id: chatId } = await chatsRepository.newChat(requestId, helperId, requesterId);
            return chatId;
        } catch (error) {
            console.error('error in newRequestChat:', error, 'layer: service');
            throw error;
        }
    }

    newChat = async (user1Id: number, user2Id: number) => {
        try {
            const { id: chatId } = await chatsRepository.newChat(null, user1Id, user2Id);
            return chatId;
        } catch (error) {
            console.error('error in newChat:', error, 'layer: service');
            throw error;
        }
    }

    // getChatMessages = async () => {
    //     // TODO: Get chat messages
    // }
};
export const chatsService = new ChatsService();