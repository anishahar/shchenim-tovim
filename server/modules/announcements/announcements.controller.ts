import { ROLES } from '@constantsLib';
import { UserRole } from '@typesLib';
import { Request, Response } from 'express';
import { pool } from '../../db.js';
import * as usersService from '../../services/users.service';

/**
 * FEATURE 4: ANNOUNCEMENTS CONTROLLER
 */
class AnnouncementsController {

    // GET /api/announcements - Fetch board messages filtered by user's building
    getAnnouncements = async (req: any, res: Response) => {
        try {
            // 1. Get userId from middleware
            if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
            const userId = req.user.id;

            // 2. Fetch user's home location details
            const user = await usersService.getUserDetails(userId);
            if (!user.city || !user.street || !user.building_number) {
                return res.status(400).json({ error: 'User needs a complete home address' });
            }

            // 3. Fetch announcements ONLY for the user's specific building
            const query = `
                SELECT a.*, u.name as author_name 
                FROM announcements a
                JOIN users u ON a.author_id = u.id
                WHERE u.city = $1 AND u.street = $2 AND u.building_number = $3
                ORDER BY a.created_at DESC
            `;
            
            const result = await pool.query(query, [user.city, user.street, user.building_number]);

            // Formatting data to return a nested author object
            const formattedData = result.rows.map(row => ({
                id: row.id,
                title: row.title,
                content: row.content,
                author: {
                    id: row.author_id,
                    name: row.author_name
                },
                createdAt: row.created_at
            }));

            return res.json(formattedData);
        } catch (err) {
            console.error('Error fetching announcements:', err);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    // POST /api/announcements - Create a new announcement
    newAnnouncement = async (req: any, res: Response) => {
        try {
            const { title, content } = req.body;

            // Security: We get the author ID from the JWT token
            const authorId = req.user.id;

            if (!title || !content) {
                return res.status(400).json({ error: 'Title and content are required' });
            }

            const result = await pool.query(
                `INSERT INTO announcements (author_id, title, content) 
                 VALUES ($1, $2, $3) 
                 RETURNING id, title, content, created_at`,
                [authorId, title, content]
            );

            return res.status(201).json(result.rows[0]);
        } catch (err) {
            console.error('Error creating announcement:', err);
            return res.status(500).json({ error: 'Failed to create announcement' });
        }
    }

    // DELETE /api/announcements/:id - Delete an announcement
    deleteAnnouncement = async (req: any, res: Response) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const userRole = req.user.role as UserRole;

            // Get the announcement to check ownership
            const announcement = await pool.query(
                'SELECT author_id FROM announcements WHERE id = $1',
                [id]
            );

            if (announcement.rows.length === 0) {
                return res.status(404).json({ error: 'Announcement not found' });
            }

            const isOwner = announcement.rows[0].author_id === userId;
            const isAreaManager = userRole === ROLES.AREA_MANAGER;

            // House committee can delete own, area manager can delete any
            if (!isOwner && !isAreaManager) {
                return res.status(403).json({
                    error: 'Only announcement owner or area manager can delete'
                });
            }

            // Proceed with deletion
            await pool.query('DELETE FROM announcements WHERE id = $1', [id]);
            return res.json({ message: 'Announcement deleted successfully' });
        } catch (err) {
            console.error('Error deleting announcement:', err);
            return res.status(500).json({ error: 'Failed to delete announcement' });
        }
    }
};

export const announcementsController = new AnnouncementsController();