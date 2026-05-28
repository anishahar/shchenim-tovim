import { requestsRepository } from "./requests.repository.js";


class RequestsService {
    requestStatusInProgress = async (requestId: number) => {
        try {
            await requestsRepository.requestStatusInProgress(requestId);
        } catch (error) {
            console.error('error in requestStatusInProgress:', error, 'layer: service');
            throw error;
        }
    }

    getById = async (requestId: number) => {
        try {
            const request = requestsRepository.getById(requestId);
            if (!request) throw new Error("not found");

            return request;
        } catch (error) {
            console.error('error in getById:', error, 'layer: service');
            throw error;
        }
    }
};

export const requestsService = new RequestsService();