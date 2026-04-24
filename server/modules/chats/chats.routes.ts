import { Router } from 'express';
import { authenticateToken } from '../../middleware.js';
import { chatsController } from './chats.controller.js';

export const chatsRouter = Router();

chatsRouter.get('/', authenticateToken, chatsController.getUserChats);

chatsRouter.get('/:id/messages', authenticateToken, chatsController.getChatMessages);