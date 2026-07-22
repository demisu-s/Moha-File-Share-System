import { z } from 'zod';

export const createDepartmentSchema = z.object({
    name: z.string().min(2, 'Department name is required'),
    code: z.string().min(2, 'Department code is required'),
    description: z.string().optional(),
    plantId: z.string().min(1, 'Plant ID is required')
});

export const updateDepartmentSchema = z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional()
});