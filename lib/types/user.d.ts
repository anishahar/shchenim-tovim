
export interface User {
    id: number;
    email: string;
    name: string;
    role: 'resident' | 'admin';
    avatarUrl?: string;
    phone?: string;
    createdAt: Date;
    updatedAt: Date;
}