import { Request, Response } from 'express';
import { chatsService } from './chats.service.js';
import { getMessagesSchema, refuseHelpSchema, updateLastReadTimeSchema } from './chats.validation.js';
import { pool } from '../../db.js';
import { requestsService } from '../requests/requests.service.js';

class ChatsController {
    getUserChats = async (req: Request, res: Response) => {
        if (!req.user) return res.sendStatus(401);
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
            res.status(500).json({ error: 'error in getting chat messages' });

        }
    }

    updateLastReadTime = async (req: Request, res: Response) => {
        const { data, error } = updateLastReadTimeSchema.safeParse(req);

        if (error) return res.status(400).json({ errors: error });
        const chatId = data.params.id;

        if (!req.user) return res.status(401);
        const userId = req.user.id;

        try {
            await chatsService.updateLastReadTime(chatId, userId);
            return res.sendStatus(200);
        }
        catch (error) {
            console.error('error in updateLastReadTime:', error);
            res.status(500).json({ error: error });

        }
    }

    deleteChat = async (req: Request, res: Response) => {
        const chatId = Number(req.params.id);
        if (!req.user) return res.status(401);
        const userId = req.user.id;

        try {
            await chatsService.deleteChat(chatId, userId);
            return res.status(200).json({ message: 'Chat deleted' });
        } catch (error: any) {
            if (error.message === 'Not a member') return res.status(403).json({ error: 'Forbidden' });
            console.error('error in deleteChat:', error);
            res.status(500).json({ error: 'Failed to delete chat' });
        }
    }

    refuseHelp = async (req: Request, res: Response) => {
        const { data, error } = refuseHelpSchema.safeParse(req);

        if (error) return res.status(400).json({ errors: error });
        const chatId = data.params.id;

        if (!req.user) return res.status(401);
        const userId = req.user.id;

        try {
            await chatsService.refuseHelp(chatId, userId);
            return res.sendStatus(200);
        }
        catch (error) {
            console.error('error in refuseHelp:', error);
            res.status(500).json({ error: error });
        }
    }
};
export const chatsController = new ChatsController();
