import { requestsRepository } from "./requests.repository.js";


class RequestsService {

    getRequesterByRequestId = async (requestId: number) => {
        try {
            const { requesterId } = await requestsRepository.getRequesterByRequestId(requestId);
            return requesterId;
        } catch (error) {
            console.error('error in newRequestChat:', error, 'layer: service');
            throw error;
        }
    }
};

export const requestsService = new RequestsService();