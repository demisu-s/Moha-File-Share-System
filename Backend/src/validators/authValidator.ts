import { z } from 'zod';
import { ROLES } from '../constants/roles';

export const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    fullName: z.string().min(2, 'Full name is required'),
    employeeId: z.string().min(1, 'Employee ID is required'),
    plantId: z.string().optional(),
    departmentId: z.string().optional(),
    role: z.enum([ROLES.EMPLOYEE, ROLES.DEPARTMENT_HEAD, ROLES.PLANT_ADMIN, ROLES.VIEWER]).default(ROLES.EMPLOYEE)
});

// Used by admins to create users — includes SUPER_ADMIN role
export const createUserSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    fullName: z.string().min(2, 'Full name is required'),
    employeeId: z.string().min(1, 'Employee ID is required'),
    plantId: z.string().optional(),
    departmentId: z.string().optional(),
    role: z.enum([ROLES.SUPER_ADMIN, ROLES.EMPLOYEE, ROLES.DEPARTMENT_HEAD, ROLES.PLANT_ADMIN, ROLES.VIEWER]).default(ROLES.EMPLOYEE)
});

export const loginSchema = z.object({
    employeeId: z.string().min(1, 'Employee ID is required'),
    password: z.string().min(1, 'Password is required')
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters')
});

export const updateUserSchema = z.object({
    fullName: z.string().min(2).optional(),
    phone: z.string().optional(),
    departmentId: z.string().optional(),
    plantId: z.string().optional(),
    role: z.enum([ROLES.EMPLOYEE, ROLES.DEPARTMENT_HEAD, ROLES.PLANT_ADMIN, ROLES.VIEWER]).optional(),
    isActive: z.boolean().optional()
});