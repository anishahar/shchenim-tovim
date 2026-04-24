import { User } from "./user.js";
import { Request } from "./requests.js";


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

export type SocketMessage = Pick<Message, 'chatId' | 'content'>

export type FirstMessageInChat = {
    otherUserId: number;
    content: string;
}

export type FirstMessageInRequestChat = {
    requestId: number;
    content: string;
}