import { Request, Response } from 'express';
import { pool } from '../../db.js';

class RatingController {
    
    /**
     * POST /api/ratings
     * Saves a new rating for a user after a completed request.
     */
    saveRating = async (req: any, res: Response) => {
        try {
            const { rated_user_id, request_id, score } = req.body;
            const rater_user_id = req.user.id; // Extracted from authenticateToken middleware

            //  Validation: Ensure the score is within the 1-5 range
            if (!score || score < 1 || score > 5) {
                return res.status(400).json({ error: "Score must be an integer between 1 and 5" });
            }

            //  Validation: Prevent users from rating themselves
            if (Number(rated_user_id) === Number(rater_user_id)) {
                    return res.status(400).json({ error: "You cannot rate yourself!" });
            }

            // Validation: Verify that the target user exists in the database
            const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [rated_user_id]);
            if (userCheck.rowCount === 0) {
                return res.status(404).json({ error: "The user you are trying to rate does not exist" });
            }

            //  Persistence: Insert the new rating into the database
            const query = `
                INSERT INTO ratings (rated_user_id, rater_user_id, request_id, score)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;
            
            const result = await pool.query(query, [rated_user_id, rater_user_id, request_id, score]);

            return res.status(201).json({
                message: "Rating saved successfully",
                data: result.rows[0]
            });

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
}

export const ratingController = new RatingController();