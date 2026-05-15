import { pool } from "../../db.js";
import { GET_USER_BY_ID } from "./users.db.js";


class UsersRepository {

    getUserById = async (id: number) => {
        try {
            const result = await pool.query(
                GET_USER_BY_ID,
                [id]
            );

            return result.rows[0] ?? null;

        } catch (error) {
            console.error('error in getUserById:', error, 'layer: repository');
            throw error;
        }
    };

}

export const usersRepository = new UsersRepository();