
export type UserRole = 'resident' | 'house_committee' | 'area_manager';

export interface User {
    id: number;
    email: string;
    name: string;
    role: UserRole;
    avatarUrl?: string;
    phone?: string;

    addressText?: string;    // Legacy single field
    city: string;
    street: string;
    streetNumber: string;
    apartment?: string;
    latitude: number;
    longitude: number;

    createdAt: Date;
    updatedAt: Date;
}