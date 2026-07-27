// src/controllers/userController.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { createUserSchema, updateUserSchema, changePasswordSchema } from '../validators/authValidator';
import { successResponse, paginatedResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { UserService } from '../services/userService';
import bcrypt from 'bcryptjs';

export class UserController {
    private userService = new UserService();
    constructor() {
        this.createUser = this.createUser.bind(this);
        this.getAllUsers = this.getAllUsers.bind(this);
        this.getUserById = this.getUserById.bind(this);
        this.updateUser = this.updateUser.bind(this);
        this.deleteUser = this.deleteUser.bind(this);
        this.getProfile = this.getProfile.bind(this);
        this.updateProfile = this.updateProfile.bind(this);
        this.changePassword = this.changePassword.bind(this);
    }

    async createUser(req: Request, res: Response, next: NextFunction) {
        try {
            const validated = createUserSchema.parse(req.body);
            
            if (validated.plantId) {
                const hasAccess = await this.userService.canManagePlant(
                    req.user!.id, 
                    validated.plantId
                );
                if (!hasAccess) {
                    throw new AppError('You do not have permission to create users in this plant', 403);
                }
            }

            if (validated.departmentId) {
                const department = await prisma.department.findUnique({
                    where: { id: validated.departmentId }
                });
                
                if (department && department.plantId !== validated.plantId) {
                    throw new AppError('Department does not belong to the specified plant', 400);
                }
            }

            const hashedPassword = await bcrypt.hash(validated.password, 10);
            
            const user = await this.userService.createUser({
                ...validated,
                password: hashedPassword,
                createdBy: req.user!.id
            });

            logger.info(`User created: ${user.id} (${user.employeeId}) by ${req.user?.employeeId}`);
            res.status(201).json(successResponse(user, 'User created successfully'));
        } catch (error) {
            next(error);
        }
    }

    async getAllUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const plantId = req.query.plantId as string;
            const departmentId = req.query.departmentId as string;
            
            let where: any = { isActive: true };
            
            if (plantId) {
                where.plantId = plantId;
            }
            
            if (departmentId) {
                where.departmentId = departmentId;
            }
            
            if (req.user?.role === 'PLANT_ADMIN') {
                where.plantId = req.user.plantId;
            }
            
            if (req.user?.role === 'DEPARTMENT_HEAD') {
                where.departmentId = req.user.departmentId;
            }

            if (req.query.search) {
                const search = req.query.search as string;
                where.OR = [
                    { fullName: { contains: search } },
                    { employeeId: { contains: search } },
                    { email: { contains: search } }
                ];
            }

            const result = await this.userService.getUsers(where, page, limit);

            res.json(paginatedResponse(result.items, result.total, page, limit));
        } catch (error) {
            next(error);
        }
    }

    async getUserById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            
            const user = await this.userService.getUserById(id as string);
            
            if (!user) {
                throw new AppError('User not found', 404);
            }

            const hasAccess = await this.userService.canAccessUser(req.user!.id, user.id);
            if (!hasAccess) {
                throw new AppError('You do not have permission to view this user', 403);
            }

            res.json(successResponse(user));
        } catch (error) {
            next(error);
        }
    }

    async updateUser(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const validated = updateUserSchema.parse(req.body);

            const user = await prisma.user.findUnique({ where: { id: id as string } });
            if (!user) {
                throw new AppError('User not found', 404);
            }

            const hasAccess = await this.userService.canManageUser(req.user!.id, user.id);
            if (!hasAccess) {
                throw new AppError('You do not have permission to update this user', 403);
            }

            if (validated.role) {
                const canAssignRole = await this.userService.canAssignRole(
                    req.user!.id, 
                    validated.role
                );
                if (!canAssignRole) {
                    throw new AppError(`You do not have permission to assign role: ${validated.role}`, 403);
                }

            
            }

            const updated = await this.userService.updateUser(id as string, validated);

            logger.info(`User updated: ${id} by ${req.user?.employeeId}`);
            res.json(successResponse(updated, 'User updated successfully'));
        } catch (error) {
            next(error);
        }
    }

    async deleteUser(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const user = await prisma.user.findUnique({ where: { id: id as string } });
            if (!user) {
                throw new AppError('User not found', 404);
            }

            if (user.id === req.user?.id) {
                throw new AppError('You cannot delete your own account', 400);
            }

            const hasAccess = await this.userService.canManageUser(req.user!.id, user.id);
            if (!hasAccess) {
                throw new AppError('You do not have permission to delete this user', 403);
            }

            await this.userService.deleteUser(id as string);

            logger.warn(`User deleted: ${id} by ${req.user?.employeeId}`);
            res.json(successResponse(null, 'User deleted successfully'));
        } catch (error) {
            next(error);
        }
    }

    async getProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await this.userService.getUserById(req.user!.id);
            
            if (!user) {
                throw new AppError('User not found', 404);
            }

            res.json(successResponse(user));
        } catch (error) {
            next(error);
        }
    }

    async updateProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const { fullName, phone } = req.body;
            
            const updated = await this.userService.updateUser(req.user!.id, {
                fullName,
                phone
            });

            logger.info(`Profile updated for user: ${req.user?.employeeId}`);
            res.json(successResponse(updated, 'Profile updated successfully'));
        } catch (error) {
            next(error);
        }
    }

    async changePassword(req: Request, res: Response, next: NextFunction) {
        try {
            const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
            
            const user = await prisma.user.findUnique({
                where: { id: req.user!.id }
            });

            if (!user) {
                throw new AppError('User not found', 404);
            }

            const isValid = await bcrypt.compare(currentPassword, user.password);
            if (!isValid) {
                throw new AppError('Current password is incorrect', 401);
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            
            await this.userService.updateUser(user.id, {
                password: hashedPassword
            });

            logger.info(`Password changed for user: ${req.user?.employeeId}`);
            res.json(successResponse(null, 'Password changed successfully'));
        } catch (error) {
            next(error);
        }
    }
}