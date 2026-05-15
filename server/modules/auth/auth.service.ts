
import bcrypt from 'bcrypt';
import createError from 'http-errors';
import jwt from 'jsonwebtoken';
import { authRepository } from './auth.repository.js';

class AuthService {
    register = async (
        name: string,
        email: string,
        password: string,
        role: string,
        phone: string,
        addressText: string,
        latitude: number,
        longitude: number,
        city?: string,
        street?: string,
        streetNumber?: string,
        apartment?: string
    ) => {
        try {
            const existingUser = await authRepository.findUser(email);
            if (existingUser) throw createError(400, 'User already exists');

            // Hash password with bcrypt (10 rounds)
            const passwordHash = await bcrypt.hash(password, 10);

            const user = await authRepository.insertResident(
                name,
                email,
                passwordHash,
                role,
                phone,
                addressText,
                latitude,
                longitude,
                city,
                street,
                streetNumber,
                apartment
            );

            // Create JWT token
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET!,
                { expiresIn: '7d' }
            );

            return { token, user };
        } catch (error) {
            console.error('error in register:', error, 'layer: service');
            throw error;
        }
    }

    login = async (email: string, password: string) => {
        try {
            const user = await authRepository.findUser(email);
            if (!user) throw createError(401, "User doesn't exist");

            // Compare password with bcrypt
            const passwordMatch = await bcrypt.compare(password, user.password_hash);
            if (!passwordMatch) {
                throw createError(401, 'Invalid password');
            }

            // Check if user is blocked
            if (user.is_blocked) {
                throw createError(403, 'Account has been blocked');
            }

            // Create JWT token
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET!,
                { expiresIn: '7d' }
            );

            return { token, user };
        } catch (error: any) {
            console.error('error in login:', error, 'layer: service');
            throw error;
        }
    }
};

export const authService = new AuthService();