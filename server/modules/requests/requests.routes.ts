import { Router } from 'express';
import { authenticateToken } from '../../middleware.js';
import { requestController } from './requests.controller.js';


export const requestsRouter = Router();

requestsRouter.get('/', authenticateToken, requestController.getRequests);

requestsRouter.get('/:id', authenticateToken, requestController.getRequest);

requestsRouter.post('/', authenticateToken, requestController.newRequest);

requestsRouter.patch('/:id', authenticateToken, requestController.editRequest);

requestsRouter.delete('/:id', authenticateToken, requestController.deleteRequest);