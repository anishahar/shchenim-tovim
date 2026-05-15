import z from "zod";

export const getUserSchema = z.object({
    params: z.object({
        id: z.coerce.number().refine(Number.isFinite)
    })
});