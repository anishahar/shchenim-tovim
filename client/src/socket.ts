import { io, Socket } from "socket.io-client";

export const socket: Socket = io(import.meta.env.VITE_SERVER_URL, {
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
}