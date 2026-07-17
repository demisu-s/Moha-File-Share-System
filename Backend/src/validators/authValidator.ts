// src/validators/authValidator.ts
import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    fullName: z.string().min(2, 'Full name is required'),
    employeeId: z.string().min(1, 'Employee ID is required'),
    plantId: z.string().optional(),
    departmentId: z.string().optional(),
    role: z.enum(['EMPLOYEE', 'DEPARTMENT_HEAD', 'PLANT_ADMIN', 'VIEWER']).default('EMPLOYEE')
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters')
});