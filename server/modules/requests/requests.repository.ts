import { pool } from "../../db.js";
import { GET_REQUESTER_ID } from "./requests.db.js";


class RequestsRepository {

    getRequesterByRequestId = async (requestId: number) => {
        try {
            const result = await pool.query<{ user_id: number }>
                (
                    GET_REQUESTER_ID, [requestId]
                );
            if (result.rows.length === 0) throw new Error("request id does not exist");
            return result.rows[0]
        } catch (error) {
            console.error('error in getRequesterByRequestId:', error, 'layer: repository');
            throw error;
        }
    }
};

export const requestsRepository = new RequestsRepository();