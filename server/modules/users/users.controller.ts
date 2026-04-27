import { Request, Response } from 'express';
import { pool } from '../../db.js'; // Updated to use { pool } and correct path

class UsersController {
    /**
     * GET /users
     * Retrieves all users (area manager only)
     */
    getAllUsers = async (req: Request, res: Response) => {
        try {
            const users = await pool.query(
                'SELECT id, email, name, role, avatar_url, phone, address_text, latitude, longitude, city, street, street_number, apartment, is_blocked, created_at FROM users ORDER BY created_at DESC'
            );

            res.json(users.rows);
        } catch (error) {
            console.error('Error fetching all users:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    /**
     * GET /users/:id
     * Retrieves user profile details by ID
     */
    getUserDetailes = async (req: Request, res: Response) => {
        const { id } = req.params;

        try {
            // Updated column names to match your schema (name, avatar_url, etc.)
            const user = await pool.query(
                'SELECT id, email, name, role, avatar_url, phone, address_text, latitude, longitude, city, street, street_number, apartment, created_at FROM users WHERE id = $1',
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
        const { name, phone, avatar_url, address_text, latitude, longitude, city, street, street_number, apartment } = req.body;

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
                     address_text = COALESCE($4, address_text),
                     latitude = COALESCE($5, latitude),
                     longitude = COALESCE($6, longitude),
                     city = COALESCE($7, city),
                     street = COALESCE($8, street),
                     street_number = COALESCE($9, street_number),
                     apartment = COALESCE($10, apartment),
                     updated_at = NOW()
                 WHERE id = $11
                 RETURNING id, email, name, role, avatar_url, phone, address_text, latitude, longitude, city, street, street_number, apartment`,
                [name, phone, avatar_url, address_text, latitude, longitude, city, street, street_number, apartment, id]
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

    /**
     * PATCH /users/:id/block
     * Block a user (area manager only)
     */
    blockUser = async (req: Request, res: Response) => {
        const { id } = req.params;

        try {
            await pool.query('UPDATE users SET is_blocked = TRUE WHERE id = $1', [id]);
            res.json({ message: 'User blocked successfully' });
        } catch (error) {
            console.error('Error blocking user:', error);
            res.status(500).json({ message: 'Server error while blocking user' });
        }
    }

    /**
     * PATCH /users/:id/unblock
     * Unblock a user (area manager only)
     */
    unblockUser = async (req: Request, res: Response) => {
        const { id } = req.params;

        try {
            await pool.query('UPDATE users SET is_blocked = FALSE WHERE id = $1', [id]);
            res.json({ message: 'User unblocked successfully' });
        } catch (error) {
            console.error('Error unblocking user:', error);
            res.status(500).json({ message: 'Server error while unblocking user' });
        }
    }

    /**
     * PATCH /users/:id/role
     * Update user role (area manager only)
     */
    updateUserRole = async (req: Request, res: Response) => {
        const { id } = req.params;
        const { role } = req.body;

        // Validate role
        const validRoles = ['resident', 'house_committee', 'area_manager'];
        if (!role || !validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        try {
            const result = await pool.query(
                'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, name, role',
                [role, id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json({
                message: 'User role updated successfully',
                user: result.rows[0]
            });
        } catch (error) {
            console.error('Error updating user role:', error);
            res.status(500).json({ message: 'Server error while updating role' });
        }
    }
}

export const usersController = new UsersController();