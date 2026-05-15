
export type SocketResponse =
    | { ok: true; data?: any }
    | { ok: false; error: string };