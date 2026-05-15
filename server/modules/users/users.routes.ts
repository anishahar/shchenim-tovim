
import { Router } from 'express';
import { authenticateToken, requireMinRole } from '../../middleware.js';
import { usersController } from './users.controller.js';


export const usersRouter = Router();

// Get all users (area manager only)
usersRouter.get('/', authenticateToken, requireMinRole('area_manager'), usersController.getAllUsers);

usersRouter.get('/:id', authenticateToken, usersController.getUserDetailes);

usersRouter.patch('/:id', authenticateToken, usersController.updateUserDetailes);

// User management routes (area manager only)
usersRouter.patch('/:id/block', authenticateToken, requireMinRole('area_manager'), usersController.blockUser);
usersRouter.patch('/:id/unblock', authenticateToken, requireMinRole('area_manager'), usersController.unblockUser);
usersRouter.patch('/:id/role', authenticateToken, requireMinRole('area_manager'), usersController.updateUserRole);