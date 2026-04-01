
import { Router } from 'express';
import { authenticateToken } from '../../middleware.js';
import { usersController } from './users.controller.js';


export const usersRouter = Router();

usersRouter.get('/:id', authenticateToken, usersController.getUserDetailes);

usersRouter.patch('/:id', authenticateToken, usersController.updateUserDetailes);