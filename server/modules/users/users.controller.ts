import { Request, Response } from 'express';
import { pool } from '../../db.js'; // Updated to use { pool } and correct path

class UsersController {
    /**
     * GET /users/:id
     * Retrieves user profile details by ID
     */
    getUserDetailes = async (req: Request, res: Response) => {
        const { id } = req.params;

        try {
            // Updated column names to match your schema (name, avatar_url, etc.)
            const user = await pool.query(
                'SELECT id, email, name, role, avatar_url, phone, created_at FROM users WHERE id = $1',
                [id]
            );

            if (user.rows.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json(user.rows[0]);
        } catch (error) {
            console.error('Error fetching user profile:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    /**
     * PATCH /users/:id
     * Updates specific user profile fields
     */
    updateUserDetailes = async (req: Request, res: Response) => {
        const { id } = req.params;
        const { name, phone, avatar_url } = req.body;
        
        // Security Check: Verify that the logged-in user is only updating their own profile
        if (req.user?.id !== parseInt(id)) {
            return res.status(403).json({ message: 'Unauthorized: You can only update your own profile' });
        }

        try {
            // Using COALESCE to keep existing values if new ones are not provided
            const updatedUser = await pool.query(
                `UPDATE users 
                 SET name = COALESCE($1, name), 
                     phone = COALESCE($2, phone), 
                     avatar_url = COALESCE($3, avatar_url),
                     updated_at = NOW()
                 WHERE id = $4 
                 RETURNING id, email, name, role, avatar_url, phone`,
                [name, phone, avatar_url, id]
            );

            res.json({
                message: 'Profile updated successfully',
                user: updatedUser.rows[0]
            });
        } catch (error) {
            console.error('Error updating user profile:', error);
            res.status(500).json({ message: 'Server error while updating profile' });
        }
    }
}

export const usersController = new UsersController();