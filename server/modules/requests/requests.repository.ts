import { pool } from "../../db.js";
import { GET_REQUESTER_ID } from "./requests.db.js";


class RequestsRepository {

    getRequesterByRequestId = async (requestId: number) => {
        try {
            const result = await pool.query<{ requesterId: number }>
                (
                    GET_REQUESTER_ID, [requestId]
                );
            return result.rows[0];
        } catch (error) {
            console.error('error in getRequesterByRequestId:', error, 'layer: repository');
            throw error;
        }
    }
};

export const requestsRepository = new RequestsRepository();