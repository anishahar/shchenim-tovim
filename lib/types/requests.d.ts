
export interface Request {
    id: number;
    userId: number;
    title: string;
    description: string;
    category: string;
    status: 'open' | 'in_progress' | 'completed';
    location: {
        lat: number;
        lng: number;
    };
    imageUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface DbRequest {
    id: number;
    userId: number;
    title: string;
    description: string;
    category: string;
    status: 'open' | 'in_progress' | 'completed';
    location: {
        lat: number;
        lng: number;
    };
    imageUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}