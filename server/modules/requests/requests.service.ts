import { requestsRepository } from "./requests.repository.js";


class RequestsService {

    getRequesterByRequestId = async (requestId: number) => {
        try {
            const { user_id } = await requestsRepository.getRequesterByRequestId(requestId);
            return user_id;
        } catch (error) {
            console.error('error in newRequestChat:', error, 'layer: service');
            throw error;
        }
    }

    requestStatusInProgress = async (requestId: number) => {
        try {
            await requestsRepository.requestStatusInProgress(requestId);
        } catch (error) {
            console.error('error in requestStatusInProgress:', error, 'layer: service');
            throw error;
        }
    }
};

export const requestsService = new RequestsService();