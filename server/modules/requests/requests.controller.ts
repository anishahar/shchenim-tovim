import { Request, Response } from 'express';

class RequestController {
    getRequests = async (req: Request, res: Response) => {
        // TODO: Get all requests
        return res.status(501).json({ message: 'Not implemented yet' });
    }

    newRequest = async (req: Request, res: Response) => {
        // TODO: Create new request
        res.status(501).json({ message: 'Not implemented yet' });
    }

    getRequest = async (req: Request, res: Response) => {
        // TODO: Get all requests
        return res.status(501).json({ message: 'Not implemented yet' });
    }

    editRequest = async (req: Request, res: Response) => {
        // TODO: Get all requests
        return res.status(501).json({ message: 'Not implemented yet' });
    }

    deleteRequest = async (req: Request, res: Response) => {
        // TODO: Get all requests
        return res.status(501).json({ message: 'Not implemented yet' });
    }
};
export const requestController = new RequestController();