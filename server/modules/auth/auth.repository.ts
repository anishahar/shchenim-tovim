import { pool } from "../../db.js";
import { FIND_USER_BY_EMAIL, INSERT_USER } from "./auth.db.js";

class AuthRepository {
    findUser = async (email: string) => {
        try{
        // Check if user already exists by email
        const user = await pool.query<{id: number, name: string, email: string, password_hash: string, role: string, is_blocked: boolean}>(
            FIND_USER_BY_EMAIL, [email]
        );

        return user.rows[0];
        }
        catch(error){
            console.error('error in findUser:', error, 'layer: repository');
            throw error;
        }
    }
    insertResident = async (
        name: string,
        email: string,
        passwordHash: string,
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
            const result = await pool.query<{id: number, name: string, email: string, role: string}>(
                INSERT_USER, [name, email, passwordHash, role, phone, addressText, latitude, longitude, city || null, street || null, streetNumber || null, apartment || null]
            );

            return result.rows[0];
        } catch (error) {
            console.error('error in insertResident:', error, 'layer: repository');
            throw error;
        }
    }
};

export const authRepository = new AuthRepository();