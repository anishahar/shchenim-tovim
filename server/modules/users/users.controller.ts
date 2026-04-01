import { Request, Response } from 'express';

class UsersController {
    getUserDetailes = async (req: Request, res: Response) => {
        // TODO: Get user profile
        res.status(501).json({ message: 'Not implemented yet' });
    }

    updateUserDetailes = async (req: Request, res: Response) => {
        // TODO: Update user profile
        res.status(501).json({ message: 'Not implemented yet' });
    }

};
export const usersController = new UsersController();