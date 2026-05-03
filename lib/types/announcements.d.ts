import { User } from "./user.js";


export interface Announcement {
    id: number;
    title: string;
    content: string;
    author: Pick<User, 'id' | 'name'>;
    createdAt: Date;
}
