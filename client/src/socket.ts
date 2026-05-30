import { io, Socket } from "socket.io-client";

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const socketUrl =
    (import.meta.env as Record<string, string | undefined>).VITE_SERVER_URL ||
    apiUrl.replace(/\/api\/?$/, '');

export const socket: Socket = io(socketUrl, {
    withCredentials: true,
    autoConnect: false,
});
