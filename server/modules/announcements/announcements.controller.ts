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

            // Fetch user details to get address for filtering
            const user = await usersService.getUserDetails(userId);
             
            // Security Check: Ensure user has address details
            // NOTE: Using street_number instead of apartment for building-wide logic
            if (!user.city || !user.street || !user.street_number) {
                return res.status(400).json({ 
                    error: 'To view announcements, your profile must include city, street, and street number.' 
                });
            }
            
            // Logic: Show city-wide announcements (street IS NULL) OR building-specific ones
            const query = `
                SELECT a.*, u.name as author_name 
                FROM announcements a
                JOIN users u ON a.author_id = u.id
                WHERE a.city = $1 
                  AND (
                     (a.street IS NULL AND a.street_number IS NULL) -- Area Manager (Global City-wide)
                     OR 
                     (a.street = $2 AND a.street_number = $3)       -- Board Manager (Building-wide)
                  )
                ORDER BY a.created_at DESC
            `;
            
            // Passing city, street, and street_number to the query
            const result = await pool.query(query, [
                user.city, 
                user.street, 
                user.street_number
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
            
            // Extract the user role
            const userRole = req.user.role as UserRole;

            if (!title || !content) {
                return res.status(400).json({ error: 'Title and content are required' });
            }

            // Fetch publisher address details
            const admin = await usersService.getUserDetails(authorId);

            // Check if the publisher is an Area Manager
            const isAreaManager = userRole === ROLES.AREA_MANAGER;

            // IMPORTANT: If Area Manager, street and street_number are saved as NULL.
            // This allows the "GET" query to show the message to the entire city.
            const result = await pool.query(
                `INSERT INTO announcements (author_id, title, content, city, street, street_number) 
                 VALUES ($1, $2, $3, $4, $5, $6) 
                 RETURNING id, title, content, created_at`,
                [
                    authorId, 
                    title, 
                    content, 
                    admin.city, 
                    isAreaManager ? null : admin.street,        // Set NULL for Area Manager
                    isAreaManager ? null : admin.street_number  // Set NULL for Area Manager
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
}

export const announcementsController = new AnnouncementsController();