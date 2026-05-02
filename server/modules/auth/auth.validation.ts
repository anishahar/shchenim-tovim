import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(6),
  phone: z.string().min(9).max(15),
  role: z.enum(['resident', 'house_committee', 'area_manager']).optional(), // Ignored by backend

  address_text: z.string().min(5),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  city: z.string().min(2).max(100),
  street: z.string().min(2).max(100),
  street_number: z.string().min(1).max(20),
  apartment: z.string().min(1).max(20).optional(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

