import { Request, Response } from 'express';
import { authService } from './auth.service.js';
import { loginSchema, registerSchema } from './auth.validation.js';

class AuthController {
    register = async (req: Request, res: Response) => {
        try {
            const { data, error } = registerSchema.safeParse(req.body);

            if (error) { return res.status(400).json({ errors: error }); }

            const { name, email, password, phone, address_text, latitude, longitude, city, street, street_number, apartment } = data;

            // Always set new users as 'resident' - only area_manager can change roles
            const { token, user } = await authService.register(
                name,
                email,
                password,
                'resident',
                phone,
                address_text,
                latitude,
                longitude,
                city,
                street,
                street_number,
                apartment
            );

            res.status(201).json({
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Registration failed' });
        }
    }

    login = async (req: Request, res: Response) => {
        try {
            const { data, error } = loginSchema.safeParse(req.body);

            if (error) { return res.status(400).json({ errors: error }); }

            const { email, password } = data;

            const { token, user } = await authService.login(email, password);

            res.json({
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            })
        } catch (error: any) {
            if (error.status) {
                return res.status(error.status).json({ error: error.message });
            }
            console.error('Unexpected error in login:', error);
            return res.status(500).json({ error: 'Login failed' });
        }
    }
};

export const authController = new AuthController();