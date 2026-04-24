import { Request, Response } from 'express';
import { chatsService } from './chats.service.js';
import { getMessagesSchema } from './chats.validation.js';

class ChatsController {
    getUserChats = async (req: Request, res: Response) => {
        if (!req.user) return res.status(401);
        const userId = req.user.id;

        try {
            const chats = await chatsService.getUserChats(userId);
            return res.status(200).json(chats);
        }
        catch (error) {
            console.error('error in getUserChats:', error);
            res.status(500).json({ error: 'getting chats failed' });

        }
    }

    // newRequestChat = async (req: Request, res: Response) => {
    //     const { data, error } = newRequesrtChatSchema.safeParse(req)

    //     if (error) return res.status(400).json({ errors: error })

    //     const requestId = data.query.requestId;

    //     if (!req.user) return res.status(401);
    //     const userId = req.user.id;

    //     try {
    //         const chatId = await chatsService.newChat(requestId, userId);
    //         return res.status(200).json(chatId);
    //     }
    //     catch (error) {
    //         console.error('error in creating new chat request:', error);
    //         res.status(500).json({ error: 'creating chat request failed' });

    //     }
    // }

    // newChat = async (req: Request, res: Response) => {
    //     const { data, error } = newChatSchema.safeParse(req)

    //     if (error) return res.status(400).json({ errors: error })

    //     const otherUserId = data.query.otherUserId;

    //     if (!req.user) return res.status(401);
    //     const userId = req.user.id;

    //     try {
    //         const chatId = await chatsService.newChat(otherUserId, userId);
    //         return res.status(200).json(chatId);
    //     }
    //     catch (error) {
    //         console.error('error in creating new chat:', error);
    //         res.status(500).json({ error: 'creating chat failed' });

    //     }
    // }

    getChatMessages = async (req: Request, res: Response) => {
        const { data, error } = getMessagesSchema.safeParse(req)

        if (error) return res.status(400).json({ errors: error })

        const chatId = data.params.id;

        if (!req.user) return res.status(401);
        const userId = req.user.id;

        try {
            const messages = await chatsService.getChatMessages(chatId, userId);
            return res.status(200).json(messages);
        }
        catch (error) {
            console.error('error in getting chat messages:', error);
            res.status(500).json({ error: 'getting chat messages' });

        }
    }
};
export const chatsController = new ChatsController();