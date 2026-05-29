
export type RequestStatus = 'open' | 'in_progress' | 'completed';

export interface Request {
    id: number;
    userId: number;
    title: string;
    description: string;
    category: string;
    urgency: 'low' | 'medium' | 'high';
    status: RequestStatus;
    locationText: string;
    latitude: number;
    longitude: number;
    imageUrl?: string;
    createdAt: Date;
    updatedAt: Date;
    distance: number;
}
