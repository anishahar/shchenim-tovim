import { Router } from 'express';
import { authenticateToken } from '../../middleware.js';
import { authController } from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/register', authController.register);

authRouter.post('/login', authController.login);

authRouter.get('/me', authenticateToken, (req, res) => {
    res.json({ user: req.user });
});


