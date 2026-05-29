import { Request, Response } from 'express';
import { pool } from '../../db.js';
import { requestIdSchema, getRequestsSchema, newRequestSchema } from './requests.validation.js';
import { requestsService } from './requests.service.js';

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
            const { radius } = data.query;

            if (!req.user) return res.status(401);
            const userId = req.user.id;

            const requests = await requestsService.getRequests(userId, radius)

            return res.status(200).json(
                requests
            );
        } catch (err) {
            console.error('Error fetching requests:', err);
            return res.status(500).json({ error: 'Server error while fetching requests' });
        }
    }

    // POST /api/requests - Create a new help request
    newRequest = async (req: Request, res: Response) => {
        try {
            const { data, error } = newRequestSchema.safeParse({
                body: req.body
            });

            if (error) return res.status(400).json({ errors: error });
            const { title, description, category, urgency, locationText, imageUrl, latitude, longitude } = data.body;

            if (!req.user) return res.status(401);
            const userId = req.user.id;

            const result = await pool.query(
                `INSERT INTO requests (user_id, title, description, category, urgency, location_text, image_url, latitude, longitude, status) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'open') RETURNING id, title, status`,
                [userId, title, description, category, urgency, locationText, imageUrl, latitude, longitude]
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
            const { data, error } = requestIdSchema.safeParse({
                params: req.params
            });
            if (error) return res.status(400).json({ errors: error });

            const { id } = data.params;

            if (!req.user) return res.status(401);
            const userId = req.user.id;

            const request = await requestsService.getRequestByIdForUser(id, userId);

            return res.json(request);
        } catch (err) {
            console.error('Error fetching single request:', err);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    // PATCH /api/requests/:id - Edit an existing request (Ownership required)
    editRequest = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { status, title, description, category, urgency, latitude, longitude } = req.body;

            if (!req.user) return res.status(401);
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
    deleteRequest = async (req: Request, res: Response) => {
        try {
            const { data, error } = requestIdSchema.safeParse({
                params: req.params
            });
            if (error) return res.status(400).json({ errors: error });

            const { id } = data.params;

            if (!req.user) return res.status(401);
            const userId = req.user.id;

            const check = await pool.query('SELECT user_id FROM requests WHERE id = $1', [id]);
            if (check.rows.length === 0) return res.status(404).json({ error: 'Not found' });
            if (check.rows[0].user_id !== userId) return res.status(403).json({ error: 'Unauthorized' });

            await pool.query('DELETE FROM requests WHERE id = $1', [id]);
            return res.status(200);
        } catch (err) {
            console.error('Error deleting request:', err);
            return res.status(500).json({ error: 'Deletion failed' });
        }
    }
};

export const requestController = new RequestController();