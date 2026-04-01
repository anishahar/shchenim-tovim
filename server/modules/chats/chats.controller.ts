import { Request, Response } from 'express';

class ChatsController {
    getChats = async (req: Request, res: Response) => {
        // TODO: Get all chats
        return res.status(501).json({ message: 'Not implemented yet' });
    }

    newChat = async (req: Request, res: Response) => {
        // TODO: Create new chat
        res.status(501).json({ message: 'Not implemented yet' });
    }

    getChatMessages = async (req: Request, res: Response) => {
        // TODO: Get chat messages
        res.status(501).json({ message: 'Not implemented yet' });
    }
};
export const chatsController = new ChatsController();