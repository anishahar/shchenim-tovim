import { Request, Response } from 'express';
import { pool } from '../../db.js';

/**
 * FEATURE: USERS CONTROLLER
 * This controller handles user profile management, including retrieving detailed 
 * profile information and updating user-specific settings and location data.
 */
class UsersController {
    
    /**
     * GET /users/:id
     * Retrieves comprehensive user profile details, including address for location-based features.
     */
    getUserDetailes = async (req: Request, res: Response) => {
        const { id } = req.params;

        try {
            // Added 'city', 'street', and 'building_number' to the query 
            // to support the building-based announcement filtering.
            const query = `
                SELECT id, email, name, role, avatar_url, phone, 
                       city, street, building_number, created_at 
                FROM users 
                WHERE id = $1
            `;
            const user = await pool.query(query, [id]);

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
     * Updates user profile fields. Allows updating location data (city, street, building_number).
     */
    updateUserDetailes = async (req: Request, res: Response) => {
        const { id } = req.params;
        // Destructuring the new address fields from the request body
        const { name, phone, avatar_url, city, street, building_number } = req.body;
        
        // Security Check: Ensure the authenticated user matches the profile ID being updated
        // @ts-ignore - req.user is injected by Auth Middleware
        if (req.user?.id !== parseInt(id)) {
            return res.status(403).json({ message: 'Unauthorized: You can only update your own profile' });
        }

        try {
            /**
             * Using COALESCE to update fields only if new values are provided.
             * This maintains existing location data if the user only wants to update their name/phone.
             */
            const query = `
                UPDATE users 
                SET name = COALESCE($1, name), 
                    phone = COALESCE($2, phone), 
                    avatar_url = COALESCE($3, avatar_url),
                    city = COALESCE($4, city),
                    street = COALESCE($5, street),
                    building_number = COALESCE($6, building_number),
                    updated_at = NOW()
                WHERE id = $7 
                RETURNING id, email, name, role, avatar_url, phone, city, street, building_number
            `;

            const updatedUser = await pool.query(query, [
                name, 
                phone, 
                avatar_url, 
                city, 
                street, 
                building_number, 
                id
            ]);

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