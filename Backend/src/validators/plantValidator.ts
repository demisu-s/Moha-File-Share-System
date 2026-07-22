import { z } from 'zod';

export const createPlantSchema = z.object({
    name: z.string().min(2, 'Plant name is required'),
    code: z.string().min(2, 'Plant code is required'),
    location: z.string().min(2, 'Location is required'),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Invalid email format').optional()
});

export const updatePlantSchema = z.object({
    name: z.string().min(2).optional(),
    location: z.string().min(2).optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Invalid email format').optional(),
    isActive: z.boolean().optional()
});