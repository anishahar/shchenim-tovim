
export type UserRole = 'resident' | 'house_committee' | 'area_manager';

export interface User {
    id: number;
    email: string;
    name: string;
    role: UserRole;
    avatarUrl?: string;
    phone?: string;

    // Address fields (backward compatible)
    addressText?: string;    // Legacy single field
    city?: string;           // New separate fields
    street?: string;
    streetNumber?: string;
    apartment?: string;
    latitude?: number;
    longitude?: number;

    createdAt: Date;
    updatedAt: Date;
}