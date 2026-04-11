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
  request: Pick<Request, 'id' | 'title' | 'imageUrl' | 'status'> | null;
  otherUser: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  createdAt: Date;
  updatedAt: Date;
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
  title: string;
  content: string;
  author: Pick<User, 'id' | 'name'>;
  createdAt: Date;
}
