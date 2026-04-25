import { z } from 'zod';

export const sendMessageSchema = z.object({
    chatId: z.number(),
    content: z.string().trim().min(1),
});

export const newRequesrtChatSchema = z.object({
    requestId: z.number(),
    content: z.string().trim().min(1),
});

export const newChatSchema = z.object({
    otherUserId: z.number(),
    content: z.string().trim().min(1),
});