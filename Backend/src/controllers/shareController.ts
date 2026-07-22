// src/controllers/shareController.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { fileShareSchema } from '../validators/fileValidator';
import { successResponse, paginatedResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { ShareService } from '../services/shareService';

export class ShareController {
    private shareService = new ShareService();

    async createShare(req: Request, res: Response, next: NextFunction) {
        try {
            const validated = fileShareSchema.parse(req.body);
            
            const canShare = await this.shareService.canShareFile(
                req.user!.id, 
                validated.fileId
            );
            
            if (!canShare) {
                throw new AppError('You do not have permission to share this file', 403);
            }

            const share = await this.shareService.createShare({
                ...validated,
                sharedBy: req.user!.id
            });

            await this.shareService.createShareNotifications(share.id);

            logger.info(`File shared: ${share.fileId} by ${req.user?.employeeId}`);
            res.status(201).json(successResponse(share, 'File shared successfully'));
        } catch (error) {
            next(error);
        }
    }

    async getAllShares(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            
            let where: any = { isActive: true };
            
            if (!req.user) {
                throw new AppError('User not authenticated', 401);
            }

            if (req.user.role === 'SUPER_ADMIN') {
                // Super admin sees all shares
            } else if (req.user.role === 'PLANT_ADMIN') {
                where.OR = [
                    { sharedBy: req.user.id },
                    { sharedWithPlantId: req.user.plantId }
                ];
            } else if (req.user.role === 'DEPARTMENT_HEAD') {
                where.OR = [
                    { sharedBy: req.user.id },
                    { sharedWithDeptId: req.user.departmentId },
                    { sharedWithUserId: req.user.id }
                ];
            } else {
                where.OR = [
                    { sharedBy: req.user.id },
                    { sharedWithUserId: req.user.id },
                    { sharedWithDeptId: req.user.departmentId },
                    { sharedWithPlantId: req.user.plantId },
                    { sharedWithAll: true }
                ];
            }

            const result = await this.shareService.getShares(where, page, limit);

            res.json(paginatedResponse(result.items, result.total, page, limit));
        } catch (error) {
            next(error);
        }
    }

    async getShareById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            
            const share = await this.shareService.getShareById(id as string);
            
            if (!share) {
                throw new AppError('Share not found', 404);
            }

            const hasAccess = await this.shareService.canAccessShare(
                req.user!.id, 
                share.id
            );
            
            if (!hasAccess) {
                throw new AppError('You do not have permission to view this share', 403);
            }

            res.json(successResponse(share));
        } catch (error) {
            next(error);
        }
    }

    async updateShare(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { permission, expiresAt } = req.body;

            const share = await prisma.fileShare.findUnique({ 
                where: { id: id as string },
                include: { file: true }
            });
            
            if (!share) {
                throw new AppError('Share not found', 404);
            }

            const canUpdate = await this.shareService.canManageShare(
                req.user!.id, 
                share.id
            );
            
            if (!canUpdate) {
                throw new AppError('You do not have permission to update this share', 403);
            }

            const updated = await this.shareService.updateShare(id as string, {
                permission,
                expiresAt: expiresAt ? new Date(expiresAt) : undefined
            });

            logger.info(`Share updated: ${id} by ${req.user?.employeeId}`);
            res.json(successResponse(updated, 'Share updated successfully'));
        } catch (error) {
            next(error);
        }
    }

    async revokeShare(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const share = await prisma.fileShare.findUnique({ 
                where: { id: id as string },
                include: { file: true }
            });
            
            if (!share) {
                throw new AppError('Share not found', 404);
            }

            const canRevoke = await this.shareService.canManageShare(
                req.user!.id, 
                share.id
            );
            
            if (!canRevoke) {
                throw new AppError('You do not have permission to revoke this share', 403);
            }

            await this.shareService.revokeShare(id as string);

            logger.warn(`Share revoked: ${id} by ${req.user?.employeeId}`);
            res.json(successResponse(null, 'Share revoked successfully'));
        } catch (error) {
            next(error);
        }
    }
}