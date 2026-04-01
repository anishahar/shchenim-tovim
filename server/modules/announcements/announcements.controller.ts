import { Request, Response } from 'express';

class AnnouncementsController {
    getAnnouncements = async (req: Request, res: Response) => {
        // TODO: Get all announcements
        res.status(501).json({ message: 'Not implemented yet' });
    }

    newAnnouncement = async (req: Request, res: Response) => {
        // TODO: Create announcement (admin only)
        res.status(501).json({ message: 'Not implemented yet' });
    }
};
export const announcementsController = new AnnouncementsController();