import { Router } from 'express';
import { authenticateToken, requireMinRole } from '../../middleware.js';
import { announcementsController } from './announcements.controller.js';


export const announcementsRouter = Router();

announcementsRouter.get('/', authenticateToken, announcementsController.getAnnouncements);

announcementsRouter.post('/', authenticateToken, requireMinRole('house_committee'), announcementsController.newAnnouncement);

announcementsRouter.delete('/:id', authenticateToken, announcementsController.deleteAnnouncement);
