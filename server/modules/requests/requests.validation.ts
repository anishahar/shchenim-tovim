import { z } from 'zod';

export const getRequestsSchema = z.object({
    query: z.object({
        category: z.string().optional(),
        urgency: z.string().optional(),
        search: z.string().optional(),
        page: z.coerce.number().refine(Number.isFinite).default(1),
        limit: z.coerce.number().refine(Number.isFinite).default(20),
        radius: z.coerce.number().refine(Number.isFinite).optional()
    })
});

export const newRequestSchema = z.object({

});
//...