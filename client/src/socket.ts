import { io, Socket } from "socket.io-client";

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const socketUrl =
    (import.meta.env as Record<string, string | undefined>).VITE_SERVER_URL ||
    apiUrl.replace(/\/api\/?$/, '');

export const socket: Socket = io(socketUrl, {
    withCredentials: true, //?
    autoConnect: false,
});

export const registerSocketEvents = () => {
    socket.on("connect", () => {
        console.log("connected");
    });

    socket.on("disconnect", () => {
        console.log("disconnected");
    });

    socket.on("new_message", (message) => {
        console.log("message:", message);
        ///....
    });

    socket.on("bootstrap_error", (err) => {
        console.error("socket bootstrap error:", err);
    });


    //connect_error?
}
    if (typeof window !== 'undefined') {
        (window as any).socket = socket;
    }
