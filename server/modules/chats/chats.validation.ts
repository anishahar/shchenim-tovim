import { z } from 'zod';

export const newRequesrtChatParamsSchema = z.object({
    requestId: z.number(),
});

export const newChatParamsSchema = z.object({
    otherUserId: z.number(),
});
