
export interface Request {
    id: number;
    userId: number;
    title: string;
    description: string;
    category: string;
    urgency: 'low' | 'medium' | 'high';
    status: 'open' | 'in_progress' | 'completed';
    locationText: string;
    latitude: number;
    longitude: number;
    imageUrl?: string;
    createdAt: Date;
    updatedAt: Date;
    distance: number;
}