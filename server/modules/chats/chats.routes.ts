import { Router } from 'express';
import { authenticateToken } from '../../middleware.js';
import { chatsController } from './chats.controller.js';

export const chatsRouter = Router();

chatsRouter.get('/', authenticateToken, chatsController.getChats);

chatsRouter.post('/', authenticateToken, chatsController.newRequestChat);

chatsRouter.post('/', authenticateToken, chatsController.newChat);

chatsRouter.get('/:id/messages', authenticateToken, chatsController.getChatMessages);