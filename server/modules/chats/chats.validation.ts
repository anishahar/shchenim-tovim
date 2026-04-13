import { z } from 'zod';

export const newRequesrtChatSchema = z.object({
    query: z.object({
        requestId: z.string().transform(Number).refine((n) => !Number.isNaN(n)),
    })
});

export const newChatSchema = z.object({
    query: z.object({
        otherUserId: z.string().transform(Number).refine((n) => !Number.isNaN(n)),
    })
});

export const getMessagesSchema = z.object({
    params: z.object({
        id: z.string().transform(Number).refine((n) => !Number.isNaN(n)),
    })
});
