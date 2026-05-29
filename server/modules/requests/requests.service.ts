import { usersService } from "../users/users.service.js";
import { requestsRepository } from "./requests.repository.js";


class RequestsService {
    getRequests = async (userId: number, radius: number) => {
        try {
            const { longitude, latitude } = await usersService.getUserDetails(userId);
            return (await requestsRepository.getRequests(longitude, latitude)).filter((request) =>
                request.distance <= radius && request.user.id !== userId
            )
        } catch (error) {
            console.error('error in getRequests:', error, 'layer: service');
            throw error;
        }
    }

    getRequestByIdForUser = async (requestId: number, userId: number) => {
        try {
            const { longitude, latitude } = await usersService.getUserDetails(userId);
            const request = await requestsRepository.getRequestByIdForUser(requestId, longitude, latitude);
            if (!request) throw new Error("not found");

            return request;
        } catch (error) {
            console.error('error in getRequestByIdForUser:', error, 'layer: service');
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