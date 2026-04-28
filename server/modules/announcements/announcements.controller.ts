import { ROLES } from '@constantsLib';
import { UserRole } from '@typesLib';
import { Request, Response } from 'express';
import { pool } from '../../db.js';

/**
 * FEATURE 4: ANNOUNCEMENTS CONTROLLER
 */
class AnnouncementsController {

    // GET /api/announcements - Fetch all board messages
    getAnnouncements = async (req: Request, res: Response) => {
        try {
            // Using a JOIN to include the author's name from the users table.
            // This follows the "Shared Components" principle by providing a complete 
            // object for the Frontend, avoiding duplicate API calls.
            const query = `
                SELECT a.*, u.name as author_name 
                FROM announcements a
                JOIN users u ON a.author_id = u.id
                ORDER BY a.created_at DESC
            `;
            const result = await pool.query(query);

            // Formatting data to return a nested author object as agreed with Frontend Dev
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
        //*************************************** */
        // updated the req type to any in newAnnouncement to access req.user.id
        //  which is injected by our shared Authentication Middleware to ensure secure and authorized posting."
        try {
            const { title, content } = req.body;

            // Security: We get the author ID from the JWT token (populated by the shared Auth Middleware).
            // This prevents users from forging the author identity.
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