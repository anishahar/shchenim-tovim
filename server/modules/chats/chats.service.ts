import { Chat } from "@typesLib";
import { requestsService } from "../requests/requests.service.js";
import { chatsRepository } from "./chats.repository.js";


class ChatsService {
    getUserChats = async (userId: number): Promise<Chat[]> => {
        try {
            const dbChats = await chatsRepository.getUserChats(userId);

            const chats = await Promise.all(
                dbChats.map(async (chat) => {
                    const { unreadMessagesAmount } = await chatsRepository.getUnreadMessagesAmount(chat.id, userId)
                    return { ...chat, unreadMessagesAmount } as Chat
                }
                )
            )

            return chats;
        } catch (error) {
            console.error('error in getUserChats:', error, 'layer: service');
            throw error;
        }

    }

    newRequestChat = async (requestId: number, helperId: number) => {
        try {
            const requesterId = await requestsService.getRequesterByRequestId(requestId);
            const { id: chatId } = await chatsRepository.newChat(requestId, helperId, requesterId);
            return { chatId, otherUserId: requesterId };
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

    getChatMessages = async (chatId: number, userId: number) => {
        try {
            const isMember = await this.validateUserInExitsingChat(chatId, userId);
            if (!isMember) {
                throw new Error("Not a member");
            };
            const messages = await chatsRepository.getChatMessages(chatId);
            return messages;
        } catch (error) {
            console.error('error in getChatMessages:', error, 'layer: service');
            throw error;
        }
    }

    validateUserInExitsingChat = async (chatId: number, userId: number) => {
        try {
            const isMember = await chatsRepository.validateUserInExitsingChat(chatId, userId);
            return isMember;
        } catch (error) {
            console.error('error in validateUserInExitsingChat:', error, 'layer: service');
            throw error;
        }
    }

    sendMessage = async (chatId: number, senderId: number, content: string) => {
        try {
            const isMember = await this.validateUserInExitsingChat(chatId, senderId);
            if (!isMember) {
                throw new Error("Not a member");
            };

            const { createdAt } = await chatsRepository.sendMessage(chatId, senderId, content);
            const sentAt = new Date(createdAt);
            await chatsRepository.updateChatLastUpdateTime(chatId, sentAt);

            return sentAt;
        }
        catch (error) {
            console.error('sendMessage failed', {
                chatId,
                senderId,
                error,
            }, 'layer: service');
            throw error;
        }
    }

    updateLastReadTime = async (chatId: number, userId: number) => {
        try {
            const isMember = await this.validateUserInExitsingChat(chatId, userId);
            if (!isMember) {
                throw new Error("Not a member");
            };
            await chatsRepository.updateLastReadTime(chatId, userId);
        }
        catch (error) {
            console.error('updateLastReadTime failed', {
                chatId,
                userId,
                error,
            }, 'layer: service');
            throw error;
        }
    }
};
export const chatsService = new ChatsService();