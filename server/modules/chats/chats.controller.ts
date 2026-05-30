import { Request, Response } from 'express';
import { chatsService } from './chats.service.js';
import { getMessagesSchema, refuseHelpSchema, updateLastReadTimeSchema } from './chats.validation.js';
import { pool } from '../../db.js';

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

    completeChat = async (req: Request, res: Response) => {
        const chatId = Number(req.params.id);
        const { score } = req.body;

        if (!req.user) return res.sendStatus(401);
        const userId = req.user.id;

        try {
            const chat = await chatsService.getChatByIdForUser(chatId, userId);
            if (!chat.request) return res.status(400).json({ error: 'This chat is not linked to a request' });

            const requestRow = await pool.query<{ user_id: number }>(
                'SELECT user_id FROM requests WHERE id = $1',
                [chat.request.id]
            );
            if (requestRow.rows.length === 0) return res.status(404).json({ error: 'Request not found' });
            if (requestRow.rows[0].user_id !== userId) return res.status(403).json({ error: 'Only the request owner can complete it' });

            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                if (score && score > 0) {
                    await client.query(
                        `INSERT INTO ratings (rated_user_id, rater_user_id, request_id, score)
                         VALUES ($1, $2, $3, $4)
                         ON CONFLICT DO NOTHING`,
                        [chat.otherUser.id, userId, chat.request.id, score]
                    );
                }

                await client.query(
                    `UPDATE requests SET status = 'completed' WHERE id = $1`,
                    [chat.request.id]
                );

                await client.query('DELETE FROM chats WHERE id = $1', [chatId]);

                await client.query('COMMIT');
            } catch (err) {
                await client.query('ROLLBACK');
                throw err;
            } finally {
                client.release();
            }

            return res.sendStatus(200);
        } catch (error: any) {
            if (error.message === 'Not found / not a member') return res.status(403).json({ error: 'Forbidden' });
            console.error('error in completeChat:', error);
            return res.status(500).json({ error: 'Failed to complete request' });
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
