import { User } from "./user.js";

export type RequestStatus = 'open' | 'in_progress' | 'completed';
export type RequestUrgency = 'low' | 'medium' | 'high';
export interface Request {
    id: number;
    user: Pick<User, 'id' | 'name' | 'avatarUrl'>;
    title: string;
    description: string;
    category: string;
    urgency: RequestUrgency;
    status: RequestStatus;
    locationText: string;
    latitude: number;
    longitude: number;
    imageUrl?: string;
    createdAt: Date;
    updatedAt: Date;
    distance: number;
}