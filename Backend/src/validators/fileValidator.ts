// src/validators/fileValidator.ts
import { z } from 'zod';

export const fileUploadSchema = z.object({
    description: z.string().optional(),
    tags: z.string().optional(),
    departmentId: z.string().optional(),
    plantId: z.string().optional(),
    category: z.enum(['DOCUMENT', 'SPREADSHEET', 'PRESENTATION', 'PDF', 'IMAGE', 'VIDEO', 'OTHER']).default('OTHER')
});

export const fileShareSchema = z.object({
    fileId: z.string().min(1, 'File ID is required'),
    sharedWithUserId: z.string().optional(),
    sharedWithPlantId: z.string().optional(),
    sharedWithDeptId: z.string().optional(),
    sharedWithAll: z.boolean().default(false),
    permission: z.enum(['VIEW', 'EDIT', 'DELETE', 'SHARE', 'FULL_CONTROL']).default('VIEW'),
    expiresAt: z.string().datetime().optional()
}).refine(
    (data) => {
        // Must have at least one share target
        return !!(data.sharedWithUserId || data.sharedWithPlantId || data.sharedWithDeptId || data.sharedWithAll);
    },
    {
        message: 'Must specify at least one share target (user, plant, department, or all)'
    }
);