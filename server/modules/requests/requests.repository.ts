import { pool } from "../../db.js";
import { GET_BY_ID, GET_REQUESTS, UPDATE_REQUEST_STATUS } from "./requests.db.js";
import { Request } from "@typesLib";


class RequestsRepository {

    getRequests = async (longitude: number, latitude: number) => {
        try {
            const result = await pool.query<Request>
                (
                    GET_REQUESTS, [latitude, longitude]
                );
            return result.rows
        } catch (error) {
            console.error('error in getRequests:', error, 'layer: repository');
            throw error;
        }
    }

    getRequestByIdForUser = async (requestId: number, longitude: number, latitude: number) => {
        try {
            const result = await pool.query<Request>
                (
                    GET_BY_ID, [latitude, longitude, requestId]
                );

            return result.rows[0]
        } catch (error) {
            console.error('error in getRequestByIdForUser:', error, 'layer: repository');
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