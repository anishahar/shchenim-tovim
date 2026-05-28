import { pool } from "../../db.js";
import { GET_BY_ID, UPDATE_REQUEST_STATUS } from "./requests.db.js";


class RequestsRepository {
    //needs parsinggggggg
    getById = async (requestId: number) => {
        try {
            const result = await pool.query
                (
                    GET_BY_ID, [requestId]
                );
            return result.rows[0]
        } catch (error) {
            console.error('error in getById:', error, 'layer: repository');
            throw error;
        }
    }

    requestStatusInProgress = async (requestId: number) => {
        try {
            await pool.query<{ user_id: number }>
                (
                    UPDATE_REQUEST_STATUS, [requestId]
                );
        } catch (error) {
            console.error('error in requestStatusInProgress:', error, 'layer: repository');
            throw error;
        }
    }
};

export const requestsRepository = new RequestsRepository();