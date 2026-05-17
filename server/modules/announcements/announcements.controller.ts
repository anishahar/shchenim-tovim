import { ROLES } from '@constantsLib';
import { UserRole } from '@typesLib';
import { Request, Response } from 'express';
import { pool } from '../../db.js';
import { usersService } from '../users/users.service.js';

/**
 * FEATURE 4: ANNOUNCEMENTS CONTROLLER
 */
class AnnouncementsController {

    // GET /api/announcements - Fetch board messages
    getAnnouncements = async (req: Request, res: Response) => {
        try {
            if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
            const userId = req.user.id;

            // *** ADDED: Fetch user details to get address for filtering ***
            const user = await usersService.getUserDetails(userId);
             
            // *** ADDED: Security Check for address details ***
            if (!user.city || !user.street || !user.building_number) {
                return res.status(400).json({ 
                    error: 'To view announcements, your profile must include city, street, and building number.' 
                });
            }
            
            // *** MODIFIED: Added WHERE clause to filter by building address ***
            const query = `
                SELECT a.*, u.name as author_name 
                FROM announcements a
                JOIN users u ON a.author_id = u.id
                WHERE a.city = $1 
                  AND a.street = $2 
                  AND a.building_number = $3
                ORDER BY a.created_at DESC
            `;
            
            // *** MODIFIED: Passing address parameters to the query ***
            const result = await pool.query(query, [
                user.city, 
                user.street, 
                user.building_number
            ]);

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
            const authorId = req.user.id;

            if (!title || !content) {
                return res.status(400).json({ error: 'Title and content are required' });
            }

            // *** ADDED: Fetch admin address to tag the new announcement ***
            const admin = await usersService.getUserDetails(authorId);

            // *** MODIFIED: Insert includes city, street, and building_number ***
            const result = await pool.query(
                `INSERT INTO announcements (author_id, title, content, city, street, building_number) 
                 VALUES ($1, $2, $3, $4, $5, $6) 
                 RETURNING id, title, content, created_at`,
                [
                    authorId, 
                    title, 
                    content, 
                    admin.city, 
                    admin.street, 
                    admin.building_number
                ]
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

            const announcement = await pool.query(
                'SELECT author_id FROM announcements WHERE id = $1',
                [id]
            );

            if (announcement.rows.length === 0) {
                return res.status(404).json({ error: 'Announcement not found' });
            }

            const isOwner = announcement.rows[0].author_id === userId;
            const isAreaManager = userRole === ROLES.AREA_MANAGER;

            if (!isOwner && !isAreaManager) {
                return res.status(403).json({
                    error: 'Only announcement owner or area manager can delete'
                });
            }

            await pool.query('DELETE FROM announcements WHERE id = $1', [id]);
            return res.json({ message: 'Announcement deleted successfully' });
        } catch (err) {
            console.error('Error deleting announcement:', err);
            return res.status(500).json({ error: 'Failed to delete announcement' });
        }
    }
};

export const announcementsController = new AnnouncementsController();