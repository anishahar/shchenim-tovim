import { Router } from 'express';
import { chatsRouter } from './modules/chats/chats.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { requestsRouter } from './modules/requests/requests.routes.js';
import { announcementsRouter } from './modules/announcements/announcements.routes.js';
import { uploadRouter } from './modules/upload/upload.routes.js';


const router = Router();

router.use('/users', usersRouter);
router.use('/chats', chatsRouter);
router.use('/requests', requestsRouter);
router.use('/auth', authRouter);
router.use('/announcements', announcementsRouter);
router.use('/upload', uploadRouter);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});


export default router;
