export interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
  avatarUrl?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

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

export interface Chat {
  id: number;
  requestId: number;
  requesterId: number;
  helperId: number;
  createdAt: Date;
}

export interface Message {
  id: number;
  chatId: number;
  senderId: number;
  content: string;
  createdAt: Date;
}

export interface Announcement {
  id: number;
  adminId: number;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
