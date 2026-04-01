import { Router } from 'express';
import { authenticateToken, requireRole } from '../../middleware.js';
import { announcementsController } from './announcements.controller.js';


export const announcementsRouter = Router();

announcementsRouter.get('/', authenticateToken, announcementsController.getAnnouncements);

announcementsRouter.post('/', authenticateToken, requireRole('admin'), announcementsController.newAnnouncement);
