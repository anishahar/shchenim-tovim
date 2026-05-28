import { Chat } from "@typesLib";
import { requestsService } from "../requests/requests.service.js";
import { chatsRepository } from "./chats.repository.js";
import { requestsRepository } from "../requests/requests.repository.js";


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

    getChatByIdForUser = async (chatId: number, userId: number): Promise<Chat> => {
        try {
            const dbChat = await chatsRepository.getChatByIdForUser(chatId, userId);

            if (!dbChat) throw new Error("Not found / not a member")
            const { unreadMessagesAmount } = await chatsRepository.getUnreadMessagesAmount(dbChat.id, userId)
            const chat = { ...dbChat, unreadMessagesAmount } as Chat

            return chat;
        } catch (error) {
            console.error('error in getChatByIdForUser:', error, chatId, userId, 'layer: service');
            throw error;
        }
    }

    newRequestChat = async (requestId: number, helperId: number) => {
        try {
            const request = await requestsService.getById(requestId);
            const { id: chatId } = await chatsRepository.newChat(requestId, helperId, request.user_id);

            requestsService.requestStatusInProgress(requestId);
            return { chatId, otherUserId: request.user_id };
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
            await this.getChatByIdForUser(chatId, userId); //check if the chats exist and the user is a member, if not it will throw an error
            const messages = await chatsRepository.getChatMessages(chatId);
            return messages;
        } catch (error) {
            console.error('error in getChatMessages:', error, 'layer: service');
            throw error;
        }
    }

    sendMessage = async (chatId: number, senderId: number, content: string) => {
        try {
            await this.getChatByIdForUser(chatId, senderId); //check if the chats exist and the user is a member, if not it will throw an error

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
            await this.getChatByIdForUser(chatId, userId); //check if the chats exist and the user is a member, if not it will throw an error

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

    //only for requests chats
    refuseHelp = async (chatId: number, refusingUserId: number) => {
        try {
            const chat = await this.getChatByIdForUser(chatId, refusingUserId);

            if (!chat) {
                throw new Error("Not Found");
            }

            if (!chat.request) {
                throw new Error("This chat is not related to a request");
            }

            const request = await requestsRepository.getById(chat.request.id);

            if (request.user_id !== refusingUserId) {
                throw new Error("Forbidden");
            }

            await chatsRepository.refuseHelp(chatId);
        }
        catch (error) {
            console.error('refuseHelp error', {
                chatId,
                refusingUserId,
                error,
            }, 'layer: service');
            throw error;
        }
    }
};
export const chatsService = new ChatsService();