import { usersRepository } from "./users.repository.js";


class UsersService {
    getUserDetails = async (id: number) => {
        try {
            return await usersRepository.getUserById(id);
        } catch (error) {
            console.error('error in newRequestChat:', error, 'layer: service');
            throw error;
        }
    }

}

export const usersService = new UsersService();