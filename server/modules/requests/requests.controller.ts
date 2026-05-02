import { Request, Response } from 'express';
import { pool } from '../../db.js';
import { getRequestsSchema } from './requests.validation.js';
import { usersService } from '../users/users.service.js';

/**
 * FEATURE 1: HELP REQUESTS CONTROLLER
 */
class RequestController {

    // GET /api/requests - Fetch all requests with optional filters and pagination
    getRequests = async (req: Request, res: Response) => {
        try {
            const { data, error } = getRequestsSchema.safeParse({
                query: req.query
            });

            if (error) return res.status(400).json({ errors: error });
            const { category, urgency, search, page, limit, radius } = data.query;

            const offset = (Number(page) - 1) * Number(limit);

            if (!req.user) return res.status(401);
            const userId = req.user.id;

            const { longitude, latitude } = await usersService.getUserDetails(userId);
            if (!longitude || !latitude) return; ////////////////// its needs to be NOT NULL.... when we refactor this to use types ill remove this check

            let query = `
                SELECT *
                FROM (
                    SELECT 
                    r.*, 
                    u.name as user_name, 
                    u.avatar_url,
                    (
                        6371 * 2 * asin(
                        sqrt(
                            pow(sin(radians(($1 - r.latitude) / 2)), 2) +
                            cos(radians(r.latitude)) *
                            cos(radians($1)) *
                            pow(sin(radians(($2 - r.longitude) / 2)), 2)
                        )
                        )
                    ) AS distance
                    FROM requests r
                    JOIN users u ON r.user_id = u.id
                    WHERE r.status != 'closed'
                ) t
                WHERE t.distance < $3
                `;
            let params: (string | number)[] = [latitude, longitude, radius];

            if (category) {
                params.push(category);
                query += ` AND t.category = $${params.length}`;
            }

            if (urgency) {
                params.push(urgency);
                query += ` AND t.urgency = $${params.length}`;
            }

            if (search) {
                params.push(`%${search}%`);
                query += ` AND (r.title ILIKE $${params.length} OR t.description ILIKE $${params.length})`;
            }

            query += ` ORDER BY t.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(Number(limit), offset);

            const result = await pool.query(query, params);

            const formattedData = result.rows.map(row => ({
                id: row.id,
                title: row.title,
                description: row.description,
                category: row.category,
                urgency: row.urgency,
                status: row.status,
                location_text: row.location_text,
                latitude: row.latitude,    // Added: for map integration
                longitude: row.longitude,  // Added: for map integration
                image_url: row.image_url,
                created_at: row.created_at,
                user: {
                    id: row.user_id,
                    name: row.user_name,
                    avatar_url: row.avatar_url
                }
            }));

            return res.json({
                data: formattedData,
                total: result.rowCount,
                page: Number(page)
            });
        } catch (err) {
            console.error('Error fetching requests:', err);
            return res.status(500).json({ error: 'Server error while fetching requests' });
        }
    }

    // POST /api/requests - Create a new help request
    newRequest = async (req: any, res: Response) => {
        try {
            // Added latitude and longitude to destructuring
            const { title, description, category, urgency, location_text, image_url, latitude, longitude } = req.body;
            const userId = req.user.id; // Populated by authenticateToken middleware

            const result = await pool.query(
                `INSERT INTO requests (user_id, title, description, category, urgency, location_text, image_url, latitude, longitude, status) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'open') RETURNING id, title, status`,
                [userId, title, description, category, urgency, location_text, image_url, latitude, longitude]
            );

            return res.status(201).json(result.rows[0]);
        } catch (err) {
            console.error('Error creating request:', err);
            return res.status(500).json({ error: 'Failed to create request' });
        }
    }

    // GET /api/requests/:id - Get detailed info for a specific request
    getRequest = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const query = `
                SELECT r.*, u.name as user_name, u.avatar_url 
                FROM requests r 
                JOIN users u ON r.user_id = u.id 
                WHERE r.id = $1
            `;
            const result = await pool.query(query, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Request not found' });
            }

            return res.json(result.rows[0]);
        } catch (err) {
            console.error('Error fetching single request:', err);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    // PATCH /api/requests/:id - Edit an existing request (Ownership required)
    editRequest = async (req: any, res: Response) => {
        try {
            const { id } = req.params;
            const { status, title, description, category, urgency, latitude, longitude } = req.body;
            const userId = req.user.id;

            // Check if request exists and belongs to the user
            const check = await pool.query('SELECT user_id FROM requests WHERE id = $1', [id]);
            if (check.rows.length === 0) return res.status(404).json({ error: 'Not found' });
            if (check.rows[0].user_id !== userId) return res.status(403).json({ error: 'Unauthorized' });

            await pool.query(
                `UPDATE requests 
                 SET status = COALESCE($1, status), 
                     title = COALESCE($2, title), 
                     description = COALESCE($3, description), 
                     category = COALESCE($4, category), 
                     urgency = COALESCE($5, urgency),
                     latitude = COALESCE($6, latitude),
                     longitude = COALESCE($7, longitude)
                 WHERE id = $8`,
                [status, title, description, category, urgency, latitude, longitude, id]
            );

            return res.json({ message: 'Request updated successfully' });
        } catch (err) {
            console.error('Error updating request:', err);
            return res.status(500).json({ error: 'Update failed' });
        }
    }

    // DELETE /api/requests/:id - Delete a request (Ownership required)
    deleteRequest = async (req: any, res: Response) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const check = await pool.query('SELECT user_id FROM requests WHERE id = $1', [id]);
            if (check.rows.length === 0) return res.status(404).json({ error: 'Not found' });
            if (check.rows[0].user_id !== userId) return res.status(403).json({ error: 'Unauthorized' });

            await pool.query('DELETE FROM requests WHERE id = $1', [id]);
            return res.json({ message: 'Request deleted successfully' });
        } catch (err) {
            console.error('Error deleting request:', err);
            return res.status(500).json({ error: 'Deletion failed' });
        }
    }
};

export const requestController = new RequestController();