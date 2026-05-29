import { z } from 'zod';

export const getRequestsSchema = z.object({
    query: z.object({
        radius: z.coerce.number().refine(Number.isFinite)
    })
});

export const requestIdSchema = z.object({
    params: z.object({
        id: z.coerce.number().refine(Number.isFinite),
    }),
})

export const newRequestSchema = z.object({
    body: z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        category: z.string().min(1),
        urgency: z.enum(['low', 'medium', 'high']),
        locationText: z.string().min(1),
        imageUrl: z.string().nullable(),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
    })
});

export const editRequestSchema = z.object({
    params: z.object({
        id: z.coerce.number().refine(Number.isFinite),
    }),

    body: z.object({
        status: z.enum(['open', 'in_progress', 'completed']).optional(),
        title: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        category: z.string().min(1).optional(),
        urgency: z.enum(['low', 'medium', 'high']).optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
    }).refine(
        (body) => Object.keys(body).length > 0,
        {
            message: 'At least one field must be provided',
        }
    ),
});

