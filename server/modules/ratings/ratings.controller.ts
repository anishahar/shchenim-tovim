import { Request, Response } from 'express';
import { pool } from '../../db.js';
import { requestsService } from '../requests/requests.service.js';

class RatingController {

    /**
     * POST /api/ratings
     * Saves a new rating for a user after a completed request.
     */
    saveRating = async (req: Request, res: Response) => {
        try {
            const { ratedUserId, requestId, score } = req.body;

            if (!req.user) return res.sendStatus(401);
            const userId = req.user.id;

            const request = await requestsService.getRequestByIdForUser(requestId, userId);

            if (request.user.id !== userId) {
                throw new Error('Only the request owner can rate the helper');
            }

            //  Validation: Ensure the score is within the 1-5 range
            if (!score || score < 1 || score > 5) {
                return res.status(400).json({ error: "Score must be an integer between 1 and 5" });
            }

            //  Validation: Prevent users from rating themselves
            if (Number(ratedUserId) === Number(userId)) {
                return res.status(400).json({ error: "You cannot rate yourself!" });
            }

            // Validation: Verify that the target user exists in the database
            const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [ratedUserId]);
            if (userCheck.rowCount === 0) {
                return res.status(404).json({ error: "The user you are trying to rate does not exist" });
            }

            //  Persistence: Insert the new rating into the database
            const query = `
                INSERT INTO ratings (rated_user_id, rater_user_id, request_id, score)
                VALUES ($1, $2, $3, $4)
            `;

            await pool.query(query, [ratedUserId, userId, requestId, score]);

            return res.sendStatus(201);

        } catch (err: any) {
            // Handle unique constraint violation (if a request was already rated)
            if (err.code === '23505') {
                return res.status(400).json({ error: "This request has already been rated" });
            }

            console.error('Error in saveRating:', err);
            return res.status(500).json({ error: "Internal server error while saving rating" });
        }
    }

    /**
     * GET /api/ratings/average/:userId
     * Calculates and returns the average score and total count for a specific user.
     */
    getUserAverage = async (req: Request, res: Response) => {
        try {
            const { userId } = req.params;

            // Query to calculate average score and total number of ratings
            const query = `
                SELECT 
                    ROUND(AVG(score), 1) as average_score,
                    COUNT(*) as total_ratings
                FROM ratings
                WHERE rated_user_id = $1
            `;

            const result = await pool.query(query, [userId]);
            const stats = result.rows[0];

            return res.json({
                userId: userId,
                average: parseFloat(stats.average_score) || 0,
                count: parseInt(stats.total_ratings) || 0
            });

        } catch (err) {
            console.error('Error in getUserAverage:', err);
            return res.status(500).json({ error: "Internal server error while fetching user rating" });
        }
    }

    getTopRated = async (_req: Request, res: Response) => {
        try {
            const result = await pool.query(`
                SELECT
                    u.id,
                    u.name,
                    u.avatar_url AS "avatarUrl",
                    ROUND(AVG(r.score)::numeric, 1)::float8 AS average,
                    COUNT(r.id)::int AS count
                FROM users u
                JOIN ratings r ON r.rated_user_id = u.id
                WHERE NOT u.is_blocked
                GROUP BY u.id, u.name, u.avatar_url
                ORDER BY average DESC, count DESC
                LIMIT 5
            `);
            return res.json(result.rows);
        } catch (err) {
            console.error('Error in getTopRated:', err);
            return res.status(500).json({ error: 'Failed to fetch top rated users' });
        }
    }
}

export const ratingController = new RatingController();