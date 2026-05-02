// export type UserRole = 'resident' | 'house_committee' | 'area_manager';

// export interface User {
//   id: number;
//   email: string;
//   name: string;
//   role: UserRole;
//   avatarUrl?: string;
//   phone?: string;

//   // Address fields (backward compatible)
//   addressText?: string;    // Legacy single field
//   city?: string;           // New separate fields
//   street?: string;
//   streetNumber?: string;
//   apartment?: string;
//   latitude?: number;
//   longitude?: number;

//   createdAt: Date;
//   updatedAt: Date;
// }

// Helper to check role hierarchy
// export function hasRoleOrHigher(userRole: UserRole, requiredRole: UserRole): boolean {
//   const hierarchy = {
//     resident: 1,
//     house_committee: 2,
//     area_manager: 3,
//   };
//   return hierarchy[userRole] >= hierarchy[requiredRole];
// }

// export interface Request {
//   id: number;
//   userId: number;
//   title: string;
//   description: string;
//   category: string;
//   status: 'open' | 'in_progress' | 'completed';
//   location: {
//     lat: number;
//     lng: number;
//   };
//   imageUrl?: string;
//   createdAt: Date;
//   updatedAt: Date;
// }

// export interface Chat {
//   id: number;
//   request: Pick<Request, 'id' | 'title' | 'imageUrl' | 'status'> | null;
//   otherUser: Pick<User, 'id' | 'name' | 'avatarUrl'>;
//   createdAt: Date;
//   updatedAt: Date;
// }


// export interface Message {
//   id: number;
//   chatId: number;
//   senderId: number;
//   content: string;
//   createdAt: Date;
// }

// export interface Announcement {
//   id: number;
//   title: string;
//   content: string;
//   author: Pick<User, 'id' | 'name'>;
//   createdAt: Date;
// }
